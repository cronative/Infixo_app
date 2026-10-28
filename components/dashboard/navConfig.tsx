import {
  Home,
  User,
  Link2,
  AtSign,
  Clapperboard,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  Briefcase,
  Star,
  BarChart3,
  Laptop,
  IdCard,
  Users,
  Eye,
  ShoppingBag,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    title: "OVERVIEW",
    items: [
      { href: "/dashboard", label: "Dashboard", subtitle: "Your creator studio at a glance", icon: Home },
    ],
  },
  {
    id: "content-links",
    title: "CONTENT & LINKS",
    items: [
      { href: "/dashboard/series", label: "Series", subtitle: "Organize your videos & episodes", icon: Clapperboard },
      { href: "/dashboard/products", label: "Shop", subtitle: "Products you recommend", icon: ShoppingBag },
      { href: "/dashboard/links", label: "Links", subtitle: "Share important links", icon: Link2 },
    ],
  },
  {
    id: "audience-trust",
    title: "AUDIENCE & TRUST",
    items: [
      { href: "/dashboard/socials", label: "Social Accounts", subtitle: "Connect & sync your social media", icon: AtSign },
      { href: "/dashboard/reviews", label: "Reviews", subtitle: "Showcase brand feedback", icon: Star },
      { href: "/dashboard/analytics", label: "Analytics", subtitle: "See profile visits & link clicks", icon: BarChart3 },
    ],
  },
  {
    id: "brand-collaborations",
    title: "BRAND & COLLABORATIONS",
    items: [
      { href: "/dashboard/mediakit", label: "Media Kit & Rates", subtitle: "Show your services & pricing", icon: Briefcase },
      { href: "/dashboard/team", label: "Team", subtitle: "Manage collaborators", icon: Users },
      { href: "/dashboard/setup", label: "Gear & Tools", subtitle: "Show your creator setup", icon: Laptop },
    ],
  },
  {
    id: "profile-appearance",
    title: "PROFILE & APPEARANCE",
    items: [
      { href: "/dashboard/profile", label: "Profile", subtitle: "Edit your creator details", icon: User },
      { href: "/dashboard/themes", label: "Themes", subtitle: "Customize your profile look", icon: Palette },
      { href: "/dashboard/preview", label: "Live Preview", subtitle: "See how your public profile looks", icon: Eye },
      { href: "/dashboard/creator-card", label: "Creator Card", subtitle: "Share your digital creator card", icon: IdCard },
    ],
  },
  {
    id: "account",
    title: "ACCOUNT",
    items: [
      { href: "/dashboard/subscription", label: "Plan", subtitle: "View limits & upgrade", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", subtitle: "Account & privacy controls", icon: Settings },
    ],
  },
];

/** All items, for title lookup and flattened consumers. */
export const SIDEBAR_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Flattened backward-compatible exports
export const WORKSPACE_NAV: NavItem[] = [...NAV_GROUPS[0].items, ...NAV_GROUPS[1].items, ...NAV_GROUPS[2].items];
export const ACCOUNT_NAV: NavItem[] = NAV_GROUPS[3].items;

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/series", label: "Series", icon: Clapperboard },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/mediakit", label: "Media Kit", icon: Briefcase },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** Page title for the current route (longest matching nav href). */
export function getNavTitle(pathname: string): string {
  const match = SIDEBAR_NAV
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
}

export const LOGOUT_ITEM = { href: "/login", label: "Logout", icon: LogOut };
