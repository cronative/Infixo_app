"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Link as LinkIcon,
  ExternalLink,
  X,
  Check,
  ChevronDown,
  MoreVertical,
  Copy,
  Pencil,
} from "lucide-react";
import { CustomLink } from "@/types";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface CustomLinksManagerProps {
  onChange?: (links: CustomLink[]) => void;
}

const MAX_FREE_LINKS = 3;

function extractDomain(url: string): string {
  try {
    const full = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const parsed = new URL(full);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url || "example.com";
  }
}

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
  const [linkToDelete, setLinkToDelete] = useState<CustomLink | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  // Click outside to close 3-dot menus
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  function handleOpenCreate() {
    if (isLimitReached) {
      showToast(
        `Early Access plan is limited to ${MAX_FREE_LINKS} custom links. Upgrade to VIP Plan for unlimited links! ⭐`,
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
    showToast("Custom link removed! 🗑️");
    setLinkToDelete(null);
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

  async function handleCopy(url: string) {
    setActiveMenuId(null);
    const success = await copyToClipboard(url);
    if (success) {
      showToast("Link URL copied! ✨");
    }
  }

  return (
    <div className="space-y-3 text-left">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
        <div>
          <h2 className="font-display text-base font-bold text-[#17131A]">
            Custom links
          </h2>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            Add the destinations you want followers and brands to find.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[#6F6872]">
            Early Access • {links.length} of {MAX_FREE_LINKS} links
          </span>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
              isLimitReached
                ? "bg-[#FAF8FA] border border-[#ECE8EB] text-[#6F6872] opacity-60 cursor-not-allowed"
                : "bg-[#803D63] hover:bg-[#6F3456] text-white"
            }`}
            title={isLimitReached ? "Early Access plan limit reached (3 links max)" : "Add new custom link"}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      {/* Links List / Empty State */}
      {links.length === 0 ? (
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-6 text-center space-y-2 shadow-2xs">
          <p className="text-xs font-bold text-[#17131A]">Add your first custom link</p>
          <p className="text-xs text-[#6F6872] max-w-sm mx-auto">
            Help people reach your latest content, website, booking page, store or community.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#ECE8EB] bg-white divide-y divide-[#ECE8EB] overflow-hidden shadow-2xs">
          {links.map((item, idx) => {
            const domain = extractDomain(item.url);
            return (
              <div
                key={item.id || idx}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAFAFB] transition-colors text-left"
              >
                {/* Left: Index badge & Title/Domain */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FAF8FA] border border-[#ECE8EB] text-[10px] font-bold text-[#6F6872] shrink-0">
                    0{idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#17131A]">{item.title}</p>
                    <p className="truncate text-[11px] font-medium text-[#6F6872] mt-0.5">{domain}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-2.5 py-1 text-xs font-semibold text-[#17131A] transition-colors"
                      title="Open link in new tab"
                    >
                      <span className="hidden sm:inline">Open</span>
                      <ExternalLink className="h-3 w-3 text-[#803D63]" />
                    </a>
                  )}

                  {/* Three-dot menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === item.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#ECE8EB] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenEdit(item);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17131A] hover:bg-[#FAF8FA] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#6F6872]" />
                          <span>Edit Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(item.url)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17131A] hover:bg-[#FAF8FA] transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#6F6872]" />
                          <span>Copy Link</span>
                        </button>

                        <div className="my-1 border-t border-[#ECE8EB]" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setLinkToDelete(item);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Link</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(linkToDelete)}
        onClose={() => setLinkToDelete(null)}
        onConfirm={() => linkToDelete && handleDeleteLink(linkToDelete.id)}
        title="Delete this link?"
        description={`"${linkToDelete?.title}" will be removed from your public creator profile.`}
        confirmText="Delete Link"
        cancelText="Cancel"
      />

      {/* MODAL FOR ADDING / EDITING CUSTOM LINK */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title={editingLink ? "Edit Custom Link" : "Add Custom Link"}
        description="Add link title and destination URL to display on your public profile"
        icon={<LinkIcon className="h-4 w-4" />}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-5 space-y-4 text-left">
            {/* Link Type Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#17131A]">
                Link type template
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 pr-9 text-xs font-semibold text-[#17131A] focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors cursor-pointer"
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
                  </optgroup>

                  <optgroup label="✨ Other">
                    <option value="✨ Custom Link|||https://">✨ Custom / Other</option>
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872]" />
              </div>
            </div>

            {/* Form Inputs */}
            <form id="custom-link-form" onSubmit={handleSaveModalLink} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#17131A]">
                  Link title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Watch Latest Episode"
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#17131A]">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="e.g. https://cal.com/yourname"
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-3.5 pr-9 py-2.5 text-xs font-mono font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                  />
                  {formUrl && (formUrl.startsWith("http") || formUrl.startsWith("https")) && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6872] hover:text-[#803D63]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </form>
          </ModalBody>

          {/* Action Buttons */}
          <ModalFooter className="px-5 py-3.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#ECE8EB] text-xs font-semibold text-[#6F6872] hover:bg-[#FAF8FA] hover:text-[#17131A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="custom-link-form"
              disabled={isSaving}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{editingLink ? "Save Changes" : "Save Link"}</span>
            </button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
