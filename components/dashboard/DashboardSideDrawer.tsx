"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ExternalLink,
  Copy,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { AuthService } from "@/services/AuthService";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { SIDEBAR_NAV } from "@/components/dashboard/navConfig";

interface DashboardSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSideDrawer({ isOpen, onClose }: DashboardSideDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCreator();
  const { showToast } = useToast();

  // Close drawer automatically on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
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

  if (!isOpen) return null;

  const handleStr = profile.username || "username";
  const liveUrl = `https://inflixo.com/${handleStr}`;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Dark Glassmorphism Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Slides in from Left) */}
      <aside className="relative z-10 flex h-full w-[310px] sm:w-[340px] max-w-[85vw] flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-left">
        {/* Top Header: Logo + Close Button */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-700 transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Creator Info Banner (Solid Logo Brand Purple #803D63) */}
        <div className="mx-4 mt-4 rounded-2xl bg-[#803D63] p-4 text-white">
          <div className="flex items-center gap-3">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || profile.email || "Creator"}
              className="h-12 w-12 rounded-full border-2 border-white/40 shadow-inner"
              textClassName="text-sm font-black text-white"
              fallbackBgClass="bg-purple-900"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-black text-white">
                  {profile.displayName || "Creator"}
                </p>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                )}
              </div>
              <p className="truncate text-xs font-semibold text-purple-100">
                @{handleStr}
              </p>
            </div>
          </div>

          {/* Quick Live Link Action */}
          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-white/20">
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-white/30 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Live Profile
            </a>
            <button
              type="button"
              onClick={async () => {
                const success = await copyToClipboard(liveUrl);
                if (success) {
                  showToast("Profile link copied! ✨");
                } else {
                  showToast("Could not copy link", "error");
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
              title="Copy Link"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Dashboard Navigation
            </p>

            {SIDEBAR_NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-extrabold transition-all ${
                    active
                      ? "bg-purple-50 text-[#803D63] shadow-2xs border border-purple-200"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        active ? "bg-[#803D63] text-white shadow-2xs" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      active ? "text-[#803D63] translate-x-0.5" : "text-slate-300"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Drawer Bottom Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-2">
          {/* Subscription Status Badge */}
          <div className="flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/80 px-3.5 py-2.5 text-xs font-extrabold text-[#803D63]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#803D63] shrink-0" />
              <span>Early Access Active</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onClose();
              AuthService.logout();
              router.push("/login");
            }}
            className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Sign Out</span>
            </div>
          </button>
        </div>
      </aside>
    </div>
  );
}
