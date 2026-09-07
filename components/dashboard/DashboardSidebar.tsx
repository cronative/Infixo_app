"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Sparkles,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { WORKSPACE_NAV, ACCOUNT_NAV } from "@/components/dashboard/navConfig";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCreator();

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#E7E3DC] bg-white px-4 py-5 lg:flex h-full overflow-y-auto select-none">
      {/* Brand Logo */}
      <div className="px-2 pb-2">
        <Logo size="sm" />
      </div>

      {/* Creator Header Strip */}
      <div className="my-3 -mx-4 px-4 py-2.5 border-y border-[#E7E3DC] flex items-center gap-2.5 bg-[#F8F7F3]">
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={displayName}
          className="w-9 h-9 rounded-full overflow-hidden object-cover aspect-square border border-[#E7E3DC] shrink-0"
          textClassName="text-xs font-bold text-[#181716]"
          fallbackBgClass="bg-[#803D63]/[0.09]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-xs font-semibold text-[#181716]" title={displayName}>
              {displayName}
            </p>
            {profile.isVerified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="truncate text-[11px] font-medium text-[#797570]">
              @{handleStr}
            </p>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 space-y-5 pt-1">
        {/* WORKSPACE GROUP */}
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#797570] mb-1.5">
            Workspace
          </p>
          <div className="space-y-0.5">
            {WORKSPACE_NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                    active
                      ? "bg-[#803D63]/[0.09] text-[#803D63] font-semibold"
                      : "text-[#54514D] hover:bg-[#F8F7F3] hover:text-[#181716] font-medium"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#803D63]" : "text-[#797570]"}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ACCOUNT GROUP */}
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#797570] mb-1.5">
            Account
          </p>
          <div className="space-y-0.5">
            {ACCOUNT_NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                    active
                      ? "bg-[#803D63]/[0.09] text-[#803D63] font-semibold"
                      : "text-[#54514D] hover:bg-[#F8F7F3] hover:text-[#181716] font-medium"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#803D63]" : "text-[#797570]"}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Utility Area: Early Access & Logout */}
      <div className="pt-3 border-t border-[#E7E3DC] space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 py-2 text-[11px] font-semibold text-[#181716]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
            <span>Early Access</span>
          </div>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#803D63] hover:underline inline-flex items-center gap-0.5 font-semibold"
            title="View live profile"
          >
            <span>Preview</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>

        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#797570] hover:bg-rose-50 hover:text-[#C2414B] transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
