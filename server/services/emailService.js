const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "inflixoapp@gmail.com",
    pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
  },
});

async function sendOtpEmail(toEmail, otpCode) {
  const from = process.env.EMAIL_FROM || '"Inflixo" <inflixoapp@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:32px 16px; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 440px; margin: 0 auto; padding: 32px 24px; border-radius: 20px; background-color: #ffffff; border: 1px solid #E9E3F5; text-align: center;">
          <!-- Inflixo Logo -->
          <div style="margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 900; color: #651FFF; letter-spacing: -0.5px;">
              Inflixo
            </span>
          </div>

          <!-- Heading -->
          <h1 style="margin: 0 0 8px 0; color: #0F172A; font-size: 20px; font-weight: 800; tracking-tight: -0.5px;">
            Your sign-in code
          </h1>

          <!-- Subtitle -->
          <p style="margin: 0 0 24px 0; color: #64748B; font-size: 14px; font-weight: 500; line-height: 1.4;">
            Use this code to sign in to Inflixo.
          </p>

          <!-- 4-Digit Code Box -->
          <div style="background-color: #FAF9FF; border: 1px solid #E9E3F5; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #651FFF; font-family: monospace;">
              ${otpCode}
            </span>
          </div>

          <!-- Expiry Notice -->
          <p style="margin: 0 0 20px 0; color: #64748B; font-size: 13px; font-weight: 600;">
            Expires in 10 minutes.
          </p>

          <!-- Disclaimer -->
          <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 12px; line-height: 1.4;">
            Didn't request this?<br />
            You can safely ignore this email.
          </p>

          <!-- Divider -->
          <div style="border-top: 1px solid #E9E3F5; padding-top: 20px;">
            <p style="margin: 0; color: #94A3B8; font-size: 11px; font-weight: 500;">
              &copy; 2026 Inflixo &middot; A product by TrustIQ Labs
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `${otpCode} is your Inflixo sign-in code`,
      html,
    });
    console.log(`✉️ OTP Email sent successfully to ${toEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send OTP email via SMTP:", err.message);
    return false;
  }
}

module.exports = { sendOtpEmail };
