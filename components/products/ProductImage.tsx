"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export function resolveProductImageSrc(src?: string | null): string {
  if (!src) return "";
  const trimmed = src.trim();
  if (trimmed.startsWith("/uploads/")) {
    return `/api/assets${trimmed}`;
  }
  return trimmed;
}

// `cover` fills the box edge to edge; default (`cover = false`) keeps the padded object-contain look on a light background.
export function ProductImage({ src, name, className = "", cover = false }: { src: string; name: string; className?: string; cover?: boolean }) {
  const resolvedSrc = resolveProductImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden ${cover ? "bg-(--surface)/80" : "bg-[#F8FAFC]"} ${className}`}>
      {resolvedSrc && failedSrc !== resolvedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={name}
          onError={() => setFailedSrc(resolvedSrc)}
          className={`h-full w-full ${cover ? "object-cover" : "object-contain p-2"}`}
        />
      ) : (
        <ShoppingBag className="h-5 w-5 text-(--text-muted)" aria-label="Product image unavailable" />
      )}
    </div>
  );
}

export function formatProductPrice(paise: number | null) {
  return paise === null ? null : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
