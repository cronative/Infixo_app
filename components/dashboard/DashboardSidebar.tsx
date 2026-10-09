"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Sparkles,
  ShieldCheck,
  LogOut,
  Crown,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { NAV_GROUPS, isNavActive } from "@/components/dashboard/navConfig";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { getPlanDisplayInfo } from "@/lib/trialStatus";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, handleViewProfile, isTrialExpired, subscription } = useCreator();
  const planInfo = getPlanDisplayInfo(subscription);

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#e2e8f0] bg-white px-3 py-4 h-dvh">
      {/* Top Brand Logo */}
      <div className="flex items-center justify-between px-1.5 mb-3">
        <Logo size="md" />
      </div>

      {/* Creator Profile Mini Card */}
      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2">
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={displayName}
          className="h-9 w-9 shrink-0 rounded-full border border-[#e2e8f0]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-[13px] font-semibold text-[#0f172a]" title={displayName}>
              {displayName}
            </p>
            {profile.isVerified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 fill-[#7A2253] text-white" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="truncate text-[11px] text-[#64748b]">
              @{handleStr}
            </p>
            {isTrialExpired ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                <span className="h-1 w-1 rounded-full bg-rose-500" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#047857]">
                <span className="h-1 w-1 rounded-full bg-[#10b981]" />
                Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation List: 3 Creator-First Groups (Studio, Growth, Account) */}
      <nav className="flex-1 space-y-3.5 overflow-y-auto pt-1 no-scrollbar" aria-label="Dashboard">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
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
                    className={`flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${active
                      ? "bg-[#7A2253]/[0.07] font-semibold text-[#7A2253]"
                      : "font-medium text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                      }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#7A2253]" : "text-[#94a3b8]"}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Utility Row: plan · preview · logout */}
      <div className="mt-2 flex items-center gap-1 border-t border-[#e2e8f0] pt-2">
        <Link
          href="/dashboard/subscription"
          title={`Subscription Plan: ${planInfo.label}`}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
            planInfo.tier === "vip"
              ? "bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 font-semibold"
              : planInfo.tier === "pro"
              ? "bg-blue-50 text-blue-800 border border-blue-200/90 hover:bg-blue-100 font-semibold"
              : planInfo.tier === "starter"
              ? "bg-[#7A2253]/[0.07] text-[#7A2253] border border-[#7A2253]/20 hover:bg-[#7A2253]/[0.12] font-semibold"
              : planInfo.tier === "expired"
              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold"
              : "text-[#475569] border border-transparent hover:bg-[#f1f5f9] hover:text-[#0f172a] font-medium"
          }`}
        >
          {planInfo.tier === "vip" ? (
            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500/20" />
          ) : planInfo.tier === "pro" ? (
            <Zap className="h-3.5 w-3.5 shrink-0 text-blue-600 fill-blue-600/20" />
          ) : planInfo.tier === "starter" ? (
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#7A2253]" />
          ) : planInfo.tier === "expired" ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
          )}
          <span className="truncate">{planInfo.label}</span>
        </Link>
        <button
          type="button"
          onClick={handleViewProfile}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          title="View live profile"
          aria-label="View live profile"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
