"use client";

import Link from "next/link";
import { Layers, Mail, Pencil, Users } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { getInitials } from "@/lib/avatar";

/**
 * Media kit header strip: who you are · total fanbase · platforms · packages · contact email.
 * Every stat stacks to a 2-column grid on phones.
 */
export function MediaKitSummary({
  name,
  handle,
  category,
  photoUrl,
  fanbase,
  platforms,
  packageCount,
  contactEmail,
  onEdit,
}: {
  name: string;
  handle: string;
  category?: string;
  photoUrl?: string | null;
  fanbase: string;
  platforms: { instagram: boolean; youtube: boolean; facebook: boolean };
  packageCount: number;
  contactEmail: string;
  onEdit: () => void;
}) {
  const platformCount = [platforms.instagram, platforms.youtube, platforms.facebook].filter(Boolean).length;
  const stat = "flex min-w-0 flex-col gap-1";
  const value = "truncate text-[20px] font-bold leading-6 text-[#18181B]";
  const label = "text-[12px] text-[#6B6B76]";

  return (
    <section className="rounded-[5px] border border-[#ECECF0] bg-white p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))_minmax(0,1.3fr)_auto] md:items-center md:gap-0 md:divide-x md:divide-[#ECECF0]">
        {/* Who */}
        <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1 md:pr-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-[5px] object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[5px] bg-[#C21B5C] text-[18px] font-bold text-white">
              {getInitials(name || handle)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-6 text-[#18181B]">{name || handle}</p>
            {category && (
              <span className="mt-0.5 inline-block max-w-full truncate rounded-[5px] bg-[#FFEDE6] px-2 py-0.5 text-[12px] font-semibold text-[#C21B5C]">
                {category}
              </span>
            )}
            <p className="mt-0.5 truncate text-[12px] text-[#6B6B76]">@{handle}</p>
          </div>
        </div>

        <div className={`${stat} md:px-4`}>
          <Users className="h-4 w-4 text-[#C21B5C]" aria-hidden />
          <span className={value}>{fanbase}</span>
          <span className={label}>Total fanbase</span>
        </div>

        <Link href="/dashboard/socials" className={`${stat} md:px-4 group`}>
          <span className="flex h-4 items-center gap-1" aria-hidden>
            {platformCount === 0 && <span className="h-4 w-4 rounded-full border border-dashed border-[#D4D4D8]" />}
            {platforms.instagram && <InstagramIcon className="h-4 w-4 text-[#E1306C]" />}
            {platforms.youtube && <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />}
            {platforms.facebook && <FacebookIcon className="h-4 w-4 text-[#1877F2]" />}
          </span>
          <span className={value}>{platformCount}</span>
          <span className={`${label} group-hover:text-[#C21B5C]`}>{platformCount === 1 ? "Platform" : "Platforms"}</span>
        </Link>

        <div className={`${stat} md:px-4`}>
          <Layers className="h-4 w-4 text-[#C21B5C]" aria-hidden />
          <span className={value}>{packageCount}</span>
          <span className={label}>{packageCount === 1 ? "Collab package" : "Collab packages"}</span>
        </div>

        <div className={`${stat} col-span-2 md:col-span-1 md:px-4`}>
          <Mail className="h-4 w-4 text-[#C21B5C]" aria-hidden />
          <span title={contactEmail} className="truncate text-[15px] font-bold leading-6 text-[#18181B]">
            {contactEmail || "Not set"}
          </span>
          <span className={label}>Contact email</span>
        </div>

        <div className="col-span-2 md:col-span-1 md:pl-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-[13px] font-semibold text-[#C21B5C] hover:bg-[#FFEDE6] cursor-pointer md:w-auto"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </div>
    </section>
  );
}
