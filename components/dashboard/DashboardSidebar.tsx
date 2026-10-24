"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { NAV_GROUPS, isNavActive } from "@/components/dashboard/navConfig";
import { useCreator } from "@/contexts/CreatorContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { getInitials } from "@/lib/avatar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { profile, subscription } = useCreator();

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#e2e8f0] bg-white px-3 py-4 h-dvh">
      {/* Top Brand Logo */}
      <div className="flex items-center justify-between px-1.5 mb-3.5">
        <Logo size="md" />
      </div>

      {/* Creator Profile Mini Card */}
      <Link
        href={`/${handleStr}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3.5 flex items-center justify-between rounded-[5px] border border-[#f1f5f9] bg-[#f8fafc] hover:bg-[#f1f5f9] p-2.5 transition-colors group cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {profile.photoDataUrl ? (
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-9 w-9 shrink-0 rounded-full border border-[#e2e8f0]"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A2253] text-white font-bold text-xs shrink-0 select-none">
              {getInitials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-bold text-[#0f172a]" title={displayName}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] mt-0.5">
              <span className="truncate">@{handleStr}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10b981]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                Live
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[#94a3b8] group-hover:text-[#0f172a] shrink-0 transition-colors" />
      </Link>

      {/* Main Navigation List with Subtitles */}
      <nav className="flex-1 space-y-3.5 overflow-y-auto pr-1 no-scrollbar text-left" aria-label="Dashboard">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-[5px] px-3 py-2 text-left transition-all ${
                      active
                        ? "bg-[#FFF5F7] text-[#7A2253]"
                        : "hover:bg-[#f8fafc] text-[#0f172a]"
                    }`}
                  >
                    {/* Active left indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#7A2253] rounded-r-full" />
                    )}

                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                        active ? "text-[#7A2253]" : "text-[#64748b] group-hover:text-[#0f172a]"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold leading-tight ${
                          active
                            ? "text-[#7A2253] font-bold"
                            : "text-[#0f172a] group-hover:text-[#7A2253]"
                        }`}
                      >
                        {item.label}
                      </p>
                      {item.subtitle && (
                        <p
                          className={`truncate text-[11px] leading-tight mt-0.5 ${
                            active ? "text-[#64748b]" : "text-[#94a3b8]"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Plan Card */}
      <div className="mt-3 pt-2 border-t border-[#f1f5f9]">
        <Link
          href="/dashboard/subscription"
          className="flex items-center justify-between rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] p-2.5 transition-colors hover:bg-[#FCE7F3]/70 group cursor-pointer shadow-2xs text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-white border border-[#FCE7F3] text-[#7A2253] shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#7A2253]">
                {subscription?.planName || "Starter Plan"}
              </p>
              <p className="truncate text-[11px] text-[#64748b]">
                Unlock more features
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#7A2253] group-hover:translate-x-0.5 shrink-0 transition-transform" />
        </Link>
      </div>
    </aside>
  );
}
