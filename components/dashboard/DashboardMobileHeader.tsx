"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, ExternalLink, Copy } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";

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
  const { showToast } = useToast();
  const handleStr = profile.username || "username";

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullUrl = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullUrl);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#151933] active:scale-95 transition-transform cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onOpenDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#151933] active:scale-95 transition-transform hover:bg-[#f1f5f9] cursor-pointer"
            aria-label="Open menu drawer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Logo size="sm" />
      </div>

      <div className="flex items-center gap-1.5">
        {title ? (
          <p className="text-xs font-bold text-[#151933] truncate max-w-[140px]">{title}</p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#151933] bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform cursor-pointer shadow-xs"
              title="Copy Profile Link"
            >
              <Copy className="h-3 w-3 text-[#64748b]" />
              <span className="hidden xs:inline text-[11px]">Copy</span>
            </button>
            <Link
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#151933] bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform shadow-xs"
            >
              <span className="text-[11px]">View</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
