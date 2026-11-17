"use client";

import { ArrowUpRight, Check, Clock, Gift, Star } from "lucide-react";
import type { MediaKitPackage } from "@/types";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { CARD_ITEM } from "@/components/public/ui";
import {
  GST_OPTIONS,
  TRAVEL_OPTIONS,
  USAGE_RIGHTS,
  collabTypeShort,
  describeItem,
  packagePlatforms,
  revisionsLabel,
  type PackagePlatform,
} from "@/lib/collabPackage";

const SERIF = "Georgia, 'Times New Roman', serif";

const PLATFORM_ICON: Record<PackagePlatform, React.ReactNode> = {
  instagram: <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />,
  youtube: <YoutubeIcon className="h-3.5 w-3.5 text-[#FF0000]" />,
  facebook: <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />,
};

/** Small brand glyph for a free-text platform ("Instagram Bundle", "YouTube" …). */
export function platformIcon(platform?: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram") || p.includes("reel")) return PLATFORM_ICON.instagram;
  if (p.includes("youtube")) return PLATFORM_ICON.youtube;
  if (p.includes("facebook")) return PLATFORM_ICON.facebook;
  return null;
}

const UNIT_MAP: Record<string, string> = {
  per_reel: "/ reel",
  per_post: "/ post",
  per_video: "/ video",
  per_package: "/ package",
  per_month: "/ month",
};

/** "₹8,000", "₹8,000–₹12,000 / package", "From ₹5,000 / reel", "Request quote", "Barter". */
export function formatPackagePrice(pkg: MediaKitPackage): string {
  if (pkg.details?.priceVisibility === "quote") return "Request quote";
  const unitLabel = pkg.priceUnit && pkg.priceUnit !== "per_package" ? UNIT_MAP[pkg.priceUnit] || "" : "";
  const prefix = pkg.isStartingPrice ? "From " : "";
  // "8000" / "₹8000" → "₹8,000"; anything that isn't a plain number is kept as typed.
  const rupee = (v: string) => {
    const bare = v.replace(/^₹\s*/, "");
    return /^\d+(\.\d+)?$/.test(bare) ? `₹${Number(bare).toLocaleString("en-IN")}` : v.startsWith("₹") ? v : `₹${v}`;
  };
  const min = (pkg.minPrice || "").trim();
  const max = (pkg.maxPrice || "").trim();
  if (min && max && min !== max) return `${rupee(min)}–${rupee(max)}${unitLabel ? ` ${unitLabel}` : ""}`;
  const raw = (pkg.price || min || "").trim();
  if (!raw || raw === "₹0") return pkg.details?.collabType === "barter" ? "Barter" : "Custom scope";
  const withSymbol = raw.toLowerCase().includes("contact") ? raw : rupee(raw);
  return `${prefix}${withSymbol}${unitLabel ? ` ${unitLabel}` : ""}`;
}

/** GST note next to the price: the package's own setting wins over the creator-wide one. */
function gstNote(pkg: MediaKitPackage, pricesPlusGst?: boolean) {
  const g = pkg.details?.gst;
  if (g === "included") return "incl. GST";
  if (g === "extra") return "+ GST";
  if (g === "na") return "";
  return pricesPlusGst ? "+ GST" : "";
}

/** Everything a package shows brands, computed once (PackageCard and the media kit rows). */
export function packageView(pkg: MediaKitPackage, pricesPlusGst?: boolean) {
  const d = pkg.details;
  const badgeText = (pkg.packageName || pkg.badge || "").trim();
  const pitch = (pkg.storyPitch || "").trim();
  const description = (pkg.description || "").trim();
  const price = formatPackagePrice(pkg);
  const isAmount = price.startsWith("₹") || price.startsWith("From ₹");
  const gst = isAmount ? gstNote(pkg, pricesPlusGst) : "";
  const platforms = d?.items?.length ? packagePlatforms(d.items) : [];
  const structured = (d?.items || []).map((it) => ({
    text: describeItem(it),
    extras: [it.tagging && "Brand tagged", it.collabPost && "Collab post", it.link && "Link included"].filter(Boolean) as string[],
    notes: it.notes,
  }));
  // Free-text deliverables (older packages, or "other deliverables" in the form) not already listed above.
  const listed = new Set(structured.map((x) => x.text));
  const freeText = (Array.isArray(pkg.deliverables) ? pkg.deliverables : [])
    .map((t) => String(t).trim())
    .filter((t) => t && !listed.has(t))
    .map((t) => ({ text: t, extras: [] as string[], notes: undefined as string | undefined }));
  const deliverables = [...structured, ...freeText];
  const usage = d?.usageRights ? USAGE_RIGHTS.find((u) => u.value === d.usageRights)?.label : "";
  const terms = [
    pkg.turnaroundDays > 0 && { label: "Delivery", value: `${pkg.turnaroundDays} working ${pkg.turnaroundDays === 1 ? "day" : "days"}` },
    d?.revisions && { label: "Revisions", value: revisionsLabel(d.revisions) },
    d?.languages?.length && { label: "Language", value: d.languages.join(", ") },
    usage && { label: "Usage rights", value: [usage, d?.usageDuration].filter(Boolean).join(" · ") },
    d?.exclusivity && { label: "Exclusivity", value: d.exclusivity },
    d?.postRetention && { label: "Stays live", value: d.postRetention },
    d?.travel && { label: "Travel", value: TRAVEL_OPTIONS.find((t) => t.value === d.travel)?.label || "" },
    d?.gst && d.gst !== "extra" && { label: "GST", value: GST_OPTIONS.find((g) => g.value === d.gst)?.label || "" },
    d?.extraCharges && { label: "Extra charges", value: d.extraCharges },
  ].filter(Boolean) as { label: string; value: string }[];
  const req = d?.requirements;
  const requirements = [
    req?.productProvided && "Brand provides the product",
    req?.briefRequired && "Campaign brief from the brand",
    req?.visitRequired && "Restaurant / store visit",
    req?.shipping && `Shipping & returns: ${req.shipping}`,
    req?.location && `Location / travel: ${req.location}`,
    req?.conditions,
  ].filter(Boolean) as string[];
  return { d, badgeText, pitch, description, price, gst, platforms, deliverables, terms, requirements };
}

/**
 * One collaboration package as brands see it (public media kit, and the live
 * preview in the dashboard form). Theme tokens only.
 */
export function PackageCard({
  pkg,
  pricesPlusGst,
  onRequest,
  preview = false,
  compact = false,
}: {
  pkg: MediaKitPackage;
  /** Creator-wide "prices + 18% GST" (media kit commercial terms). */
  pricesPlusGst?: boolean;
  onRequest?: (pkg: MediaKitPackage) => void;
  /** Dashboard preview: the CTA is shown but does nothing. */
  preview?: boolean;
  /** Tighter layout for the public profile's Work With Me: same details, inline lists. */
  compact?: boolean;
}) {
  const { d, badgeText, pitch, description, price, gst, platforms, deliverables, terms, requirements } = packageView(pkg, pricesPlusGst);

  if (compact) {
    // Delivery is already in the meta line, so the terms line starts after it.
    const termLine = terms.filter((t) => t.label !== "Delivery" && t.label !== "Revisions").map((t) => (t.label === "Revisions" || t.label === "Language" ? t.value : `${t.label}: ${t.value}`));
    return (
      <article
        className={`${CARD_ITEM} space-y-2 p-3`}
        style={pkg.isPopular ? { borderColor: "color-mix(in srgb, var(--accent-text) 45%, var(--surface-border))" } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {pkg.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded package cover
              <img src={pkg.coverImage} alt="" className="h-11 w-11 shrink-0 rounded-[5px] object-cover" />
            )}
            <h4 title={pkg.title} className="line-clamp-2 min-w-0 break-words text-[14px] font-bold leading-[19px] text-(--text)">
              {pkg.title || "Untitled package"}
            </h4>
          </div>
          <p className="shrink-0 text-right leading-tight">
            <span className="block whitespace-nowrap text-[14px] font-extrabold text-(--accent-text)">{price}</span>
            {gst && <span className="text-[10px] font-semibold text-(--text-muted)">{gst}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-(--text-muted)">
          {pkg.isPopular && (
            <span style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
              <Star aria-hidden className="h-2.5 w-2.5 fill-current" />
              Popular
            </span>
          )}
          {platforms.length > 0 ? (
            <span className="inline-flex items-center gap-1" aria-label={platforms.join(", ")}>
              {platforms.map((p) => (
                <span key={p}>{PLATFORM_ICON[p]}</span>
              ))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium">
              {platformIcon(pkg.platform)}
              {pkg.platform}
            </span>
          )}
          {d && <span className="rounded-full bg-(--accent-soft) px-2 py-0.5 font-bold text-(--accent-text)">{collabTypeShort(d.collabType)}</span>}
          {pkg.turnaroundDays > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="h-3 w-3" />
              {pkg.turnaroundDays} {pkg.turnaroundDays === 1 ? "day" : "days"}
            </span>
          )}
          {d?.revisions && <span>{revisionsLabel(d.revisions)}</span>}
          {pkg.category && <span className="font-semibold text-(--text-secondary)">{pkg.category}</span>}
          {badgeText && <span className="rounded-full bg-(--accent-soft) px-2 py-0.5 font-bold text-(--accent-text)">{badgeText}</span>}
        </div>

        {description && <p className="line-clamp-2 break-words text-[12px] leading-[17px] text-(--text-secondary)">{description}</p>}

        {deliverables.length > 0 && (
          <ul className="space-y-1 rounded-[5px] bg-(--surface) px-2.5 py-2">
            {deliverables.map((it, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] leading-[17px]">
                <Check aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-(--accent-text)" strokeWidth={3} />
                <span className="min-w-0 break-words">
                  <span className="font-semibold text-(--text)">{it.text}</span>
                  {(it.extras.length > 0 || it.notes) && (
                    <span className="text-(--text-muted)"> · {[...it.extras, it.notes].filter(Boolean).join(" · ")}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {d?.inclusions?.length ? (
          <p className="text-[12px] leading-[17px] text-(--text-secondary)">
            <span className="font-semibold text-(--text)">Includes: </span>
            {d.inclusions.join(" · ")}
          </p>
        ) : null}

        {d && d.collabType !== "paid" && d.barterDetails && (
          <p className="text-[12px] leading-[17px] text-(--text-secondary)">
            <span className="font-semibold text-(--accent-text)">Barter: </span>
            {d.barterDetails}
          </p>
        )}

        {termLine.length > 0 && <p className="text-[11px] leading-4 text-(--text-muted)">{termLine.join(" · ")}</p>}

        {requirements.length > 0 && (
          <p className="text-[11px] leading-4 text-(--text-muted)">
            <span className="font-semibold">Good to know: </span>
            {requirements.join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => (preview ? undefined : onRequest?.(pkg))}
          style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
          className="no-print inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[5px] px-3 text-[13px] font-semibold transition-opacity hover:opacity-95 cursor-pointer"
        >
          Request collaboration
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </button>
      </article>
    );
  }

  return (
    <article
      className={`${CARD_ITEM} overflow-hidden`}
      style={pkg.isPopular ? { borderColor: "color-mix(in srgb, var(--accent-text) 45%, var(--surface-border))" } : undefined}
    >
      {pkg.isPopular && (
        <p
          style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider"
        >
          <Star aria-hidden className="h-3 w-3 fill-current" />
          Most popular
        </p>
      )}
      {pkg.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded package cover
        <img src={pkg.coverImage} alt="" className="h-36 w-full object-cover" />
      )}
      <div className="space-y-3 p-3.5">
        {/* Meta: platforms · collab type · delivery · category · badge */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-(--text-muted)">
          {platforms.length > 0 ? (
            <span className="inline-flex items-center gap-1" aria-label={platforms.join(", ")}>
              {platforms.map((p) => (
                <span key={p}>{PLATFORM_ICON[p]}</span>
              ))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium">
              {platformIcon(pkg.platform)}
              {pkg.platform}
            </span>
          )}
          {d && (
            <span className="rounded-full bg-(--accent-soft) px-2 py-0.5 text-[11px] font-bold text-(--accent-text)">{collabTypeShort(d.collabType)}</span>
          )}
          {pkg.turnaroundDays > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="h-3 w-3" />
              {pkg.turnaroundDays} {pkg.turnaroundDays === 1 ? "day" : "days"}
            </span>
          )}
          {pkg.category && (
            <span className="rounded-[5px] border border-(--surface-border) bg-(--surface) px-2 py-0.5 text-[11px] font-semibold text-(--text-secondary)">
              {pkg.category}
            </span>
          )}
          {badgeText && <span className="rounded-full bg-(--accent-soft) px-2 py-0.5 text-[11px] font-bold text-(--accent-text)">{badgeText}</span>}
        </div>

        {/* Title + price (price under the title on phones) */}
        <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between min-[420px]:gap-3">
          <h4 title={pkg.title} className="line-clamp-2 min-w-0 break-words text-[16px] font-bold leading-5 text-(--text)">
            {pkg.title || "Untitled package"}
          </h4>
          <p className="shrink-0 min-[420px]:text-right">
            <span className="whitespace-nowrap text-[16px] font-extrabold leading-5 text-(--accent-text) min-[420px]:block">{price}</span>
            {gst && <span className="ml-1 text-[11px] font-semibold text-(--text-muted) min-[420px]:ml-0">{gst}</span>}
          </p>
        </div>

        {description && <p className="whitespace-pre-line break-words text-[13px] leading-[19px] text-(--text-secondary)">{description}</p>}

        {pitch && (
          <div className="rounded-[5px] border-l-2 border-(--accent) bg-(--accent-soft) px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-(--accent-text)">The story I&apos;d tell for you</p>
            <p style={{ fontFamily: SERIF }} className="mt-0.5 text-[13px] italic leading-relaxed text-(--text)">
              &ldquo;{pitch}&rdquo;
            </p>
          </div>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="overflow-hidden rounded-[5px] border border-(--surface-border)">
            <div className="flex items-center justify-between gap-2 border-b border-(--surface-border) bg-(--surface) px-3 py-2">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-(--text)">
                <Gift aria-hidden className="h-3.5 w-3.5 text-(--accent-text)" />
                What your brand gets
              </p>
              <span className="shrink-0 text-[11px] font-semibold text-(--text-muted)">
                {deliverables.length} {deliverables.length === 1 ? "deliverable" : "deliverables"}
              </span>
            </div>
            <ol className="divide-y divide-(--surface-border)">
              {deliverables.map((it, i) => (
                <li key={i} className="flex items-start gap-2.5 px-3 py-2.5">
                  <span
                    aria-hidden
                    style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[13px] font-semibold leading-5 text-(--text)">{it.text}</span>
                    {it.extras.length > 0 && <span className="block text-[12px] leading-4 text-(--text-muted)">{it.extras.join(" · ")}</span>}
                    {it.notes && <span className="block break-words text-[12px] leading-4 text-(--text-muted)">{it.notes}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* What's included */}
        {d?.inclusions?.length ? (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Also included</p>
            <ul className="flex flex-wrap gap-1.5">
              {d.inclusions.map((inc) => (
                <li key={inc} className="inline-flex items-center gap-1 rounded-full border border-(--surface-border) bg-(--surface) px-2.5 py-1 text-[12px] font-medium text-(--text)">
                  <Check aria-hidden className="h-3 w-3 text-(--accent-text)" strokeWidth={3} />
                  {inc}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Barter */}
        {d && d.collabType !== "paid" && d.barterDetails && (
          <p className="rounded-[5px] bg-(--surface) px-3 py-2 text-[13px] text-(--text)">
            <span className="font-semibold text-(--accent-text)">Barter: </span>
            {d.barterDetails}
          </p>
        )}

        {/* Terms */}
        {terms.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-[5px] border border-(--surface-border) px-3 py-2.5">
            {terms.map((t) => (
              <div key={t.label} className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t.label}</dt>
                <dd className="break-words text-[13px] font-medium leading-[18px] text-(--text)">{t.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Good to know</p>
            <ul className="space-y-0.5">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-1.5 text-[12px] leading-[17px] text-(--text-secondary)">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--text-muted)" />
                  <span className="min-w-0 break-words">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => (preview ? undefined : onRequest?.(pkg))}
          style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
          className="no-print inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[5px] px-4 text-[14px] font-semibold transition-opacity hover:opacity-95 cursor-pointer"
        >
          Request collaboration
          <ArrowUpRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
