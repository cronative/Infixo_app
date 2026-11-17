"use client";

import type { MouseEvent } from "react";
import { ExternalLink, Package } from "lucide-react";
import { CARD_ITEM, CARD_ITEM_HOVER } from "./tokens";

export interface ProductTileItem {
  id: string | number;
  name: string;
  imageUrl?: string;
  href?: string;
  price?: string | null;
}

/** Compact product tile: 4:3 image, 2-line name, price (never wraps) + open icon. */
export function ProductTile({ product: p, onClick }: { product: ProductTileItem; onClick?: (e: MouseEvent, p: ProductTileItem) => void }) {
  return (
    <a
      href={p.href || "#"}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => onClick?.(e, p)}
      className={`group flex h-full flex-col p-1.5 ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
    >
      <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[5px] bg-(--surface)">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote product images of any host
          <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Package className="h-6 w-6 text-(--icon)" />
        )}
      </span>
      <span title={p.name} className="mt-1.5 line-clamp-2 break-words px-0.5 text-[12px] font-medium leading-4 text-(--text)">{p.name}</span>
      <span className="mt-auto flex items-center justify-between gap-1 px-0.5 pt-1.5">
        <span className="whitespace-nowrap text-[12px] font-bold tabular-nums leading-none text-(--text)">{p.price || ""}</span>
        <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0 text-(--accent-text)" />
      </span>
    </a>
  );
}

/** Product tile grid: 2 per row on small phones, 3 from 400px. */
export function ProductTiles({
  products,
  onProductClick,
  previewFour = false,
}: {
  products: ProductTileItem[];
  /** Profile preview of 4: the 4th tile hides once the grid is 3 across. */
  previewFour?: boolean;
  onProductClick?: (e: MouseEvent, p: ProductTileItem) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 p-2.5 min-[400px]:grid-cols-3">
      {products.map((p, i) => (
        <li key={p.id} className={`min-w-0 ${previewFour && i === 3 ? "min-[400px]:hidden" : ""}`}>
          <ProductTile product={p} onClick={onProductClick} />
        </li>
      ))}
    </ul>
  );
}
