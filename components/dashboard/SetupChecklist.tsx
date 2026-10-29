"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, X, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import type { CreatorProfile, SocialAccounts } from "@/types";

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

const STORAGE_KEY_MINIMIZED = "inflixo_setup_checklist_minimized";
const STORAGE_KEY_SHARED = "inflixo_profile_shared_once";

export function SetupChecklist({
  profile,
  socials,
  seriesCount,
  linksCount,
  hasPickedTheme,
  onShare,
  onCopyLink,
}: SetupChecklistProps) {
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_MINIMIZED) === "true";
  });

  const [hasSharedProfile, setHasSharedProfile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_SHARED) === "true";
  });

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

  const handleShareClick = () => {
    setHasSharedProfile(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SHARED, "true");
    }
    onShare();
  };

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
        actionHref: "/dashboard/settings",
      },
      {
        id: "profile-image",
        title: "Add your profile image",
        description:
          "A great profile image makes your link in bio more trustworthy and helps fans recognize you immediately.",
        isDone: hasPhoto,
        actionLabel: "Add profile image",
        actionHref: "/dashboard/settings",
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
        onAction: handleShareClick,
      },
    ],
    [hasNameAndBio, hasPhoto, hasSocialConnected, linksCount, hasPickedTheme, hasSharedProfile]
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

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, "true");
    }
  };

  const handleRestore = () => {
    setIsMinimized(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, "false");
    }
  };

  // Emotional subtitle based on progress
  const emotionalSubtitle = useMemo(() => {
    if (completedCount === totalCount) {
      return "All set! Your profile is 100% complete and ready to convert visitors into fans.";
    }
    if (completedCount >= 4) {
      return "You're almost there! Just a couple quick steps to turn your profile into a high-converting hub.";
    }
    if (completedCount >= 1) {
      return "Great start! Complete these quick steps to make your profile look credible and trustworthy.";
    }
    return "Complete these essential steps to make your link in bio feel verified, trusted, and ready for fans.";
  }, [completedCount, totalCount]);

  // If minimized, render a sleek compact badge/pill
  if (isMinimized) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white border border-[#ECECF0] rounded-[5px] text-left transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#18181B]">Setup checklist</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {completedCount}/{totalCount}
              </span>
            </div>
            <p className="text-[11.5px] text-[#6B6B76] truncate mt-0.5">
              {progressPercent}% completed • {emotionalSubtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex h-7 items-center justify-center px-2.5 rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#18181B] text-[12px] font-medium transition-colors shrink-0 cursor-pointer"
        >
          <span>Continue setup</span>
          <ArrowRight className="h-3 w-3 ml-1 text-[#71717A]" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 bg-white border border-[#ECECF0] rounded-[5px] text-left transition-all">
      {/* 1. Header with title, badge and close button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#18181B] tracking-tight">
              Your setup checklist
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-[12.5px] text-[#6B6B76] font-normal mt-1 leading-snug">
            {emotionalSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleMinimize}
          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-[#8E8E93] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors shrink-0 cursor-pointer"
          title="Minimize checklist"
          aria-label="Minimize checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Progress bar */}
      <div className="mt-3.5 w-full bg-[#F4F4F5] h-2 rounded-[5px] overflow-hidden">
        <div
          style={{ width: `${Math.max(5, progressPercent)}%` }}
          className="h-full bg-gradient-to-r from-[#7A2253] via-[#8E2861] to-[#A23372] rounded-[5px] transition-all duration-500 ease-out"
        />
      </div>

      {/* 3. Interactive Checklist items (Accordion style) */}
      <div className="mt-3.5 divide-y divide-[#F4F4F5]">
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
  );
}
