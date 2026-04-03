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

    const link = `${process.env.BASE_URL}/signup?token=${token}`
    successResponse(res, { link, token })
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
      .select('id, name, profile_pic_url, left_child_id, right_child_id')
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

  // Ensure nodeId is a string (Express params can be string | string[])
  const nodeIdStr = Array.isArray(nodeId) ? nodeId[0] : nodeId

  try {
    // Check if node is in user's tree
    const isInTree = await isDescendant(req.user!.id, nodeIdStr)
    if (!isInTree) {
      return errorResponse(res, 'Access denied')
    }

    const { data: children, error } = await supabase
      .from('users')
      .select('id, name, profile_pic_url, left_child_id, right_child_id')
      .eq('parent_id', nodeIdStr)
      .eq('is_deleted', false)

    if (error) {
      return errorResponse(res, 'Server error')
    }

    successResponse(res, children)
  } catch (err) {
    logger.error('Error in getChildren:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}