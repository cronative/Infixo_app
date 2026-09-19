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
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { NAV_GROUPS } from "@/components/dashboard/navConfig";

interface DashboardSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSideDrawer({ isOpen, onClose }: DashboardSideDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCreator();

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
        <div className="flex items-center justify-between border-b border-[#e2e8f0] p-4">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Creator Info Card */}
        <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc]/50">
          <div className="flex items-center gap-3">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-10 w-10 shrink-0 rounded-full border border-[#e2e8f0] shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-bold text-[#181716]">
                  {displayName}
                </p>
                {profile.isVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 fill-[#043084] text-white" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="truncate text-[11px] font-medium text-[#475569]">
                  @{handleStr}
                </p>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#059669] bg-[#ecfdf5] px-1.5 py-0.2 rounded border border-[#a7f3d0]">
                  <span className="h-1 w-1 rounded-full bg-[#10b981]" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List: 3 Creator-First Groups (Studio, Growth, Account) */}
        <nav className="flex-1 space-y-4 p-4 overflow-y-auto no-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex min-h-[42px] items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "border-[#cbd5e1] bg-[#043084] text-white shadow-sm"
                          : "border-transparent text-[#475569] hover:translate-x-0.5 hover:border-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#043084]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#475569]"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Utility Area */}
        <div className="p-4 border-t border-[#e2e8f0] space-y-2 bg-[#f8fafc]">
          <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#043084] shadow-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#043084] shrink-0" />
              <span className="text-[11px] font-semibold">Free Trial</span>
            </div>
            <Link
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-[#043084] hover:underline inline-flex items-center gap-1"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <button
            onClick={() => {
              AuthService.logout();
              router.push("/login");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors min-h-[44px] cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
