"use client";

import { PastBrandItem } from "@/types";

interface BrandLogosWrapProps {
  brands?: PastBrandItem[];
}

export function BrandLogosWrap({ brands }: BrandLogosWrapProps) {
  if (!brands || brands.length === 0) return null;

  const validBrands = brands.filter((b) => Boolean(b && b.name?.trim()));
  if (validBrands.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] p-4 sm:p-5 shadow-xs text-left">
      <h3 className="font-bold text-base sm:text-[17px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
        Brands I&apos;ve worked with
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        {validBrands.map((brand, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
          >
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-4 w-4 rounded-full object-contain"
              />
            ) : null}
            <span>{brand.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
