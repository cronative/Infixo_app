import {
  LayoutGrid,
  UserRound,
  Share2,
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

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/series", label: "Series", icon: Layers },
  { href: "/dashboard/socials", label: "Links", icon: Share2 },
  { href: "/dashboard/setup", label: "Setup", icon: Laptop },
  { href: "/dashboard/mediakit", label: "Collabs", icon: Briefcase },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/themes", label: "Themes", icon: Palette },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/dashboard/subscription", label: "Plan", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Flat export for components requiring a unified list
export const SIDEBAR_NAV: NavItem[] = [
  ...WORKSPACE_NAV,
  ...ACCOUNT_NAV,
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/series", label: "Series", icon: Layers },
  { href: "/dashboard/mediakit", label: "Collabs", icon: Briefcase },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/settings", label: "Account", icon: Settings },
];

export const LOGOUT_ITEM = { href: "/login", label: "Logout", icon: LogOut };
