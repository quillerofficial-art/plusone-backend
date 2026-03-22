import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user!.id)
      .single()

    if (error || !user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}