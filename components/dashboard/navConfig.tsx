import {
  Home,
  User,
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
      { href: "/dashboard", label: "Home", subtitle: "Your dashboard & quick stats", icon: Home },
    ],
  },
  {
    id: "content",
    title: "CONTENT",
    items: [
      { href: "/dashboard/series", label: "Series", subtitle: "Organize your videos into series", icon: Layers },
      { href: "/dashboard/products", label: "Products", subtitle: "Manage affiliate products", icon: ShoppingBag },
      { href: "/dashboard/links", label: "Links", subtitle: "Custom links & collections", icon: Link2 },
    ],
  },
  {
    id: "engage",
    title: "ENGAGE",
    items: [
      { href: "/dashboard/socials", label: "Socials", subtitle: "Connect your social accounts", icon: AtSign },
      { href: "/dashboard/team", label: "Team", subtitle: "Manage collaborators", icon: Users },
    ],
  },
  {
    id: "grow",
    title: "GROW",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", subtitle: "Track performance & audience", icon: BarChart3 },
      { href: "/dashboard/reviews", label: "Reviews", subtitle: "View feedback from fans", icon: Star },
    ],
  },
  {
    id: "brand",
    title: "BRAND",
    items: [
      { href: "/dashboard/profile", label: "Profile", subtitle: "Manage your public profile", icon: User },
      { href: "/dashboard/themes", label: "Themes", subtitle: "Customize your storefront", icon: Palette },
      { href: "/dashboard/preview", label: "Preview", subtitle: "See how your profile looks", icon: Eye },
      { href: "/dashboard/creator-card", label: "Creator Card", subtitle: "Your digital creator card", icon: IdCard },
      { href: "/dashboard/mediakit", label: "Media Kit", subtitle: "Logos, banners & assets", icon: Briefcase },
    ],
  },
  {
    id: "account",
    title: "ACCOUNT",
    items: [
      { href: "/dashboard/setup", label: "Gear & Setup", subtitle: "Tools, gear & studio setup", icon: Laptop },
      { href: "/dashboard/subscription", label: "Plan", subtitle: "Manage your subscription", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", subtitle: "Account & preferences", icon: Settings },
    ],
  },
];

/** All items, for title lookup and flattened consumers. */
export const SIDEBAR_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Flattened backward-compatible exports
export const WORKSPACE_NAV: NavItem[] = [...NAV_GROUPS[0].items, ...NAV_GROUPS[1].items, ...NAV_GROUPS[2].items];
export const ACCOUNT_NAV: NavItem[] = NAV_GROUPS[3].items;

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
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
