"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Mail, Share2 } from "lucide-react";
import { encode } from "uqr";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { FacebookIcon, InstagramIcon, TelegramIcon, WhatsappIcon, XTwitterIcon } from "@/components/shared/BrandIcons";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  /** Clean profile URL (no query). `?ref=share` is added here for analytics. */
  shareUrl: string;
}

const LOGO_SRC = "/icon-192.png";
const QR_QUIET = 2;

/** Adds ref=share so visits from shared links show up as "Shared link" in Analytics. */
export function withShareRef(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("ref", "share");
    return u.toString();
  } catch {
    return url.includes("?") ? `${url}&ref=share` : `${url}?ref=share`;
  }
}

function useQrMatrix(value: string) {
  return useMemo(() => {
    if (!value) return null;
    try {
      // High error correction so the centre logo never breaks scanning.
      const qr = encode(value, { ecc: "H", border: 0 });
      let d = "";
      qr.data.forEach((row, y) =>
        row.forEach((dark, x) => {
          if (dark) d += `M${x + QR_QUIET} ${y + QR_QUIET}h1v1h-1z`;
        })
      );
      return { data: qr.data, size: qr.size, modules: qr.size + QR_QUIET * 2, path: d };
    } catch {
      return null;
    }
  }, [value]);
}

export function ShareProfileModal({ isOpen, onClose, displayName, username, shareUrl }: ShareProfileModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const handle = username.replace(/^@/, "") || "creator";
  const name = displayName?.trim() || handle;
  const firstName = name.split(/\s+/)[0];
  const link = useMemo(() => withShareRef(shareUrl), [shareUrl]);
  const prettyUrl = shareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const shareText = `Check out ${firstName}'s profile on Inflixo`;
  const qr = useQrMatrix(link);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    if (await copyToClipboard(link)) setCopied(true);
    else showToast("Couldn't copy link", "error");
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: `${name} on Inflixo`, text: shareText, url: link });
    } catch {
      // Share sheet dismissed.
    }
  };

  // Instagram has no web share URL: share the 9:16 Creator Card image (mobile) or open it to save & post.
  const handleInstagramStory = async () => {
    const cardUrl = `/api/era-card/${encodeURIComponent(handle)}`;
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], `${handle}-creator-card.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${name} on Inflixo`, text: link });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    window.open(cardUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadQr = async () => {
    if (!qr) return;
    try {
      const px = 1024;
      const scale = Math.floor(px / qr.modules);
      const sizePx = scale * qr.modules;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = sizePx;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, sizePx, sizePx);
      ctx.fillStyle = "#0B1220";
      qr.data.forEach((row, y) =>
        row.forEach((dark, x) => {
          if (dark) ctx.fillRect((x + QR_QUIET) * scale, (y + QR_QUIET) * scale, scale, scale);
        })
      );
      const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = LOGO_SRC;
      });
      const box = Math.round(sizePx * 0.22);
      const pad = Math.round(box * 0.12);
      const bx = (sizePx - box) / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(bx, bx, box, box, Math.round(box * 0.18));
      ctx.fill();
      ctx.drawImage(logo, bx + pad, bx + pad, box - pad * 2, box - pad * 2);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${handle}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      showToast("Couldn't download QR, please try again", "error");
    }
  };

  const enc = encodeURIComponent;
  const quickShare: { label: string; color: string; icon: React.ReactNode; href?: string; onClick?: () => void }[] = [
    { label: "WhatsApp", color: "#25D366", icon: <WhatsappIcon className="h-5 w-5" />, href: `https://wa.me/?text=${enc(`${shareText} ${link}`)}` },
    {
      label: "Story",
      color: "linear-gradient(45deg,#F58529,#DD2A7B 50%,#8134AF)",
      icon: <InstagramIcon className="h-5 w-5 fill-white" />,
      onClick: handleInstagramStory,
    },
    { label: "X", color: "#000000", icon: <XTwitterIcon className="h-4 w-4" />, href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(link)}` },
    { label: "Facebook", color: "#1877F2", icon: <FacebookIcon className="h-5 w-5 fill-white" />, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}` },
    { label: "Telegram", color: "#229ED9", icon: <TelegramIcon className="h-5 w-5" />, href: `https://t.me/share/url?url=${enc(link)}&text=${enc(shareText)}` },
    { label: "Email", color: "#52525B", icon: <Mail className="h-5 w-5" />, href: `mailto:?subject=${enc(`${name} on Inflixo`)}&body=${enc(`${shareText}: ${link}`)}` },
  ];

  const tileCls = "flex min-h-[44px] flex-col items-center gap-1.5 rounded-[8px] py-1 text-[11px] font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7A2253]";
  const tileIcon = (q: (typeof quickShare)[number]) => (
    <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: q.color }}>
      {q.icon}
    </span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${firstName}'s profile`}
      description="Share the link or scan the QR"
      size="sm"
      wrapHeader
      closeOnBackdropClick
      headerClassName="bg-[#7A2253]/[0.07]! py-3! px-4! sm:px-4!"
    >
      <div className="flex-1 divide-y divide-[#EADBE3] overflow-y-auto">
        {/* QR + name */}
        <div className="flex flex-col items-center gap-2 px-4 py-4">
          <div className="relative rounded-[8px] border border-[#EADBE3] bg-white p-1.5">
            {qr ? (
              <svg
                role="img"
                aria-label={`QR code for ${prettyUrl}`}
                width={184}
                height={184}
                viewBox={`0 0 ${qr.modules} ${qr.modules}`}
                shapeRendering="crispEdges"
                className="block"
              >
                <rect width={qr.modules} height={qr.modules} fill="#FFFFFF" />
                <path d={qr.path} fill="#0B1220" />
              </svg>
            ) : (
              <div className="h-[184px] w-[184px]" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo over the QR */}
            <img
              src={LOGO_SRC}
              alt=""
              aria-hidden
              className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[8px] border-[3px] border-white bg-white"
            />
          </div>
          <p className="text-[14px] font-semibold text-[#18181B]">{name}</p>
        </div>

        {/* Copy link */}
        <div className="flex min-h-[52px] items-center gap-2 px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#52525B]" title={prettyUrl}>
            {prettyUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-semibold transition-colors cursor-pointer ${
              copied ? "bg-emerald-600 text-white" : "bg-[#7A2253] text-white hover:bg-[#681c46]"
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        {/* Quick share */}
        <div className="grid grid-cols-6 gap-1 px-3 py-3">
          {quickShare.map((q) =>
            q.href ? (
              <a key={q.label} href={q.href} target="_blank" rel="noopener noreferrer" className={tileCls} aria-label={`Share on ${q.label}`}>
                {tileIcon(q)}
                <span className="truncate">{q.label}</span>
              </a>
            ) : (
              <button key={q.label} type="button" onClick={q.onClick} className={tileCls} aria-label="Share to Instagram Story">
                {tileIcon(q)}
                <span className="truncate">{q.label}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-2 border-t border-[#EADBE3] px-4 py-3">
        <button
          type="button"
          onClick={handleDownloadQr}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-[#E4E4E7] bg-white text-[13px] font-semibold text-[#18181B] hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[#7A2253] text-[13px] font-semibold text-white hover:bg-[#681c46] cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Share via App
          </button>
        )}
      </div>
    </Modal>
  );
}
