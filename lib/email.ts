import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "inflixoapp@gmail.com",
    pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
  },
});

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border-radius: 24px; background-color: #ffffff; border: 1px solid #e9e5f5; box-shadow: 0 10px 30px rgba(109,40,217,0.08);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #6d28d9, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          ✨ INFLIXO
        </span>
      </div>
      
      <h2 style="color: #17141f; font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 8px;">
        Verify Your Creator Email
      </h2>
      <p style="color: #646077; font-size: 14px; text-align: center; line-height: 1.5; margin-bottom: 28px;">
        Use the 4-digit verification code below to log in to your Inflixo account. This code expires in 10 minutes.
      </p>

      <div style="background: linear-gradient(135deg, #f5f1fb, #fdf2f8); border: 2px dashed #d8b4fe; border-radius: 18px; padding: 20px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #6d28d9; font-family: monospace;">
          ${otpCode}
        </span>
      </div>

      <p style="color: #948fa8; font-size: 12px; text-align: center; line-height: 1.4;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Your Inflixo Login OTP: ${otpCode}`,
      html,
    });
    console.log(`✉️ OTP Email sent successfully to ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error("❌ Failed to send OTP email:", err.message);
    return false;
  }
}
