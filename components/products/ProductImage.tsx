"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

export function ProductImage({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100/80 ${className}`}>
      {src && failedSrc !== src ? (
        <Image src={src} alt={name} fill sizes="(max-width: 640px) 110px, 160px" unoptimized className="object-contain p-1" loading="lazy" onError={() => setFailedSrc(src)} />
      ) : <ShoppingBag className="h-5 w-5 text-slate-400" aria-label="Product image unavailable" />}
    </div>
  );
}

export function formatProductPrice(paise: number | null) {
  return paise === null ? null : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
