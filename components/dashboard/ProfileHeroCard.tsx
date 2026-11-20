"use client";

import Link from "next/link";
import { BadgeCheck, Copy, ExternalLink, MapPin, Pencil, UserRound } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { EraAwardMedal } from "@/components/shared/EraBadge";
import { BrandPlatformIcon } from "@/components/public/ui";
import { eraRing, getEraConfig } from "@/lib/eraConfig";
import { formatFans, getCreatorEra } from "@/lib/creatorEra";
import type { CreatorProfile, SocialAccounts } from "@/types";

const PLATFORMS = ["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "pinterest", "spotify", "tiktok", "twitch"] as const;

/**
 * Dashboard Profile (view mode): the creator's identity laid out like the public header —
 * photo, name, link, chips, bio, socials, stats and actions in one centred card.
 */
export function ProfileHeroCard({
  profile,
  socials,
  totalAudience,
  categories,
  onEdit,
  onCopyLink,
}: {
  profile: CreatorProfile;
  socials?: SocialAccounts;
  totalAudience: number;
  categories: string[];
  onEdit: () => void;
  onCopyLink: () => void;
}) {
  const handle = (profile.username || "username").replace(/^@/, "");
  const name = profile.displayName || "Your name";
  const era = getCreatorEra(totalAudience > 0 ? totalAudience : null);
  const eraCfg = era ? getEraConfig(era.era) : null;
  const location = [profile.city, profile.state].map((v) => (v || "").trim()).filter(Boolean).join(", ");
  const chips = [...categories, ...(profile.customCategory ? [profile.customCategory] : [])];
  const linked = PLATFORMS.map((key) => {
    const acc = (socials as Record<string, { url?: string; username?: string; enabled?: boolean } | undefined> | undefined)?.[key];
    if (!acc || acc.enabled === false || (!acc.url && !acc.username)) return null;
    return { key, url: acc.url || "" };
  }).filter(Boolean) as { key: string; url: string }[];

  return (
    <section className="overflow-hidden rounded-[5px] border border-[#ECECF0] bg-white">
      <SectionHeading
        icon={UserRound}
        title="Your public profile"
        subtitle="What fans see first."
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--success)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--success)" />
          Live
        </span>
        }
      />

      <div className="mx-auto flex max-w-[520px] flex-col items-center px-4 pb-5 pt-6 text-center">
        {/* Photo with the Creator Era ring, like the public header */}
        <div className="relative">
          <div className="rounded-full p-[2.5px]" style={{ background: eraCfg ? eraRing(eraCfg) : "#ECECF0" }}>
            <div className="rounded-full bg-white p-[2px]">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={name}
                className="h-24 w-24 rounded-full object-cover"
                textClassName="text-2xl font-extrabold text-white"
                style={{ backgroundColor: "#C21B5C" }}
              />
            </div>
          </div>
          {profile.isVerified && (
            <span className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white" aria-label="Verified creator">
              <BadgeCheck className="h-5 w-5 fill-[#1D9BF0] text-white" strokeWidth={2.2} />
            </span>
          )}
        </div>

        <h2 className="mt-3 break-words text-[22px] font-bold leading-7 text-[#18181B]">{name}</h2>
        <button
          type="button"
          onClick={onCopyLink}
          title="Copy profile link"
          className="group mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-[#6B6B76] hover:text-[#C21B5C] cursor-pointer"
        >
          inflixo.com/{handle}
          <Copy className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#C21B5C]" />
        </button>

        {(chips.length > 0 || location) && (
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5" aria-label="Categories">
            {chips.map((c) => (
              <li key={c} className="rounded-full border border-[#ECECF0] px-2.5 py-0.5 text-[12px] font-medium text-[#52525B]">
                {c}
              </li>
            ))}
            {location && (
              <li className="inline-flex items-center gap-1 rounded-full border border-[#ECECF0] px-2.5 py-0.5 text-[12px] font-medium text-[#52525B]">
                <MapPin className="h-3.5 w-3.5 text-[#A1A1AA]" />
                {location}
              </li>
            )}
          </ul>
        )}

        {profile.bio?.trim() ? (
          <p className="mt-3 text-[14px] leading-5 text-[#3F3F46]">{profile.bio}</p>
        ) : (
          <button type="button" onClick={onEdit} className="mt-3 text-[13px] italic text-[#6B6B76] hover:text-[#C21B5C] cursor-pointer">
            No bio added yet — add one
          </button>
        )}

        {linked.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {linked.map((s) => (
              <a
                key={s.key}
                href={s.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.key}
                className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white hover:border-[#A1A1AA]"
              >
                <BrandPlatformIcon platform={s.key} size={22} />
              </a>
            ))}
          </div>
        )}

        {/* Stats row */}
        <dl className="mt-5 grid w-full grid-cols-3 divide-x divide-[#ECECF0] border-t border-[#ECECF0] pt-4">
          <div className="px-2">
            <dt className="text-[12px] text-[#6B6B76]">Total Fans</dt>
            <dd className="mt-0.5 text-[20px] font-extrabold leading-7 text-[#18181B]">{totalAudience > 0 ? formatFans(totalAudience) : "—"}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[12px] text-[#6B6B76]">Creator Era</dt>
            <dd className="mt-1 flex items-center justify-center gap-1.5 text-[13px] font-bold leading-4 text-[#18181B]">
              {era ? (
                <>
                  <EraAwardMedal era={era.era} stage={era.stage} size={20} className="shrink-0" />
                  <span className="min-w-0">{era.badge}</span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="px-2">
            <dt className="text-[12px] text-[#6B6B76]">Platforms</dt>
            <dd className="mt-0.5 text-[20px] font-extrabold leading-7 text-[#18181B]">{linked.length}</dd>
          </div>
        </dl>

        {/* Actions, stacked */}
        <div className="mt-5 grid w-full gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-[#C21B5C] px-4 text-[14px] font-semibold text-white hover:opacity-95 cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
          <Link
            href={`/${handle}`}
            target="_blank"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] border border-[#ECECF0] bg-white px-4 text-[14px] font-semibold text-[#18181B] hover:bg-[#FAFAFB]"
          >
            <ExternalLink className="h-4 w-4" />
            View public profile
          </Link>
        </div>
      </div>
    </section>
  );
}
