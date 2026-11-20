/**
 * Static header copy for every /dashboard page: title, one-line subtitle and
 * "How it works" bullets. Copy only — route names and DB fields stay as they are.
 */
export interface PageCopy {
  title: string;
  subtitle: string;
  help: string[];
}

export const PAGE_COPY = {
  dashboard: {
    title: "Your Creator Space",
    subtitle: "Your series, links and shop — all in one place.",
    help: [
      "See this week's profile opens and clicks.",
      "Your top series, products and links show here.",
      "Follow \"Next steps\" to complete your profile.",
    ],
  },
  series: {
    title: "My Series",
    subtitle: "Keep your videos together in one place.",
    help: [
      "Pick a platform and paste your video links as episodes.",
      "Fans watch Part 1, 2, 3 in the right order on your profile.",
      "Views and likes still count on YouTube/Instagram/Facebook.",
    ],
  },
  shop: {
    title: "My Shop",
    subtitle: "Products you use, love or promote.",
    help: [
      "Paste a product or affiliate link; we fill in the details.",
      "Turn on \"Affiliate link\" so fans see an honest label.",
      "Fans tap a product to open your link.",
    ],
  },
  links: {
    title: "My Links",
    subtitle: "Everything fans should find — websites, tickets, accounts.",
    help: [
      "Add a single link or group related links together.",
      "Pin one link to keep it at the top.",
      "Drag to change the order fans see.",
    ],
  },
  socials: {
    title: "My Socials",
    subtitle: "Add your accounts so fans can follow you everywhere.",
    help: [
      "Add your Instagram, YouTube and Facebook usernames.",
      "We read only public follower counts — no login, no password.",
      "Your primary accounts add up to your total fans and Creator Era.",
    ],
  },
  reviews: {
    title: "My Reviews",
    subtitle: "What brands say about working with you.",
    help: [
      "Send a review request link to a brand you've worked with.",
      "You approve each review before it shows on your profile.",
      "Good reviews help new brands trust you faster.",
    ],
  },
  analytics: {
    title: "My Analytics",
    subtitle: "What fans open and click on your profile.",
    help: [
      "Counts for the last 7 or 30 days.",
      "Your own visits while logged in aren't counted.",
      "Tap a section to see each series, link or product.",
    ],
  },
  mediakit: {
    title: "My Media Kit",
    subtitle: "Your collab packages and rates for brands.",
    help: [
      "Create packages like a Brand Reel or a Cafe Visit.",
      "Brands see them in the Collab tab and can send you a request.",
      "Requests from brands appear below.",
    ],
  },
  team: {
    title: "My Team",
    subtitle: "The people who help you create.",
    help: [
      "Add your editor, shooter or manager with their role.",
      "They're shown on your profile's Collab tab.",
      "Brands see you have a team behind your content.",
    ],
  },
  setup: {
    title: "My Setup",
    subtitle: "The camera, mic and apps behind your content.",
    help: [
      "Add the gear and software you use.",
      "Fans stop asking \"which camera?\" in your DMs.",
      "Add affiliate links if you like.",
    ],
  },
  profile: {
    title: "My Profile",
    subtitle: "Your name, photo and story — how fans and brands know you.",
    help: [
      "Pick up to 3 niches so the right people find you.",
      "Write a short bio in your own voice.",
      "Save to update your public page instantly.",
    ],
  },
  themes: {
    title: "My Theme",
    subtitle: "Pick a look and see your public page live.",
    help: [
      "The preview is your live public page.",
      "Tap a theme to try it there; press \"Apply theme\" to make it live.",
      "Your content stays the same; only the look changes.",
    ],
  },
  preview: {
    title: "Live Preview",
    subtitle: "Exactly what your fans see right now.",
    help: [
      "This is your live public page.",
      "Changes appear here after you save them.",
      "Share your link from the top bar.",
    ],
  },
  creatorCard: {
    title: "My Creator Card",
    subtitle: "Share your creator journey on Stories, Status and posts.",
    help: [
      "Choose a layout, colours and a tagline.",
      "Download or share it to your story.",
      "Fans scan the QR to open your profile.",
    ],
  },
  plan: {
    title: "My Plan",
    subtitle: "What's included, what you've used and billing.",
    help: [
      "See what's included and what you've used.",
      "Upgrade any time; nothing is deleted if you switch.",
      "Yearly plans save you more.",
    ],
  },
  settings: {
    title: "Settings",
    subtitle: "Your account, privacy and login.",
    help: [
      "Manage your email and search visibility.",
      "Deleting your account can't be undone.",
    ],
  },
  brands: {
    title: "My Brands",
    subtitle: "The businesses, products and channels you're building.",
    help: [],
  },
  collaborations: {
    title: "Brand Collaborations",
    subtitle: "Brands you've worked with, shown on your profile.",
    help: [],
  },
  requests: {
    title: "Brand Requests",
    subtitle: "Messages brands sent you from your profile.",
    help: [],
  },
} satisfies Record<string, PageCopy>;
