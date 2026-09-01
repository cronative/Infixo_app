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
  Eye,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/profile", label: "My Profile", icon: UserRound },
  { href: "/dashboard/series", label: "Content", icon: Layers },
  { href: "/dashboard/socials", label: "Links & Socials", icon: Share2 },
  { href: "/dashboard/mediakit", label: "Services & Brand Work", icon: Briefcase },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/themes", label: "Appearance", icon: Palette },
  { href: "/dashboard/preview", label: "Profile Preview", icon: Eye },
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
  { href: "/dashboard/series", label: "Content", icon: Layers },
  { href: "/dashboard/mediakit", label: "Services", icon: Briefcase },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/settings", label: "Account", icon: Settings },
];

export const LOGOUT_ITEM = { href: "/login", label: "Logout", icon: LogOut };
