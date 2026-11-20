"use client";

import { useState } from "react";
import { Briefcase, Globe, Check, Clapperboard, Copy, ExternalLink, Link2, ShoppingBag, Star, User, Users, type LucideIcon } from "lucide-react";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";
import { SectionHeading } from "./SectionHeading";

const PAGES: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Profile", path: "", icon: User },
  { label: "Series", path: "/series", icon: Clapperboard },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
  { label: "Links", path: "/links", icon: Link2 },
  { label: "Reviews", path: "/reviews", icon: Star },
  { label: "Media Kit", path: "/mediakit", icon: Briefcase },
  { label: "Team", path: "/team", icon: Users },
];

/** Quick links to every public page: tap to open, copy icon to share that page's link. */
export function PublicPagesCard({ handle, profileUrl }: { handle: string; profileUrl: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const clean = (handle || "").replace(/^@/, "");
  if (!clean) return null;

  const copy = async (label: string, path: string) => {
    const ok = await copyToClipboard(`${profileUrl}${path}`);
    if (ok) {
      setCopied(label);
      showToast(`${label} link copied`);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1800);
    } else {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <section className="rounded-[5px] border border-[#ECECF0] bg-white">
      <SectionHeading
        icon={Globe}
        title="Your public pages"
        subtitle="Open or copy the link of any page to share it."
        count={`${PAGES.length} pages`}
      />
      <ul className="grid grid-cols-1 gap-2 p-3 @md:grid-cols-2 @3xl:grid-cols-3">
        {PAGES.map(({ label, path, icon: Icon }) => {
          const url = `/${clean}${path}`;
          const isCopied = copied === label;
          return (
            <li key={label} className="flex items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white pr-1 transition-colors hover:border-[#D4D4D8]">
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#FFEDE6] text-[#C21B5C]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-[#18181B]">{label}</span>
                  <span className="block break-all text-[12px] leading-snug text-[#6B6B76]">inflixo.com/{clean}{path}</span>
                </span>
              </a>
              <button
                type="button"
                onClick={() => copy(label, path)}
                aria-label={`Copy ${label} link`}
                title={`Copy ${label} link`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] cursor-pointer"
              >
                {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${label}`}
                title={`Open ${label}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B]"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
