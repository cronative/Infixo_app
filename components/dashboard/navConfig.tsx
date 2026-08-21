import {
  LayoutGrid,
  UserRound,
  Share2,
  Layers,
  Palette,
  Eye,
  CreditCard,
  Settings,
  LogOut,
  Briefcase,
} from "lucide-react";

export const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/socials", label: "Social Accounts", icon: Share2 },
  { href: "/dashboard/series", label: "Series & Episodes", icon: Layers },
  { href: "/dashboard/mediakit", label: "Media Kit", icon: Briefcase, badge: "VIP" },
  { href: "/dashboard/themes", label: "Themes", icon: Palette },
  { href: "/dashboard/preview", label: "Preview", icon: Eye },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const LOGOUT_ITEM = { href: "/login", label: "Logout", icon: LogOut };

export const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/series", label: "Series", icon: Layers },
  { href: "/dashboard/mediakit", label: "Media Kit", icon: Briefcase, badge: "VIP" },
  { href: "/dashboard/themes", label: "Themes", icon: Palette },
  { href: "/dashboard/settings", label: "Account", icon: Settings },
];
