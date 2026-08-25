"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Link as LinkIcon, ExternalLink, X, Check, ChevronDown } from "lucide-react";
import { CustomLink } from "@/types";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";

interface CustomLinksManagerProps {
  onChange?: (links: CustomLink[]) => void;
}

const MAX_FREE_LINKS = 3;

export function CustomLinksManager({ onChange }: CustomLinksManagerProps) {
  const { showToast } = useToast();
  const creatorCtx = useCreator();
  const subscription = creatorCtx?.subscription;
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const planKey = (subscription?.planKey || "").toLowerCase();
  const isVip = planKey.includes("vip") || planKey.includes("pro");
  const isLimitReached = !isVip && links.length >= MAX_FREE_LINKS;

  useEffect(() => {
    const localLinks = customLinksRepository.get();
    setLinks(Array.isArray(localLinks) ? localLinks : []);

    // Fetch from MySQL DB table creator_custom_links if email available
    const authSession = authRepository.get();
    if (authSession?.email) {
      fetch(`/api/creator/custom-links?email=${encodeURIComponent(authSession.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.links)) {
            setLinks(data.links);
            customLinksRepository.save(data.links);
            if (onChange) onChange(data.links);
          }
        })
        .catch(() => {});
    }
  }, []);

  function handleOpenCreate() {
    if (isLimitReached) {
      showToast(
        `Free / Early Access plan is limited to ${MAX_FREE_LINKS} custom links. Upgrade to VIP Plan for unlimited links! ⭐`,
        "info"
      );
      return;
    }
    setEditingLink(null);
    setFormTitle("");
    setFormUrl("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(link: CustomLink) {
    setEditingLink(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setIsModalOpen(true);
  }

  async function handleSaveModalLink(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const cleanTitle = formTitle.trim();
    let cleanUrl = formUrl.trim();

    if (!cleanTitle) {
      showToast("Please enter a link title", "error");
      return;
    }
    if (!cleanUrl) {
      showToast("Please enter a destination URL", "error");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let updatedList: CustomLink[] = [];
    if (editingLink) {
      updatedList = links.map((l) => (l.id === editingLink.id ? { ...l, title: cleanTitle, url: cleanUrl } : l));
    } else {
      const newLink: CustomLink = {
        id: `link_${Date.now()}`,
        title: cleanTitle,
        url: cleanUrl,
        isEnabled: true,
      };
      updatedList = [...links, newLink];
    }

    setLinks(updatedList);
    customLinksRepository.save(updatedList);
    if (onChange) onChange(updatedList);

    setIsModalOpen(false);
    showToast(editingLink ? "Updated custom link! ✨" : "Added custom link & saved to DB! 🔗");

    await syncToBackend(updatedList);
  }

  function handleDeleteLink(id: string) {
    const updatedList = links.filter((l) => l.id !== id);
    setLinks(updatedList);
    customLinksRepository.save(updatedList);
    if (onChange) onChange(updatedList);
    showToast("Custom link removed");
    syncToBackend(updatedList);
  }

  async function syncToBackend(updatedLinks: CustomLink[]) {
    const authSession = authRepository.get();
    if (!authSession?.email) return;

    try {
      setIsSaving(true);
      await fetch("/api/creator/custom-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authSession.email,
          links: updatedLinks,
        }),
      });
    } catch (e) {
      console.warn("Backend custom links sync error:", e);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-rose-100 bg-white p-5 sm:p-6 shadow-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-[#803D63]" />
              Additional Custom Links
            </h3>
            {!isVip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                ⚡ Free / Early Access ({links.length}/{MAX_FREE_LINKS} Links)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#803D63]">
                ⭐ VIP Plan (Unlimited Links)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Add custom links for latest episodes, booking pages, merch store, or personal website.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className={`tap-scale inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
            isLimitReached
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-[#803D63] hover:bg-[#6D3254] text-white cursor-pointer shadow-2xs"
          }`}
          title={isLimitReached ? "Free / Early Access plan limit reached (3 links max)" : "Add new custom link"}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Link</span>
        </button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63]/10 text-[#803D63]">
            <LinkIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-bold text-slate-900">No custom links added yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Click &quot;Add Link&quot; to add custom links for latest episodes, booking pages, merch store, or personal website.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#803D63]/30 bg-[#803D63]/10 hover:bg-[#803D63]/20 px-4 py-2 text-xs font-bold text-[#803D63] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add First Custom Link</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {links.map((item, idx) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:border-[#803D63]/30 hover:bg-white flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#803D63]/10 text-[#803D63]">
                  <LinkIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 text-left space-y-0.5">
                  <p className="truncate text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-black uppercase text-[#803D63] tracking-wider bg-[#803D63]/10 px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  </p>
                  <p className="truncate text-[11px] font-mono text-slate-500 max-w-md">
                    {item.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#803D63] hover:bg-rose-50 transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#803D63] hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Edit Link"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLink(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL FOR ADDING / EDITING CUSTOM LINK (Similar to Create Gig Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left animate-in zoom-in-95">
            
            {/* Header & Close Button */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/10 text-[#803D63]">
                  <LinkIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900">
                    {editingLink ? "Edit Custom Link" : "Add Custom Link"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Add link title and destination URL to display on your public profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Link Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Link Type
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-900 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20 cursor-pointer"
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [title] = val.split("|||");
                    setFormTitle(title);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>— Select a type to auto-fill title —</option>

                  <optgroup label="🔗 Content & General">
                    <option value="🎬 Watch Latest Episode|||https://">🎬 Watch Latest Episode</option>
                    <option value="🎙️ Stream Latest Podcast|||https://open.spotify.com/">🎙️ Stream Latest Podcast</option>
                    <option value="📁 Press Kit & Media Assets|||https://drive.google.com/">📁 Press Kit & Media Assets</option>
                    <option value="🌐 Official Website|||https://">🌐 Official Website</option>
                    <option value="👤 Personal Portfolio & Bio|||https://">👤 Personal Portfolio & Bio</option>
                    <option value="🛍️ Store & Merch Shop|||https://">🛍️ Store & Merch Shop</option>
                    <option value="📅 Book 1-on-1 Consultation|||https://calendly.com/">📅 Book 1-on-1 Consultation</option>
                    <option value="📍 Store / Location (Google Maps)|||https://maps.google.com/?q=">📍 Store / Location (Google Maps)</option>
                    <option value="💬 Direct WhatsApp Chat|||https://wa.me/91">💬 Direct WhatsApp Chat</option>
                  </optgroup>

                  <optgroup label="📱 Social Profiles">
                    <option value="📸 Follow on Instagram|||https://instagram.com/">📸 Follow on Instagram</option>
                    <option value="▶️ Subscribe on YouTube|||https://youtube.com/@">▶️ Subscribe on YouTube</option>
                    <option value="🐦 Follow on X (Twitter)|||https://x.com/">🐦 Follow on X (Twitter)</option>
                    <option value="💼 Connect on LinkedIn|||https://linkedin.com/in/">💼 Connect on LinkedIn</option>
                    <option value="🧵 Follow on Threads|||https://threads.net/@">🧵 Follow on Threads</option>
                    <option value="👻 Add Me on Snapchat|||https://snapchat.com/add/">👻 Add Me on Snapchat</option>
                    <option value="📌 Follow on Pinterest|||https://pinterest.com/">📌 Follow on Pinterest</option>
                    <option value="🎮 Watch on Twitch|||https://twitch.tv/">🎮 Watch on Twitch</option>
                    <option value="🎵 Follow on Spotify|||https://open.spotify.com/artist/">🎵 Follow on Spotify</option>
                    <option value="🎬 Follow on TikTok|||https://tiktok.com/@">🎬 Follow on TikTok</option>
                    <option value="✈️ Join Telegram Channel|||https://t.me/">✈️ Join Telegram Channel</option>
                    <option value="👻 Add on Snapchat|||https://snapchat.com/add/">👻 Add on Snapchat</option>
                  </optgroup>

                  <optgroup label="✨ Other">
                    <option value="✨ Custom Link|||https://">✨ Custom / Other</option>
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSaveModalLink} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Link Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 🎬 Watch Latest Episode"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="e.g. https://cal.com/yourname"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 py-2.5 text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
                  />
                  {formUrl && (formUrl.startsWith("http") || formUrl.startsWith("https")) && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#803D63]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingLink ? "Save Changes" : "Save Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
