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

      {/* Creator Profile Card Banner (Flat SaaS Light Style) */}
      <div className="mt-4 rounded-xl bg-white p-3 text-slate-900 border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={profile.displayName || profile.email || "Creator"}
            className="w-12 h-12 rounded-full overflow-hidden object-cover aspect-square border border-gray-200 shrink-0"
            textClassName="text-sm font-extrabold text-slate-900"
            fallbackBgClass="bg-indigo-50"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {profile.displayName || "Creator"}
              </p>
              {profile.isVerified && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              )}
            </div>
            <p className="truncate text-[11px] font-medium text-slate-500">
              @{handleStr}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="mt-4 flex-1 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Admin Navigation
        </p>

        {SIDEBAR_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? "bg-indigo-50 text-[#803D63] border border-indigo-200"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                  active ? "bg-[#803D63] text-white" : "bg-slate-100 text-slate-500"
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
      <div className="pt-3 border-t border-slate-200 space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
            <span>Early Access Active</span>
          </div>
        </div>

        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <LogOut className="h-3.5 w-3.5 shrink-0" />
          </div>
          Logout
        </button>
      </div>
    </aside>
  );
}
