import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendOTP = async (email: string, otp: string, purpose: string) => {
  const subject = purpose === 'signup' ? 'PlusOne Signup OTP' : 'PlusOne Forgot Password OTP';
  const html = `<p>Your OTP for ${purpose} is: <b>${otp}</b>. It expires in 10 minutes.</p>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject,
    html,
  });
};