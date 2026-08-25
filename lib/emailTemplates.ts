// ---------------------------------------------------------------------------
// Inflixo — Modern, Premium, Responsive Email Design System & Engine
// Primary Brand Palette: #803D63 (Inflixo Maroon)
// Layout: 720px spacious responsive container with email-safe tables & inline CSS.
// ---------------------------------------------------------------------------

export interface EmailTemplateOptions {
  // Common Fields
  title?: string;
  badge?: string;
  heading?: string;
  subheading?: string;
  toEmail?: string;
  creatorName?: string;
  clientName?: string;
  clientEmail?: string;
  projectTitle?: string;
  contentUrl?: string;
  reviewUrl?: string;
  otpCode?: string;
  subject?: string;
  messageBodyHtml?: string;
  ctaText?: string;
  ctaUrl?: string;
  microCopy?: string;
  planName?: string;
  amount?: string;
  dateStr?: string;
  comment?: string;
  rating?: number;
  customItems?: { label: string; value: string; isLink?: boolean }[];
}

export type EmailTemplateType =
  | "otp"
  | "collab_review_request"
  | "review_received"
  | "welcome"
  | "onboarding_completed"
  | "collab_request_received"
  | "collab_request_accepted"
  | "collab_request_declined"
  | "new_collab_gig"
  | "subscription_activated"
  | "subscription_renewal"
  | "payment_successful"
  | "payment_failed"
  | "subscription_expiring"
  | "subscription_cancelled"
  | "profile_published"
  | "series_published"
  | "security_alert"
  | "creator_announcements"
  | "broadcast";

// ---------------------------------------------------------------------------
// HTML Component Helpers
// ---------------------------------------------------------------------------

function renderHeader(tagline: string = "Creator Platform • Collaboration & Growth"): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #803D63; border-radius: 16px 16px 0 0;">
      <tr>
        <td style="padding: 24px 32px; text-align: left;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align: middle;">
                <!-- Brand Identity -->
                <div style="display: inline-block; vertical-align: middle;">
                  <span style="color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    Inflixo
                  </span>
                </div>
                <!-- Inline Vertical Divider + Subtitle -->
                <div style="display: inline-block; vertical-align: middle; margin-left: 12px; padding-left: 12px; border-left: 1px solid rgba(255, 255, 255, 0.3);">
                  <span style="color: rgba(255, 255, 255, 0.85); font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    ${tagline}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderFooter(senderContext?: string): string {
  const currentYear = new Date().getFullYear();
  const contextLine = senderContext
    ? `This email was sent by Inflixo on behalf of <strong style="color: #475569;">${senderContext}</strong>.`
    : `This email was sent by Inflixo Creator Platform.`;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
      <tr>
        <td style="padding: 28px 32px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <!-- Brand Tagline -->
          <p style="color: #0F172A; font-size: 13px; font-weight: 800; margin: 0 0 4px 0;">
            Inflixo
          </p>
          <p style="color: #64748B; font-size: 12px; font-weight: 500; margin: 0 0 16px 0;">
            Everything you create. One place.
          </p>

          <!-- Context Line -->
          <p style="color: #94A3B8; font-size: 11px; font-weight: 500; margin: 0 0 14px 0;">
            ${contextLine}
          </p>

          <!-- Navigation Links -->
          <p style="color: #803D63; font-size: 12px; font-weight: 700; margin: 0 0 14px 0;">
            <a href="https://inflixo.com" target="_blank" style="color: #803D63; text-decoration: none;">inflixo.com</a>
            &nbsp;•&nbsp;
            <a href="https://inflixo.com/privacy" target="_blank" style="color: #803D63; text-decoration: none;">Privacy Policy</a>
            &nbsp;•&nbsp;
            <a href="https://inflixo.com/terms" target="_blank" style="color: #803D63; text-decoration: none;">Terms of Service</a>
            &nbsp;•&nbsp;
            <a href="mailto:support@inflixo.com" style="color: #803D63; text-decoration: none;">Help &amp; Support</a>
          </p>

          <!-- Copyright -->
          <p style="color: #94A3B8; font-size: 11px; font-weight: 500; margin: 0;">
            © ${currentYear} Inflixo Inc. • Sent from inflixoapp@gmail.com
          </p>

        </td>
      </tr>
    </table>
  `;
}

function renderHeroBadge(badgeText: string): string {
  return `
    <div style="display: inline-block; background-color: #F8F1F5; border: 1px solid #E8DCE4; border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
      <span style="color: #803D63; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${badgeText}
      </span>
    </div>
  `;
}

function renderCtaButton(label: string, url: string, microCopy?: string): string {
  const microTextHtml = microCopy
    ? `<p style="color: #94A3B8; font-size: 12px; font-weight: 600; margin: 10px 0 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ⏱️ ${microCopy}
       </p>`
    : "";

  return `
    <div style="text-align: center; margin: 32px 0 24px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="24%" stroke="f" fillcolor="#803D63">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" target="_blank" style="background-color: #803D63; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 12px; display: inline-block; line-height: 1; box-shadow: 0 4px 14px rgba(128, 61, 99, 0.25); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${label}
      </a>
      <!--<![endif]-->
      ${microTextHtml}
    </div>
  `;
}

function renderTrustFootnote(text: string, email?: string): string {
  const emailSnippet = email ? ` for <strong style="color: #475569;">${email}</strong>` : "";
  return `
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; text-align: center; margin-top: 24px;">
      <p style="color: #64748B; font-size: 12px; font-weight: 500; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        🔒 <strong>Secure Link</strong> • ${text}${emailSnippet}
      </p>
    </div>
  `;
}

function renderInfoTable(items: { label: string; value: string; isLink?: boolean }[]): string {
  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 13px; font-weight: 700; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${item.label}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-size: 13px; font-weight: 800; width: 65%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${
            item.isLink
              ? `<a href="${item.value}" target="_blank" style="color: #803D63; text-decoration: underline;">View Content ↗</a>`
              : item.value
          }
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAFAFC; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; margin: 20px 0;">
      ${rowsHtml}
    </table>
  `;
}

// ---------------------------------------------------------------------------
// Main Responsive Canvas Outer Template Wrapper
// ---------------------------------------------------------------------------

function wrapInCanvas(contentHtml: string, tagline?: string, senderContext?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Inflixo Notification</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; }
        @media only screen and (max-width: 680px) {
          .email-outer-td { padding: 16px 12px !important; }
          .email-card-td { padding: 24px 18px !important; }
          .email-hero-title { font-size: 22px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 32px 16px;">
        <tr>
          <td align="center" class="email-outer-td">
            
            <!-- Spacious 720px Container Table -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 720px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 10px 35px rgba(128, 61, 99, 0.05); overflow: hidden;">
              
              <!-- Global Compact Header -->
              <tr>
                <td>
                  ${renderHeader(tagline)}
                </td>
              </tr>

              <!-- Main Body Content -->
              <tr>
                <td class="email-card-td" style="padding: 36px 36px 28px 36px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  ${contentHtml}
                </td>
              </tr>

              <!-- Global Footer -->
              <tr>
                <td>
                  ${renderFooter(senderContext)}
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

// ---------------------------------------------------------------------------
// Master Template Render Dispatcher
// ---------------------------------------------------------------------------

export function renderEmailTemplate(type: EmailTemplateType, options: EmailTemplateOptions): string {
  const {
    otpCode,
    creatorName = "Digital Media House",
    clientName = "Valued Brand",
    clientEmail = "",
    projectTitle = "1x Sponsored Reel Campaign",
    contentUrl = "https://inflixo.com",
    reviewUrl = "https://inflixo.com",
    subject = "Inflixo Creator Update",
    messageBodyHtml = "",
    ctaText,
    ctaUrl,
    microCopy,
    planName = "Creator VIP Plan",
    amount = "₹2,999",
    dateStr = new Date().toLocaleDateString(),
    customItems,
  } = options;

  switch (type) {
    // 1. Email OTP / Login Code
    case "otp": {
      const code = otpCode || "1234";
      const body = `
        ${renderHeroBadge("SECURITY VERIFICATION")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
          Your Login Verification Code 🔒
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          Use the 4-digit code below to log in to your Inflixo creator dashboard.
        </p>

        <div style="background-color: #F8F1F5; border: 2px dashed #803D63; border-radius: 16px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 44px; font-weight: 900; letter-spacing: 16px; color: #803D63; font-family: 'Courier New', Courier, monospace; line-height: 1; padding-left: 16px;">
            ${code}
          </div>
        </div>

        ${renderTrustFootnote("Code valid for 5 minutes. Never share this code with anyone.", options.toEmail)}
      `;
      return wrapInCanvas(body, "Account Security", "Inflixo Auth");
    }

    // 2. Collab Review Request (Brand Invitation)
    case "collab_review_request": {
      const targetCtaUrl = reviewUrl || ctaUrl || "https://inflixo.com";
      const body = `
        ${renderHeroBadge("COLLABORATION REVIEW")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
          How was your collaboration with ${creatorName}?
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Your feedback helps creators build trust and showcase verified work to top brands.
        </p>

        ${renderInfoTable([
          { label: "Creator", value: creatorName },
          { label: "Client / Brand", value: clientName },
          { label: "Collaboration Title", value: projectTitle },
          { label: "Content Link", value: contentUrl, isLink: true },
        ])}

        ${renderCtaButton("★ Submit Review & Rating →", targetCtaUrl, "Takes less than 1 minute.")}

        ${renderTrustFootnote("This private review link was created specifically for you and can only be used once.", clientEmail)}
      `;
      return wrapInCanvas(body, "Brand Feedback Request", creatorName);
    }

    // 3. Review Received Notification (to Creator)
    case "review_received": {
      const body = `
        ${renderHeroBadge("NEW REVIEW SUBMITTED")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          ${clientName} left a 5-star review! ⭐
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          A new brand testimonial has been submitted for your collaboration on <strong>"${projectTitle}"</strong>.
        </p>

        ${renderInfoTable([
          { label: "Brand Client", value: clientName },
          { label: "Project Title", value: projectTitle },
          { label: "Status", value: "Pending Your Approval" },
        ])}

        ${renderCtaButton("Review & Approve Testimonial →", ctaUrl || "https://inflixo.com/dashboard/reviews")}
      `;
      return wrapInCanvas(body, "Creator Review Portal", creatorName);
    }

    // 4. Welcome to Inflixo
    case "welcome": {
      const body = `
        ${renderHeroBadge("WELCOME TO INFLIXO")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          Welcome aboard, ${creatorName}! 🚀
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Inflixo gives you one bio link for all your web series, YouTube shorts, Instagram reels, rate cards, and brand reviews.
        </p>

        ${renderCtaButton("Build Your Public Profile →", ctaUrl || "https://inflixo.com/dashboard")}
      `;
      return wrapInCanvas(body, "Welcome Creator", "Inflixo Team");
    }

    // 5. Creator Onboarding Completed
    case "onboarding_completed": {
      const body = `
        ${renderHeroBadge("PROFILE LIVE")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          Your Inflixo page is live! 🎉
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Congratulations! Your creator bio link, content series, and collaboration packages are published.
        </p>

        ${renderCtaButton("View Your Public Page ↗", ctaUrl || "https://inflixo.com/dashboard")}
      `;
      return wrapInCanvas(body, "Onboarding Completed", creatorName);
    }

    // 6. Collab Request Received
    case "collab_request_received": {
      const body = `
        ${renderHeroBadge("NEW BRAND INQUIRY")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          Inquiry from ${clientName}! 💼
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ${clientName} wants to collaborate with you on your <strong>"${projectTitle}"</strong> rate card package.
        </p>

        ${renderInfoTable([
          { label: "Brand Representative", value: clientName },
          { label: "Client Email", value: clientEmail },
          { label: "Package", value: projectTitle },
        ])}

        ${renderCtaButton("View Collab Inquiry →", ctaUrl || "https://inflixo.com/dashboard/mediakit")}
      `;
      return wrapInCanvas(body, "Direct Brand Inquiry", creatorName);
    }

    // 7. Subscription / Payment Successful
    case "payment_successful":
    case "subscription_activated": {
      const body = `
        ${renderHeroBadge("PAYMENT RECEIPT")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          Payment Received — ${planName}
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you! Your payment for Inflixo <strong>${planName}</strong> was processed successfully.
        </p>

        ${renderInfoTable([
          { label: "Plan", value: planName },
          { label: "Amount Paid", value: amount },
          { label: "Billing Date", value: dateStr },
          { label: "Status", value: "Active ✓" },
        ])}

        ${renderCtaButton("Go to Creator Dashboard →", ctaUrl || "https://inflixo.com/dashboard")}
      `;
      return wrapInCanvas(body, "Subscription Active", creatorName);
    }

    // 8. Payment Failed / Expiring
    case "payment_failed":
    case "subscription_expiring": {
      const body = `
        ${renderHeroBadge("SUBSCRIPTION NOTICE")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 10px 0;">
          Action Required: Update Subscription
        </h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          We couldn't process your payment for <strong>${planName}</strong> (${amount}). Please update your billing details to maintain uninterrupted VIP features.
        </p>

        ${renderCtaButton("Manage Subscription →", ctaUrl || "https://inflixo.com/dashboard/subscription")}
      `;
      return wrapInCanvas(body, "Billing Alert", creatorName);
    }

    // 9. Generic Broadcast / Custom Announcement Template
    case "broadcast":
    case "creator_announcements":
    default: {
      const title = subject || options.title || "Inflixo Creator Update";
      const customContent = messageBodyHtml || `
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We have exciting updates for creator pages, series management, and brand collaboration tools.
        </p>
      `;

      const ctaHtml = ctaText && ctaUrl ? renderCtaButton(ctaText, ctaUrl, microCopy) : "";
      const tableHtml = customItems && customItems.length > 0 ? renderInfoTable(customItems) : "";

      const body = `
        ${renderHeroBadge("CREATOR UPDATE")}
        
        <h1 class="email-hero-title" style="color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.5px;">
          ${title}
        </h1>

        <div style="color: #475569; font-size: 14px; line-height: 1.6;">
          ${customContent}
        </div>

        ${tableHtml}
        ${ctaHtml}
      `;
      return wrapInCanvas(body, "Official Creator Broadcast", "Inflixo Team");
    }
  }
}
