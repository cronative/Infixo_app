"use client";

import { useState } from "react";
import { Copy, Check, Share2, Sparkles, MessageSquare } from "lucide-react";
import { FacebookIcon, XTwitterIcon } from "@/components/shared/BrandIcons";
import { useToast } from "@/contexts/ToastContext";
import { Series } from "@/types";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface ShareSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series;
  username: string;
}

export function ShareSeriesModal({ isOpen, onClose, series, username }: ShareSeriesModalProps) {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const handleStr = username || "creator";
  const origin = typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")
    ? window.location.origin
    : "https://inflixo.com";
  const seriesUrl = `${origin}/${handleStr}/series/${series.id}`;

  const reelCaption = `🎬 ${series.title}\n\nMissed a part? Watch all episodes in order on Inflixo 👇\n${seriesUrl}`;

  async function handleCopyLink() {
    const success = await copyToClipboard(seriesUrl);
    if (success) {
      setCopiedLink(true);
      showToast("Series link copied! 🔗", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast("Could not copy link", "error");
    }
  }

  async function handleCopyCaption() {
    const success = await copyToClipboard(reelCaption);
    if (success) {
      setCopiedCaption(true);
      showToast("Reel caption copied! Ready to paste 🎬", "success");
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      showToast("Could not copy caption", "error");
    }
  }

  function handleWhatsAppShare() {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reelCaption)}`;
    window.open(waUrl, "_blank");
  }

  function handleFacebookShare() {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(seriesUrl)}`;
    window.open(fbUrl, "_blank");
  }

  function handleTwitterShare() {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(reelCaption)}`;
    window.open(twUrl, "_blank");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Share Series"
      description="Direct public URL for Reel captions and social bio"
      icon={<Share2 className="h-4 w-4" />}
    >
      <ModalBody className="p-5 space-y-4 text-left">
        {/* Series Title Badge */}
        <div className="rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] p-3 flex items-center gap-3">
          <span className="text-base">🎬</span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold text-[#241618] truncate">{series.title}</p>
            <p className="text-[11px] text-[#6B5A5D] font-medium truncate">inflixo.com/{handleStr}/series/{series.id}</p>
          </div>
        </div>

        {/* Copy Direct Link Section */}
        <div className="space-y-1 text-left">
          <label className="block text-xs font-bold text-[#241618]">Series Public Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={seriesUrl}
              className="flex-1 rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] px-3.5 py-2 text-xs font-mono text-[#241618] select-all focus:border-[#B85C6B] focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Caption Box */}
        <div className="space-y-2 rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] p-3.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#B85C6B] font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ready-to-Paste Reel Caption</span>
            </div>
            <span className="text-[10px] bg-[#F3DDE0] text-[#8C3F4D] px-2 py-0.5 rounded-md font-bold">Recommended</span>
          </div>

          <div className="rounded-lg border border-[#E4DAD5] bg-white p-2.5 text-xs font-mono text-[#241618] leading-relaxed whitespace-pre-wrap select-all">
            {reelCaption}
          </div>

          <button
            type="button"
            onClick={handleCopyCaption}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
          >
            {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCaption ? "Caption Copied ✓" : "Copy Reel Caption"}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-1.5 text-left pt-1">
          <label className="block text-xs font-bold text-[#241618]">Share Directly</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FacebookIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Facebook</span>
            </button>
            <button
              type="button"
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] text-[#241618] px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <XTwitterIcon className="h-3.5 w-3.5 text-[#241618] shrink-0" />
              <span>X (Twitter)</span>
            </button>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#E4DAD5] text-xs font-semibold text-[#6B5A5D] hover:bg-[#fbfbfb] hover:text-[#241618] transition-colors cursor-pointer"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
