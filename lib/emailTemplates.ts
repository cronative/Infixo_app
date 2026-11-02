// ---------------------------------------------------------------------------
// Inflixo — Modern, Premium, Responsive Email Design System & Engine
// Primary Brand Palette: #7A2253 (Inflixo Maroon)
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

function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.DEV_APP_ORIGIN;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://inflixo.com";
}

function renderHeader(tagline: string = "For Creators. By Creators."): string {
  const baseUrl = getAppBaseUrl();
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #7A2253; border-radius: 8px 8px 0 0;">
      <tr>
        <td style="padding: 20px 28px; text-align: left;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: auto;">
            <tr>
              <!-- Brand Logo Image with Text Fallback -->
              <td style="vertical-align: middle;">
                <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: middle;">
                  <!--[if mso]>
                  <span style="color: #FFFFFF; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    Inflixo
                  </span>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <img
                    src="${baseUrl}/images/inflixo-logo-horizontal-white.png"
                    alt="Inflixo"
                    height="32"
                    style="height: 32px; width: auto; max-height: 32px; display: block; border: 0; outline: none; text-decoration: none;"
                  />
                  <!--<![endif]-->
                </a>
              </td>
              <!-- Inline Vertical Divider + Official Tagline -->
              <td style="vertical-align: middle; padding-left: 14px; margin-left: 14px; border-left: 1px solid rgba(255, 255, 255, 0.25);">
                <span style="color: rgba(255, 255, 255, 0.9); font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; white-space: nowrap;">
                  ${tagline}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderFooter(senderContext?: string): string {
  const baseUrl = getAppBaseUrl();
  const currentYear = new Date().getFullYear();
  const contextLine = senderContext
    ? `This email was sent by Inflixo on behalf of <strong style="color: #475569;">${senderContext}</strong>.`
    : `This email was sent by Inflixo Creator Platform.`;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-top: 1px solid #ECECF0; border-radius: 0 0 8px 8px;">
      <tr>
        <td style="padding: 28px 32px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <!-- Brand Logo / Wordmark in Footer -->
          <div style="margin-bottom: 8px;">
            <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <img
                src="${baseUrl}/images/inflixo-wordmark-title.png"
                alt="Inflixo"
                height="22"
                style="height: 22px; width: auto; max-height: 22px; display: inline-block; border: 0;"
              />
            </a>
          </div>

          <!-- Official Brand Tagline & Mission -->
          <p style="color: #7A2253; font-size: 11.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 4px 0;">
            For Creators. By Creators.
          </p>
          <p style="color: #64748B; font-size: 12px; font-weight: 500; margin: 0 0 16px 0;">
            Turn your videos into bingeable series. Your creator world in one link.
          </p>

          <!-- Context Line -->
          <p style="color: #94A3B8; font-size: 11px; font-weight: 500; margin: 0 0 14px 0;">
            ${contextLine}
          </p>

          <!-- Navigation Links -->
          <p style="color: #7A2253; font-size: 12px; font-weight: 700; margin: 0 0 14px 0;">
            <a href="${baseUrl}" target="_blank" style="color: #7A2253; text-decoration: none;">inflixo.com</a>
            &nbsp;•&nbsp;
            <a href="${baseUrl}/privacy" target="_blank" style="color: #7A2253; text-decoration: none;">Privacy Policy</a>
            &nbsp;•&nbsp;
            <a href="${baseUrl}/terms" target="_blank" style="color: #7A2253; text-decoration: none;">Terms of Service</a>
            &nbsp;•&nbsp;
            <a href="mailto:support@inflixo.com" style="color: #7A2253; text-decoration: none;">Help &amp; Support</a>
          </p>

          <!-- Copyright -->
          <p style="color: #94A3B8; font-size: 11px; font-weight: 500; margin: 0;">
            © ${currentYear} Inflixo • Made with ❤️ for creators in India
          </p>

        </td>
      </tr>
    </table>
  `;
}

function renderHeroBadge(badgeText: string): string {
  return `
    <div style="display: inline-block; background-color: #FAF5F7; border: 1px solid #F3E8EE; border-radius: 5px; padding: 4px 12px; margin-bottom: 16px;">
      <span style="color: #7A2253; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
    <div style="text-align: center; margin: 28px 0 20px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="12%" stroke="f" fillcolor="#7A2253">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" target="_blank" style="background-color: #7A2253; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 5px; display: inline-block; line-height: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
    <div style="background-color: #FAF5F7; border: 1px solid #ECECF0; border-radius: 5px; padding: 12px 16px; text-align: center; margin-top: 24px;">
      <p style="color: #64748B; font-size: 11.5px; font-weight: 500; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
        <td style="padding: 10px 14px; border-bottom: 1px solid #ECECF0; color: #64748B; font-size: 12.5px; font-weight: 700; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${item.label}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #ECECF0; color: #7A2253; font-size: 12.5px; font-weight: 800; width: 65%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${item.isLink
          ? `<a href="${item.value}" target="_blank" style="color: #7A2253; text-decoration: underline;">View Content ↗</a>`
          : item.value
        }
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFFFF; border: 1px solid #ECECF0; border-radius: 5px; overflow: hidden; margin: 18px 0;">
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
            
            <!-- Clean Inflixo 8px Container Table -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 660px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #ECECF0; overflow: hidden;">
              
              <!-- Global Header -->
              <tr>
                <td>
                  ${renderHeader(tagline)}
                </td>
              </tr>

              <!-- Main Body Content -->
              <tr>
                <td class="email-card-td" style="padding: 32px 32px 24px 32px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
        
        <h1 class="email-hero-title" style="color: #18181B; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">
          Your Sign-In Verification Code 🔒
        </h1>
        <p style="color: #52525B; font-size: 13.5px; line-height: 1.6; margin: 0 0 20px 0;">
          Use the 4-digit code below to log in to your Inflixo Creator Studio.
        </p>

        <div style="background-color: #FAF5F7; border: 1.5px dashed #7A2253; border-radius: 5px; padding: 20px 16px; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 42px; font-weight: 900; letter-spacing: 16px; color: #7A2253; font-family: 'Courier New', Courier, monospace; line-height: 1; padding-left: 16px;">
            ${code}
          </div>
        </div>

        ${renderTrustFootnote("Code valid for 5 minutes. Never share this code with anyone.", options.toEmail)}
      `;
      return wrapInCanvas(body, "For Creators. By Creators.", "Inflixo Auth");
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
