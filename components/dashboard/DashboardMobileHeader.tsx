"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, ExternalLink, Copy } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { Logo } from "@/components/shared/Logo";

const ICON_BTN =
  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-[#fdf2f8] hover:text-[#7A2253] active:bg-[#fce7f3]";

/** Native-style mobile app bar: menu · brand (or title) · profile shortcuts. */
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
  const { profile, handleViewProfile, isTrialExpired, openTrialExpiredModal } = useCreator();
  const { showToast } = useToast();
  const handleStr = profile.username || "username";

  const handleCopy = async () => {
    if (isTrialExpired) {
      showToast("Public profile is hidden (Free trial ended)", "error");
      openTrialExpiredModal();
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const success = await copyToClipboard(`${origin}/${handleStr}`);
    showToast(success ? "Profile link copied! ✨" : "Could not copy link", success ? "success" : "error");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#e2e8f0] bg-white/95 px-2 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-1">
        {showBack ? (
          <button onClick={() => router.back()} className={ICON_BTN} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <button onClick={onOpenDrawer} className={ICON_BTN} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0 flex-1 px-1">
          {title ? (
            <p className="truncate text-[17px] font-semibold tracking-tight text-[#0f172a]">{title}</p>
          ) : (
            <Logo size="sm" />
          )}
        </div>

        <button type="button" onClick={handleCopy} className={ICON_BTN} aria-label="Copy profile link" title="Copy profile link">
          <Copy className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={handleViewProfile}
          className={ICON_BTN}
          aria-label="View public profile"
          title="View public profile"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
