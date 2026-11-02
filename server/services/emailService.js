const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "inflixoapp@gmail.com",
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otpCode) {
  const from = process.env.EMAIL_FROM || '"Inflixo" <inflixoapp@gmail.com>';

  if (!process.env.SMTP_PASS) {
    console.error("❌ SMTP_PASS is missing. OTP email was not sent.");
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:32px 16px; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 440px; margin: 0 auto; padding: 32px 24px; border-radius: 20px; background-color: #ffffff; border: 1px solid #D9DEE8; text-align: center;">
          <!-- Inflixo Logo -->
          <div style="margin-bottom: 20px;">
            <img
              src="${process.env.NEXT_PUBLIC_APP_URL || "https://inflixo.com"}/images/inflixo-wordmark-title.png"
              alt="Inflixo"
              height="26"
              style="height: 26px; width: auto; max-height: 26px; display: inline-block; border: 0;"
            />
          </div>

          <!-- Heading -->
          <h1 style="margin: 0 0 6px 0; color: #18181B; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
            Your sign-in code
          </h1>

          <!-- Subtitle -->
          <p style="margin: 0 0 20px 0; color: #64748B; font-size: 13px; font-weight: 500; line-height: 1.4;">
            Use this code to sign in to your Inflixo Creator Studio.
          </p>

          <!-- 4-Digit Code Box -->
          <div style="background-color: #FAF5F7; border: 1.5px dashed #7A2253; border-radius: 5px; padding: 18px; margin-bottom: 18px;">
            <span style="font-size: 38px; font-weight: 900; letter-spacing: 14px; color: #7A2253; font-family: 'Courier New', Courier, monospace; line-height: 1; padding-left: 14px;">
              ${otpCode}
            </span>
          </div>

          <!-- Expiry Notice -->
          <p style="margin: 0 0 20px 0; color: #64748B; font-size: 12px; font-weight: 600;">
            Code valid for 5 minutes. Never share this code with anyone.
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
