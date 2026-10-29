import { PLANS } from "@/config/plans";
import { LEGAL_ENTITY as E } from "@/lib/legalVersions";
import { a, b, mail, ol, p, section, sub, ul, type LegalBlock, type LegalSection } from "@/components/legal/legalContent";

const TRIAL_DAYS = PLANS.trial.trialDays ?? 7;
const PAID_PLAN_NAMES = [PLANS.starter.name, PLANS.pro.name, PLANS.vip.name].join(", ");

export const TERMS_INTRO: LegalBlock[] = [
  p(
    "These Terms of Service (the ", b("“Terms”"), ") govern your access to and use of Inflixo, including the website at ",
    a("https://inflixo.com", "inflixo.com"),
    ", public creator profiles, the creator dashboard and related services (together, the ", b("“Service”"), "). Inflixo is operated by ",
    b(E.companyName), " (", b("“Inflixo”"), ", ", b("“we”"), ", ", b("“us”"), " or ", b("“our”"), ")."
  ),
  p(
    "Please read these Terms carefully. By creating an account, accessing a creator profile or otherwise using the Service, you agree to these Terms and to our ",
    a("/privacy", "Privacy Policy"), ". If you register as a creator, the ",
    a("/creator-terms", "Creator Terms & Conditions"),
    " also apply to you. If you do not agree, please do not use the Service."
  ),
];

export const TERMS_SECTIONS: LegalSection[] = [
  section(
    "about",
    "About Inflixo and These Terms",
    p(
      "Inflixo is a creator profile and link-in-bio platform. It lets creators build a public profile, organise links to videos they have already published on third-party platforms into series and episodes, display their social media audience, share links, products, a media kit and collaboration packages, and receive collaboration enquiries."
    ),
    p(
      "These Terms form a legally binding agreement between you and ", b(E.companyName), ". Additional terms may apply to particular features, including the ",
      a("/creator-terms", "Creator Terms & Conditions"),
      " for creators and any terms shown at the time of purchase. If there is a conflict, the more specific terms apply to that feature."
    )
  ),
  section(
    "definitions",
    "Definitions",
    ul(
      [b("“Creator”"), " means a person who registers an account on Inflixo to build a public profile."],
      [b("“Visitor”"), " means anyone who views a public creator profile or other public page, including fans and brands."],
      [b("“Creator Content”"), " means anything a creator adds to Inflixo, including profile details, text, images, links, series and episode information, products, reviews they choose to display and media kit details."],
      [b("“Third-Party Platform”"), " means a service not operated by Inflixo, such as YouTube, Instagram, Facebook, payment providers and other websites linked from Inflixo."],
      [b("“Audience Information”"), " means follower, subscriber and similar counts and related public details for social media accounts connected to a creator profile."],
      [b("“Paid Plan”"), " means a paid subscription to Inflixo (currently offered as ", PAID_PLAN_NAMES, ")."]
    )
  ),
  section(
    "eligibility",
    "Eligibility",
    p(
      "You may use the Service only if you can form a binding contract under applicable law. You must be at least eighteen (18) years old, or the age of majority where you live if higher, to create an account. If you are under that age, you may use the Service only with the involvement and verifiable consent of a parent or legal guardian, who agrees to these Terms on your behalf and is responsible for your use of the Service."
    ),
    p("Only adults may purchase a Paid Plan. You may not use the Service if you have previously been barred from using it or if doing so would violate applicable law.")
  ),
  section(
    "accounts",
    "Accounts and Registration",
    p(
      "To create an account you sign in with your email address and a one-time verification code. You agree to provide accurate and current information, to keep your email account secure and to notify us promptly at ",
      mail(E.emails.support), " if you believe your account has been accessed without permission."
    ),
    p(
      "You are responsible for all activity that takes place through your account. You may not share, sell or transfer your account, and you may not create an account for someone else without their authorisation. Usernames are provided on a first-come basis and may not be used to impersonate others or to mislead Visitors."
    )
  ),
  section(
    "service",
    "The Inflixo Service",
    p("The Service may include the following features, depending on your plan:"),
    ul(
      "A public creator profile at a personal web address (for example, inflixo.com/yourname).",
      "Series and episodes built from links to videos already published on Third-Party Platforms.",
      "Display of Audience Information and an aggregated Total Fanbase figure.",
      "Custom links, a shop of recommended or affiliate products, a media kit with collaboration packages, client reviews and creative team listings.",
      "Collaboration enquiry forms for brands and profile analytics for creators."
    ),
    p(
      b("Inflixo organises links to existing videos. It does not host, store, stream or distribute the underlying third-party videos."),
      " When a Visitor opens an episode, they are taken to, or shown content from, the Third-Party Platform where the video is published, and that platform's terms apply."
    ),
    p(
      "We may change, add or remove features, and we may set or change plan limits, with reasonable notice where a change materially reduces what you have paid for. Features shown on our website may differ by plan."
    )
  ),
  section(
    "your-content",
    "Your Content and Ownership",
    p(
      "You keep all ownership rights in your Creator Content and in the videos and other works you link to. Inflixo does not claim ownership of your creative work."
    ),
    p(
      "You are solely responsible for your Creator Content. You confirm that you own it or have all rights, licences and permissions needed to add it to Inflixo and to let us use it as described in these Terms, and that it does not infringe anyone's rights or break any law."
    )
  ),
  section(
    "license",
    "Limited Licence You Grant to Inflixo",
    p(
      "You grant Inflixo a non-exclusive, worldwide, royalty-free, sublicensable (only to our service providers) licence to host, store, reproduce, format, display and transmit your Creator Content solely to operate, provide, secure and improve the Service. This includes showing your public profile, generating link previews and share images, creating your media kit and exporting it at your request."
    ),
    p(
      "We may also display your public profile name, username and profile image to illustrate the Service, for example as a featured or demo profile, only where you have given separate permission. This licence ends when you delete the relevant content or your account, except for copies that remain in backups for a limited period, content that others have already shared, or where we must keep information to comply with law."
    )
  ),
  section(
    "series-links",
    "External Video Links and Series",
    p(
      "Series and episodes on Inflixo consist of links that point to videos published on Third-Party Platforms. Creators choose the platform for each series and add the episode links in order. Inflixo may display titles, descriptions, episode numbers, cover images and metadata provided by the creator or retrieved from the linked page."
    ),
    p(
      "Inflixo does not control linked videos. A video may be removed, made private, edited, geo-restricted or age-restricted by its owner or by the Third-Party Platform at any time, and a link may stop working. We are not responsible for the availability, accuracy or legality of content on Third-Party Platforms."
    )
  ),
  section(
    "social-data",
    "Social Media Connections and Audience Information",
    p(
      "Creators may add the handles or links of their social media accounts. Inflixo may obtain and process publicly available social media information through permitted integrations, authorised third-party service providers and other lawful data sources, subject to applicable platform policies and data protection requirements."
    ),
    p("Audience Information shown on Inflixo:"),
    ul(
      "may be approximate, rounded, delayed or temporarily unavailable, and is refreshed periodically rather than in real time;",
      "depends on information made available by Third-Party Platforms, which may change or limit access at any time; and",
      "is provided for general information only and is not an audited or guaranteed measure of reach or engagement."
    ),
    p(
      "The ", b("Total Fanbase"), " figure is the sum of the platform-specific follower or subscriber counts of the accounts a creator has designated for it. It is not a count of unique people, because one person may follow a creator on more than one platform."
    )
  ),
  section(
    "third-party",
    "Third-Party Platforms and Services",
    p(
      "The Service links to and relies on Third-Party Platforms. Your use of a Third-Party Platform is governed by that platform's own terms and policies. Where Inflixo displays or links to YouTube content, you also agree to be bound by the ",
      a("https://www.youtube.com/t/terms", "YouTube Terms of Service"), ", and information may be handled in line with the ",
      a("https://policies.google.com/privacy", "Google Privacy Policy"), "."
    ),
    p(
      "Inflixo is an independent service. It is not affiliated with, endorsed by or sponsored by Meta Platforms, Inc., Instagram, Facebook, Google LLC or YouTube. All third-party names and logos are trademarks of their respective owners and are used only to identify the relevant platform."
    ),
    p("We are not responsible for Third-Party Platforms, their content, their availability or the way they handle your information.")
  ),
  section(
    "acceptable-use",
    "Acceptable Use",
    p("You agree that you will not, and will not help anyone else to:"),
    ul(
      "impersonate any person, creator, brand or organisation, or misrepresent your identity or affiliation;",
      "add social accounts, handles, videos or domains that you do not own, control or have permission to use;",
      "post or link to content that is unlawful, defamatory, obscene, sexually explicit, hateful, harassing, threatening, violent, misleading or harmful to minors;",
      "infringe copyright, trademark, privacy, publicity or other rights of any person;",
      "misrepresent Audience Information, reviews, testimonials, collaborations or brand relationships, or buy or fabricate followers or reviews to display on Inflixo;",
      "promote fraud, scams, pyramid schemes, unlawful gambling, counterfeit goods or products or services that are illegal where offered;",
      "send spam or use the Service for unsolicited bulk messages;",
      "scrape, crawl or harvest data from the Service, other than through public search engine indexing, or access it by automated means without our written permission;",
      "interfere with or disrupt the Service, probe or bypass security measures, or upload malicious code; or",
      "use the Service in any way that breaks applicable law, including the Information Technology Act, 2000 and the rules made under it."
    )
  ),
  section(
    "inflixo-ip",
    "Inflixo's Intellectual Property",
    p(
      "The Service, including its software, design, themes, text, graphics, the Inflixo name and logo and the “Creator Era” badges, is owned by or licensed to ",
      E.companyName,
      " and is protected by intellectual property laws. Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable and revocable licence to use the Service for its intended purpose. You may not copy, modify, distribute, sell or reverse-engineer any part of the Service, or use our trademarks, without our prior written permission, except as allowed by law."
    ),
    p("If you send us feedback or suggestions, we may use them without any obligation to you.")
  ),
  section(
    "subscriptions",
    "Free Trial, Subscriptions and Billing",
    sub(
      "Free trial",
      p(
        `New creators may receive a ${TRIAL_DAYS}-day free trial. No payment card is required to start the trial. During the trial your public profile is visible to Visitors. When the trial ends, your profile automatically becomes private (Visitors cannot view it) until you choose a Paid Plan. You are not charged automatically when the trial ends. Your account and content remain available to you in your dashboard.`
      )
    ),
    sub(
      "Paid Plans",
      p(
        "Paid Plans are offered on monthly or yearly billing cycles at the prices shown on our pricing page or at checkout, in Indian Rupees or another displayed currency. Prices include or exclude taxes as stated at checkout. Introductory or promotional prices apply only for the period stated in the offer."
      ),
      p(
        "Payments are processed by our third-party payment provider. We do not store your full card or bank details. Charges may appear on your statement as “Inflixo” or “", E.companyName, "”."
      )
    ),
    sub(
      "Renewal",
      p(
        "Where you choose a recurring subscription, your Paid Plan renews automatically at the end of each billing cycle, and you authorise us and our payment provider to charge the then-current price for the next cycle, until you cancel. We will tell you about any price change before it applies to your next renewal."
      )
    ),
    sub(
      "Plan changes",
      p(
        "Features and limits differ by plan. If you move to a plan with lower limits, or your Paid Plan ends, some features may stop working and content above the new limits may be hidden from your public profile until you upgrade again."
      )
    )
  ),
  section(
    "cancellation-refunds",
    "Cancellation and Refunds",
    p(
      "You can cancel a recurring subscription at any time from Dashboard › Subscription. Cancellation stops future renewals. Your Paid Plan stays active until the end of the billing period you have already paid for; after that your account moves to the unpaid state and your public profile becomes private."
    ),
    p(
      "Because access to paid features is provided immediately, subscription payments are non-refundable once a billing period has started, except where required by applicable law or as stated below."
    ),
    p(
      "If you were charged more than once for the same period, or charged because of a technical error, email ", mail(E.emails.billing),
      " within seven (7) days of the transaction with the payment reference. Verified duplicate or erroneous charges will be refunded to the original payment method, normally within 7–10 business days after approval."
    ),
    p("Nothing in this section limits any rights you have under applicable consumer protection law.")
  ),
  section(
    "shops-collaborations",
    "Creator Shops, Affiliate Links and Collaborations",
    p(
      "Creators may list products, often through affiliate links, and may publish collaboration packages and rates. ", b("Inflixo is not the seller"),
      " of any product shown in a creator's shop and is not a party to any purchase, which takes place on the seller's own website and under its terms. Prices and availability shown on Inflixo are added by creators and may not be current."
    ),
    p(
      "Creators may earn a commission from affiliate links. Creators are responsible for clearly disclosing affiliate relationships, paid partnerships and sponsorships as required by law and applicable advertising standards."
    ),
    p(
      "Collaboration enquiries submitted through a creator profile are sent to that creator. Any agreement, payment, deliverable or dispute between a creator and a brand is solely between them. Inflixo does not guarantee any collaboration, payment or outcome and is not responsible for the conduct of creators or brands."
    )
  ),
  section(
    "reviews-interactions",
    "Reviews, Enquiries and Interactions",
    p(
      "Creators may invite clients to leave reviews through a private link. Reviews are shown on a creator's profile only after the creator approves them. Reviews reflect the opinions of the people who wrote them; Inflixo does not verify reviews and does not endorse any creator, brand or review."
    ),
    p(
      "When you submit a review or a collaboration enquiry, you confirm that the information you provide is truthful and that you are entitled to share it, and you agree that it will be shared with the creator concerned and, for approved reviews, shown publicly."
    )
  ),
  section(
    "copyright",
    "Copyright Complaints and Content Removal",
    p(
      "We respect intellectual property rights and respond to notices of alleged infringement in line with the Copyright Act, 1957, the Information Technology Act, 2000 and other applicable law, including notices that follow the format of the U.S. Digital Millennium Copyright Act."
    ),
    p("To report content on Inflixo that you believe infringes your rights, email ", mail(E.emails.legal), " with:"),
    ol(
      "identification of the copyrighted work or other right you claim is infringed;",
      "the exact Inflixo URL where the material appears;",
      "your name, address, telephone number and email address;",
      "a statement that you believe in good faith that the use is not authorised by the rights owner, its agent or the law;",
      "a statement that the information in your notice is accurate and that you are the rights owner or authorised to act for them; and",
      "your physical or electronic signature."
    ),
    p(
      "We may remove or disable access to reported material and notify the creator concerned, who may respond with a counter-notice. We may suspend or terminate accounts of repeat infringers. Because episode videos are hosted on Third-Party Platforms, complaints about a video itself should also be sent to the platform hosting it."
    )
  ),
  section(
    "privacy",
    "Privacy and Data Protection",
    p(
      "Our ", a("/privacy", "Privacy Policy"), " explains how we collect, use, share and protect personal data, including data relating to creators, Visitors, brands that send enquiries and clients who submit reviews, and how you can exercise your rights. Our ",
      a("/cookies", "Cookie Policy"), " explains how we use cookies."
    ),
    p(
      "Creator profiles are public by design. Anything a creator chooses to publish, such as name, username, photo, bio, location, social accounts and links, can be seen by anyone with the profile address and may be indexed by search engines."
    )
  ),
  section(
    "termination",
    "Suspension and Termination",
    p(
      "You may stop using the Service at any time and may delete your account from your dashboard settings or by contacting ", mail(E.emails.support), "."
    ),
    p(
      "We may suspend, restrict or terminate your access, remove content or make a profile private, with or without notice, if we reasonably believe that you have breached these Terms or the Creator Terms, that your use creates legal risk or harm to others, or where we are required to do so by law or by a Third-Party Platform. Where reasonable, we will tell you why and give you an opportunity to respond."
    ),
    p(
      "When your account ends, your right to use the Service stops. Sections that by their nature should continue, including those on ownership, licences already granted for the purposes described above, disclaimers, limitation of liability, indemnity and governing law, will continue to apply."
    )
  ),
  section(
    "disclaimers",
    "Disclaimers",
    p(
      "The Service is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement and uninterrupted or error-free operation."
    ),
    p(
      "We do not guarantee any follower growth, views, sponsorships, collaborations, income or other results from using Inflixo, the accuracy of Audience Information, or the availability of any Third-Party Platform or linked content."
    )
  ),
  section(
    "liability",
    "Limitation of Liability",
    p(
      "To the fullest extent permitted by law, ", E.companyName,
      " and its directors, officers, employees and partners will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, revenue, audience, data, goodwill or reputation, arising out of or in connection with the Service."
    ),
    p(
      "To the fullest extent permitted by law, our total liability for all claims relating to the Service will not exceed the greater of (a) the amount you paid to Inflixo in the twelve (12) months before the event giving rise to the claim and (b) ₹1,000 (one thousand Indian Rupees)."
    ),
    p("Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law.")
  ),
  section(
    "indemnity",
    "Indemnification",
    p(
      "To the extent permitted by law, you agree to indemnify and hold harmless ", E.companyName,
      " and its directors, officers, employees and partners from any claims, losses, liabilities, damages and expenses (including reasonable legal fees) arising out of your Creator Content, your use of the Service, your dealings with brands, buyers or other users, or your breach of these Terms or of any law or third-party right."
    )
  ),
  section(
    "law-changes",
    "Governing Law, Disputes and Changes to These Terms",
    p(
      "These Terms are governed by the laws of India. Subject to any mandatory consumer protection rights you have, the courts at ", E.jurisdictionCity,
      " have exclusive jurisdiction over any dispute arising out of or relating to these Terms or the Service. Before starting formal proceedings, you agree to contact us at ",
      mail(E.emails.legal), " and to try in good faith to resolve the dispute informally for at least thirty (30) days."
    ),
    p(
      "We may update these Terms from time to time. The “Last updated” date above shows when they last changed. If a change is material, we will give reasonable notice, for example by email or a notice in your dashboard, before it takes effect, and we may ask you to accept the updated Terms. If you continue to use the Service after the changes take effect, you accept the updated Terms. If you do not agree, you should stop using the Service and may delete your account."
    ),
    p(
      "If any part of these Terms is found unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition or sale of assets. These Terms, together with the documents referred to in them, are the entire agreement between you and us about the Service."
    )
  ),
  section(
    "contact",
    "Grievance Redressal and Contact",
    p(
      "If you have a complaint about content on Inflixo or about the Service, you can contact our Grievance Officer at ", mail(E.emails.grievance),
      ". Complaints will be acknowledged and handled within the timelines required by the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and other applicable law. Further details are in our ",
      a("/privacy", "Privacy Policy"), "."
    ),
    p("Other contacts:"),
    ul(
      ["Legal notices and copyright complaints: ", mail(E.emails.legal)],
      ["Billing and refunds: ", mail(E.emails.billing)],
      ["Privacy and data requests: ", mail(E.emails.privacy)],
      ["General support: ", mail(E.emails.support)]
    ),
    p(b(E.companyName), " — operator of Inflixo, ", a("https://inflixo.com", "inflixo.com"), ".")
  ),
];
