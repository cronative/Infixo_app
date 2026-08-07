"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function DashboardMobileHeader({ title, showBack }: { title?: string; showBack?: boolean }) {
  const router = useRouter();
  return (
    <header className="safe-top sticky top-0 z-20 flex items-center gap-3 border-b border-inflixo-border bg-white/95 px-5 py-4 shadow-[0_1px_0_rgba(23,20,31,0.02),0_8px_20px_-16px_rgba(23,20,31,0.15)] backdrop-blur-md lg:hidden">
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-inflixo-border"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : (
        <Logo size="sm" />
      )}
      {title && <p className="text-[15px] font-bold text-inflixo-navy">{title}</p>}
    </header>
  );
}
