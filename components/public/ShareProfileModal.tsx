"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Download, Share2, QrCode } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { renderSVG } from "uqr";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  shareUrl: string;
}

export function ShareProfileModal({
  isOpen,
  onClose,
  displayName,
  username,
  shareUrl,
}: ShareProfileModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const cleanHandle = username.replace(/^@/, "");

  const qrSvg = useMemo(() => {
    if (!shareUrl) return "";
    try {
      return renderSVG(shareUrl, { ecc: "M", border: 2 });
    } catch {
      return "";
    }
  }, [shareUrl]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      showToast("Profile link copied to clipboard! ✨");
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast("Failed to copy link", "error");
    }
  };

  const handleDownloadQr = () => {
    if (!qrSvg) return;
    try {
      const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cleanHandle || "creator"}-qr-code.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("QR code downloaded! Print it for events or café tables 🖨️");
    } catch {
      showToast("Failed to download QR code", "error");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName || "Creator"} on Inflixo`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Profile" size="sm">
      <ModalBody>
        <div className="flex flex-col items-center text-center space-y-4 pt-1 pb-2">
          {/* QR Code Container */}
          <div className="w-full max-w-[210px] aspect-square rounded-[5px] border border-slate-200 dark:border-white/10 bg-white p-3.5 flex items-center justify-center shadow-none">
            {qrSvg ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-[3px]"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <QrCode className="h-24 w-24 text-slate-400" />
            )}
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {displayName || "Creator"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[260px]">
              {shareUrl}
            </p>
          </div>

          {/* Copy URL Row */}
          <div className="w-full flex items-center gap-2 rounded-[5px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-1.5 pl-3">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate flex-1 text-left select-all">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`tap-scale shrink-0 px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#7A2253] hover:bg-[#681c46] text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="w-full flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full sm:flex-1 py-2 px-3 rounded-[5px] border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download QR Code</span>
          </button>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:flex-1 py-2 px-3 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-none"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share via App</span>
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
