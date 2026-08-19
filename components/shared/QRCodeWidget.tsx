"use client";

import { useState } from "react";
import { Copy, Check, QrCode, Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface QRCodeWidgetProps {
  username: string;
  className?: string;
}

export function QRCodeWidget({ username, className = "" }: QRCodeWidgetProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const cleanUsername = username || "username";
  const profileUrl = `https://inflixo.com/${cleanUsername}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(profileUrl)}&margin=10`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      showToast("Link copied to clipboard! ✨");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div
      className={`rounded-3xl border border-white/20 bg-slate-950/80 backdrop-blur-xl p-5 text-white shadow-2xl transition-all hover:border-white/30 ${className}`}
    >
      <div className="flex flex-col items-center text-center space-y-3.5">
        {/* Header Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-black text-purple-300 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Live Profile QR</span>
        </div>

        {/* Working Scannable QR Code Image */}
        <div className="relative p-2.5 bg-white rounded-2xl shadow-lg ring-4 ring-white/10 group transition-all hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={`QR Code for ${cleanUsername}`}
            className="h-36 w-36 object-contain rounded-lg"
          />
        </div>

        {/* Handle Info */}
        <div className="w-full space-y-0.5">
          <p className="truncate text-xs font-black text-white tracking-tight">
            inflixo.com/{cleanUsername}
          </p>
          <p className="text-[11px] text-white/65 font-medium">
            Scan camera to open profile
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="tap-scale flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white/15 hover:bg-white/25 py-2.5 text-xs font-extrabold text-white border border-white/20 transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Link
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-purple-300" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
