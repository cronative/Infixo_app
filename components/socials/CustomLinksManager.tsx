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
  GripVertical,
  FolderOpen,
  X,
} from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
  SpotifyIcon,
  TwitchIcon,
} from "@/components/shared/BrandIcons";

interface CustomLinksManagerProps {
  onChange?: (links: CustomLink[]) => void;
}

function getInitials(name: string): string {
  if (!name) return "LK";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getLinkPlatform(link: CustomLink): {
  icon: React.ReactNode;
  bgClass: string;
} {
  const url = (link.url || "").toLowerCase();
  const title = (link.title || "").toLowerCase();

  if (url.includes("instagram.com") || title.includes("instagram")) {
    return {
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs",
    };
  }
  if (url.includes("youtube.com") || url.includes("youtu.be") || title.includes("youtube")) {
    return {
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-red-600 shadow-xs",
    };
  }
  if (url.includes("facebook.com") || url.includes("fb.com") || title.includes("facebook")) {
    return {
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-blue-600 shadow-xs",
    };
  }
  if (url.includes("twitter.com") || url.includes("x.com") || title.includes("twitter") || title.includes(" x ")) {
    return {
      icon: <XTwitterIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-black shadow-xs",
    };
  }
  if (url.includes("linkedin.com") || title.includes("linkedin")) {
    return {
      icon: <LinkedinIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-[#0A66C2] shadow-xs",
    };
  }
  if (url.includes("threads.net") || title.includes("threads")) {
    return {
      icon: <ThreadsIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-black shadow-xs",
    };
  }
  if (url.includes("snapchat.com") || title.includes("snapchat")) {
    return {
      icon: <SnapchatIcon className="h-4 w-4 text-black" />,
      bgClass: "bg-[#FFFC00] shadow-xs",
    };
  }
  if (url.includes("spotify.com") || title.includes("spotify")) {
    return {
      icon: <SpotifyIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-[#1DB954] shadow-xs",
    };
  }
  if (url.includes("twitch.tv") || title.includes("twitch")) {
    return {
      icon: <TwitchIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-[#9146FF] shadow-xs",
    };
  }

  // Fallback to title initials with pink/maroon squircle badge
  return {
    icon: (
      <span className="text-[11px] font-bold tracking-tight text-[#043084]">
        {getInitials(link.title)}
      </span>
    ),
    bgClass: "bg-[#04308414] border border-[#e2e8f0]",
  };
}

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

function createClientId(prefix: string) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
}

function createEmptyCollectionItem(): CustomLinkItem {
  return { id: createClientId("item"), title: "", url: "", isEnabled: true };
}

export function CustomLinksManager({ onChange }: CustomLinksManagerProps) {
  const { showToast } = useToast();
  const creatorCtx = useCreator();
  const subscription = creatorCtx?.subscription;
  const onChangeRef = useRef(onChange);
  const [links, setLinks] = useState<CustomLink[]>(() => {
    const localLinks = customLinksRepository.get();
    return Array.isArray(localLinks) ? localLinks : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [formMode, setFormMode] = useState<"link" | "collection">("link");
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [collectionItems, setCollectionItems] = useState<CustomLinkItem[]>([]);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState<boolean>(false);
  const [lastSuggestedTitle, setLastSuggestedTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<CustomLink | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const quota = getPlanQuota(subscription?.planKey || "early_access");
  const maxLinks = quota.maxCustomLinks;
  const isLimitReached = maxLinks !== Infinity && links.length >= maxLinks;

  const email = creatorCtx?.profile?.email || authRepository.getPendingEmail() || authRepository.get()?.email;
  const username = creatorCtx?.profile?.username;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Fetch from MySQL DB table creator_custom_links if email or username available
    if (email || username) {
      const query = email
        ? `email=${encodeURIComponent(email)}`
        : `username=${encodeURIComponent(username || "")}`;
      fetch(`/api/creator/custom-links?${query}`)
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const links = apiResponse.data?.links || apiResponse.links;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(links)) {
            setLinks(links);
            customLinksRepository.save(links);
            onChangeRef.current?.(links);
          }
        })
        .catch(() => { });
    }
  }, [email, username]);

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
        `${quota.name} is limited to ${maxLinks} custom links. Upgrade to Pro for 20 links or VIP for unlimited links.`,
        "info"
      );
      return;
    }
    setEditingLink(null);
    setSelectedType("");
    setFormMode("link");
    setFormTitle("");
    setFormUrl("");
    setCollectionItems([createEmptyCollectionItem()]);
    setIsTitleManuallyEdited(false);
    setLastSuggestedTitle("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(link: CustomLink) {
    setEditingLink(link);
    setSelectedType("");
    setFormMode(link.kind === "collection" ? "collection" : "link");
    setFormTitle(link.title);
    setFormUrl(link.url);
    setCollectionItems(
      link.items && link.items.length > 0
        ? link.items.map((item) => ({ ...item }))
        : [createEmptyCollectionItem()]
    );
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
    if (formMode === "link" && !cleanUrl) {
      showToast("Please enter a destination URL", "error");
      return;
    }

    if (formMode === "link" && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const hasIncompleteCollectionItem = collectionItems.some((item) => {
      const hasTitle = Boolean(item.title.trim());
      const hasUrl = Boolean(item.url.trim());
      return hasTitle !== hasUrl;
    });

    if (formMode === "collection" && hasIncompleteCollectionItem) {
      showToast("Please add both title and URL for each collection link, or leave the row blank", "error");
      return;
    }

    const cleanedItems = collectionItems
      .map((item) => {
        const title = item.title.trim();
        let url = item.url.trim();
        if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }
        return {
          ...item,
          id: item.id || createClientId("item"),
          title,
          url,
          isEnabled: item.isEnabled !== false,
        };
      })
      .filter((item) => item.title && item.url);

    if (formMode === "collection" && cleanedItems.length === 0) {
      showToast("Please add at least one link inside this collection", "error");
      return;
    }

    const urlsToValidate = formMode === "collection" ? cleanedItems.map((item) => item.url) : [cleanUrl];
    const hasInvalidUrl = urlsToValidate.some((url) => {
      try {
        const parsed = new URL(url);
        return !["http:", "https:"].includes(parsed.protocol);
      } catch {
        return true;
      }
    });

    if (hasInvalidUrl) {
      showToast("Please enter valid link URLs", "error");
      return;
    }

    let updatedList: CustomLink[] = [];
    if (editingLink) {
      updatedList = links.map((l) => (
        String(l.id) === String(editingLink.id)
          ? {
            ...l,
            title: cleanTitle,
            url: formMode === "collection" ? "" : cleanUrl,
            kind: formMode,
            items: formMode === "collection" ? cleanedItems : [],
          }
          : l
      ));
    } else {
      const newLink: CustomLink = {
        id: createClientId("link"),
        title: cleanTitle,
        url: formMode === "collection" ? "" : cleanUrl,
        isEnabled: true,
        kind: formMode,
        items: formMode === "collection" ? cleanedItems : [],
      };
      updatedList = [...links, newLink];
    }

    const previousLinks = links;
    setLinks(updatedList);
    customLinksRepository.save(updatedList);
    onChangeRef.current?.(updatedList);

    try {
      await syncToBackend(updatedList);
      setIsModalOpen(false);
      showToast(editingLink ? "Updated custom link! ✨" : formMode === "collection" ? "Added link collection! 🔗" : "Added custom link & saved to DB! 🔗");
    } catch {
      setLinks(previousLinks);
      customLinksRepository.save(previousLinks);
      onChangeRef.current?.(previousLinks);
      showToast("Could not save custom link. Please try again.", "error");
    }
  }

  async function handleDeleteLink(id: string) {
    const previousLinks = links;
    const updatedList = links.filter((l) => l.id !== id);
    setLinks(updatedList);
    customLinksRepository.save(updatedList);
    onChangeRef.current?.(updatedList);

    try {
      await syncToBackend(updatedList);
      showToast("Custom link removed! 🗑️");
      setLinkToDelete(null);
    } catch {
      setLinks(previousLinks);
      customLinksRepository.save(previousLinks);
      onChangeRef.current?.(previousLinks);
      showToast("Could not delete custom link. Please try again.", "error");
    }
  }

  async function syncToBackend(updatedLinks: CustomLink[]) {
    const targetEmail = creatorCtx?.profile?.email || authRepository.getPendingEmail() || authRepository.get()?.email || creatorCtx?.profile?.username;
    if (!targetEmail) return;

    try {
      setIsSaving(true);
      const httpResponse = await fetch("/api/creator/custom-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          links: updatedLinks,
        }),
      });
      const apiResponse = await httpResponse.json().catch(() => null);
      if (!httpResponse.ok || apiResponse?.status === 0 || apiResponse?.success === false) {
        throw new Error(apiResponse?.message || "Custom links sync failed");
      }
    } catch (e) {
      console.warn("Backend custom links sync error:", e);
      throw e;
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

  function updateCollectionItem(id: string, patch: Partial<CustomLinkItem>) {
    setCollectionItems((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addCollectionItem() {
    setCollectionItems((items) => [
      ...items,
      createEmptyCollectionItem(),
    ]);
  }

  function removeCollectionItem(id: string) {
    setCollectionItems((items) => {
      if (items.length <= 1) {
        return [createEmptyCollectionItem()];
      }
      return items.filter((item) => item.id !== id);
    });
  }

  return (
    <div className="w-full space-y-3 text-left">
      {/* Section Header: count badge + Add Link button */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/20">
          {links.length} / {maxLinks === Infinity ? "Unlimited" : maxLinks} links
        </span>

        <button
          type="button"
          onClick={(e) => handleOpenCreate(e.currentTarget)}
          disabled={isLimitReached}
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm ${isLimitReached
            ? "bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] opacity-60 cursor-not-allowed"
            : "bg-[#043084] hover:bg-brand-hover text-white"
            }`}
          title={isLimitReached ? "Limit reached (3 links max)" : "Add new custom link"}
        >
          <Plus className="h-4 w-4" />
          <span>Add Link</span>
        </button>
      </div>

      {/* Links List / Empty State */}
      {links.length === 0 ? (
        <EmptyState
          icon={<LinkIcon className="h-7 w-7" />}
          title="Add your first custom link"
          description="Help people reach your latest content, website, booking page, store or community."
          action={
            <button
              type="button"
              onClick={(e) => handleOpenCreate(e.currentTarget)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#043084] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Link</span>
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0] shadow-xs">
          {links.map((item, idx) => {
            const isCollection = item.kind === "collection";
            const enabledItems = item.items?.filter((child) => child.isEnabled !== false && child.title && child.url) || [];
            const domain = isCollection ? `${enabledItems.length} links in collection` : extractDomain(item.url);
            const platformInfo = getLinkPlatform(item);
            const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";

            return (
              <div
                key={item.id || idx}
                className="px-3.5 sm:px-4 py-2.5 min-h-[52px] hover:bg-[#f1f5f9] transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Drag handle + Favicon/Icon + Title/Domain */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[#64748b]/40 cursor-grab active:cursor-grabbing shrink-0" title="Drag to reorder">
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${isCollection ? "bg-[#043084] text-white shadow-xs" : platformInfo.bgClass
                        }`}
                    >
                      {isCollection ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : domain && !platformInfo.bgClass.includes("gradient") && !platformInfo.bgClass.includes("red") && !platformInfo.bgClass.includes("blue") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={faviconUrl}
                          alt=""
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        platformInfo.icon
                      )}
                    </div>

                    <div
                      onClick={() => handleOpenEdit(item)}
                      className="min-w-0 flex-1 cursor-pointer group"
                      title="Click to edit link"
                    >
                      <p className="truncate text-sm sm:text-[15px] font-semibold text-[#043084] group-hover:underline">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-[#475569]">
                        {domain}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Edit + Open ↗ + ⋮) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs font-semibold text-[#043084] transition-colors shadow-2xs cursor-pointer"
                      title="Edit this link"
                    >
                      <Pencil className="h-3 w-3 text-[#64748b]" />
                      <span className="hidden xs:inline">Edit</span>
                    </button>

                    {!isCollection && item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs font-medium text-[#043084] transition-colors shadow-2xs"
                        title="Open link in new tab"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3 text-[#64748b]" />
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
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#043084] transition-colors cursor-pointer shadow-2xs"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {activeMenuId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                        >
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
                              <span>Open Link</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenEdit(item);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
                            <span>Edit Link</span>
                          </button>

                          {!isCollection && (
                            <button
                              type="button"
                              onClick={() => handleCopy(item.url)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#64748b]" />
                              <span>Copy Link</span>
                            </button>
                          )}

                          <div className="my-1 border-t border-[#e2e8f0]" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setLinkToDelete(item);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isCollection && enabledItems.length > 0 && (
                  <div className="ml-7 mt-3 grid gap-2 sm:ml-12">
                    {enabledItems.slice(0, 4).map((child) => (
                      <a
                        key={child.id}
                        href={child.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#043084] transition-colors hover:border-[#043084]/25 hover:bg-[#f8fafc]"
                      >
                        <span className="truncate">{child.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
                      </a>
                    ))}
                    {enabledItems.length > 4 && (
                      <p className="px-1 text-[11px] font-semibold text-[#64748b]">
                        +{enabledItems.length - 4} more links
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(linkToDelete)}
        onClose={() => setLinkToDelete(null)}
        onConfirm={() => {
          if (linkToDelete) void handleDeleteLink(linkToDelete.id);
        }}
        title="Delete this link?"
        description={`"${linkToDelete?.title}" will be removed from your public creator profile.`}
        confirmText="Delete Link"
        cancelText="Cancel"
        loading={isSaving}
        isDestructive
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
        headerClassName="px-4 sm:px-5 py-3"
      >
        <form onSubmit={handleSaveModalLink} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            {/* Clean Segmented Control */}
            <div className="flex rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-1 gap-1">
              <button
                type="button"
                onClick={() => setFormMode("link")}
                className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  formMode === "link"
                    ? "bg-white text-[#043084] shadow-xs border border-[#e2e8f0]/80"
                    : "text-[#64748b] hover:text-[#043084] hover:bg-white/40"
                }`}
              >
                Single link
              </button>
              <button
                type="button"
                onClick={() => setFormMode("collection")}
                className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  formMode === "collection"
                    ? "bg-white text-[#043084] shadow-xs border border-[#e2e8f0]/80"
                    : "text-[#64748b] hover:text-[#043084] hover:bg-white/40"
                }`}
              >
                Link collection
              </button>
            </div>

            {/* Link Type Selector */}
            {formMode === "link" && (
              <div className="space-y-1">
                <label htmlFor="custom-link-type" className="block text-xs font-bold text-[#043084]">
                  Link type
                </label>
                <div className="relative">
                  <select
                    id="custom-link-type"
                    value={selectedType}
                    onChange={(e) => handleTypeSelect(e.target.value)}
                    className="h-9.5 w-full appearance-none rounded-[10px] border border-[#e2e8f0] bg-white px-3 pr-9 text-xs font-semibold text-[#043084] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all cursor-pointer shadow-2xs"
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
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                </div>
              </div>
            )}

            {/* Link Title Field */}
            <div className="space-y-1">
              <label htmlFor="custom-link-title" className="block text-xs font-bold text-[#043084]">
                {formMode === "collection" ? "Collection title" : "Link title"} <span className="text-[#C2414B] font-bold">*</span>
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
                placeholder={formMode === "collection" ? "e.g. World Tour Tickets" : "e.g. Follow on Instagram or Watch Latest Video"}
                className="h-9.5 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] placeholder:font-normal focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
              />
            </div>

            {/* Destination URL Field */}
            {formMode === "link" ? (
              <div className="space-y-1">
                <label htmlFor="custom-link-url" className="block text-xs font-bold text-[#043084]">
                  Destination URL <span className="text-[#C2414B] font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="custom-link-url"
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com/your-destination"
                    className="h-9.5 w-full rounded-[10px] border border-[#e2e8f0] bg-white pl-3 pr-9 text-xs font-mono font-medium text-[#043084] placeholder:text-[#94a3b8] placeholder:font-normal focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                  />
                  {formUrl && (formUrl.startsWith("http://") || formUrl.startsWith("https://")) && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Test link destination in new tab"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#043084] transition-colors p-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#043084]">Collection links</p>
                    <p className="text-[11px] text-[#64748b]">Add grouped links for tickets, tour stops, or resources.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCollectionItem}
                    className="inline-flex h-7.5 items-center gap-1.5 rounded-[8px] bg-[#043084] px-3 text-xs font-semibold text-white transition-all hover:bg-brand-hover hover:shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {collectionItems.map((item, index) => (
                    <div key={item.id} className="rounded-[10px] border border-[#e2e8f0] bg-white p-2.5 sm:p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#043084]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#043084]/10 text-[10px] font-extrabold text-[#043084]">
                            {index + 1}
                          </span>
                          <span>Link {index + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCollectionItem(item.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#64748b] transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          aria-label="Remove collection link"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* Separate rows for Title and URL */}
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-[#043084]">
                            Link title <span className="text-[#C2414B] font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateCollectionItem(item.id, { title: e.target.value })}
                            placeholder="e.g. Ahmedabad tickets"
                            className="h-9 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] placeholder:font-normal focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-[#043084]">
                            Link URL <span className="text-[#C2414B] font-bold">*</span>
                          </label>
                          <input
                            type="url"
                            value={item.url}
                            onChange={(e) => updateCollectionItem(item.id, { url: e.target.value })}
                            placeholder="https://bookmyshow.com/..."
                            className="h-9 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs font-mono font-medium text-[#043084] placeholder:text-[#94a3b8] placeholder:font-normal focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>

          {/* Modal Actions Footer */}
          <ModalFooter className="px-4 sm:px-5 py-3 flex items-center justify-end gap-2 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => {
                if (!isSaving) {
                  setIsModalOpen(false);
                  triggerButtonRef.current?.focus();
                }
              }}
              disabled={isSaving}
              className="h-9 px-4 rounded-[10px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4.5 rounded-[10px] bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{isSaving ? "Saving..." : editingLink ? "Save Changes" : "Save Link"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
