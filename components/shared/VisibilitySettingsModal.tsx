"use client";

import { useState } from "react";
import {
  X,
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

  if (!isOpen) return null;

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
      color: "text-purple-600 bg-purple-100",
    },
    {
      key: "showInstagram",
      label: "Show Instagram Account",
      description: "Display Instagram button & followers stats",
      icon: InstagramIcon,
      color: "text-rose-600 bg-rose-100",
    },
    {
      key: "showYoutube",
      label: "Show YouTube Channel",
      description: "Display YouTube button & subscribers stats",
      icon: YoutubeIcon,
      color: "text-red-600 bg-red-100",
    },
    {
      key: "showFacebook",
      label: "Show Facebook Page",
      description: "Display Facebook button & likes stats",
      icon: FacebookIcon,
      color: "text-blue-600 bg-blue-100",
    },
    {
      key: "showContentCategory",
      label: "Show Category & Profession",
      description: "Display niche badges below display name",
      icon: Tag,
      color: "text-amber-600 bg-amber-100",
    },
    {
      key: "showSeries",
      label: "Show Web Series & Shows",
      description: "Display Series tab & episode listings",
      icon: Film,
      color: "text-[#803D63] bg-[#F6EBF1]",
    },
    {
      key: "showCollabGigs",
      label: "Show Collab Gigs & Rate Cards",
      description: "Display Gigs tab & brand collaboration packages",
      icon: Briefcase,
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      key: "showReviews",
      label: "Show Brand Reviews",
      description: "Display Reviews tab & client testimonials",
      icon: Star,
      color: "text-amber-600 bg-amber-100",
    },
    {
      key: "showCustomLinks",
      label: "Show Custom Bio Links",
      description: "Display custom website & media links",
      icon: LinkIcon,
      color: "text-teal-600 bg-teal-100",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F6EBF1] text-[#803D63]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Page Display Settings
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                Toggle section visibility on your public page
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toggle Items List */}
        <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100">

          {/* Show All master toggle */}
          <div className="pb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl shrink-0 mt-0.5 text-[#803D63] bg-[#F6EBF1]">
                <Check className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">Show All Sections</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">Enable all sections on your public profile at once</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShowAll}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allEnabled ? "bg-[#803D63]" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
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
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Custom iOS Style Switch Toggle */}
                <button
                  type="button"
                  onClick={() => toggleKey(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? "bg-[#803D63]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
