"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Crown,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { NAV_GROUPS, isNavActive } from "@/components/dashboard/navConfig";
import { getPlanDisplayInfo } from "@/lib/trialStatus";

interface DashboardSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSideDrawer({ isOpen, onClose }: DashboardSideDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, handleViewProfile, isTrialExpired, subscription } = useCreator();
  const planInfo = getPlanDisplayInfo(subscription);

  // Close drawer ONLY when user actually navigates to a new pathname
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock background scroll when drawer is open
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Canvas */}
      <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl z-10">
        {/* Header: Logo & Close Button */}
        <div className="flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Creator Info Card */}
        <div className="mx-3 mb-2 rounded-xl bg-[#f8fafc] p-3">
          <div className="flex items-center gap-3">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-10 w-10 shrink-0 rounded-full border border-[#e2e8f0]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-sm font-semibold text-[#0f172a]">
                  {displayName}
                </p>
                {profile.isVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 fill-[#7A2253] text-white" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="truncate text-xs text-[#64748b]">
                  @{handleStr}
                </p>
                {isTrialExpired ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                    <span className="h-1 w-1 rounded-full bg-rose-500" />
                    Private
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#047857]">
                    <span className="h-1 w-1 rounded-full bg-[#10b981]" />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List: 3 Creator-First Groups (Studio, Growth, Account) */}
        <nav className="flex-1 space-y-4 px-3 py-2 overflow-y-auto no-scrollbar" aria-label="Dashboard">
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
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
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                        active
                          ? "bg-[#7A2253]/[0.07] font-semibold text-[#7A2253]"
                          : "font-medium text-[#334155] active:bg-[#f1f5f9]"
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#7A2253]" : "text-[#94a3b8]"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Utility Area */}
        <div className="px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-[#e2e8f0] space-y-1">
          <div className="flex min-h-[44px] items-center justify-between rounded-xl px-3 text-sm font-medium text-[#0f172a]">
            <Link
              href="/dashboard/subscription"
              onClick={onClose}
              title={`Subscription Plan: ${planInfo.label}`}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                planInfo.tier === "vip"
                  ? "bg-amber-50 text-amber-900 border border-amber-200/90 font-semibold"
                  : planInfo.tier === "pro"
                  ? "bg-blue-50 text-blue-800 border border-blue-200/90 font-semibold"
                  : planInfo.tier === "starter"
                  ? "bg-[#7A2253]/[0.07] text-[#7A2253] border border-[#7A2253]/20 font-semibold"
                  : planInfo.tier === "expired"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                  : "text-[#475569] border border-transparent font-medium hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              {planInfo.tier === "vip" ? (
                <Crown className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500/20" />
              ) : planInfo.tier === "pro" ? (
                <Zap className="h-4 w-4 shrink-0 text-blue-600 fill-blue-600/20" />
              ) : planInfo.tier === "starter" ? (
                <Sparkles className="h-4 w-4 shrink-0 text-[#7A2253]" />
              ) : planInfo.tier === "expired" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              )}
              <span className="font-semibold">{planInfo.label}</span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                onClose();
                handleViewProfile(e);
              }}
              className="text-xs font-semibold text-[#7A2253] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={() => {
              AuthService.logout();
              router.push("/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#475569] active:bg-[#f1f5f9] hover:bg-[#f1f5f9] transition-colors min-h-[44px] cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
