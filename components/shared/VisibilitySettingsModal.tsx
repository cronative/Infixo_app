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
          const httpResponse = await fetch(`/api/creator/sections?email=${encodeURIComponent(email)}`);
          if (httpResponse.ok) {
            const apiResponse = await httpResponse.json();
            const sections = apiResponse.data?.sections || apiResponse.sections;
            if (apiResponse.status === 1 && Array.isArray(sections) && sections.length > 0) {
              setSections(sections);
              sectionsRepository.saveAll(sections);
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
      description="Choose which sections to show on your public creator page."
      icon={<Layers className="h-5 w-5" />}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <ModalBody className="p-4 sm:p-5 space-y-3 text-left max-h-[65vh] overflow-y-auto">
          {/* Header Action: Reset Default */}
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              SECTIONS ({sections.length})
            </span>
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#7A2253] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Default</span>
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
                const isAbout = section.sectionKey === "ABOUT";

                return (
                  <div
                    key={section.sectionKey}
                    className={`flex items-center justify-between p-3 rounded-[5px] border transition-all ${
                      section.isVisible
                        ? "bg-white border-[#e2e8f0] shadow-xs"
                        : "bg-[#f8fafc] border-[#e2e8f0]/80 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-xs font-bold text-[#7A2253]">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-[#0f172a] truncate flex items-center gap-1.5">
                          <span>{info.name}</span>
                          {isAbout && (
                            <span className="text-[10px] font-semibold text-[#7A2253] bg-[#FFF0F5] border border-[#FCE7F1] px-1.5 py-0.5 rounded-[5px]">
                              Locked
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[#64748b] truncate mt-0.5">{info.desc}</p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isAbout ? (
                        <div className="flex items-center gap-2">
                          <span className="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-slate-200 opacity-60">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow-xs translate-x-4 mt-0.5" />
                          </span>
                          <span className="text-xs font-medium text-[#64748b]">Always shown</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={section.isVisible}
                          onClick={() => handleToggleVisibility(section.sectionKey)}
                          className="flex items-center gap-2 cursor-pointer group focus:outline-none"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                              section.isVisible ? "bg-[#7A2253]" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                                section.isVisible ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                          <span
                            className={`text-xs font-semibold w-8 text-left ${
                              section.isVisible ? "text-[#7A2253]" : "text-[#64748b]"
                            }`}
                          >
                            {section.isVisible ? "Show" : "Hide"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ModalBody>

        <ModalFooter className="px-5 sm:px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs px-5 rounded-[5px] transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Layout</span>
            )}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
