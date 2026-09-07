"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
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

interface LinkTypeOption {
  value: string;
  label: string;
  suggestedTitle: string;
  placeholderUrl: string;
}

const LINK_TYPE_GROUPS: Array<{
  group: string;
  options: LinkTypeOption[];
}> = [
  {
    group: "📱 Social Media",
    options: [
      { value: "instagram", label: "Instagram", suggestedTitle: "Follow on Instagram", placeholderUrl: "https://instagram.com/username" },
      { value: "youtube", label: "YouTube", suggestedTitle: "Subscribe on YouTube", placeholderUrl: "https://youtube.com/@channel" },
      { value: "facebook", label: "Facebook", suggestedTitle: "Follow on Facebook", placeholderUrl: "https://facebook.com/page" },
      { value: "x_twitter", label: "X / Twitter", suggestedTitle: "Follow on X", placeholderUrl: "https://x.com/username" },
      { value: "linkedin", label: "LinkedIn", suggestedTitle: "Connect on LinkedIn", placeholderUrl: "https://linkedin.com/in/username" },
      { value: "snapchat", label: "Snapchat", suggestedTitle: "Add on Snapchat", placeholderUrl: "https://snapchat.com/add/username" },
      { value: "tiktok", label: "TikTok", suggestedTitle: "Follow on TikTok", placeholderUrl: "https://tiktok.com/@username" },
      { value: "threads", label: "Threads", suggestedTitle: "Follow on Threads", placeholderUrl: "https://threads.net/@username" },
      { value: "pinterest", label: "Pinterest", suggestedTitle: "Follow on Pinterest", placeholderUrl: "https://pinterest.com/username" },
      { value: "twitch", label: "Twitch", suggestedTitle: "Watch on Twitch", placeholderUrl: "https://twitch.tv/username" },
      { value: "discord", label: "Discord", suggestedTitle: "Join Discord Server", placeholderUrl: "https://discord.gg/invite" },
      { value: "telegram", label: "Telegram", suggestedTitle: "Join Telegram Channel", placeholderUrl: "https://t.me/channel" },
      { value: "whatsapp", label: "WhatsApp", suggestedTitle: "Chat on WhatsApp", placeholderUrl: "https://wa.me/919876543210" },
    ],
  },
  {
    group: "🎵 Music & Audio",
    options: [
      { value: "spotify", label: "Spotify", suggestedTitle: "Listen on Spotify", placeholderUrl: "https://open.spotify.com/artist/..." },
      { value: "apple_music", label: "Apple Music", suggestedTitle: "Listen on Apple Music", placeholderUrl: "https://music.apple.com/..." },
      { value: "podcast", label: "Podcast", suggestedTitle: "Stream Latest Podcast", placeholderUrl: "https://podcasts.apple.com/..." },
    ],
  },
  {
    group: "🎬 Content & Media",
    options: [
      { value: "latest_video", label: "Latest Video", suggestedTitle: "Watch Latest Video", placeholderUrl: "https://youtube.com/watch?v=..." },
      { value: "latest_episode", label: "Latest Episode", suggestedTitle: "Watch Latest Episode", placeholderUrl: "https://inflixo.com/series/..." },
      { value: "media_kit", label: "Media Kit", suggestedTitle: "Media Kit & Rate Card", placeholderUrl: "https://inflixo.com/..." },
      { value: "blog", label: "Blog", suggestedTitle: "Read My Blog", placeholderUrl: "https://blog.yourwebsite.com" },
      { value: "newsletter", label: "Newsletter", suggestedTitle: "Subscribe to Newsletter", placeholderUrl: "https://newsletter.com" },
    ],
  },
  {
    group: "💼 Business & Personal",
    options: [
      { value: "website", label: "Website", suggestedTitle: "Official Website", placeholderUrl: "https://yourwebsite.com" },
      { value: "portfolio", label: "Portfolio", suggestedTitle: "Work Portfolio", placeholderUrl: "https://yourportfolio.com" },
      { value: "online_store", label: "Online Store", suggestedTitle: "Store & Merch Shop", placeholderUrl: "https://yourstore.com" },
      { value: "booking_page", label: "Booking Page", suggestedTitle: "Book 1-on-1 Consultation", placeholderUrl: "https://cal.com/username" },
      { value: "personal", label: "Personal", suggestedTitle: "About Me", placeholderUrl: "https://yourwebsite.com/about" },
      { value: "other", label: "Other", suggestedTitle: "Custom Link", placeholderUrl: "https://..." },
    ],
  },
];

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
  const [selectedType, setSelectedType] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState<boolean>(false);
  const [lastSuggestedTitle, setLastSuggestedTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<CustomLink | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

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

  function handleOpenCreate(btnElement?: HTMLButtonElement | null) {
    if (btnElement) triggerButtonRef.current = btnElement;
    if (isLimitReached) {
      showToast(
        `Early Access plan is limited to ${MAX_FREE_LINKS} custom links. Upgrade to VIP Plan for unlimited links! ⭐`,
        "info"
      );
      return;
    }
    setEditingLink(null);
    setSelectedType("");
    setFormTitle("");
    setFormUrl("");
    setIsTitleManuallyEdited(false);
    setLastSuggestedTitle("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(link: CustomLink) {
    setEditingLink(link);
    setSelectedType("");
    setFormTitle(link.title);
    setFormUrl(link.url);
    setIsTitleManuallyEdited(true);
    setLastSuggestedTitle("");
    setIsModalOpen(true);
  }

  function handleTypeSelect(typeVal: string) {
    setSelectedType(typeVal);
    if (!typeVal) return;

    const allOptions = LINK_TYPE_GROUPS.flatMap((g) => g.options);
    const foundOpt = allOptions.find((o) => o.value === typeVal);
    if (!foundOpt) return;

    if (!isTitleManuallyEdited || formTitle.trim() === "" || formTitle === lastSuggestedTitle) {
      setFormTitle(foundOpt.suggestedTitle);
      setLastSuggestedTitle(foundOpt.suggestedTitle);
    }
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
          <h2 className="font-display text-base font-bold text-[#181716]">
            Custom links
          </h2>
          <p className="text-xs text-[#797570] font-medium mt-0.5">
            Add the destinations you want followers and brands to find.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[#797570]">
            Early Access • {links.length} of {MAX_FREE_LINKS} links
          </span>

          <button
            type="button"
            onClick={(e) => handleOpenCreate(e.currentTarget)}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
              isLimitReached
                ? "bg-[#F8F7F3] border border-[#E7E3DC] text-[#797570] opacity-60 cursor-not-allowed"
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
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 text-center space-y-2 shadow-xs">
          <p className="text-xs font-bold text-[#181716]">Add your first custom link</p>
          <p className="text-xs text-[#797570] max-w-sm mx-auto">
            Help people reach your latest content, website, booking page, store or community.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={(e) => handleOpenCreate(e.currentTarget)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] overflow-hidden shadow-xs">
          {links.map((item, idx) => {
            const domain = extractDomain(item.url);
            return (
              <div
                key={item.id || idx}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-[#F8F7F3] transition-colors text-left"
              >
                {/* Left: Index badge & Title/Domain */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F8F7F3] border border-[#E7E3DC] text-[10px] font-bold text-[#797570] shrink-0">
                    0{idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#181716]">{item.title}</p>
                    <p className="truncate text-[11px] font-medium text-[#797570] mt-0.5">{domain}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-2.5 py-1 text-xs font-semibold text-[#181716] transition-colors"
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === item.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenEdit(item);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                          <span>Edit Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(item.url)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#797570]" />
                          <span>Copy Link</span>
                        </button>

                        <div className="my-1 border-t border-[#E7E3DC]" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setLinkToDelete(item);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
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
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false);
            triggerButtonRef.current?.focus();
          }
        }}
        size="md"
        title={editingLink ? "Edit Custom Link" : "Add Custom Link"}
        description="Add a useful destination to your public creator profile."
        icon={<LinkIcon className="h-4 w-4" />}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-5 space-y-4 text-left">
            <form id="custom-link-form" onSubmit={handleSaveModalLink} className="space-y-4">
              {/* Link Type Selector */}
              <div className="space-y-1">
                <label htmlFor="custom-link-type" className="block text-xs font-bold text-[#181716]">
                  Link type
                </label>
                <div className="relative">
                  <select
                    id="custom-link-type"
                    value={selectedType}
                    onChange={(e) => handleTypeSelect(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 pr-9 text-xs font-semibold text-[#181716] focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">— Select a link type (auto-fills title) —</option>
                    {LINK_TYPE_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.suggestedTitle})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#797570]" />
                </div>
              </div>

              {/* Link Title Field */}
              <div className="space-y-1">
                <label htmlFor="custom-link-title" className="block text-xs font-bold text-[#181716]">
                  Link title <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  id="custom-link-title"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    setIsTitleManuallyEdited(true);
                  }}
                  placeholder="e.g. Follow on Instagram or Watch Latest Video"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Destination URL Field */}
              <div className="space-y-1">
                <label htmlFor="custom-link-url" className="block text-xs font-bold text-[#181716]">
                  Destination URL <span className="text-[#C2414B]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="custom-link-url"
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com/your-destination"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] pl-3.5 pr-9 py-2.5 text-xs font-mono font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                  />
                  {formUrl && (formUrl.startsWith("http://") || formUrl.startsWith("https://")) && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Test link destination in new tab"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797570] hover:text-[#803D63] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </form>
          </ModalBody>

          {/* Modal Actions Footer */}
          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => {
                if (!isSaving) {
                  setIsModalOpen(false);
                  triggerButtonRef.current?.focus();
                }
              }}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="custom-link-form"
              disabled={isSaving}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving..." : editingLink ? "Save Changes" : "Save Link"}</span>
            </button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
