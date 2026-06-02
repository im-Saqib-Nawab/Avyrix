import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/services/logger.service';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: Number(config.SMTP_PORT) === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

function brandWrapper(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#12121a;border:1px solid #2a2a3a;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px;text-align:center;">
          <h1 style="margin:0;font-size:22px;background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AVYRIX AI</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;color:#e4e4e7;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;color:#71717a;font-size:12px;">
          &copy; ${new Date().getFullYear()} AVYRIX AI. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const hasSmtp = Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);

  if (!hasSmtp) {
    logger.info('Email skipped — SMTP not configured', { to, subject });
    return;
  }

  try {
    await transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      html,
    });
    logger.info('Email sent', { to, subject });
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = brandWrapper(
    'Verify your email',
    `
      <h2 style="margin:0 0 12px;color:#fff;font-size:20px;">Verify your email</h2>
      <p style="margin:0 0 24px;color:#a1a1aa;">Welcome to AVYRIX AI! Confirm your email address to unlock your account.</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Verify Email</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">Or copy this link:<br><a href="${verifyUrl}" style="color:#818cf8;word-break:break-all;">${verifyUrl}</a></p>
    `,
  );

  await sendEmail(email, 'Verify your AVYRIX AI account', html);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${config.FRONTEND_URL}/reset-password/${encodeURIComponent(token)}`;

  const html = brandWrapper(
    'Reset your password',
    `
      <h2 style="margin:0 0 12px;color:#fff;font-size:20px;">Reset your password</h2>
      <p style="margin:0 0 24px;color:#a1a1aa;">We received a request to reset your AVYRIX AI password. This link expires in 30 minutes.</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Reset Password</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
    `,
  );

  await sendEmail(email, 'Reset your AVYRIX AI password', html);
}
