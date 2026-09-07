"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CreatorProfileSection, DEFAULT_PROFILE_SECTIONS, ProfileSectionKey } from "@/types";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { authRepository, sectionsRepository } from "@/repositories/localRepository";

const SECTION_DESCRIPTIONS: Record<ProfileSectionKey, { name: string; desc: string }> = {
  ABOUT: { name: "Creator Header & Bio", desc: "Profile picture, display name, category, and bio" },
  TOTAL_FANBASE: { name: "Total Fanbase Card", desc: "Verified combined audience count card" },
  SOCIALS: { name: "Primary Social Accounts", desc: "Connected platforms (Instagram, YouTube, Facebook)" },
  OTHER_SOCIALS: { name: "Other Social Accounts", desc: "Secondary channels and custom social handles" },
  LINKS: { name: "Custom Links", desc: "External website, shop, and featured links" },
  SERIES: { name: "Featured Series & Episodes", desc: "Video series, episodes, and playlist tabs" },
  SERVICES: { name: "Creator Services & Rate Cards", desc: "Sponsorship deliverables and rates" },
  COLLABORATIONS: { name: "Selected Collaborations", desc: "Past brand sponsorships and campaign cases" },
  BRANDS: { name: "Ventures & Brands", desc: "Brands, companies, and side-projects founded" },
  TEAM: { name: "Creator Team", desc: "Core team, editors, managers, and producers" },
  REVIEWS: { name: "Client & Brand Reviews", desc: "Verified client ratings and testimonials" },
  WORK_WITH_ME: { name: "Work With Me CTA", desc: "Direct brand collaboration inquiry trigger" },
};

export function SectionOrderManager() {
  const { profile } = useCreator();
  const { showToast } = useToast();
  const [sections, setSections] = useState<CreatorProfileSection[]>(DEFAULT_PROFILE_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const email = authRepository.getPendingEmail() || profile.email;

  useEffect(() => {
    async function loadSections() {
      try {
        const local = sectionsRepository.getAll();
        if (local && local.length > 0) {
          setSections(local);
        }

        if (email) {
          const res = await fetch(`/api/creator/sections?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.sections) && data.sections.length > 0) {
              setSections(data.sections);
              sectionsRepository.saveAll(data.sections);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load sections:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSections();
  }, [email]);

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    // re-assign sortOrder
    const reordered = updated.map((sec, idx) => ({ ...sec, sortOrder: idx }));
    setSections(reordered);
    saveSections(reordered);
  };

  const handleToggleVisibility = (secKey: ProfileSectionKey) => {
    if (secKey === "ABOUT") {
      showToast("Creator Header & Bio cannot be hidden", "info");
      return;
    }
    const updated = sections.map((sec) =>
      sec.sectionKey === secKey ? { ...sec, isVisible: !sec.isVisible } : sec
    );
    setSections(updated);
    saveSections(updated);
  };

  const handleResetDefault = () => {
    setSections(DEFAULT_PROFILE_SECTIONS);
    saveSections(DEFAULT_PROFILE_SECTIONS);
    showToast("Reset sections to default layout ✨");
  };

  const saveSections = async (updatedList: CreatorProfileSection[]) => {
    setSaving(true);
    sectionsRepository.saveAll(updatedList);
    try {
      if (email) {
        await fetch("/api/creator/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, sections: updatedList }),
        });
      }
    } catch (err) {
      console.error("Failed to save sections:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 space-y-4 shadow-xs text-left">
      <div className="flex items-center justify-between border-b border-[#E4DAD5] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600b0f0f] text-[#600a0f] border border-[#600a0f]/20 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#241618] flex items-center gap-2">
              Profile Sections &amp; Layout
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#600a0f]" />}
            </h2>
            <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
              Customize the order and visibility of sections displayed on your public creator page.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] px-3 py-1.5 text-xs font-semibold text-[#6B5A5D] hover:text-[#241618] transition-colors cursor-pointer shadow-xs"
          title="Reset to default order"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset Default</span>
        </button>
      </div>

      <div className="space-y-2 pt-1">
        {sections
          .filter((s) => s.sectionKey !== "COLLABORATIONS" && s.sectionKey !== "BRANDS")
          .map((section, idx) => {
            const info = SECTION_DESCRIPTIONS[section.sectionKey] || {
              name: section.sectionKey,
              desc: "Custom profile block",
            };
            const isFirst = idx === 0;
            const isLast = idx === sections.length - 1;
            const isAbout = section.sectionKey === "ABOUT";

            return (
              <div
                key={section.sectionKey}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all ${section.isVisible
                  ? "bg-white border-[#E4DAD5] shadow-xs"
                  : "bg-[#fbfbfb] border-[#E4DAD5]/60 opacity-60"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#fbfbfb] border border-[#E4DAD5] text-[11px] font-bold text-[#6B5A5D]">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-[#241618] truncate flex items-center gap-1.5">
                      {info.name}
                      {isAbout && (
                        <span className="text-[10px] font-semibold text-[#600a0f] bg-[#600b0f0f] border border-[#600a0f]/20 px-1.5 py-0.2 rounded-md">
                          Locked
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6B5A5D] truncate">{info.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(section.sectionKey)}
                    disabled={isAbout}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${section.isVisible
                      ? "border-[#E4DAD5] bg-[#fbfbfb] text-[#241618] hover:bg-[#600b0f0f] hover:text-[#600a0f]"
                      : "border-[#C1443A]/20 bg-[#C1443A]/10 text-[#C1443A]"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={section.isVisible ? "Hide section from profile" : "Show section on profile"}
                  >
                    {section.isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "up")}
                    disabled={isFirst}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4DAD5] bg-[#fbfbfb] text-[#6B5A5D] hover:text-[#241618] hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "down")}
                    disabled={isLast}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4DAD5] bg-[#fbfbfb] text-[#6B5A5D] hover:text-[#241618] hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
