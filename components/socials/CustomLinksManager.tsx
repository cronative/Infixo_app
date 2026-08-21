"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Sparkles, Check } from "lucide-react";
import { CustomLink, DEFAULT_CUSTOM_LINKS } from "@/types";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";

interface CustomLinksManagerProps {
  onChange?: (links: CustomLink[]) => void;
}

export function CustomLinksManager({ onChange }: CustomLinksManagerProps) {
  const { showToast } = useToast();
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const localLinks = customLinksRepository.get();
    setLinks(localLinks && localLinks.length > 0 ? localLinks : DEFAULT_CUSTOM_LINKS);

    // Fetch from backend API if email available
    const authSession = authRepository.get();
    if (authSession?.email) {
      fetch(`/api/creator/custom-links?email=${encodeURIComponent(authSession.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.links) && data.links.length > 0) {
            setLinks(data.links);
            customLinksRepository.save(data.links);
            if (onChange) onChange(data.links);
          }
        })
        .catch(() => {});
    }
  }, []);

  function handleUpdateLink(id: string, field: "title" | "url", value: string) {
    const updated = links.map((link) => (link.id === id ? { ...link, [field]: value } : link));
    setLinks(updated);
    customLinksRepository.save(updated);
    if (onChange) onChange(updated);
    syncToBackend(updated);
  }

  function handleAddLink() {
    const newLink: CustomLink = {
      id: `link_${Date.now()}`,
      title: "🔗 New Featured Link",
      url: "https://",
      isEnabled: true,
    };
    const updated = [...links, newLink];
    setLinks(updated);
    customLinksRepository.save(updated);
    if (onChange) onChange(updated);
    syncToBackend(updated);
    showToast("Added new custom link! 🔗");
  }

  function handleDeleteLink(id: string) {
    const updated = links.filter((link) => link.id !== id);
    setLinks(updated);
    customLinksRepository.save(updated);
    if (onChange) onChange(updated);
    syncToBackend(updated);
    showToast("Custom link removed");
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
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-[#803D63]" />
            Additional Custom Links (Linktree Style)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Add custom links for latest episodes, booking pages, merch store, or personal website.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddLink}
          className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Link</span>
        </button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-semibold">
          No custom links added yet. Click &quot;Add Link&quot; above to create your first link.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((item, idx) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:border-[#803D63]/30 hover:bg-white space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-[#803D63] tracking-wider bg-[#803D63]/10 px-2 py-0.5 rounded-md">
                  Link #{idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteLink(item.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Remove Link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Title Input */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Link Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateLink(item.id, "title", e.target.value)}
                    placeholder="e.g. 🎬 Watch Latest Episode"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
                  />
                </div>

                {/* URL Input */}
                <div className="sm:col-span-7 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Destination URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdateLink(item.id, "url", e.target.value)}
                      placeholder="https://cal.com/yourname"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
                    />
                    {item.url && item.url.startsWith("http") && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#803D63]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
