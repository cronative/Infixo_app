"use client";

import { ArrowRight, ChevronRight, Layers, MoreVertical, Plus } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { formatPackagePrice, platformIcon } from "@/components/mediakit/PackageCard";
import { packagePlatforms, shortItemsSummary, type PackagePlatform } from "@/lib/collabPackage";
import type { MediaKitPackage } from "@/types";

const ICON: Record<PackagePlatform, React.ReactNode> = {
  instagram: <InstagramIcon className="h-4 w-4 text-[#E1306C]" />,
  youtube: <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />,
  facebook: <FacebookIcon className="h-4 w-4 text-[#1877F2]" />,
};

function statusChip(pkg: MediaKitPackage) {
  if (pkg.isDraft) return <span className="rounded-[5px] border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Draft</span>;
  if (!pkg.isActive) return <span className="rounded-[5px] border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Hidden</span>;
  return null;
}

/** "Collaboration Packages & Rates": image · title · price · platforms + deliverables · description · ›. */
export function PackagesRatesCard({
  packages,
  activeMenuId,
  onAdd,
  onEdit,
  onMenu,
  onShowExamples,
}: {
  packages: MediaKitPackage[];
  activeMenuId: string | null;
  onAdd: () => void;
  onEdit: (pkg: MediaKitPackage) => void;
  onMenu: (e: React.MouseEvent<HTMLButtonElement>, pkg: MediaKitPackage) => void;
  onShowExamples: () => void;
}) {
  return (
    <SectionCard title="Collaboration Packages & Rates" icon={Layers} bodyClassName="p-4 space-y-3">
      {packages.length === 0 ? (
        <div className="rounded-[5px] border border-dashed border-[#D4D4D8] px-4 py-6 text-center">
          <p className="text-[13px] font-semibold text-[#18181B]">Create your first collab package</p>
          <p className="mt-1 text-[12px] text-[#6B6B76]">Reels, store visits and promotions for brands, cafes and shops.</p>
          <button type="button" onClick={onShowExamples} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2253] hover:underline cursor-pointer">
            Not sure what to offer? See examples <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {packages.map((pkg) => {
            const items = pkg.details?.items || [];
            const platforms = items.length ? packagePlatforms(items) : [];
            const summary = items.length ? shortItemsSummary(items) : (pkg.deliverables || []).slice(0, 3).join(" + ");
            return (
              <li key={pkg.id} className="flex items-stretch gap-3 rounded-[5px] border border-[#ECECF0] bg-white p-2.5 transition-colors hover:border-[#7A2253]/40">
                <button type="button" onClick={() => onEdit(pkg)} className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[5px] bg-[#F7EEF2] cursor-pointer sm:h-[96px] sm:w-[128px]" aria-label={`Edit ${pkg.title}`}>
                  {pkg.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pkg.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center gap-1.5">
                      {platforms.length ? platforms.map((p) => <span key={p}>{ICON[p]}</span>) : platformIcon(pkg.platform) || <Layers className="h-5 w-5 text-[#7A2253]/60" />}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => onEdit(pkg)} className="min-w-0 flex-1 text-left cursor-pointer">
                  <span className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-[#18181B]">{pkg.title}</span>
                        {statusChip(pkg)}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[15px] font-extrabold text-[#7A2253]">{formatPackagePrice(pkg)}</span>
                  </span>
                  {(platforms.length > 0 || summary) && (
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-[#3F3F46]">
                      {platforms.length > 0 && <span className="flex shrink-0 items-center gap-1">{platforms.map((p) => <span key={p}>{ICON[p]}</span>)}</span>}
                      <span className="truncate">{summary}</span>
                    </span>
                  )}
                  {pkg.description && <span className="mt-1 line-clamp-2 break-words text-[12px] leading-[18px] text-[#6B6B76]">{pkg.description}</span>}
                </button>
                <span className="flex shrink-0 flex-col items-center justify-between" data-pkg-menu>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenu(e, pkg);
                    }}
                    aria-label={`More options for ${pkg.title}`}
                    aria-expanded={activeMenuId === pkg.id}
                    className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B] cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onEdit(pkg)} aria-label={`Edit ${pkg.title}`} className="flex h-8 w-8 items-center justify-center text-[#7A2253] cursor-pointer">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] border border-[#7A2253] bg-white text-[14px] font-semibold text-[#7A2253] hover:bg-[#F7EEF2] cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Add New Package
      </button>
    </SectionCard>
  );
}
