import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import crypto from 'crypto'
import { isDescendant } from '../utils/helpers'
import { successResponse, errorResponse } from '../utils/response'
import logger from '../utils/logger'

// Generate invitation token for a specific parent and position
export const generateInvite = async (req: Request, res: Response) => {
  const { parent_id, position } = req.body

  if (!parent_id || !position || !['left', 'right'].includes(position)) {
    return errorResponse(res, 'Invalid parent_id or position')
  }

  try {
    // Check if parent exists
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('left_child_id, right_child_id')
      .eq('id', parent_id)
      .single()

    if (parentError || !parent) {
      return errorResponse(res, 'Parent node not found')
    }

    // Verify that parent is a descendant of current user
    const isInTree = await isDescendant(req.user!.id, parent_id)
    if (!isInTree) {
      return errorResponse(res, 'You can only invite under your own tree')
    }

    // Check if position vacant
    if ((position === 'left' && parent.left_child_id) || (position === 'right' && parent.right_child_id)) {
      return errorResponse(res, 'Position already occupied')
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: insertError } = await supabase
      .from('invitation_tokens')
      .insert({
        token,
        sponsor_id: req.user!.id,
        parent_id,
        position,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      return errorResponse(res, 'Failed to generate invite')
    }

    // Web invite page (for users without app)
    const inviteWebUrl = `${process.env.BACKEND_URL}/invite?token=${token}`;
    // Deep link (for users with app)
    const deepLink = `${process.env.FRONTEND_URL}?token=${token}`;

   successResponse(res, { 
   invite_link: inviteWebUrl,
   deep_link: deepLink,
   token 
   });
  } catch (err) {
    logger.error('Error in generateInvite:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}

// Get root node of logged in user
export const getRoot = async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile_number, profile_pic_url, subscription_status, left_child_id, right_child_id')
      .eq('id', req.user!.id)
      .single()

    if (error || !user) {
      return errorResponse(res, 'User not found')
    }

    successResponse(res, user)
  } catch (err) {
    logger.error('Error in getRoot:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}

// Get children of a node
export const getChildren = async (req: Request, res: Response) => {
  const { nodeId } = req.params
  const nodeIdStr = Array.isArray(nodeId) ? nodeId[0] : nodeId

  try {
    // 1. Validate node exists
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('id, left_child_id, right_child_id')
      .eq('id', nodeIdStr)
      .single()

    if (parentError || !parent) {
      return errorResponse(res, 'Node not found')
    }

    // 2. Extract child IDs
    const childIds = [
      parent.left_child_id,
      parent.right_child_id
    ].filter(Boolean)

    console.log("CHILD IDS:", childIds)

    if (childIds.length === 0) {
      return successResponse(res, [])
    }

    // 3. Fetch children safely (no .in bug)
    const children = []

    for (const id of childIds) {
  console.log("FETCHING CHILD ID:", id)

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

   console.log("CHILD DATA:", data)
   console.log("CHILD ERROR:", error)

   if (data) {
    children.push(data)
   }
  }

    for (const id of childIds) {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          mobile_number,
          profile_pic_url,
          subscription_status,
          left_child_id,
          right_child_id,
          position,
          is_deleted
        `)
        .eq('id', id)
        .single()

      // Skip deleted users (safe check)
      if (data && (data.is_deleted === false || data.is_deleted === null)) {
        children.push({
          ...data,
          side: data.position,
          position: undefined
        })
      }

      if (error) {
        console.error("Child fetch error:", error)
      }
    }

    return successResponse(res, children)

  } catch (err) {
    logger.error('Error in getChildren:', {
      error: err,
      userId: req.user?.id,
      nodeId: nodeIdStr
    })
    return errorResponse(res, 'Server error')
  }
}