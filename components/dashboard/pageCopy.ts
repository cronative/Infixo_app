/** Static header copy for every /dashboard page: title, one-line subtitle and "How it works" bullets. */
export interface PageCopy {
  title: string;
  subtitle: string;
  help: string[];
}

export const PAGE_COPY = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Your creator world at a glance.",
    help: [
      "See this week's profile opens and clicks.",
      "Your top series, products and links show here.",
      "Follow \"Next steps\" to complete your profile.",
    ],
  },
  series: {
    title: "Series",
    subtitle: "Turn your videos into shows fans can binge in order.",
    help: [
      "Pick a platform and paste your video links as episodes.",
      "Fans watch Part 1, 2, 3 in the right order on your profile.",
      "Views and likes still count on YouTube/Instagram/Facebook.",
    ],
  },
  shop: {
    title: "Shop",
    subtitle: "Products you use, love or promote.",
    help: [
      "Paste a product or affiliate link; we fill in the details.",
      "Turn on \"Affiliate link\" so fans see an honest label.",
      "Fans tap a product to open your link.",
    ],
  },
  links: {
    title: "Links",
    subtitle: "Everything your fans should find — tickets, accounts, websites.",
    help: [
      "Add a single link or group related links together.",
      "Pin one link to keep it at the top.",
      "Drag to change the order fans see.",
    ],
  },
  socials: {
    title: "Your Fans",
    subtitle: "Every follower is someone who chose your content. Let's count them all ❤️",
    help: [
      "Add your Instagram, YouTube and Facebook usernames.",
      "We read only public follower counts — no login, no password.",
      "Your primary accounts add up to your total fans and Creator Era.",
    ],
  },
  reviews: {
    title: "Brand Reviews",
    subtitle: "Show brands what it's like to work with you.",
    help: [
      "Send a review request link to a brand you've worked with.",
      "You approve each review before it shows on your profile.",
      "Good reviews help new brands trust you faster.",
    ],
  },
  analytics: {
    title: "Analytics",
    subtitle: "What fans open and click on your profile.",
    help: [
      "Counts for the last 7 or 30 days.",
      "Your own visits while logged in aren't counted.",
      "Tap a section to see each series, link or product.",
    ],
  },
  mediakit: {
    title: "Media Kit",
    subtitle: "Your collab packages and rates for brands.",
    help: [
      "Create packages like a Brand Reel or a Cafe Visit.",
      "Brands see them in the Collab tab and can send you a request.",
      "Requests from brands appear below.",
    ],
  },
  team: {
    title: "Team",
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
    title: "Profile",
    subtitle: "Your name, link and story — how fans and brands know you.",
    help: [
      "Pick up to 3 niches so the right people find you.",
      "Write a short bio in your own voice.",
      "Save to update your public page instantly.",
    ],
  },
  themes: {
    title: "Themes",
    subtitle: "Pick a look for your public profile.",
    help: [
      "Tap a theme to preview it on the right.",
      "Press \"Apply theme\" to make it live.",
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
    title: "Creator Card",
    subtitle: "A shareable card for Stories and Status.",
    help: [
      "Choose a layout, colours and a tagline.",
      "Download or share it to your story.",
      "Fans scan the QR to open your profile.",
    ],
  },
  plan: {
    title: "Plan",
    subtitle: "Your plan, billing and usage.",
    help: [
      "See what's included and what you've used.",
      "Upgrade any time; nothing is deleted if you switch.",
      "Yearly plans save you more.",
    ],
  },
  settings: {
    title: "Settings",
    subtitle: "Your account and privacy.",
    help: [
      "Manage your email and search visibility.",
      "Deleting your account can't be undone.",
    ],
  },
} satisfies Record<string, PageCopy>;
