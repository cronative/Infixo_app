import { PLANS } from "@/config/plans";
import { LEGAL_ENTITY as E } from "@/lib/legalVersions";
import { a, b, mail, p, section, sub, ul, type LegalBlock, type LegalSection } from "@/components/legal/legalContent";

const TRIAL_DAYS = PLANS.trial.trialDays ?? 7;

export const CREATOR_TERMS_INTRO: LegalBlock[] = [
  p(
    "These Creator Terms & Conditions (the ", b("“Creator Terms”"), ") apply to everyone who registers on Inflixo as a creator and builds a public profile. Inflixo is operated by ",
    b(E.companyName), " (", b("“Inflixo”"), ", ", b("“we”"), ", ", b("“us”"), " or ", b("“our”"), ")."
  ),
  p(
    "The Creator Terms ", b("supplement"), " our ", a("/terms", "Terms of Service"), " and should be read together with them and with our ",
    a("/privacy", "Privacy Policy"),
    ". Words defined in the Terms of Service have the same meaning here. If the Creator Terms conflict with the Terms of Service on a creator-specific matter, the Creator Terms apply."
  ),
];

export const CREATOR_TERMS_SECTIONS: LegalSection[] = [
  section(
    "scope",
    "Scope and Acceptance",
    p(
      "By creating a creator account, completing onboarding or publishing a public profile, you agree to these Creator Terms, the Terms of Service and the Privacy Policy. When you register, we record the versions of these documents you accepted and the time you accepted them."
    ),
    p(
      "If you use Inflixo on behalf of a business, agency, brand or another person, you confirm that you are authorised to accept these Creator Terms for them, and “you” includes that person or organisation."
    )
  ),
  section(
    "identity",
    "Creator Identity and Account Authenticity",
    p(
      "You must represent yourself truthfully. Your display name, username, photo, category, location and other profile details must relate to you, or to the person, group or brand you are authorised to represent, and must not mislead Visitors about who you are."
    ),
    p(
      "You may not create a profile that impersonates another creator, celebrity, brand or organisation, or that suggests an endorsement or affiliation that does not exist. Fan pages, parody and commentary profiles must say clearly that they are not the official account. Inflixo does not currently offer identity verification, and any badge or label shown on a profile does not mean Inflixo has verified the creator's identity unless we say so expressly."
    )
  ),
  section(
    "account-security",
    "Account Access and Security",
    p(
      "You sign in with your email address and a one-time verification code. Keep access to that email account secure, because anyone who can read it may be able to sign in to your Inflixo account. Do not share verification codes."
    ),
    p(
      "If you add team members or work with a manager or agency, you remain responsible for everything done through your account. Tell us promptly at ", mail(E.emails.support), " if you suspect unauthorised access."
    )
  ),
  section(
    "public-profile",
    "Your Public Creator Profile",
    p(
      "Your Inflixo profile is public by design while your trial or Paid Plan is active. Anyone with your profile address can see the information you publish, and it may be shared, linked to or indexed by search engines. Only publish information you are comfortable making public. Do not publish personal contact details of other people without their consent."
    ),
    p(
      "Some profile sections can be shown or hidden from your dashboard. When your trial ends without a Paid Plan, or your Paid Plan ends, your profile becomes private until you subscribe again."
    )
  ),
  section(
    "usernames-domains",
    "Usernames, Profile Addresses and Custom Domains",
    p(
      "Your username forms your profile address (for example, inflixo.com/yourname). Usernames must not infringe trademarks, impersonate others or be offensive. Some usernames are reserved. We may reclaim or change a username that breaches these Creator Terms, that is the subject of a valid trademark or impersonation complaint, or that has been inactive for a long period, with notice where reasonable."
    ),
    p(
      "Where available on your plan, you may connect a custom domain or subdomain that you own or control. You are responsible for the domain, its registration and its DNS settings. We may disconnect a custom domain that is misconfigured, used unlawfully or no longer verified."
    )
  ),
  section(
    "series",
    "Series, Playlists and Episode Links",
    p(
      "You can organise links to your published videos into series and episodes so Visitors can follow them in order. When you create a series you choose its platform (for example, YouTube, Instagram, Facebook or a mix of supported platforms), and you add each episode as a link with an episode number. Inflixo may reject links that do not match the chosen platform or that are not valid video links."
    ),
    p(
      b("Inflixo does not host, upload, store or stream your videos."),
      " Each episode is a link to a video published on a Third-Party Platform. You must only add links to videos that you published, that you own or that you have permission to feature, and you are responsible for keeping titles, descriptions and episode order accurate. If a linked video is removed, made private or restricted on the Third-Party Platform, the episode on Inflixo may stop working."
    )
  ),
  section(
    "ownership",
    "Ownership of Creator Content",
    p(
      "You own your Creator Content and the videos and other works you link to. You grant Inflixo the limited licence described in the ", a("/terms#license", "Terms of Service"),
      " so that we can host and display your profile, generate link previews and share images, create and export your media kit and otherwise operate the Service."
    ),
    p(
      "You confirm that your Creator Content does not infringe any copyright, trademark, privacy, publicity or other right, and that you have obtained any permissions needed from people who appear in it or who contributed to it."
    )
  ),
  section(
    "uploads",
    "Images and Files You Upload",
    p(
      "Unlike videos, some files you upload are stored by Inflixo, such as your profile photo, series cover images and product images. You must have the right to use every image you upload. Do not upload images of other people without their permission, sensitive personal information, or content that breaches the Acceptable Use rules in the Terms of Service."
    ),
    p("We may resize, compress or convert uploaded images so they display correctly, and we may remove images that breach these Creator Terms.")
  ),
  section(
    "social-connections",
    "Connecting Social Media Accounts",
    p(
      "You may add your social media accounts to your profile by entering their handles or links. You may only add accounts that you own or manage, or that you are expressly authorised to represent."
    ),
    p(
      "Inflixo may obtain and process publicly available social media information through permitted integrations, authorised third-party service providers and other lawful data sources, subject to applicable platform policies and data protection requirements. This may include an account's public name, handle, profile image and follower or subscriber count, which we may refresh periodically. We do not ask for your social media passwords."
    ),
    p(
      "Third-Party Platforms may change or restrict access to public information at any time. If that happens, some Audience Information may stop updating or may no longer be shown. Depending on your plan, some connected accounts may not be removable or editable during the free trial."
    )
  ),
  section(
    "metrics",
    "Follower, Subscriber and Fanbase Metrics",
    p("Audience Information on Inflixo is provided for general information. Counts:"),
    ul(
      "may be approximate, rounded (for example, 12.4K), delayed or temporarily unavailable;",
      "reflect what was publicly available when last refreshed, not real-time figures; and",
      "are not audited and are not a guarantee of reach, impressions, engagement or sales."
    ),
    p(
      "Your ", b("Total Fanbase"), " is the sum of the follower or subscriber counts of your primary accounts (one per supported platform). Additional accounts you add may be shown in your dashboard but are not counted. Total Fanbase is an aggregation of platform-specific counts, not a number of unique individuals, because one person may follow you on more than one platform."
    ),
    p(
      "Milestone badges such as Creator Era levels are calculated from your Total Fanbase and are a fun indicator of growth, not an official ranking or certification. You must not manipulate your counts (for example, by buying followers) to influence what is shown on Inflixo, and you must not present Inflixo metrics to brands as audited figures."
    )
  ),
  section(
    "media-kit",
    "Media Kit and Rate Cards",
    p(
      "Your media kit brings together your profile, Audience Information, collaboration packages, reviews and contact details, and can be shared or exported as a PDF. You set your own packages, deliverables, prices and turnaround times. Inflixo does not set, recommend, guarantee or take a share of your rates."
    ),
    p(
      "Make sure the information in your media kit is accurate and current, including any prices and inclusions, and update it when it changes. Exported or shared copies may continue to circulate after you change your profile; you are responsible for clarifying outdated information with brands."
    )
  ),
  section(
    "collaborations",
    "Collaboration Enquiries and Brand Deals",
    p(
      "Brands and other Visitors can contact you through your profile, for example through the Work With Me section, collaboration packages, email or WhatsApp links. Enquiries submitted through Inflixo are passed to you together with the details the sender provided."
    ),
    p(
      "Inflixo is not an agent, talent manager or party to any agreement between you and a brand. Any negotiation, contract, payment, invoicing, tax, deliverable or dispute is solely between you and the brand. Use enquiry information only to respond to that enquiry and handle it in line with applicable data protection law. Be cautious of requests for payment or personal financial information; Inflixo will never ask you to pay a brand to secure a collaboration."
    )
  ),
  section(
    "shop",
    "Creator Shop and Affiliate Disclosures",
    p(
      "You may list products in your shop, including products you recommend through affiliate links. You are responsible for every product you list: its name, image, price, description and destination link must be accurate and lawful, and you must have the right to use the product images."
    ),
    p(
      "Inflixo is not the seller of listed products, does not process product purchases and is not responsible for product quality, delivery, returns or the seller's practices. Purchases are made on the seller's website under its terms."
    ),
    p(
      "You must clearly disclose any material connection with a brand or product, such as affiliate commissions, free products or paid partnerships, as required by the Consumer Protection Act, 2019, guidelines issued under it on endorsements and misleading advertisements, applicable advertising standards and the rules of the relevant Third-Party Platforms. Products marked as affiliate products on Inflixo are labelled as such to Visitors, but that label does not replace your own disclosure obligations."
    ),
    p("Do not list products or services that are illegal, counterfeit, unsafe, age-restricted without appropriate safeguards, or otherwise prohibited by law or by the Terms of Service.")
  ),
  section(
    "custom-links",
    "Custom Links and External Destinations",
    p(
      "You may add custom links and link groups to your profile. Every link must go where its title says, and must not lead to malware, phishing, scams, adult content, illegal content or pages designed to mislead Visitors. Inflixo may generate previews of linked pages and may disable links that are reported or detected as harmful."
    ),
    p("You are responsible for the content of the pages you link to and for keeping your links up to date.")
  ),
  section(
    "team",
    "Creative Team Members",
    p(
      "Where your plan allows, you may list team members, such as editors, managers or camera operators, with their names, roles, photos and social links. You must have each person's permission before listing them and must remove their details if they ask. Listing a person does not give them access to your account unless a team access feature expressly provides it."
    )
  ),
  section(
    "reviews",
    "Client Reviews and Testimonials",
    p(
      "You may invite clients and brands you have genuinely worked with to leave a review through a private invitation link. Reviews appear on your profile only after you approve them."
    ),
    p("You must not:"),
    ul(
      "write, submit or arrange reviews about yourself, or ask friends, family or employees to pose as clients;",
      "offer payment, discounts or other incentives in exchange for positive reviews, unless clearly disclosed and permitted by law; or",
      "edit the meaning of a review or present a review as relating to work that was not performed."
    ),
    p(
      "Inflixo does not verify reviews. We may remove reviews that appear fake, misleading or unlawful, and we may take action on accounts that manipulate reviews."
    )
  ),
  section(
    "analytics",
    "Analytics and Profile Insights",
    p(
      "Inflixo may record events on your public profile, such as profile views, link clicks, episode clicks and enquiry submissions, to show you analytics in your dashboard and to operate and secure the Service. Analytics are estimates, may not capture every visit and may differ from figures reported by Third-Party Platforms. How we handle this information is explained in our ",
      a("/privacy", "Privacy Policy"), "."
    )
  ),
  section(
    "trial-plans",
    "Free Trial and Plan Limits",
    p(
      `New creators may receive a ${TRIAL_DAYS}-day free trial, with no payment card required. During the trial, your public profile is visible to Visitors and you can use the features and limits of the trial plan. When the trial ends, your profile automatically becomes private until you choose a Paid Plan. You are not charged automatically at the end of the trial.`
    ),
    p(
      "Each plan has its own limits (for example, the number of series, episodes per series, links, products, collaboration packages, reviews, gear items, team seats, social accounts and available themes), as shown on our pricing page and in your dashboard. If you exceed a limit, or move to a plan with lower limits, content above the limit may be hidden from your public profile or become read-only until you upgrade."
    )
  ),
  section(
    "paid-subscriptions",
    "Paid Subscriptions, Renewal and Cancellation",
    p(
      "Paid Plans are billed monthly or yearly in advance through our payment provider, at the price shown at checkout. Recurring subscriptions renew automatically at the end of each billing cycle until cancelled. You can cancel from Dashboard › Subscription; your plan stays active until the end of the period already paid, and no further renewals are charged."
    ),
    p(
      "Refunds are handled as described in the ", a("/terms#cancellation-refunds", "Cancellation and Refunds"),
      " section of the Terms of Service. If a payment fails or a subscription is halted by the payment provider, your account may return to the unpaid state and your profile may become private."
    )
  ),
  section(
    "responsibilities",
    "Creator Responsibilities and Legal Compliance",
    p("As a creator you are responsible for:"),
    ul(
      "complying with all laws that apply to your content and activities, including advertising, consumer protection, intellectual property, privacy and tax laws;",
      "obtaining consent from anyone whose personal data, image or work you publish on Inflixo;",
      "making accurate statements about your audience, past collaborations, brands you have worked with and results you have achieved;",
      "handling personal data you receive through Inflixo, such as brand enquiries, lawfully and securely;",
      "your own income, invoicing, GST and other tax obligations from collaborations, affiliate earnings and sales; and",
      "keeping your profile content appropriate for a general audience and labelling content that may not be suitable for minors."
    )
  ),
  section(
    "moderation",
    "Content Moderation and Enforcement",
    p(
      "We do not review all Creator Content before it is published, but we may review content that is reported to us or detected by our systems. If we reasonably believe content or behaviour breaches these Creator Terms, the Terms of Service or the law, we may remove or hide content, disable links, reset a username, make a profile private, limit features, or suspend or terminate an account."
    ),
    p(
      "Where reasonable, we will tell you what action we took and why, and you may ask us to review the decision by writing to ", mail(E.emails.grievance),
      ". We may act without notice where required by law, to protect Visitors, or to prevent fraud or abuse. Anyone can report content on a creator profile by emailing ", mail(E.emails.grievance), "."
    )
  ),
  section(
    "deletion",
    "Account Deletion and Data Handling",
    p(
      "You can delete your account from your dashboard settings, or by emailing ", mail(E.emails.privacy),
      " from your registered email address. Deleting your account removes your public profile and the content and settings associated with it, including series, links, products, media kit, reviews, team details, social account details and analytics, from our active systems. Deletion cannot be undone."
    ),
    p(
      "Some information may remain for a limited time in backups, or may be kept where we are required to do so by law (for example, payment and tax records held by us or our payment provider) or to resolve disputes, prevent fraud or enforce our agreements. Copies of your profile or media kit that others have saved or shared, and content you linked to on Third-Party Platforms, are outside our control. More detail, including retention timelines, is in our ",
      a("/privacy", "Privacy Policy"), "."
    ),
    p("Deleting your Inflixo account does not cancel a subscription with a third party or delete your accounts or videos on Third-Party Platforms.")
  ),
  section(
    "dependencies",
    "Third-Party Service Dependencies and Availability",
    p(
      "Inflixo relies on Third-Party Platforms and service providers, including social media platforms, data providers, hosting, email and payment providers. Their availability, policies, pricing and technical changes are outside our control and may affect features such as Audience Information, link previews, video links, sign-in emails and payments."
    ),
    p(
      "We aim to keep Inflixo available and reliable but do not guarantee uninterrupted service. We may carry out maintenance, and we may change or discontinue features that depend on a Third-Party Platform if that platform changes its terms or access. We are not affiliated with Meta, Instagram, Facebook, Google or YouTube."
    )
  ),
  section(
    "law-disputes",
    "Applicable Law and Dispute Resolution",
    p(
      "These Creator Terms are governed by the laws of India. The dispute resolution, jurisdiction (courts at ", E.jurisdictionCity, "), limitation of liability, disclaimer and indemnity provisions of the ",
      a("/terms", "Terms of Service"), " apply to these Creator Terms."
    ),
    p(
      "Before starting formal proceedings, please contact us at ", mail(E.emails.legal),
      " so we can try to resolve the issue informally. Nothing in these Creator Terms limits rights you have under mandatory consumer protection law."
    )
  ),
  section(
    "changes-contact",
    "Changes and Contact",
    sub(
      "Changes to these Creator Terms",
      p(
        "We may update these Creator Terms as Inflixo evolves or the law changes. The “Last updated” date and version above show the current version. For material changes, we will give reasonable notice by email or in your dashboard before they take effect, and we may ask you to accept the updated Creator Terms to keep using creator features. If you do not agree, you may stop using Inflixo and delete your account."
      )
    ),
    sub(
      "Contact",
      ul(
        ["Creator support: ", mail(E.emails.support)],
        ["Content reports and grievances: ", mail(E.emails.grievance)],
        ["Legal notices and copyright: ", mail(E.emails.legal)],
        ["Billing: ", mail(E.emails.billing)],
        ["Privacy and data requests: ", mail(E.emails.privacy)]
      ),
      p(b(E.companyName), " — operator of Inflixo, ", a("https://inflixo.com", "inflixo.com"), ".")
    )
  ),
];
