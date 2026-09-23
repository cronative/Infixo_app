/**
 * Reserved usernames and system identifiers
 *
 * Prevents account impersonation and routing collisions with Next.js platform routes.
 */

export const RESERVED_USERNAMES = new Set([
  // Core platform & system routes
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "checkout",
  "cookies",
  "creator_email_sender",
  "dashboard",
  "demo",
  "demo_creator",
  "home",
  "login",
  "logout",
  "onboarding",
  "privacy",
  "review",
  "reviews",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "terms",
  "verify-otp",
  "verify",

  // Static assets & internal endpoints
  "assets",
  "uploads",
  "static",
  "media",
  "public",
  "icon",
  "apple-icon",
  "favicon",

  // Inflixo brand identity & official impersonation protection
  "inflixo",
  "inflixoapp",
  "inflixo_official",
  "inflixo_team",
  "inflixo_support",
  "official",
  "support",
  "help",
  "billing",
  "security",
  "contact",
  "team",
  "staff",
  "root",
  "moderator",
  "feedback",
  "legal",
  "press",
  "careers",
  "status",
  "about",
  "faq",
  "blog",
  "founder",
  "ceo",

  // Creator features & route sub-paths
  "series",
  "episodes",
  "mediakit",
  "media-kit",
  "links",
  "brands",
  "collaborations",
  "socials",
  "setup",
  "settings",
  "themes",
  "analytics",
  "profile",
]);

/**
 * Checks whether a requested username slug is reserved by the platform.
 */
export function isReservedUsername(rawUsername: string | null | undefined): boolean {
  if (!rawUsername || typeof rawUsername !== "string") return false;
  const normalized = rawUsername.trim().toLowerCase().replace(/^@+/, "");
  return RESERVED_USERNAMES.has(normalized);
}
