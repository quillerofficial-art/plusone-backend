import { Request, Response } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { generateReferralCode, incrementAncestorsDownline } from '../utils/helpers'
import { generateOTP, storeOTP, verifyOTP} from '../utils/otpGenerator'
import { sendOTP } from '../utils/emailService'
import { OtpPurpose } from '../types/enums'
import { successResponse, errorResponse } from '../utils/response'
import logger from '../utils/logger'


export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;
  const isValid = await verifyOTP(email, otp, purpose);
  if (!isValid) return errorResponse(res, 'Invalid or expired OTP');

  // Mark email as verified for 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await supabase
    .from('email_verifications')
    .upsert({ email, verified: true, expires_at: expiresAt.toISOString() });

  successResponse(res, { verified: true });
};

// Signup with invitation token
export const signup = async (req: Request, res: Response) => {
  const { email, password, name, upi_id, mobile_number, token } = req.body

  if (!email || !password || !name || !token) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

    if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }

  let userId: string | null = null

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
      return errorResponse(res, 'Invalid or expired invitation token')
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
      return errorResponse(res, 'Position already occupied')
    }
    
    // 2.5 Check if email is verified
    const { data: verif, error: verifError } = await supabase
     .from('email_verifications')
     .select('verified, expires_at')
     .eq('email', email)
     .single();

     if (verifError || !verif || !verif.verified || new Date(verif.expires_at) < new Date()) {
     return errorResponse(res, 'Email not verified. Please request OTP and verify first.');
    }

    // 3. Create user in Supabase Auth (using admin client to auto-confirm email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // email automatically confirmed
    })

    if (authError) {
      return errorResponse(res, authError.message )
    }
    
    userId = authUser.user.id
    
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

     if (dbError) throw dbError  // ✅ Throw, not return

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

    // ✅ Ensure child's parent_id is correct (permanent fix)
    const { data: childCheck } = await supabase
     .from('users')
     .select('parent_id')
     .eq('id', userId)
     .single();

    if (childCheck?.parent_id !== invToken.parent_id) {
     await supabase
     .from('users')
     .update({ parent_id: invToken.parent_id })
     .eq('id', userId);
    }
    successResponse(res, { message: 'User created successfully', userId })
    await supabase.from('email_verifications').delete().eq('email', email);
  } catch (err) {
     if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    }
    logger.error('Error in register:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error' )
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
      return errorResponse(res, 'Failed to fetch user profile')
    }

    successResponse(res, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: userProfile,
    })
  } catch (err) {
    logger.error('Error in login:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}

// Forgot password (Supabase handles via email)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    return errorResponse(res, 'Email required')
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BASE_URL}/reset-password`,
    })

    if (error) {
      return errorResponse(res, error.message )
    }

    successResponse(res, { message: 'Password reset email sent' })
  } catch (err) {
    logger.error('Error in forgotPassword:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}

// Change password (requires current password for security)
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Current and new password required')
  }

  try {
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user!.email,
      password: currentPassword,
    })
    if (signInError) {
      return errorResponse(res, 'Current password is incorrect')
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user!.id,
      { password: newPassword }
    )
    if (updateError) {
      return errorResponse(res, updateError.message )
    }

    successResponse(res, { message: 'Password changed successfully' })
  } catch (err) {
    logger.error('Error in changePassword:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error')
  }
}

// Referrer Info
export const getReferrerInfo = async (req: Request, res: Response) => {
  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return errorResponse(res, 'Token required' )
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
      return errorResponse(res, 'Invalid or expired invitation token' )
    }

    const { data: sponsor, error: sponsorError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', invToken.sponsor_id)
      .single()

    if (sponsorError || !sponsor) {
      return errorResponse(res, 'Sponsor not found' )
    }

    successResponse(res, { referrer: sponsor })
  } catch (err) {
    logger.error('Error in getReferrerInfo:', { error: err, userId: req.user?.id })
    errorResponse(res, 'Server error' )
  }
}

// Send OTP for signup or forgot password
export const sendOtp = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) {
    return errorResponse(res, 'Email and purpose required' );
  }

  // Allowed purposes
  const allowedPurposes = [OtpPurpose.SIGNUP, OtpPurpose.FORGOT];
  if (!allowedPurposes.includes(purpose)) {
    return errorResponse(res, 'Invalid purpose. Must be "signup" or "forgot".' );
  }

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    if (userError) throw userError;

    if (purpose === OtpPurpose.SIGNUP && users.length > 0) {
      return errorResponse(res, 'Email already registered' );
    }
    if (purpose === OtpPurpose.FORGOT && users.length === 0) {
      return errorResponse(res, 'Email not found' );
    }

    const otp = generateOTP();
    await storeOTP(email, otp, purpose);
    await sendOTP(email, otp, purpose);
    successResponse(res, { message: 'OTP sent successfully' });
  } catch (err: any) {
    logger.error('Error in sendOtp:', { error: err, userId: req.user?.id });
    errorResponse(res, 'Server error');
  }
};

//logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Supabase session is client-side, but you can:
    // 1. Add token to blacklist (if using JWT blacklist)
    // 2. Or just instruct client to delete token
    
    // For now, just return success
    successResponse(res, { message: 'Logged out successfully' })
  } catch (err) {
    logger.error('Error in logout:', { error: err, userId: req.user?.id });
    errorResponse(res, 'Server error' )
  }
}

export const verifyToken = async (req: Request, res: Response) => {
  // Token already verified by authMiddleware
  successResponse(res, { valid: true, user: { id: req.user!.id, email: req.user!.email } });
};


// This endpoint is for resetting password using the token sent by Supabase (after user clicks the link in email)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return errorResponse(res, 'Token and new password required');
  }

  try {
    // Supabase Admin se user fetch using the access token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return errorResponse(res, 'Invalid or expired token');
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return errorResponse(res, updateError.message);
    }

    successResponse(res, { message: 'Password reset successfully' });
  } catch (err) {
    logger.error('Reset password error:', err);
    errorResponse(res, 'Server error');
  }
};

// refresh token endpoint to get new access token using refresh token
export const refreshToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) throw error;
    
    // ✅ Check if session exists
    if (!data.session) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    res.status(401).json({ message: err.message || 'Invalid or expired refresh token' });
  }
};