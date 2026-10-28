"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  LogOut,
  Home,
  User,
  Link2,
  AtSign,
  Clapperboard,
  Palette,
  CreditCard,
  Settings,
  Briefcase,
  Star,
  BarChart3,
  Laptop,
  IdCard,
  Users,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { isNavActive } from "@/components/dashboard/navConfig";
import { getInitials } from "@/lib/avatar";

interface NavItemConfig {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const SIDEBAR_GROUPS: { id: string; title: string; items: NavItemConfig[] }[] = [
  {
    id: "overview",
    title: "",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        subtitle: "Your creator studio at a glance",
        icon: Home,
      },
    ],
  },
  {
    id: "content",
    title: "CONTENT",
    items: [
      {
        href: "/dashboard/series",
        label: "Series",
        subtitle: "Organize your videos & episodes",
        icon: Clapperboard,
      },
      {
        href: "/dashboard/products",
        label: "Shop",
        subtitle: "Products you recommend",
        icon: ShoppingBag,
      },
      {
        href: "/dashboard/links",
        label: "Links",
        subtitle: "Share important links",
        icon: Link2,
      },
    ],
  },
  {
    id: "audience-brands",
    title: "AUDIENCE & BRANDS",
    items: [
      {
        href: "/dashboard/socials",
        label: "Social Accounts",
        subtitle: "Connect & sync your social media",
        icon: AtSign,
      },
      {
        href: "/dashboard/reviews",
        label: "Reviews",
        subtitle: "Showcase brand feedback",
        icon: Star,
      },
      {
        href: "/dashboard/analytics",
        label: "Analytics",
        subtitle: "See profile visits & link clicks",
        icon: BarChart3,
      },
      {
        href: "/dashboard/mediakit",
        label: "Media Kit & Rates",
        subtitle: "Show your services & pricing",
        icon: Briefcase,
      },
      {
        href: "/dashboard/team",
        label: "Team",
        subtitle: "Manage collaborators",
        icon: Users,
      },
      {
        href: "/dashboard/setup",
        label: "Gear & Tools",
        subtitle: "Show your creator setup",
        icon: Laptop,
      },
    ],
  },
  {
    id: "profile",
    title: "PROFILE",
    items: [
      {
        href: "/dashboard/profile",
        label: "Profile",
        subtitle: "Edit your creator details",
        icon: User,
      },
      {
        href: "/dashboard/themes",
        label: "Themes",
        subtitle: "Customize your profile look",
        icon: Palette,
      },
      {
        href: "/dashboard/preview",
        label: "Live Preview",
        subtitle: "See how your public profile looks",
        icon: Eye,
      },
      {
        href: "/dashboard/creator-card",
        label: "Creator Card",
        subtitle: "Share your digital creator card",
        icon: IdCard,
      },
    ],
  },
];

const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  {
    href: "/dashboard/subscription",
    label: "Plan",
    subtitle: "View limits & upgrade",
    icon: CreditCard,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    subtitle: "Account & privacy controls",
    icon: Settings,
  },
];

interface DashboardSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSideDrawer({ isOpen, onClose }: DashboardSideDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, subscription } = useCreator();

  // Close drawer when pathname changes
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";
  const isProOrVip = subscription?.planKey === "pro" || subscription?.planKey === "vip";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop tap to close */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Canvas: Compact 240px style */}
      <aside className="relative flex h-full w-[260px] max-w-[85vw] flex-col bg-white shadow-2xl z-10 p-3 select-none">
        {/* Header: Logo wordmark (h-28px) & Close Button */}
        <div className="flex items-center justify-between px-2 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="inline-flex items-center transition-transform hover:opacity-90"
            title="Inflixo Dashboard"
          >
            <Image
              src="/images/inflixo-wordmark-title.png"
              alt="Inflixo"
              width={628}
              height={186}
              className="h-7 w-auto object-contain select-none"
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Profile Card -> Compact row (height 48px, clicks to /dashboard/profile) */}
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          title={`My Profile (@${handleStr})`}
          className="flex h-12 items-center gap-2.5 rounded-[5px] px-2 hover:bg-[#F4F4F5] transition-colors group cursor-pointer mb-2"
        >
          <div className="relative shrink-0">
            {profile.photoDataUrl ? (
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={displayName}
                className="h-8 w-8 rounded-full border border-[#E4E4E7] object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A2253] text-white font-bold text-xs shrink-0 select-none">
                {getInitials(displayName)}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10b981] ring-2 ring-white"
              title="Profile is live"
            />
          </div>

          <div className="min-w-0 flex-1 text-left leading-tight">
            <p className="truncate text-[14px] font-semibold text-[#18181B]" title={displayName}>
              {displayName}
            </p>
            <p className="truncate text-[12px] text-[#71717A] mt-0.5">
              @{handleStr}
            </p>
          </div>
        </Link>

        {/* Navigation List: Single line 36px, no subtitles, no chevrons */}
        <nav
          className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5"
          aria-label="Mobile navigation"
        >
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.id} className="space-y-0.5">
              {group.title && (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A1A1AA] mt-3.5 mb-1">
                  {group.title}
                </p>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={item.subtitle || item.label}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex h-[36px] items-center rounded-[5px] overflow-hidden px-3 gap-2.5 text-left transition-colors ${
                        active
                          ? "bg-[#7A2253]/[0.08] text-[#7A2253] font-semibold"
                          : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-0 bottom-0 h-full w-[3px] bg-[#7A2253]" />
                      )}

                      <Icon
                        strokeWidth={1.75}
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          active
                            ? "text-[#7A2253]"
                            : "text-[#71717A] group-hover:text-[#18181B]"
                        }`}
                      />

                      <span className="truncate text-[14px] font-medium leading-normal">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Area: Sticky */}
        <div className="shrink-0 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] border-t border-[#E4E4E7] space-y-1 mt-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.subtitle || item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-[36px] items-center rounded-[5px] overflow-hidden px-3 gap-2.5 text-left transition-colors ${
                  active
                    ? "bg-[#7A2253]/[0.08] text-[#7A2253] font-semibold"
                    : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 h-full w-[3px] bg-[#7A2253]" />
                )}

                <Icon
                  strokeWidth={1.75}
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                    active
                      ? "text-[#7A2253]"
                      : "text-[#71717A] group-hover:text-[#18181B]"
                  }`}
                />

                <span className="truncate text-[14px] font-medium leading-normal">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {!isProOrVip && (
            <Link
              href="/dashboard/subscription"
              onClick={onClose}
              title="Upgrade to Pro"
              className="flex h-[40px] items-center rounded-[5px] bg-[#7A2253]/[0.08] hover:bg-[#7A2253]/[0.12] text-[#7A2253] transition-colors px-3 gap-2.5"
            >
              <Sparkles className="h-[18px] w-[18px] shrink-0 text-[#7A2253]" strokeWidth={1.75} />
              <span className="truncate text-[14px] font-semibold leading-none">
                Upgrade to Pro
              </span>
            </Link>
          )}

          <button
            onClick={() => {
              onClose();
              AuthService.logout();
              router.push("/login");
            }}
            className="flex h-[36px] w-full items-center rounded-[5px] px-3 gap-2.5 text-left text-[14px] font-medium text-[#71717A] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
