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
import { NAV_GROUPS } from "@/components/dashboard/navConfig";
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
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#e2e8f0] bg-white px-3.5 py-4 min-h-screen">
      {/* Top Brand Logo */}
      <div className="flex items-center justify-between px-1 mb-4">
        <Logo size="md" />
      </div>

      {/* Creator Profile Mini Card */}
      <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-[#e2e8f0] bg-white p-2.5 shadow-sm transition-all hover:border-[#cbd5e1]">
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={displayName}
          className="h-10 w-10 shrink-0 rounded-full border border-[#e2e8f0] shadow-sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-xs font-bold text-[#181716]" title={displayName}>
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
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#043084] bg-[#f1f5f9] border border-[#e2e8f0] px-1.5 py-0.2 rounded">
              <span className="h-1 w-1 rounded-full bg-[#10b981]" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation List: 3 Creator-First Groups (Studio, Growth, Account) */}
      <nav className="flex-1 space-y-4 overflow-y-auto pt-1 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-9 items-center gap-2.5 rounded-[9px] border px-3 text-xs transition-all ${active
                      ? "border-[#cbd5e1] bg-[#043084] font-semibold text-white shadow-sm"
                      : "border-transparent font-medium text-[#475569] hover:translate-x-0.5 hover:border-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#043084]"
                      }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#64748b]"}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Utility Area: Trial & Logout */}
      <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
        <div className="flex items-center justify-between rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold text-[#043084] shadow-inner shadow-white/80">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#043084] shrink-0" />
            <span>Free Trial</span>
          </div>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#043084] transition-colors hover:text-brand-hover hover:underline"
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
          className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#043084]"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
