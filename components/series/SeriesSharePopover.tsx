"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Copy, Share2, MessageCircle } from "lucide-react";
import { InstagramIcon, XTwitterIcon } from "@/components/shared/BrandIcons";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";

interface SeriesSharePopoverProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function SeriesSharePopover({
  url,
  title,
  isOpen,
  onClose,
  triggerRef,
}: SeriesSharePopoverProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [igHint, setIgHint] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape, outside click, and scroll
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleScroll(e: Event) {
      // Don't close if scrolling inside popover
      if (popoverRef.current?.contains(e.target as Node)) return;
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      showToast("Link copied to clipboard! ✨", "success");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Couldn't copy link", "error");
    }
  };

  const handleWhatsApp = () => {
    const text = `Watch "${title}" on Inflixo: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    onClose();
  };

  const handleTwitter = () => {
    const text = `Watch "${title}" on Inflixo`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
    onClose();
  };

  const handleInstagramStory = async () => {
    await copyToClipboard(url);
    setIgHint(true);
    showToast("Link copied! Open Instagram → Add sticker in your story", "success");
    setTimeout(() => {
      setIgHint(false);
      onClose();
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        onClose();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label="Share Series"
      className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-[5px] border border-[#e2e8f0] bg-white p-2 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-2 py-1.5 border-b border-slate-100">
        <p className="text-xs font-semibold text-[#0f172a] truncate">Share &ldquo;{title}&rdquo;</p>
      </div>

      <div className="py-1 flex flex-col gap-0.5">
        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-full items-center justify-between rounded-[5px] px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-75" />
            ) : (
              <Copy className="h-4 w-4 text-[#64748b]" />
            )}
            <span>{copied ? "Link Copied!" : "Copy link"}</span>
          </span>
          <span className="text-[11px] text-[#94a3b8]">{copied ? "✓" : "URL"}</span>
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 text-emerald-500" />
          <span>WhatsApp</span>
        </button>

        {/* Instagram Story */}
        <button
          type="button"
          onClick={handleInstagramStory}
          className="flex w-full items-center justify-between rounded-[5px] px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <InstagramIcon className="h-4 w-4 text-pink-500" />
            <span>Instagram Story</span>
          </span>
          {igHint && <span className="text-[10px] text-pink-600 font-semibold">Copied!</span>}
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={handleTwitter}
          className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          <XTwitterIcon className="h-4 w-4 text-slate-800" />
          <span>Post on X</span>
        </button>

        {/* Native share sheet on mobile/supported desktop */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-xs font-medium text-[#7A2253] hover:bg-[#fdf2f8] transition-colors cursor-pointer border-t border-slate-100 mt-1"
          >
            <Share2 className="h-4 w-4 text-[#7A2253]" />
            <span>More share options…</span>
          </button>
        )}
      </div>
    </div>
  );
}
