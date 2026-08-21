import nodemailer from "nodemailer";

// Persistent Transporter Singleton with Warm Connection Pool
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const isSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: isSecure,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.SMTP_USER || "inflixoapp@gmail.com",
    pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 8000,
});

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';

  // Clean inline SVG Vector Email Template without any external attachments
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inflixo Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(101, 18, 250, 0.08);">
              
              <!-- Vivid Electric Violet Gradient Header Banner -->
              <tr>
                <td style="background-color: #803D63; padding: 36px 24px 28px 24px; text-align: center;">
                  
                  <!-- Clean Glassmorphic Squircle Badge with Inline SVG Logo -->
                  <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border: 1.5px solid rgba(255, 255, 255, 0.4); border-radius: 16px; width: 50px; height: 50px; text-align: center; margin: 0 auto 12px auto;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" style="vertical-align: middle; margin-top: 9px;">
                      <g stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
                        <path d="M 28 42 L 28 24 C 28 14 38 10 50 10 C 62 10 72 14 72 24 L 72 42" />
                        <path d="M 28 58 L 28 76 C 28 86 38 90 50 90 C 62 90 72 86 72 76 L 72 58" />
                        <path d="M 28 34 C 28 38 34 42 40 42" />
                        <path d="M 72 34 C 72 38 66 42 60 42" />
                        <path d="M 28 66 C 28 62 34 58 40 58" />
                        <path d="M 72 66 C 72 62 66 58 60 58" />
                      </g>
                      <g fill="#FFFFFF">
                        <rect x="33" y="22" width="34" height="8.5" rx="4.25" />
                        <rect x="44" y="30.5" width="12" height="39" rx="6" />
                        <rect x="33" y="69.5" width="34" height="8.5" rx="4.25" />
                      </g>
                    </svg>
                  </div>

                  <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">
                    Inflixo
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.85); font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">
                    One Link for Your Content &amp; Fanbase
                  </p>
                </td>
              </tr>

              <!-- Email Body Content -->
              <tr>
                <td style="padding: 32px 24px; text-align: center;">
                  <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 8px 0;">
                    Verify Your Email 🔒
                  </h2>
                  <p style="color: #64748B; font-size: 14px; font-weight: 500; line-height: 1.5; margin: 0 0 24px 0;">
                    Use the 4-digit verification code below to log in to your Inflixo account.
                  </p>

                  <!-- High-Impact OTP Display Box -->
                  <div style="background-color: #F6EBF1; border: 2px dashed #803D63; border-radius: 16px; padding: 20px 12px; text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 40px; font-weight: 900; letter-spacing: 14px; color: #803D63; font-family: 'Courier New', Courier, monospace; line-height: 1; padding-left: 14px;">
                      ${otpCode}
                    </div>
                  </div>

                  <!-- Expiration & Security Info Badge -->
                  <div style="display: inline-block; background-color: #F1F5F9; border-radius: 20px; padding: 6px 14px; margin-bottom: 20px;">
                    <span style="color: #475569; font-size: 12px; font-weight: 700;">
                      ⏱️ Valid for 5 minutes • Do not share
                    </span>
                  </div>

                  <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 0 0 20px 0;" />

                  <!-- Help & Security Footer -->
                  <p style="color: #94A3B8; font-size: 11px; font-weight: 500; line-height: 1.4; margin: 0;">
                    If you did not request this login code, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer Signature -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center;">
                  <p style="color: #94A3B8; font-size: 11px; font-weight: 600; margin: 0;">
                    © ${new Date().getFullYear()} Inflixo Inc. • Built for Content Creators
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `${otpCode} is your Inflixo verification code`,
      html,
    });
    console.log(`✉️ OTP Email sent with inline SVG logo to ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error("❌ Failed to send OTP email:", err.message || err);
    return false;
  }
}

export async function sendBroadcastEmail(
  toEmail: string,
  subject: string,
  messageBodyHtml: string
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAFAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAFAFC; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(108, 43, 255, 0.06);">
              
              <!-- Inflixo Header -->
              <tr>
                <td style="background-color: #803D63; padding: 28px 24px; text-align: center;">
                  <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Inflixo</h1>
                  <p style="color: rgba(255, 255, 255, 0.85); font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">Official Creator Broadcast</p>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 28px; color: #1E293B; font-size: 14px; line-height: 1.6;">
                  ${messageBodyHtml}
                </td>
              </tr>

              <!-- Footer Signature -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center;">
                  <p style="color: #94A3B8; font-size: 11px; font-weight: 600; margin: 0;">
                    © ${new Date().getFullYear()} Inflixo · TrustIQ Labs • Sent from inflixoapp@gmail.com
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // First Attempt: Primary Transporter (Port 465 SSL)
  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html,
    });
    console.log(`✉️ Broadcast Email sent from inflixoapp@gmail.com to ${toEmail}`);
    return { success: true };
  } catch (err1: any) {
    const errorMsg1 = err1?.message || String(err1);
    console.warn(`⚠️ Primary transport failed for ${toEmail}: ${errorMsg1}. Attempting port 587 fallback...`);

    // Fallback Attempt: Port 587 STARTTLS
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.SMTP_USER || "inflixoapp@gmail.com",
          pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
        },
        tls: { rejectUnauthorized: false },
      });

      await fallbackTransporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });

      console.log(`✉️ Fallback Broadcast Email sent to ${toEmail} via Port 587`);
      return { success: true };
    } catch (err2: any) {
      const finalError = err2?.message || errorMsg1;
      console.error(`❌ Failed to send broadcast email to ${toEmail}:`, finalError);
      return { success: false, error: finalError };
    }
  }
}
