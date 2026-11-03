"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CreatorProfile, SocialAccounts } from "@/types";
import { useSetupStep } from "@/lib/setupProgress";

interface SetupChecklistProps {
  profile: CreatorProfile;
  socials: SocialAccounts | null;
  seriesCount: number;
  linksCount: number;
  hasPickedTheme: boolean;
  onShare: () => void;
  onCopyLink: () => void;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}

const STORAGE_KEY_DISMISSED = "inflixo_setup_checklist_dismissed";

export function SetupChecklist({
  profile,
  socials,
  seriesCount,
  linksCount,
  hasPickedTheme,
  onShare,
  onCopyLink,
}: SetupChecklistProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
  });

  // Set only by an actual share action (Copy / WhatsApp / X / LinkedIn / View QR), not by opening the modal.
  const hasSharedProfile = useSetupStep("shared");

  // 1. Social connection check
  const hasSocialConnected = Boolean(
    socials?.instagram?.username ||
      (socials?.instagram?.url && socials.instagram.url !== "#") ||
      socials?.youtube?.username ||
      (socials?.youtube?.url && socials.youtube.url !== "#") ||
      socials?.facebook?.username ||
      (socials?.facebook?.url && socials.facebook.url !== "#") ||
      (socials?.instagram?.followers ?? 0) > 0 ||
      (socials?.youtube?.subscribers ?? 0) > 0 ||
      (socials?.facebook?.followers ?? 0) > 0
  );

  // 2. Profile photo check
  const hasPhoto = Boolean(profile.photoDataUrl && profile.photoDataUrl.trim().length > 0);

  // 3. Name & Bio check
  const hasNameAndBio = Boolean(
    profile.displayName &&
      profile.displayName.trim().length > 0 &&
      profile.bio &&
      profile.bio.trim().length > 0
  );


  // 4. Checklist definition
  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: "name-bio",
        title: "Add your name and bio",
        description:
          "Introduce yourself to visitors. A thoughtful bio makes your link in bio more engaging, authentic, and trustworthy.",
        isDone: hasNameAndBio,
        actionLabel: "Add name & bio",
        actionHref: "/dashboard/profile?edit=details",
      },
      {
        id: "profile-image",
        title: "Add your profile image",
        description:
          "A great profile image makes your link in bio more trustworthy and helps fans recognize you immediately.",
        isDone: hasPhoto,
        actionLabel: "Add profile image",
        actionHref: "/dashboard/profile?edit=photo",
      },
      {
        id: "socials",
        title: "Add your socials",
        description:
          "Connect Instagram, YouTube, or Facebook to verify your fanbase reach and let visitors follow all your channels.",
        isDone: hasSocialConnected,
        actionLabel: "Connect socials",
        actionHref: "/dashboard/socials",
      },
      {
        id: "links",
        title: "Add your links",
        description:
          "Direct your followers to your latest projects, music, shop, or recommendations.",
        isDone: linksCount > 0,
        actionLabel: "Add links",
        actionHref: "/dashboard/links",
      },
      {
        id: "theme",
        title: "Customize your design",
        description:
          "Pick a signature theme, colors, and layout that reflect your unique creator personality.",
        isDone: hasPickedTheme,
        actionLabel: "Customize design",
        actionHref: "/dashboard/themes",
      },
      {
        id: "share",
        title: "Share your Inflixo profile",
        description:
          "Put your link in your Instagram bio, YouTube description, and TikTok to welcome your audience.",
        isDone: hasSharedProfile,
        actionLabel: "Share profile link",
        onAction: onShare,
      },
    ],
    [hasNameAndBio, hasPhoto, hasSocialConnected, linksCount, hasPickedTheme, hasSharedProfile, onShare]
  );

  const completedCount = items.filter((item) => item.isDone).length;
  const totalCount = items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Automatically find the first incomplete item to expand by default
  const firstIncompleteId = items.find((item) => !item.isDone)?.id || items[0].id;
  const [expandedId, setExpandedId] = useState<string | null>(firstIncompleteId);

  // Update expanded item when first incomplete changes
  useEffect(() => {
    if (expandedId && items.find((item) => item.id === expandedId)?.isDone) {
      const nextPending = items.find((item) => !item.isDone)?.id || null;
      setExpandedId(nextPending);
    }
  }, [items]);

  const [listOpen, setListOpen] = useState(false);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    }
  };

  // Auto-hide when 6/6 (all completed) or if the user dismissed it via the X button
  if (completedCount === totalCount || isDismissed) {
    return null;
  }

  const nextItem = items.find((item) => !item.isDone);
  return (
    <div className="bg-white border border-[#ECECF0] rounded-[5px] text-left">
      {/* Slim one-line progress bar; the full checklist opens below on demand. */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px]">
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
        >
          <span className="shrink-0 text-[13px] font-semibold text-[#18181B] whitespace-nowrap">
            Setup <span className="tabular-nums">{completedCount}/{totalCount}</span>
          </span>
          <span className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
            <span
              style={{ width: `${Math.max(5, progressPercent)}%` }}
              className="block h-full rounded-full bg-[#7A2253] transition-all duration-500 ease-out"
            />
          </span>
          {nextItem && (
            <span className="hidden sm:inline truncate max-w-[220px] text-[12.5px] text-[#6B6B76]">
              Next: <span className="font-medium text-[#18181B]">{nextItem.title}</span>
            </span>
          )}
          <span className="shrink-0 text-[#8E8E93]">
            {listOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-[#8E8E93] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors shrink-0 cursor-pointer"
          title="Dismiss checklist"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {listOpen && (
      <div className="border-t border-[#F4F4F5] px-3.5 pb-1">
      <div className="divide-y divide-[#F4F4F5]">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="py-2.5 first:pt-1 last:pb-1">
              {/* Row Header */}
              <div
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between gap-3 py-1 cursor-pointer select-none group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleItem(item.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator */}
                  {item.isDone ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#D4D4D8] group-hover:border-[#7A2253] transition-colors shrink-0" />
                  )}

                  {/* Title */}
                  <span
                    className={`text-[13.5px] font-semibold transition-colors ${
                      item.isDone
                        ? "text-[#8E8E93] line-through"
                        : "text-[#18181B] group-hover:text-[#7A2253]"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="shrink-0 text-[#8E8E93] group-hover:text-[#18181B] transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Row Body (Expanded) */}
              {isExpanded && (
                <div className="pl-8 pr-2 pt-1 pb-2">
                  <p className="text-[12.5px] text-[#52525B] leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {!item.isDone ? (
                    item.actionHref ? (
                      <Link
                        href={item.actionHref}
                        className="inline-flex h-8 items-center justify-center px-4 rounded-[5px] bg-[#7A2253] text-white hover:bg-[#681c46] text-[12.5px] font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        {item.actionLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="inline-flex h-8 items-center justify-center px-4 rounded-[5px] bg-[#7A2253] text-white hover:bg-[#681c46] text-[12.5px] font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        {item.actionLabel}
                      </button>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[5px] border border-emerald-200/50">
                      <Check className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      )}
    </div>
  );
}
