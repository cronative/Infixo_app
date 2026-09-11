"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, ExternalLink, Copy } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getFreeTrialStatus, getTrialHeaderMessage } from "@/lib/trialStatus";

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
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();
  const handleStr = profile.username || "username";
  const trialStatus = getFreeTrialStatus(subscription);
  const headerMessage = getTrialHeaderMessage(subscription);

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
    <header className="sticky top-0 z-20 border-b border-[#e2e8f0] bg-white/92 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#151933] transition-all hover:border-[#cbd5e1] hover:bg-[#f1f5f9] active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onOpenDrawer}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#151933] transition-all hover:border-[#cbd5e1] hover:bg-[#f1f5f9] active:scale-95"
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
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#151933] shadow-xs transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc] active:scale-95"
                title="Copy Profile Link"
              >
                <Copy className="h-3 w-3 text-[#64748b]" />
                <span className="hidden xs:inline text-[11px]">Copy</span>
              </button>
              <Link
                href={`/${handleStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#151933] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-hover active:scale-95"
              >
                <span className="text-[11px]">View</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>

      {trialStatus.shouldWarn && !title && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
          <p className="text-[11px] font-semibold leading-snug text-[#92400E]">{headerMessage}</p>
          <Link href="/dashboard/subscription" className="mt-1 inline-flex text-[11px] font-bold text-[#151933] underline">
            View plans
          </Link>
        </div>
      )}
    </header>
  );
}
