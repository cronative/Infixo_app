"use client";

import { useState } from "react";
import { AtSign, Plus, Check, Trash2, Globe, Users, ChevronDown, ChevronUp } from "lucide-react";
import {
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
  PinterestIcon,
  TwitchIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { SocialAccounts, GenericSocialStats } from "@/types";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { SocialService } from "@/services/SocialService";

const OTHER_PLATFORMS = [
  {
    key: "twitter" as keyof SocialAccounts,
    name: "X (Twitter)",
    prefix: "x.com/",
    urlBase: "https://x.com/",
    icon: <XTwitterIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-slate-900",
  },
  {
    key: "linkedin" as keyof SocialAccounts,
    name: "LinkedIn",
    prefix: "linkedin.com/in/",
    urlBase: "https://linkedin.com/in/",
    icon: <LinkedinIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-sky-700",
  },
  {
    key: "threads" as keyof SocialAccounts,
    name: "Threads",
    prefix: "threads.net/@",
    urlBase: "https://threads.net/@",
    icon: <ThreadsIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-slate-900",
  },
  {
    key: "snapchat" as keyof SocialAccounts,
    name: "Snapchat",
    prefix: "snapchat.com/add/",
    urlBase: "https://snapchat.com/add/",
    icon: <SnapchatIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-yellow-500 text-slate-900",
  },
  {
    key: "pinterest" as keyof SocialAccounts,
    name: "Pinterest",
    prefix: "pinterest.com/",
    urlBase: "https://pinterest.com/",
    icon: <PinterestIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-red-700",
  },
  {
    key: "twitch" as keyof SocialAccounts,
    name: "Twitch",
    prefix: "twitch.tv/",
    urlBase: "https://twitch.tv/",
    icon: <TwitchIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-purple-700",
  },
  {
    key: "spotify" as keyof SocialAccounts,
    name: "Spotify",
    prefix: "open.spotify.com/artist/",
    urlBase: "https://open.spotify.com/artist/",
    icon: <SpotifyIcon className="h-4 w-4 text-white" />,
    badgeBg: "bg-emerald-600",
  },
];

export function OtherPlatformsManager() {
  const { socials, updateSocials } = useCreator();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const [countInput, setCountInput] = useState("");

  // Count how many are connected
  const connectedCount = OTHER_PLATFORMS.filter((plat) => {
    const obj = socials[plat.key] as GenericSocialStats | undefined;
    return Boolean(obj && (obj.username || obj.url));
  }).length;

  const handleSavePlatform = (plat: typeof OTHER_PLATFORMS[0]) => {
    const cleanHandle = handleInput.trim().replace(/^@/, "");
    if (!cleanHandle) {
      showToast(`Please enter your ${plat.name} username / handle`, "error");
      return;
    }

    const followers = parseInt(countInput.replace(/,/g, ""), 10) || 0;
    const stats: GenericSocialStats = {
      url: `${plat.urlBase}${cleanHandle}`,
      username: cleanHandle,
      name: cleanHandle,
      followers,
      enabled: true,
      lastSyncedAt: new Date().toISOString(),
    };

    const updated = {
      ...socials,
      [plat.key]: stats,
    };

    updateSocials(updated);
    SocialService.saveAccounts(updated);

    setActivePlatform(null);
    setHandleInput("");
    setCountInput("");
    showToast(`Connected ${plat.name} profile! ✨`, "success");
  };

  const handleRemovePlatform = (platKey: keyof SocialAccounts, platName: string) => {
    const updated = {
      ...socials,
      [platKey]: { url: "", followers: 0, username: "" },
    };
    updateSocials(updated);
    SocialService.saveAccounts(updated);
    showToast(`Removed ${platName} profile 🗑️`, "info");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm text-left overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/10 text-[#803D63]">
            <Globe className="h-4 w-4" />
          </span>
          <div className="text-left">
            <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
              More Social Platforms
              {connectedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  ✓ {connectedCount} connected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Connect your X (Twitter), LinkedIn, Threads, Snapchat, Pinterest, Twitch &amp; Spotify accounts
            </p>
          </div>
        </div>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ml-3">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {OTHER_PLATFORMS.map((plat) => {
              const connectedObj = socials[plat.key] as GenericSocialStats | undefined;
              const isConnected = Boolean(connectedObj && (connectedObj.username || connectedObj.url));
              const isEditingThis = activePlatform === plat.key;

              return (
                <div
                  key={plat.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 transition-all hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${plat.badgeBg} shadow-2xs`}>
                        {plat.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{plat.name}</h4>
                        <p className="text-[11px] font-medium text-slate-500">
                          {isConnected ? `@${connectedObj?.username}` : "Not connected"}
                        </p>
                      </div>
                    </div>

                    {isConnected && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlatform(plat.key, plat.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Remove ${plat.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {isConnected && !isEditingThis ? (
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 text-xs">
                      <span className="font-medium text-slate-500">Reach:</span>
                      <span className="font-black text-slate-900">
                        {connectedObj?.followers ? connectedObj.followers.toLocaleString() : "Active"}
                      </span>
                    </div>
                  ) : isEditingThis ? (
                    <div className="space-y-2 pt-1 border-t border-slate-200/80">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Username / Handle</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-[11px] font-bold text-slate-400">@</span>
                          <input
                            type="text"
                            value={handleInput}
                            onChange={(e) => setHandleInput(e.target.value)}
                            placeholder="username"
                            className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Followers / Count (Optional)</label>
                        <input
                          type="number"
                          value={countInput}
                          onChange={(e) => setCountInput(e.target.value)}
                          placeholder="e.g. 25000"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActivePlatform(null)}
                          className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePlatform(plat)}
                          className="px-3.5 py-1 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-extrabold transition-colors cursor-pointer"
                        >
                          Save Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePlatform(plat.key);
                        setHandleInput(connectedObj?.username || "");
                        setCountInput(connectedObj?.followers ? String(connectedObj.followers) : "");
                      }}
                      className="w-full py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-[#803D63] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Connect {plat.name}</span>
                    </button>
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

