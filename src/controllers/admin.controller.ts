import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { successResponse, errorResponse} from '../utils/response'
import logger from '../utils/logger'

// Get all users with filters
export const getAllUsers = async (req: Request, res: Response) => {
  const { search, subscription, level, page = 1, limit = 20 } = req.query
  let query = supabase
    .from('users')
    .select('id, name, email, upi_id, mobile_number, profile_pic_url, total_downline, level, subscription_status, created_at', { count: 'exact' })
    .eq('role', 'user')
    .eq('is_deleted', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (subscription !== undefined) {
    query = query.eq('subscription_status', subscription === 'true')
  }
  if (level) {
    query = query.eq('level', level)
  }

  const from = (page as number - 1) * (limit as number)
  const to = from + (limit as number) - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
  return errorResponse(res, error.message)
  }

  successResponse(res, {
    users: data,
    total: count,
    page: Number(page),
    limit: Number(limit),
  })
}

// Soft delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('role', 'user')

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    successResponse(res, { message: 'User deleted' })
  } catch (err) {
    logger.error('Error in deleteUser:', { error: err, userId: req.user?.id })
    res.status(500).json({ message: 'Server error' })
  }
}

// Send notification to selected users
export const sendNotification = async (req: Request, res: Response) => {
  const { userIds, title, message } = req.body
  if (!message || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds array and message required' })
  }

  try {
    // Insert into notifications with title
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({ admin_id: req.user!.id, title: title || 'Notification', message })
      .select()
      .single()

    if (notifError) throw notifError

    // Insert into user_notifications
    const userNotifications = userIds.map((userId: string) => ({
      user_id: userId,
      notification_id: notif.id,
    }))

    const { error: insertError } = await supabase
      .from('user_notifications')
      .insert(userNotifications)

    if (insertError) throw insertError

    successResponse(res, { message: 'Notification sent successfully', notificationId: notif.id })
  } catch (err) {
    logger.error('Error in sendNotification:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Failed to send notifications')
  }
}

// Get all notifications (admin view)
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        message,
        created_at,
        users!inner (name),
        user_notifications (count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse(res, error.message)
    }

    successResponse(res, { notifications: data })
  } catch (err) {
    logger.error('Error in getNotifications:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error' )
  }
}

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Total users (not deleted)
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Active subscribers (subscription_status = true AND expiry > now)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('subscription_status', true)
      .gt('subscription_expiry', new Date().toISOString());

    // Inactive users (subscription_status = false OR expired, and not deleted)
    const { count: inactiveUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('subscription_status', false);

    successResponse(res, {
      totalUsers,
      activeUsers,
      inactiveUsers,
    });
  } catch (err) {
    logger.error('Error in getDashboardStats:', { error: err, userId: req.user?.id });
    errorResponse(res, 'Failed to fetch stats' );
  }
};

// Get inactive users with pagination and search
export const getInactiveUsers = async (req: Request, res: Response) => {
  const { search, page = 1, limit = 20 } = req.query;
  let query = supabase
    .from('users')
    .select('id, name, email, upi_id, mobile_number, profile_pic_url, total_downline, level, subscription_status, created_at', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('subscription_status', false);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return errorResponse(res, 'Failed to fetch inactive users' );
  }

  successResponse(res, {
    users: data,
    total: count,
    page: Number(page),
    limit: Number(limit),
  });
};