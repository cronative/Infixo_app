"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

// `cover` fills the box edge to edge (public Shop/Setup grid cards); default keeps the padded contain look.
export function ProductImage({ src, name, className = "", cover = false }: { src: string; name: string; className?: string; cover?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden ${cover ? "" : "rounded-lg"} bg-(--surface)/80 ${className}`}>
      {src && failedSrc !== src ? (
        <Image src={src} alt={name} fill sizes="(max-width: 640px) 110px, 160px" unoptimized className={cover ? "object-cover" : "object-contain p-1"} loading="lazy" onError={() => setFailedSrc(src)} />
      ) : <ShoppingBag className="h-5 w-5 text-(--text-muted)" aria-label="Product image unavailable" />}
    </div>
  );
}

export function formatProductPrice(paise: number | null) {
  return paise === null ? null : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
