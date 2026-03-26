import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // 587 ke liye false, 465 ke liye true
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email: string, otp: string, purpose: string) => {
  const subject = purpose === 'signup' ? 'PlusOne Signup OTP' : 'PlusOne Forgot Password OTP';
  const html = `<p>Your OTP for ${purpose} is: <b>${otp}</b>. It expires in 10 minutes.</p>`;

  await transporter.sendMail({
    from: `"PlusOne" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject,
    html,
  });
};