import crypto from 'crypto';
import { supabase } from '../config/supabase';

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const storeOTP = async (email: string, otp: string, purpose: string) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await supabase.from('otps').insert({
    email,
    otp_code: otp,
    purpose,
    expires_at: expiresAt.toISOString(),
  });
};

export const verifyOTP = async (email: string, otp: string, purpose: string) => {
  const { data, error } = await supabase
    .from('otps')
    .select('id')
    .eq('email', email)
    .eq('otp_code', otp)
    .eq('purpose', purpose)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  // Delete used OTP
  await supabase.from('otps').delete().eq('id', data[0].id);
  return true;
};