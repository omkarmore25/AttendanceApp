/**
 * Email Service — Handles Email Verification & Password Reset Emails
 * Configured with Gmail App Password / Nodemailer SMTP
 */

const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    if (user.includes('gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT) || 465;
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
};

// 1. Account Verification Email
const sendVerificationEmail = async (email, name, verificationToken) => {
  const transporter = createTransporter();
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:8081'}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; background-color: #0d1322; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #212d4a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff6b00; margin: 0; font-size: 28px;">📍 AttendanceApp</h1>
      </div>
      <div style="background-color: #161f33; padding: 25px; border-radius: 12px; border: 1px solid #273554; color: #ffffff;">
        <h2 style="color: #ffffff; margin-top: 0;">Welcome, ${name}! 🎉</h2>
        <p style="font-size: 15px; color: #94a3b8; line-height: 1.6;">
          Thank you for signing up. Please verify your email address to complete registration:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #ff6b00; color: #ffffff; padding: 14px 32px; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 10px; display: inline-block;">
            ${verificationToken}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center;">
          Valid for 10 minutes. Enter this code in the app to verify your account.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const sender = process.env.SMTP_USER || process.env.EMAIL_USER;
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'AttendanceApp'}" <${sender}>`,
        to: email,
        subject: 'Verify Your AttendanceApp Account ✅',
        html,
      });
      console.log(`✅ [GMAIL SENT] Verification Email delivered to ${email}`);
      return { success: true };
    } catch (err) {
      console.error('⚠️ [EMAIL SEND ERROR]:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'SMTP Transporter not configured' };
};

// 2. Password Reset Email
const sendPasswordResetEmail = async (email, resetLink, code, name) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; background-color: #0d1322; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #212d4a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff6b00; margin: 0; font-size: 28px;">📍 AttendanceApp</h1>
      </div>
      <div style="background-color: #161f33; padding: 25px; border-radius: 12px; border: 1px solid #273554; color: #ffffff;">
        <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request 🔐</h2>
        <p style="font-size: 15px; color: #94a3b8; line-height: 1.6;">
          Hi ${name || 'User'}, we received a request to reset your password. Use the 6-digit code below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #ff6b00; color: #ffffff; padding: 14px 32px; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 10px; display: inline-block;">
            ${code}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center;">
          Valid for 1 hour. If you did not request a password reset, please ignore this email.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const sender = process.env.SMTP_USER || process.env.EMAIL_USER;
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'AttendanceApp'}" <${sender}>`,
        to: email,
        subject: 'Reset your AttendanceApp Password 🔐',
        html,
      });
      console.log(`✅ [GMAIL SENT] Password Reset Email delivered to ${email}`);
      return { success: true };
    } catch (err) {
      console.error('⚠️ [RESET EMAIL ERROR]:', err.message);
    }
  }

  console.log(`🔑 Reset Password Code for ${email}: ${code}`);
  return { success: true };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
