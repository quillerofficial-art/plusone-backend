import { Request, Response } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { generateReferralCode, incrementAncestorsDownline } from '../utils/helpers'
import { generateOTP, storeOTP, verifyOTP} from '../utils/otpGenerator'
import { sendOTP } from '../utils/emailService'

// Signup with invitation token
export const signup = async (req: Request, res: Response) => {
  const { email, password, name, upi_id, mobile_number, token } = req.body

  if (!email || !password || !name || !token) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    // 1. Validate invitation token
    const { data: invToken, error: tokenError } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !invToken) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' })
    }

    // 2. Check if position is still vacant
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('left_child_id, right_child_id')
      .eq('id', invToken.parent_id)
      .single()

    if (parentError || !parent) {
      return res.status(400).json({ message: 'Parent node not found' })
    }

    if (
      (invToken.position === 'left' && parent.left_child_id) ||
      (invToken.position === 'right' && parent.right_child_id)
    ) {
      return res.status(400).json({ message: 'Position already occupied' })
    }

    // 3. Create user in Supabase Auth (using admin client to auto-confirm email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // email automatically confirmed
    })

    if (authError) {
      return res.status(400).json({ message: authError.message })
    }

    const userId = authUser.user.id

    // 4. Insert into public.users
    const referralCode = generateReferralCode()
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        upi_id: upi_id || null,
        mobile_number: mobile_number || null,
        referral_code: referralCode,
        sponsor_id: invToken.sponsor_id,
        parent_id: invToken.parent_id,
        position: invToken.position,
      })

    if (dbError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return res.status(500).json({ message: 'Failed to create user profile' })
    }

    // 5. Update parent's child pointer
    const updateField = invToken.position === 'left' 
      ? { left_child_id: userId } 
      : { right_child_id: userId }
    await supabase
      .from('users')
      .update(updateField)
      .eq('id', invToken.parent_id)

    // 6. Increment downline for ancestors
    await incrementAncestorsDownline(userId)

    // 7. Mark token as used
    await supabase
      .from('invitation_tokens')
      .update({ used: true })
      .eq('id', invToken.id)

    res.status(201).json({ message: 'User created successfully', userId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ message: error.message })
    }

    // Fetch user profile from public.users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      return res.status(500).json({ message: 'Failed to fetch user profile' })
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: userProfile,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Forgot password (Supabase handles via email)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email required' })
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BASE_URL}/reset-password`,
    })

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    res.json({ message: 'Password reset email sent' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Change password (requires current password for security)
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password required' })
  }

  try {
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user!.email,
      password: currentPassword,
    })
    if (signInError) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user!.id,
      { password: newPassword }
    )
    if (updateError) {
      return res.status(400).json({ message: updateError.message })
    }

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Referrer Info
export const getReferrerInfo = async (req: Request, res: Response) => {
  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Token required' })
  }

  try {
    const { data: invToken, error } = await supabase
      .from('invitation_tokens')
      .select('sponsor_id')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invToken) {
      return res.status(404).json({ message: 'Invalid or expired invitation token' })
    }

    const { data: sponsor, error: sponsorError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', invToken.sponsor_id)
      .single()

    if (sponsorError || !sponsor) {
      return res.status(404).json({ message: 'Sponsor not found' })
    }

    res.json({ referrer: sponsor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export function sendOtp(arg0: string, sendOtp: any) {
    throw new Error('Function not implemented.')
}

// Send OTP for signup or forgot password
export const sendOtp = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) {
    return res.status(400).json({ message: 'Email and purpose required' });
  }
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    if (userError) throw userError;
    if (purpose === 'signup' && users.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (purpose === 'forgot' && users.length === 0) {
      return res.status(400).json({ message: 'Email not found' });
    }
    const otp = generateOTP();
    await storeOTP(email, otp, purpose);
    await sendOTP(email, otp, purpose);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};