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
  Folder,
  Globe,
  X,
  Eye,
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
  const type = ((link as { type?: string }).type || link.icon || "").toLowerCase();

  if (link.kind === "collection") {
    return {
      icon: <Folder className="h-4 w-4 text-[#475569]" />,
      bgClass: "bg-[#eef2f6]",
    };
  }

  if (url.includes("instagram.com") || title.includes("instagram")) {
    return {
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs",
    };
  }
  if (url.includes("youtube.com") || url.includes("youtu.be") || title.includes("youtube")) {
    return {
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      bgClass: "bg-[#FF0000] shadow-xs",
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
  if (type === "portfolio" || title.includes("portfolio")) {
    return {
      icon: <Globe className="h-4 w-4 text-[#0284c7]" />,
      bgClass: "bg-[#e0f2fe]",
    };
  }
  if (type === "website" || title.includes("website") || title.includes("official")) {
    return {
      icon: <Globe className="h-4 w-4 text-[#7A2253]" />,
      bgClass: "bg-[#FFF5F7] border border-[#FCE7F3]",
    };
  }

  // Fallback to title initials with pink/maroon squircle badge
  return {
    icon: (
      <span className="text-[11px] font-bold tracking-tight text-[#7A2253]">
        {getInitials(link.title)}
      </span>
    ),
    bgClass: "bg-[#FFF5F7] border border-[#FCE7F3]",
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
    // Ignore presses inside an open menu so its items receive their click.
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.("[data-menu]")) return;
      setActiveMenuId(null);
    };
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
      {/* Section Subheader: count badge + Add Link button */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center text-xs text-[#64748b] font-medium">
          {links.length} / {maxLinks === Infinity ? "Unlimited" : maxLinks} links
        </span>

        <button
          type="button"
          onClick={(e) => handleOpenCreate(e.currentTarget)}
          disabled={isLimitReached}
          className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[5px] text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            isLimitReached
              ? "bg-[#7A2253] text-white opacity-85"
              : "bg-[#7A2253] hover:bg-[#681c46] text-white"
          }`}
          title={isLimitReached ? "Plan limit reached" : "Add new custom link"}
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
              className="inline-flex items-center gap-2 rounded-[5px] bg-[#7A2253] hover:opacity-95 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Link</span>
            </button>
          }
        />
      ) : (
        <div className="rounded-[5px] border border-[#e2e8f0] bg-white divide-y divide-[#f1f5f9] shadow-2xs overflow-hidden">
          {links.map((item, idx) => {
            const isCollection = item.kind === "collection";
            const enabledItems = item.items?.filter((child) => child.isEnabled !== false && child.title && child.url) || [];
            const domain = isCollection ? `${enabledItems.length} links in collection` : extractDomain(item.url);
            const platformInfo = getLinkPlatform(item);
            const faviconUrl = domain && !isCollection ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";

            return (
              <div
                key={item.id || idx}
                className="px-3.5 sm:px-4 py-3 min-h-[58px] hover:bg-[#fafafa] transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Drag handle + Favicon/Icon + Title/Domain */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[#cbd5e1] hover:text-[#94a3b8] cursor-grab active:cursor-grabbing shrink-0" title="Drag to reorder">
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <div
                      className={`h-9 w-9 rounded-[5px] flex items-center justify-center shrink-0 overflow-hidden ${
                        isCollection ? "bg-[#eef2f6] text-[#475569]" : platformInfo.bgClass
                      }`}
                    >
                      {isCollection ? (
                        <Folder className="h-4 w-4 text-[#475569]" />
                      ) : domain && !platformInfo.bgClass.includes("gradient") && !platformInfo.bgClass.includes("FF0000") && !platformInfo.bgClass.includes("red") && !platformInfo.bgClass.includes("blue") && !platformInfo.bgClass.includes("black") && !platformInfo.bgClass.includes("0284c7") && !platformInfo.bgClass.includes("e0f2fe") ? (
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
                      <p className="truncate text-sm font-bold text-[#0f172a] group-hover:text-[#7A2253] transition-colors">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-[#64748b]">
                        {domain}
                      </p>
                    </div>
                  </div>

                  {/* Right: 3 Action Buttons (Pencil | Open ↗ | Trash) matching screenshot */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] transition-colors shadow-2xs cursor-pointer"
                      title="Edit link"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <a
                      href={item.url || (enabledItems[0]?.url) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-[#FCE7F3]/70 text-xs font-bold text-[#7A2253] transition-colors shadow-2xs cursor-pointer"
                      title="Open link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setLinkToDelete(item)}
                      className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-rose-50 text-[#ef4444] hover:text-red-700 transition-colors shadow-2xs cursor-pointer"
                      title="Delete link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collection items: styled as pink full-width cards with bold title and external link icon */}
                {isCollection && enabledItems.length > 0 && (
                  <div className="pt-2.5 pb-0.5 space-y-1.5">
                    {enabledItems.map((child) => (
                      <a
                        key={child.id}
                        href={child.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-[#FCE7F3]/80 px-4 py-2.5 text-xs font-bold text-[#7A2253] transition-colors shadow-2xs"
                      >
                        <span className="truncate">{child.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#7A2253]" />
                      </a>
                    ))}
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
        size="lg"
        showCloseButton={false}
        className="rounded-[5px] border border-slate-200 shadow-2xl overflow-hidden max-w-2xl"
      >
        {/* Custom Header with Squircle Icon */}
        <div className="relative border-b border-slate-100 bg-white px-5 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                <LinkIcon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">
                  {editingLink ? "Edit Custom Link" : "Add Custom Link"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 font-normal">
                  Add a useful destination to your public creator profile.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isSaving) {
                  setIsModalOpen(false);
                  triggerButtonRef.current?.focus();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveModalLink} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            {/* Dual Mode Switcher (Tab pills) */}
            <div className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-[5px] gap-1">
              <button
                type="button"
                onClick={() => setFormMode("link")}
                className={`py-2 px-3 rounded-[5px] text-center transition-all cursor-pointer ${
                  formMode === "link"
                    ? "bg-[#7A2253] text-white shadow-xs"
                    : "bg-transparent text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs sm:text-[13px] font-bold">Single link</span>
                <span
                  className={`block text-[10.5px] font-normal mt-0.5 ${
                    formMode === "link" ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  Add one link to your profile
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormMode("collection")}
                className={`py-2 px-3 rounded-[5px] text-center transition-all cursor-pointer ${
                  formMode === "collection"
                    ? "bg-[#7A2253] text-white shadow-xs"
                    : "bg-transparent text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs sm:text-[13px] font-bold">Link collection</span>
                <span
                  className={`block text-[10.5px] font-normal mt-0.5 ${
                    formMode === "collection" ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  Group multiple related links
                </span>
              </button>
            </div>

            {/* MODE 1: SINGLE LINK */}
            {formMode === "link" ? (
              <div className="space-y-4">
                {/* Field 1: Link type */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <label htmlFor="custom-link-type" className="text-xs sm:text-[13px] font-bold text-slate-900">
                      Link type <span className="text-[#C2414B]">*</span>
                    </label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                      Select a type to auto-fill icon and suggest a title.
                    </span>
                  </div>
                  <div className="relative flex items-center h-11 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                    <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <select
                      id="custom-link-type"
                      value={selectedType}
                      onChange={(e) => handleTypeSelect(e.target.value)}
                      className="w-full h-full px-3.5 text-xs sm:text-[13px] font-medium text-slate-700 focus:outline-none bg-transparent cursor-pointer appearance-none"
                    >
                      <option value="">— Select a link type —</option>
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
                    <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Field 2: Link title */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <label htmlFor="custom-link-title" className="text-xs sm:text-[13px] font-bold text-slate-900">
                      Link title <span className="text-[#C2414B]">*</span>
                    </label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                      This title will be shown on your public profile.
                    </span>
                  </div>
                  <div className="relative flex items-center h-11 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                    <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500 font-semibold text-sm">
                      T
                    </div>
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
                      className="w-full h-full px-3.5 text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Field 3: Destination URL */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <label htmlFor="custom-link-url" className="text-xs sm:text-[13px] font-bold text-slate-900">
                      Destination URL <span className="text-[#C2414B]">*</span>
                    </label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                      Paste the full link to your destination.
                    </span>
                  </div>
                  <div className="relative flex items-center h-11 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                    <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <input
                      id="custom-link-url"
                      type="url"
                      required
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://example.com/your-destination"
                      className="w-full h-full pl-3.5 pr-10 text-xs sm:text-[13px] font-mono font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                    />
                    {formUrl && (formUrl.startsWith("http://") || formUrl.startsWith("https://")) && (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Test link destination in new tab"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A2253] transition-colors p-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Info Eye Banner */}
                <div className="flex items-center gap-2.5 p-3 rounded-[5px] bg-[#FFF5F8] border border-[#FCE7F1] text-xs text-[#7A2253]">
                  <Eye className="h-4 w-4 shrink-0 text-[#7A2253]" />
                  <p className="leading-snug text-[11.5px] font-medium text-[#7A2253]">
                    This link will appear on your public profile as a clickable button with the above title.
                  </p>
                </div>
              </div>
            ) : (
              /* MODE 2: LINK COLLECTION */
              <div className="space-y-4">
                {/* Field 1: Collection title */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <label htmlFor="custom-collection-title" className="text-xs sm:text-[13px] font-bold text-slate-900">
                      Collection title <span className="text-[#C2414B]">*</span>
                    </label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                      Give a clear name for this group of links.
                    </span>
                  </div>
                  <div className="relative flex items-center h-11 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                    <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <input
                      id="custom-collection-title"
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        setIsTitleManuallyEdited(true);
                      }}
                      placeholder="e.g. World Tour Tickets, My Socials, Helpful Resources"
                      className="w-full h-full px-3.5 text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Field 2: Links in this collection */}
                <div className="rounded-[5px] border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900">Links in this collection</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">
                        Add multiple links for this collection.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addCollectionItem}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#7A2253] bg-white px-3 text-xs font-bold text-[#7A2253] hover:bg-[#FFF5F8] transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {collectionItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                      >
                        {/* Drag Dots & Number Pill */}
                        <div className="flex items-center gap-2 shrink-0">
                          <GripVertical className="h-4 w-4 text-slate-400 shrink-0 cursor-grab" />
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-[#FCE7F1] text-[11px] font-bold text-[#7A2253]">
                            {index + 1}
                          </div>
                        </div>

                        {/* Title input with T icon */}
                        <div className="relative flex-1 flex items-center h-10 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                          <div className="flex h-full w-9 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500 font-semibold text-xs">
                            T
                          </div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateCollectionItem(item.id, { title: e.target.value })}
                            placeholder="Link title *"
                            className="w-full h-full px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                          />
                        </div>

                        {/* URL input with Link icon */}
                        <div className="relative flex-1 flex items-center h-10 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                          <div className="flex h-full w-9 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500">
                            <LinkIcon className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type="url"
                            value={item.url}
                            onChange={(e) => updateCollectionItem(item.id, { url: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full h-full px-3 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                          />
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeCollectionItem(item.id)}
                          className="self-center p-2 rounded-[5px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          aria-label="Remove link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>

          {/* Modal Actions Footer */}
          <ModalFooter className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => {
                if (!isSaving) {
                  setIsModalOpen(false);
                  triggerButtonRef.current?.focus();
                }
              }}
              disabled={isSaving}
              className="h-10 px-5 rounded-[5px] border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-bold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
