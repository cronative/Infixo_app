"use client";

import React, { useState } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { ProductImage } from "@/components/products/ProductImage";
import { copyToClipboard } from "@/lib/copyToClipboard";

/**
 * Grid wrapper shared by Shop (standalone page, public profile tab & dashboard preview) and My Setup:
 * - 1 product: 1-column compact horizontal card
 * - 2+ products: 2-column grid with 12px (gap-3) gap and consistent card height
 */
export function ProductGrid({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const count = items.length;
  const isSingle = count === 1;
  const gridColsClass = isSingle ? "grid-cols-1" : "grid-cols-2";

  const renderedChildren = isSingle
    ? items.map((child) =>
        React.isValidElement<ProductGridCardProps>(child)
          ? React.cloneElement(child, { horizontal: child.props.horizontal ?? true })
          : child
      )
    : items;

  return (
    <div className="@container w-full">
      <div className={`grid ${gridColsClass} gap-3`}>{renderedChildren}</div>
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
  couponCode?: string | null;
  discountText?: string | null;
  isTopPick?: boolean;
  horizontal?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Compact card used by Shop and My Setup grids:
 * - `horizontal = true` (1 product): compact horizontal card with 80–96px square image on the left, name/price/note/affiliate+arrow on the right.
 * - `horizontal = false` (2+ products): 2-column grid card with 1:1 square image (object-contain, light bg), 2-line name, 1-line truncated note, bold price, and Affiliate tag + arrow in one row.
 */
export function ProductGridCard({
  name,
  imageUrl,
  href,
  price,
  note,
  isAffiliate = false,
  couponCode,
  discountText,
  isTopPick = false,
  horizontal = false,
  onClick,
}: ProductGridCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!couponCode) return;
    const ok = await copyToClipboard(couponCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const couponChip = couponCode ? (
    <button
      type="button"
      onClick={handleCopyCoupon}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-dashed border-[#7A2253]/40 bg-[#FFF5F8] text-[#7A2253] text-[10.5px] font-semibold cursor-pointer hover:bg-[#FCE7F1] transition-colors shrink-0 max-w-full truncate"
      title="Click to copy coupon code"
    >
      <span className="truncate">{copied ? "Coupon copied!" : `Code: ${couponCode}`}</span>
      {copied ? <Check className="h-2.5 w-2.5 stroke-[2.5] shrink-0 text-emerald-600" /> : <Copy className="h-2.5 w-2.5 shrink-0" />}
    </button>
  ) : null;

  const priceAndDiscount = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {price && (
        <span className="text-[13px] sm:text-[14px] font-bold text-(--text) tabular-nums leading-tight">
          {price}
        </span>
      )}
      {discountText && (
        <span className="text-[10.5px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-[3px] px-1 py-0.2">
          {price ? `· ${discountText}` : discountText}
        </span>
      )}
    </div>
  );

  const body = horizontal ? (
    <div className="relative flex flex-row items-stretch w-full gap-3">
      {isTopPick && (
        <span className="absolute -top-1 -right-1 z-10 inline-flex items-center gap-1 rounded-[4px] bg-amber-500 text-white px-1.5 py-0.5 text-[9.5px] font-bold shadow-xs">
          ⭐ Top Pick
        </span>
      )}
      <ProductImage
        src={imageUrl || ""}
        name={name}
        cover={false}
        className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 aspect-square rounded-[5px] border border-(--surface-border)/60 bg-[#F8FAFC]"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <div className="space-y-0.5 min-w-0">
          <h3
            className="text-[13px] sm:text-[13.5px] font-medium text-(--text) line-clamp-2 leading-[18px] break-words"
            title={name}
          >
            {name}
          </h3>
          {(price || discountText) && priceAndDiscount}
          {couponChip && (
            <div className="pt-0.5">{couponChip}</div>
          )}
          {note && (
            <p
              className="text-xs text-(--text-muted) font-normal line-clamp-1 truncate leading-[17px]"
              title={note}
            >
              {note}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          {isAffiliate ? (
            <span className="rounded-[3px] bg-transparent border border-(--surface-border) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
              Affiliate
            </span>
          ) : (
            <span />
          )}
          {href && (
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-(--icon) group-hover:text-(--icon-active) transition-colors"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="relative flex flex-col h-full w-full">
      {isTopPick && (
        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-[4px] bg-amber-500 text-white px-1.5 py-0.5 text-[9.5px] font-bold shadow-xs">
          ⭐ Top Pick
        </span>
      )}
      <ProductImage
        src={imageUrl || ""}
        name={name}
        cover={false}
        className="aspect-square w-full rounded-none border-b border-(--surface-border) bg-[#F8FAFC]"
      />

      <div className="flex flex-1 flex-col p-2.5 sm:p-3 gap-0.5 min-w-0">
        <h3
          className="text-[13px] font-medium text-(--text) line-clamp-2 leading-[18px] break-words"
          title={name}
        >
          {name}
        </h3>
        {(price || discountText) && priceAndDiscount}
        {couponChip && (
          <div className="pt-0.5">{couponChip}</div>
        )}
        {note && (
          <p
            className="text-xs text-(--text-muted) font-normal line-clamp-1 truncate leading-[17px]"
            title={note}
          >
            {note}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          {isAffiliate ? (
            <span className="rounded-[3px] bg-transparent border border-(--surface-border) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
              Affiliate
            </span>
          ) : (
            <span />
          )}
          {href && (
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-(--icon) group-hover:text-(--icon-active) transition-colors"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );

  const className = horizontal
    ? "tap-scale group flex flex-row items-stretch overflow-hidden rounded-[5px] border border-(--surface-border) bg-transparent hover:bg-(--surface)/40 p-2.5 sm:p-3 gap-3 shadow-none transition-all duration-200"
    : "tap-scale group flex h-full flex-col overflow-hidden rounded-[5px] border border-(--surface-border) bg-transparent hover:bg-(--surface)/40 shadow-none transition-all duration-200";

  if (!href) return <div className={className}>{body}</div>;
  return (
    <a
      href={href}
      target="_blank"
      rel={isAffiliate ? "sponsored noopener" : "noopener"}
      onClick={onClick}
      className={`${className} cursor-pointer hover:border-(--surface-border)`}
    >
      {body}
    </a>
  );
}
