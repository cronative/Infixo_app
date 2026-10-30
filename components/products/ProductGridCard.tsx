"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/products/ProductImage";

/** Grid wrapper shared by Shop and My Setup: max 3 per row with compact gap. */
export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 @min-[380px]:grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-2.5">{children}</div>
    </div>
  );
}

interface ProductGridCardProps {
  name: string;
  imageUrl?: string | null;
  href?: string;
  price?: string | null;
  note?: string | null;
  isAffiliate?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/** Compact card used by Shop and My Setup grids; cards in a row stretch to the tallest. */
export function ProductGridCard({ name, imageUrl, href, price, note, isAffiliate = false, onClick }: ProductGridCardProps) {
  const body = (
    <>
      <ProductImage src={imageUrl || ""} name={name} cover className="aspect-[4/3] w-full border-b border-(--surface-border)/60" />

      <div className="flex flex-1 flex-col p-2 sm:p-2.5 gap-0.5">
        <h3 className="text-[12px] sm:text-[12.5px] font-semibold text-(--text) line-clamp-1 truncate leading-snug break-words" title={name}>
          {name}
        </h3>
        {price && <p className="text-[11.5px] sm:text-[12px] font-bold text-(--accent-text) tabular-nums leading-tight">{price}</p>}
        {note && (
          <p className="text-[10px] sm:text-[10.5px] text-(--text-muted) line-clamp-1 truncate leading-tight" title={note}>
            {note}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          {isAffiliate ? (
            <span className="rounded-[3px] bg-(--surface) px-1.5 py-0.5 text-[9px] sm:text-[9.5px] font-semibold text-(--text-muted)">Affiliate</span>
          ) : <span />}
          {href && <ArrowUpRight className="h-3 w-3 shrink-0 text-(--icon) group-hover:text-(--icon-active) transition-colors" aria-hidden="true" />}
        </div>
      </div>
    </>
  );

  const className = "tap-scale group flex h-full flex-col overflow-hidden rounded-[5px] border border-(--surface-border)/80 bg-(--card-bg) shadow-none transition-all duration-200";

  if (!href) return <div className={className}>{body}</div>;
  return (
    <a
      href={href}
      target="_blank"
      rel={isAffiliate ? "sponsored noopener" : "noopener"}
      onClick={onClick}
      className={`${className} cursor-pointer hover:border-(--surface-border)/20`}
    >
      {body}
    </a>
  );
}
