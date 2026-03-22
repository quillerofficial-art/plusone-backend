import { supabaseAdmin } from '../config/supabase'

export const generateReferralCode = (): string => {
  return 'PLUS' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const isDescendant = async (ancestorId: string, userId: string): Promise<boolean> => {
  if (ancestorId === userId) return true

  const { data, error } = await supabaseAdmin.rpc('is_descendant', {
    ancestor_id: ancestorId,
    user_id: userId,
  })

  if (error) {
    console.error('Error checking descendant:', error)
    return false
  }
  return data || false
}

export const incrementAncestorsDownline = async (userId: string) => {
  const { error } = await supabaseAdmin.rpc('increment_ancestors_downline', {
    user_id: userId,
  })
  if (error) {
    console.error('Error incrementing ancestors downline:', error)
  }
}