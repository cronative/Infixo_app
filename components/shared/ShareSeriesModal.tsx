"use client";

import { useState } from "react";
import { Copy, Check, X, Share2, Sparkles, MessageSquare } from "lucide-react";
import { FacebookIcon, XTwitterIcon } from "@/components/shared/BrandIcons";
import { useToast } from "@/contexts/ToastContext";
import { Series } from "@/types";

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

  if (!isOpen) return null;

  const handleStr = username || "creator";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const seriesUrl = `${origin}/${handleStr}/series/${series.id}`;

  const reelCaption = `🎬 ${series.title}\n\nMissed a part? Watch all episodes in the correct order on Inflixo 👇\n${seriesUrl}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(seriesUrl);
    setCopiedLink(true);
    showToast("Series link copied to clipboard! 🔗✨");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyCaption() {
    navigator.clipboard.writeText(reelCaption);
    setCopiedCaption(true);
    showToast("Reel caption copied! Ready to paste in your Reel/Short caption! 🎬🔥");
    setTimeout(() => setCopiedCaption(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-900/95 p-6 text-white shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Share Series</h3>
              <p className="text-xs text-slate-400 font-medium">Direct public URL for Reel captions & bio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Series Title Badge */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-3 flex items-center gap-3">
          <span className="text-lg">🎬</span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-black text-purple-200 truncate">{series.title}</p>
            <p className="text-[10px] text-purple-300/80 font-medium truncate">inflixo.com/{handleStr}/series/{series.id}</p>
          </div>
        </div>

        {/* Copy Direct Link Section */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Series Public URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={seriesUrl}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-black text-white shadow-md transition-all shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Killer Feature: Copy Reel / Short Caption Box */}
        <div className="space-y-2 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900 to-purple-950/30 p-4 text-left shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Copy Reel / Short Caption</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Recommended</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
            {reelCaption}
          </div>

          <button
            onClick={handleCopyCaption}
            className="w-full tap-scale inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all"
          >
            {copiedCaption ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCaption ? "Caption Copied ✓" : "Copy Ready Reel Caption ✨"}</span>
          </button>
        </div>

        {/* One-Tap Social Share Buttons */}
        <div className="space-y-1.5 text-left pt-1">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Share Directly</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-3 py-2.5 text-xs font-black text-white shadow-sm transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 px-3 py-2.5 text-xs font-black text-white shadow-sm transition-all"
            >
              <FacebookIcon className="h-4 w-4 text-white shrink-0" />
              <span>Facebook</span>
            </button>
            <button
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-black text-white shadow-sm transition-all"
            >
              <XTwitterIcon className="h-4 w-4 text-white shrink-0" />
              <span>X (Twitter)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
