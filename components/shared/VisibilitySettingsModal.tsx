"use client";

import { useState } from "react";
import {
  Settings,
  Users,
  Film,
  Briefcase,
  Star,
  Link as LinkIcon,
  Tag,
  Check,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { VisibilitySettings, DEFAULT_VISIBILITY_SETTINGS } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface VisibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisibilitySettings;
  onSave: (newSettings: VisibilitySettings) => Promise<void> | void;
}

export function VisibilitySettingsModal({
  isOpen,
  onClose,
  settings = DEFAULT_VISIBILITY_SETTINGS,
  onSave,
}: VisibilitySettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<VisibilitySettings>({
    showFanbase: settings.showFanbase ?? true,
    showInstagram: settings.showInstagram ?? true,
    showFacebook: settings.showFacebook ?? true,
    showYoutube: settings.showYoutube ?? true,
    showTwitter: settings.showTwitter ?? true,
    showLinkedin: settings.showLinkedin ?? true,
    showThreads: settings.showThreads ?? true,
    showSnapchat: settings.showSnapchat ?? true,
    showPinterest: settings.showPinterest ?? true,
    showTwitch: settings.showTwitch ?? true,
    showSpotify: settings.showSpotify ?? true,
    showContentCategory: settings.showContentCategory ?? true,
    showSeries: settings.showSeries ?? true,
    showCollabGigs: settings.showCollabGigs ?? true,
    showReviews: settings.showReviews ?? true,
    showCustomLinks: settings.showCustomLinks ?? true,
  });

  const [saving, setSaving] = useState(false);

  const toggleKey = (key: keyof VisibilitySettings) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const TOGGLE_ITEMS: {
    key: keyof VisibilitySettings;
    label: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      key: "showFanbase",
      label: "Show Total Fanbase Count",
      description: "Display total reach count on top banner",
      icon: Users,
      color: "text-[#803D63] bg-[#F7EDF3]",
    },
    {
      key: "showInstagram",
      label: "Show Instagram Account",
      description: "Display Instagram button & followers stats",
      icon: InstagramIcon,
      color: "text-rose-600 bg-rose-50",
    },
    {
      key: "showYoutube",
      label: "Show YouTube Channel",
      description: "Display YouTube button & subscribers stats",
      icon: YoutubeIcon,
      color: "text-red-600 bg-red-50",
    },
    {
      key: "showFacebook",
      label: "Show Facebook Page",
      description: "Display Facebook button & likes stats",
      icon: FacebookIcon,
      color: "text-blue-600 bg-blue-50",
    },
    {
      key: "showContentCategory",
      label: "Show Category & Profession",
      description: "Display niche badges below display name",
      icon: Tag,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "showSeries",
      label: "Show Web Series & Shows",
      description: "Display Content tab & episode listings",
      icon: Film,
      color: "text-[#803D63] bg-[#F7EDF3]",
    },
    {
      key: "showCollabGigs",
      label: "Show Services & Brand Work",
      description: "Display Services tab & collaboration packages",
      icon: Briefcase,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      key: "showReviews",
      label: "Show Client Reviews",
      description: "Display Reviews tab & client testimonials",
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "showCustomLinks",
      label: "Show Custom Links",
      description: "Display custom website & media links",
      icon: LinkIcon,
      color: "text-teal-600 bg-teal-50",
    },
  ];

  const allEnabled = TOGGLE_ITEMS.every((item) => localSettings[item.key] ?? true);

  const handleShowAll = () => {
    const newVal = !allEnabled;
    const updated = {} as VisibilitySettings;
    TOGGLE_ITEMS.forEach((item) => {
      (updated as any)[item.key] = newVal;
    });
    setLocalSettings((prev) => ({ ...prev, ...updated }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Display Settings"
      description="Toggle section visibility on your public creator profile"
      icon={<Settings className="h-4 w-4" />}
    >
      <ModalBody className="p-4 sm:p-5 space-y-3.5 divide-y divide-[#ECE8EB]">
        {/* Show All master toggle */}
        <div className="pb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl shrink-0 text-[#803D63] bg-[#F7EDF3]">
              <Check className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-[#17131A]">Show All Sections</p>
              <p className="text-[11px] font-medium text-[#6F6872] leading-tight">Enable all sections on your public profile</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allEnabled}
            onClick={handleShowAll}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              allEnabled ? "bg-[#803D63]" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                allEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {TOGGLE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isEnabled = localSettings[item.key] ?? true;

          return (
            <div
              key={item.key}
              className="pt-3.5 first:pt-0 flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 text-left">
                <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#17131A] truncate">
                    {item.label}
                  </p>
                  <p className="text-[11px] font-medium text-[#6F6872] leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => toggleKey(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? "bg-[#803D63]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </ModalBody>

      <ModalFooter className="px-5 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#ECE8EB] text-xs font-semibold text-[#6F6872] hover:bg-[#FAF8FA] hover:text-[#17131A] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
