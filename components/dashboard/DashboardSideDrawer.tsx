"use client";

import { useEffect } from "react";
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
import { WORKSPACE_NAV, ACCOUNT_NAV } from "@/components/dashboard/navConfig";

interface DashboardSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSideDrawer({ isOpen, onClose }: DashboardSideDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCreator();

  // Close drawer automatically on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll & escape listener when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200 lg:hidden">
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Slides in from Left) */}
      <aside className="relative z-10 flex h-full w-[300px] max-w-[85vw] flex-col overflow-y-auto rounded-r-2xl bg-white shadow-xl transition-transform duration-300 animate-in slide-in-from-left">
        {/* Top Header: Logo + Close Button */}
        <div className="flex items-center justify-between border-b border-[#E4DAD5] px-5 py-4">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F0EA] text-[#6B5A5D] hover:bg-[#F3DDE0] hover:text-[#B85C6B] transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Creator Info Header */}
        <div className="px-5 py-3 border-b border-[#E4DAD5] flex items-center gap-3 bg-[#F7F0EA]">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={displayName}
            className="w-10 h-10 rounded-full border border-[#E4DAD5] overflow-hidden object-cover aspect-square shrink-0"
            textClassName="text-sm font-bold text-[#241618]"
            fallbackBgClass="bg-[#F3DDE0]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold text-[#241618]">
                {displayName}
              </p>
              {profile.isVerified && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#B85C6B]" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="truncate text-[11px] font-medium text-[#6B5A5D]">
                @{handleStr}
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#8C3F4D] bg-[#F3DDE0] px-1.5 py-0.2 rounded border border-[#B85C6B]/20">
                <span className="h-1 w-1 rounded-full bg-[#B85C6B]" />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-4 p-4">
          {/* WORKSPACE */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B5A5D] mb-1.5">
              Workspace
            </p>
            <div className="space-y-1">
              {WORKSPACE_NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold min-h-[44px] transition-colors ${
                      active
                        ? "bg-[#F3DDE0] text-[#8C3F4D]"
                        : "text-[#6B5A5D] hover:bg-[#F7F0EA] hover:text-[#241618]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#8C3F4D]" : "text-[#6B5A5D]"}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ACCOUNT */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B5A5D] mb-1.5">
              Account
            </p>
            <div className="space-y-1">
              {ACCOUNT_NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold min-h-[44px] transition-colors ${
                      active
                        ? "bg-[#F3DDE0] text-[#8C3F4D]"
                        : "text-[#6B5A5D] hover:bg-[#F7F0EA] hover:text-[#241618]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#8C3F4D]" : "text-[#6B5A5D]"}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Utility Area */}
        <div className="p-4 border-t border-[#E4DAD5] space-y-2 bg-[#F7F0EA]">
          <div className="flex items-center justify-between rounded-xl border border-[#E4DAD5] bg-white px-3 py-2 text-xs font-medium text-[#241618] shadow-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#B85C6B] shrink-0" />
              <span className="text-[11px] font-semibold">Early Access</span>
            </div>
            <Link
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-[#B85C6B] hover:underline inline-flex items-center gap-1"
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
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B5A5D] hover:bg-rose-50 hover:text-[#C1443A] transition-colors min-h-[44px] cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
