"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, ExternalLink } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useCreator } from "@/contexts/CreatorContext";

export function DashboardMobileHeader({
  title,
  showBack,
  onOpenDrawer,
}: {
  title?: string;
  showBack?: boolean;
  onOpenDrawer?: () => void;
}) {
  const router = useRouter();
  const { profile } = useCreator();
  const handleStr = profile.username || "username";

  return (
    <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-[#E7E3DC] bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] text-[#181716] active:scale-95 transition-transform cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onOpenDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] text-[#181716] active:scale-95 transition-transform hover:bg-[#803D63]/10 hover:text-[#803D63] cursor-pointer"
            aria-label="Open menu drawer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Logo size="sm" />
      </div>

      <div className="flex items-center gap-2">
        {title ? (
          <p className="text-xs font-bold text-[#181716] truncate max-w-[140px]">{title}</p>
        ) : (
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#803D63] bg-[#803D63]/[0.09] border border-[#803D63]/20 px-2.5 py-1 rounded-lg"
          >
            <span>View Profile</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </header>
  );
}
