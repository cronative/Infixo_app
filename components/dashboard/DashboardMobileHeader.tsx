"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

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
  return (
    <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-[#E9E3F5] bg-white/95 px-4 py-3.5 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E3F5] bg-slate-50 text-[#0F172A] active:scale-95 transition-transform cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onOpenDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E9E3F5] bg-slate-50 text-[#0F172A] active:scale-95 transition-transform hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
            aria-label="Open menu drawer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Logo size="sm" />
      </div>

      {title && <p className="text-sm font-black text-[#0F172A] truncate">{title}</p>}
    </header>
  );
}
