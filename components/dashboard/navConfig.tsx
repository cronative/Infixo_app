import {
  LayoutGrid,
  UserRound,
  Link2,
  AtSign,
  Layers,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  Briefcase,
  Star,
  BarChart3,
  Laptop,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

/**
 * Priority-Ordered Navigation Groups for Content Creators:
 * 1. STUDIO: Core day-to-day content & bio showcase (Home -> Series -> Links -> Socials -> Profile -> Themes)
 * 2. GROWTH: Business, brand deals, reviews & fanbase reach (Collabs -> Reviews -> Analytics)
 * 3. ACCOUNT: Platform billing, account configuration & setup (Plan -> Settings -> Setup)
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "studio",
    title: "Studio",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutGrid },
      { href: "/dashboard/series", label: "Series", icon: Layers },
      { href: "/dashboard/links", label: "Links", icon: Link2 },
      { href: "/dashboard/socials", label: "Socials", icon: AtSign },
      { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      { href: "/dashboard/themes", label: "Themes", icon: Palette },
    ],
  },
  {
    id: "growth",
    title: "Growth",
    items: [
      { href: "/dashboard/mediakit", label: "Collabs", icon: Briefcase },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { href: "/dashboard/subscription", label: "Plan", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/setup", label: "Setup", icon: Laptop },
    ],
  },
];

// Flattened backward-compatible exports
export const WORKSPACE_NAV: NavItem[] = [
  ...NAV_GROUPS[0].items,
  ...NAV_GROUPS[1].items,
];

export const ACCOUNT_NAV: NavItem[] = NAV_GROUPS[2].items;

export const SIDEBAR_NAV: NavItem[] = [
  ...WORKSPACE_NAV,
  ...ACCOUNT_NAV,
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/series", label: "Series", icon: Layers },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/mediakit", label: "Collabs", icon: Briefcase },
  { href: "/dashboard/settings", label: "Account", icon: Settings },
];

export const LOGOUT_ITEM = { href: "/login", label: "Logout", icon: LogOut };

