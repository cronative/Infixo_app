"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreatorGridBackground } from "@/components/shared/CreatorGridBackground";

interface AuthLayoutProps {
  children: ReactNode;
  showBackToHome?: boolean;
}

export function AuthLayout({
  children,
  showBackToHome = true,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#FFFCFB] px-4 py-6 sm:py-10 text-[#18181B] font-sans">
      {/* Soft grid background with floating creator tools (hidden <640px) */}
      <CreatorGridBackground showWordmark={false} />

      {/* Top-left back link outside card */}
      {showBackToHome && (
        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs font-semibold text-[#52525B] transition-colors hover:bg-zinc-100 hover:text-[#7A2253]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to home</span>
          </Link>
        </div>
      )}

      {/* Centered content */}
      <div className="relative z-10 my-auto w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
