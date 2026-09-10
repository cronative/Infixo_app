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
  Settings,
} from "lucide-react";
import {
  CreatorProfileSection,
  DEFAULT_PROFILE_SECTIONS,
  ProfileSectionKey,
  VisibilitySettings,
  DEFAULT_VISIBILITY_SETTINGS,
} from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { authRepository, sectionsRepository, profileRepository } from "@/repositories/localRepository";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

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

interface VisibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: VisibilitySettings;
  onSave?: (newSettings: VisibilitySettings) => Promise<void> | void;
}

export function VisibilitySettingsModal({
  isOpen,
  onClose,
  settings = DEFAULT_VISIBILITY_SETTINGS,
  onSave,
}: VisibilitySettingsModalProps) {
  const { showToast } = useToast();

  const [sections, setSections] = useState<CreatorProfileSection[]>(DEFAULT_PROFILE_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const email = authRepository.getPendingEmail() || profileRepository.get()?.email || "";

  useEffect(() => {
    async function loadSections() {
      if (!isOpen) return;
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
        console.error("Failed to load sections in modal:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSections();
  }, [isOpen, email]);

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    const reordered = updated.map((sec, idx) => ({ ...sec, sortOrder: idx }));
    setSections(reordered);
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
  };

  const handleResetDefault = () => {
    setSections(DEFAULT_PROFILE_SECTIONS);
    showToast("Reset to default order & layout ✨");
  };

  const handleSave = async () => {
    setSaving(true);
    sectionsRepository.saveAll(sections);
    try {
      if (email) {
        await fetch("/api/creator/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, sections }),
        });
      }

      // Sync boolean visibility map
      const secMap = sections.reduce((acc, s) => {
        if (s.sectionKey === "TOTAL_FANBASE") acc.showFanbase = s.isVisible;
        if (s.sectionKey === "SERIES") acc.showSeries = s.isVisible;
        if (s.sectionKey === "SERVICES") acc.showCollabGigs = s.isVisible;
        if (s.sectionKey === "REVIEWS") acc.showReviews = s.isVisible;
        if (s.sectionKey === "LINKS") acc.showCustomLinks = s.isVisible;
        return acc;
      }, { ...settings });

      if (onSave) {
        await onSave(secMap);
      }

      showToast("Profile sections & layout updated! ✨");
      onClose();
    } catch (err) {
      console.error("Failed to save sections in modal:", err);
      showToast("Failed to save sections", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Profile Sections & Layout"
      description="Customize the order and visibility of sections on your public creator page."
      icon={<Layers className="h-4 w-4" />}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <ModalBody className="p-4 sm:p-5 space-y-3 text-left max-h-[60vh] overflow-y-auto">
          {/* Header Action: Reset Default */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E4DAD5]">
            <span className="text-[11px] font-bold text-[#6B5A5D] uppercase tracking-wider">
              Sections ({sections.length})
            </span>
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B5A5D] hover:text-[#3a2447] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Default</span>
            </button>
          </div>

          {/* Section Items List */}
          <div className="space-y-2">
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
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${section.isVisible
                      ? "bg-white border-[#E4DAD5] shadow-xs"
                      : "bg-[#fbfbfb] border-[#E4DAD5]/60 opacity-60"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#fbfbfb] border border-[#E4DAD5] text-[10px] font-bold text-[#6B5A5D]">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold text-[#241618] truncate flex items-center gap-1.5">
                          {info.name}
                          {isAbout && (
                            <span className="text-[9px] font-semibold text-[#3a2447] bg-[#3a244714] border border-[#3a2447]/20 px-1.5 py-0.2 rounded">
                              Locked
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#6B5A5D] truncate">{info.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(section.sectionKey)}
                        disabled={isAbout}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${section.isVisible
                          ? "border-[#E4DAD5] bg-[#fbfbfb] text-[#241618] hover:bg-[#3a244714] hover:text-[#3a2447]"
                          : "border-[#C1443A]/20 bg-[#C1443A]/10 text-[#C1443A]"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={section.isVisible ? "Hide section" : "Show section"}
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
        </ModalBody>

        <ModalFooter className="px-4 sm:px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-[#E4DAD5] text-xs font-semibold text-[#6B5A5D] hover:bg-[#FAF8F5] hover:text-[#241618] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="tap-scale bg-[#3a2447] hover:bg-[#2c1937] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save Layout</span>
              </>
            )}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
