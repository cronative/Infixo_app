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
  IdCard,
  Inbox,
  Handshake,
  Store,
  Users,
  Eye,
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
 * Priority-ordered navigation groups:
 * 1. STUDIO — the creator's page and content (Series first after Home).
 * 2. BRAND DEALS — everything a brand sees or sends (Media Kit, inquiries, proof).
 * 3. SHOWCASE — optional profile sections (brands, team, gear).
 * 4. ACCOUNT — plan and settings.
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
      { href: "/dashboard/preview", label: "Preview", icon: Eye },
    ],
  },
  {
    id: "growth",
    title: "Brand deals",
    items: [
      { href: "/dashboard/mediakit", label: "Media Kit", icon: Briefcase },

      { href: "/dashboard/reviews", label: "Reviews", icon: Star },

      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/creator-card", label: "Creator Card", icon: IdCard },
    ],
  },
  {
    id: "showcase",
    title: "Showcase",
    items: [
      { href: "/dashboard/brands", label: "My Brands", icon: Store },
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/setup", label: "Gear & Setup", icon: Laptop },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { href: "/dashboard/subscription", label: "Plan", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** All items, for title lookup and flattened consumers. */
export const SIDEBAR_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Flattened backward-compatible exports
export const WORKSPACE_NAV: NavItem[] = [...NAV_GROUPS[0].items, ...NAV_GROUPS[1].items, ...NAV_GROUPS[2].items];
export const ACCOUNT_NAV: NavItem[] = NAV_GROUPS[3].items;

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/series", label: "Series", icon: Layers },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/mediakit", label: "Media Kit", icon: Briefcase },
  { href: "/dashboard/settings", label: "Account", icon: Settings },
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
