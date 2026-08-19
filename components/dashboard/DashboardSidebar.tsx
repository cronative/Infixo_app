"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Copy,
  LogOut,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SIDEBAR_NAV } from "@/components/dashboard/navConfig";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCreator();
  const { showToast } = useToast();

  const handleStr = profile.username || "username";
  const liveUrl = `https://inflixo.com/${handleStr}`;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex h-full overflow-y-auto">
      <div className="px-2">
        <Logo size="sm" />
      </div>

      {/* Creator Profile Card Banner (Linktree Admin Aesthetic) */}
      <div className="mt-5 rounded-2xl bg-[#651FFF] p-3.5 text-white shadow-md shadow-purple-600/20">
        <div className="flex items-center gap-2.5">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={profile.displayName || profile.email || "Creator"}
            className="h-10 w-10 rounded-full border-2 border-white/50 shadow-sm"
            textClassName="text-xs font-black text-white"
            fallbackBgClass="bg-purple-900"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-black text-white">
                {profile.displayName || "Creator"}
              </p>
              {profile.isVerified && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              )}
            </div>
            <p className="truncate text-[11px] font-semibold text-purple-100">
              @{handleStr}
            </p>
          </div>
        </div>

        {/* Quick Live Link Actions */}
        <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-white/20">
          <a
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white/20 px-2 py-1 text-[11px] font-extrabold text-white hover:bg-white/30 transition-all"
          >
            <ExternalLink className="h-3 w-3" />
            Live Profile
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
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
            title="Copy Link"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="mt-5 flex-1 space-y-1">
        <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
          Admin Navigation
        </p>

        {SIDEBAR_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-black transition-all ${
                active
                  ? "bg-purple-50 text-[#651FFF] shadow-2xs border border-purple-200"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-[#651FFF] text-white shadow-2xs" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Early Access Status & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/80 px-3 py-2 text-[11px] font-black text-[#651FFF]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#651FFF] shrink-0" />
            <span>Early Access Active</span>
          </div>
        </div>

        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <LogOut className="h-3.5 w-3.5 shrink-0" />
          </div>
          Logout
        </button>
      </div>
    </aside>
  );
}
