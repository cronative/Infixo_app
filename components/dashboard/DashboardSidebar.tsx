"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { isNavActive } from "@/components/dashboard/navConfig";
import { useCreator } from "@/contexts/CreatorContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
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
    title: "", // No heading for Dashboard
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const { profile, subscription } = useCreator();
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", next ? "true" : "false");
      } catch {}
      return next;
    });
  };

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";
  const isProOrVip = subscription?.planKey === "pro" || subscription?.planKey === "vip";

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-[#E4E4E7] bg-white h-dvh transition-all duration-200 select-none ${
        collapsed ? "w-[64px] p-2" : "w-[248px] p-3"
      }`}
    >
      {/* 4. TOP AREA: Fixed */}
      <div className="shrink-0 space-y-2.5 mb-2">
        {/* Logo: wordmark only, height 28px, tagline removed */}
        <div className={`flex items-center h-8 ${collapsed ? "justify-center" : "px-2"}`}>
          <Link
            href="/dashboard"
            className="inline-flex items-center transition-transform hover:opacity-90"
            title="Inflixo Dashboard"
          >
            {collapsed ? (
              <Image
                src="/images/inflixo-logo-icon-brand.png"
                alt="Inflixo"
                width={56}
                height={56}
                className="h-7 w-7 object-contain select-none rounded-[6px]"
                priority
              />
            ) : (
              <Image
                src="/images/inflixo-wordmark-title.png"
                alt="Inflixo"
                width={628}
                height={186}
                className="h-7 w-auto object-contain select-none"
                priority
              />
            )}
          </Link>
        </div>

        {/* Profile Card -> Compact row (height 48px, clicks to /dashboard/profile) */}
        <Link
          href="/dashboard/profile"
          title={`My Profile (@${handleStr})`}
          className={`flex h-12 items-center rounded-[5px] hover:bg-[#F4F4F5] transition-colors group cursor-pointer ${
            collapsed ? "justify-center px-0" : "px-2 gap-2.5"
          }`}
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
            {/* Small green dot next to avatar for Live */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10b981] ring-2 ring-white"
              title="Profile is live"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 text-left leading-tight">
              <p className="truncate text-[14px] font-semibold text-[#18181B]" title={displayName}>
                {displayName}
              </p>
              <p className="truncate text-[12px] text-[#71717A] mt-0.5">
                @{handleStr}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* 2 & 3. MIDDLE NAV LIST: Scrolls on its own if needed (hidden scrollbar until hover) */}
      <nav
        className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5"
        aria-label="Sidebar navigation"
      >
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {/* Group headings: 11px, uppercase, letter-spacing 0.06em, #A1A1AA, mt-4 mb-1 */}
            {group.title && !collapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A1A1AA] mt-4 mb-1">
                {group.title}
              </p>
            )}
            {group.title && collapsed && (
              <div className="my-2 border-t border-[#F4F4F5]" />
            )}

            {/* Menu items: single line, h-36px, px-3 py-2, gap 10px, icon 18px stroke 1.75, label 14px */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.subtitle || item.label}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex h-[36px] items-center rounded-[5px] overflow-hidden text-left transition-colors ${
                      collapsed ? "justify-center px-0" : "px-3 gap-2.5"
                    } ${
                      active
                        ? "bg-[#7A2253]/[0.08] text-[#7A2253] font-semibold"
                        : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    }`}
                  >
                    {/* 3px left indicator bar in #7A2253 (full height) */}
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

                    {!collapsed && (
                      <span className="truncate text-[14px] font-medium leading-normal">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 5. BOTTOM AREA: Fixed (sticky) */}
      <div className="shrink-0 pt-2 border-t border-[#E4E4E7] space-y-1 mt-1">
        {/* Plain items: My Plan, Settings (same item style) */}
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.subtitle || item.label}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-[36px] items-center rounded-[5px] overflow-hidden text-left transition-colors ${
                collapsed ? "justify-center px-0" : "px-3 gap-2.5"
              }`}
              style={{
                backgroundColor: active ? "rgba(122, 34, 83, 0.08)" : undefined,
              }}
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

              {!collapsed && (
                <span
                  className={`truncate text-[14px] leading-normal ${
                    active
                      ? "text-[#7A2253] font-semibold"
                      : "text-[#52525B] font-medium group-hover:text-[#18181B]"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Upgrade to Pro: slim 40px row (hidden if user is already on Pro/VIP) */}
        {!isProOrVip && (
          <Link
            href="/dashboard/subscription"
            title="Upgrade to Pro"
            className={`flex h-[40px] items-center rounded-[5px] bg-[#7A2253]/[0.08] hover:bg-[#7A2253]/[0.12] text-[#7A2253] transition-colors ${
              collapsed ? "justify-center px-0" : "px-3 gap-2.5"
            }`}
          >
            <Sparkles className="h-[18px] w-[18px] shrink-0 text-[#7A2253]" strokeWidth={1.75} />
            {!collapsed && (
              <span className="truncate text-[14px] font-semibold leading-none">
                Upgrade to Pro
              </span>
            )}
          </Link>
        )}

        {/* 6. Optional Collapse Toggle button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex h-[32px] w-full items-center rounded-[5px] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : "px-3 gap-2.5"
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="text-[12px] font-medium leading-none">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
