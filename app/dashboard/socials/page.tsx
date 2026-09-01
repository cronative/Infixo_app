"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Share2,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Copy,
  RefreshCw,
  MoreVertical,
  Check,
  ShieldCheck,
  Globe,
  Lock,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
  Link2,
  AtSign,
  Info,
  Search,
  ChevronDown,
  Briefcase,
  Play,
  User,
  ShoppingBag,
  Sparkles,
  BookOpen,
  Mail,
  Calendar,
  Heart,
  Video,
  Radio,
  FileText,
  Bookmark,
  Coffee,
  Film,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  ThreadsIcon,
  LinkedinIcon,
  SnapchatIcon,
  PinterestIcon,
  TwitchIcon,
  SpotifyIcon,
  WhatsappIcon,
} from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomLink } from "@/types";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { formatCount, formatSyncDate } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";

function extractUsername(url: string): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

function extractDomain(url: string): string {
  try {
    const full = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const parsed = new URL(full);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url || "example.com";
  }
}

const MAX_CUSTOM_LINKS = 3;

/* ==========================================================================
   STRUCTURED LINK TYPES & SUGGESTIONS DATA
   ========================================================================== */
export interface LinkTypeOption {
  id: string;
  category: "Social Platforms" | "Creator and Business" | "Content" | "Personal" | "Other";
  label: string;
  suggestedTitle: string;
  placeholderUrl: string;
  domainMatch?: string[];
}

export const LINK_TYPES: LinkTypeOption[] = [
  // GROUP 1 — SOCIAL PLATFORMS
  {
    id: "instagram",
    category: "Social Platforms",
    label: "Instagram",
    suggestedTitle: "Follow me on Instagram",
    placeholderUrl: "https://instagram.com/username",
    domainMatch: ["instagram.com", "ig.me"],
  },
  {
    id: "youtube",
    category: "Social Platforms",
    label: "YouTube",
    suggestedTitle: "Subscribe on YouTube",
    placeholderUrl: "https://youtube.com/@channel",
    domainMatch: ["youtube.com", "youtu.be"],
  },
  {
    id: "facebook",
    category: "Social Platforms",
    label: "Facebook",
    suggestedTitle: "Follow me on Facebook",
    placeholderUrl: "https://facebook.com/page",
    domainMatch: ["facebook.com", "fb.watch", "fb.com"],
  },
  {
    id: "twitter",
    category: "Social Platforms",
    label: "X / Twitter",
    suggestedTitle: "Follow me on X",
    placeholderUrl: "https://x.com/username",
    domainMatch: ["x.com", "twitter.com"],
  },
  {
    id: "threads",
    category: "Social Platforms",
    label: "Threads",
    suggestedTitle: "Follow me on Threads",
    placeholderUrl: "https://threads.net/@username",
    domainMatch: ["threads.net"],
  },
  {
    id: "linkedin",
    category: "Social Platforms",
    label: "LinkedIn",
    suggestedTitle: "Connect with me on LinkedIn",
    placeholderUrl: "https://linkedin.com/in/username",
    domainMatch: ["linkedin.com"],
  },
  {
    id: "snapchat",
    category: "Social Platforms",
    label: "Snapchat",
    suggestedTitle: "Add me on Snapchat",
    placeholderUrl: "https://snapchat.com/add/username",
    domainMatch: ["snapchat.com"],
  },
  {
    id: "tiktok",
    category: "Social Platforms",
    label: "TikTok",
    suggestedTitle: "Follow me on TikTok",
    placeholderUrl: "https://tiktok.com/@username",
    domainMatch: ["tiktok.com"],
  },
  {
    id: "pinterest",
    category: "Social Platforms",
    label: "Pinterest",
    suggestedTitle: "Follow me on Pinterest",
    placeholderUrl: "https://pinterest.com/username",
    domainMatch: ["pinterest.com"],
  },
  {
    id: "whatsapp",
    category: "Social Platforms",
    label: "WhatsApp",
    suggestedTitle: "Chat with me on WhatsApp",
    placeholderUrl: "https://wa.me/919XXXXXXXXX",
    domainMatch: ["wa.me", "whatsapp.com"],
  },
  {
    id: "telegram",
    category: "Social Platforms",
    label: "Telegram",
    suggestedTitle: "Join me on Telegram",
    placeholderUrl: "https://t.me/username",
    domainMatch: ["t.me", "telegram.me"],
  },
  {
    id: "discord",
    category: "Social Platforms",
    label: "Discord",
    suggestedTitle: "Join my Discord community",
    placeholderUrl: "https://discord.gg/invitecode",
    domainMatch: ["discord.gg", "discord.com"],
  },
  {
    id: "twitch",
    category: "Social Platforms",
    label: "Twitch",
    suggestedTitle: "Watch me on Twitch",
    placeholderUrl: "https://twitch.tv/channel",
    domainMatch: ["twitch.tv"],
  },
  {
    id: "spotify",
    category: "Social Platforms",
    label: "Spotify",
    suggestedTitle: "Listen on Spotify",
    placeholderUrl: "https://open.spotify.com/...",
    domainMatch: ["spotify.com"],
  },
  {
    id: "apple_music",
    category: "Social Platforms",
    label: "Apple Music",
    suggestedTitle: "Listen on Apple Music",
    placeholderUrl: "https://music.apple.com/...",
    domainMatch: ["music.apple.com", "apple.com"],
  },
  {
    id: "soundcloud",
    category: "Social Platforms",
    label: "SoundCloud",
    suggestedTitle: "Listen on SoundCloud",
    placeholderUrl: "https://soundcloud.com/username",
    domainMatch: ["soundcloud.com"],
  },
  {
    id: "medium",
    category: "Social Platforms",
    label: "Medium",
    suggestedTitle: "Read my articles",
    placeholderUrl: "https://medium.com/@username",
    domainMatch: ["medium.com"],
  },
  {
    id: "substack",
    category: "Social Platforms",
    label: "Substack",
    suggestedTitle: "Join my newsletter",
    placeholderUrl: "https://username.substack.com",
    domainMatch: ["substack.com"],
  },
  {
    id: "github",
    category: "Social Platforms",
    label: "GitHub",
    suggestedTitle: "View my GitHub",
    placeholderUrl: "https://github.com/username",
    domainMatch: ["github.com"],
  },
  {
    id: "behance",
    category: "Social Platforms",
    label: "Behance",
    suggestedTitle: "View my Behance portfolio",
    placeholderUrl: "https://behance.net/username",
    domainMatch: ["behance.net"],
  },
  {
    id: "dribbble",
    category: "Social Platforms",
    label: "Dribbble",
    suggestedTitle: "View my Dribbble work",
    placeholderUrl: "https://dribbble.com/username",
    domainMatch: ["dribbble.com"],
  },
  {
    id: "reddit",
    category: "Social Platforms",
    label: "Reddit",
    suggestedTitle: "Follow me on Reddit",
    placeholderUrl: "https://reddit.com/user/username",
    domainMatch: ["reddit.com"],
  },
  {
    id: "quora",
    category: "Social Platforms",
    label: "Quora",
    suggestedTitle: "Follow me on Quora",
    placeholderUrl: "https://quora.com/profile/username",
    domainMatch: ["quora.com"],
  },

  // GROUP 2 — CREATOR AND BUSINESS
  {
    id: "collab",
    category: "Creator and Business",
    label: "Book a Collaboration",
    suggestedTitle: "Work with me",
    placeholderUrl: "https://calendly.com/...",
  },
  {
    id: "contact",
    category: "Creator and Business",
    label: "Contact Me",
    suggestedTitle: "Contact me",
    placeholderUrl: "https://example.com/contact",
  },
  {
    id: "mediakit",
    category: "Creator and Business",
    label: "Media Kit",
    suggestedTitle: "View my media kit",
    placeholderUrl: "https://inflixo.com/...",
  },
  {
    id: "portfolio",
    category: "Creator and Business",
    label: "Portfolio",
    suggestedTitle: "View my portfolio",
    placeholderUrl: "https://yourportfolio.com",
  },
  {
    id: "personal_website",
    category: "Creator and Business",
    label: "Personal Website",
    suggestedTitle: "Visit my website",
    placeholderUrl: "https://yourwebsite.com",
  },
  {
    id: "business_website",
    category: "Creator and Business",
    label: "Business Website",
    suggestedTitle: "Visit our website",
    placeholderUrl: "https://yourcompany.com",
  },
  {
    id: "store",
    category: "Creator and Business",
    label: "Online Store",
    suggestedTitle: "Visit my store",
    placeholderUrl: "https://store.example.com",
  },
  {
    id: "merchandise",
    category: "Creator and Business",
    label: "Merchandise Store",
    suggestedTitle: "Shop my merchandise",
    placeholderUrl: "https://shop.example.com",
  },
  {
    id: "book_call",
    category: "Creator and Business",
    label: "Book a Call",
    suggestedTitle: "Book a call",
    placeholderUrl: "https://calendly.com/...",
  },
  {
    id: "appointment",
    category: "Creator and Business",
    label: "Appointment Booking",
    suggestedTitle: "Book an appointment",
    placeholderUrl: "https://topmate.io/...",
  },
  {
    id: "event",
    category: "Creator and Business",
    label: "Event Registration",
    suggestedTitle: "Register for event",
    placeholderUrl: "https://lu.ma/...",
  },
  {
    id: "newsletter",
    category: "Creator and Business",
    label: "Newsletter",
    suggestedTitle: "Join my newsletter",
    placeholderUrl: "https://newsletter.example.com",
  },
  {
    id: "community",
    category: "Creator and Business",
    label: "Community",
    suggestedTitle: "Join my community",
    placeholderUrl: "https://community.example.com",
  },
  {
    id: "course",
    category: "Creator and Business",
    label: "Course",
    suggestedTitle: "Explore my course",
    placeholderUrl: "https://course.example.com",
  },
  {
    id: "digital_product",
    category: "Creator and Business",
    label: "Digital Product",
    suggestedTitle: "Explore my products",
    placeholderUrl: "https://gumroad.com/...",
  },
  {
    id: "support",
    category: "Creator and Business",
    label: "Support My Work",
    suggestedTitle: "Support my work",
    placeholderUrl: "https://buymeacoffee.com/...",
  },
  {
    id: "affiliate",
    category: "Creator and Business",
    label: "Affiliate Link",
    suggestedTitle: "Recommended products",
    placeholderUrl: "https://amazon.in/...",
  },

  // GROUP 3 — CONTENT
  {
    id: "latest_video",
    category: "Content",
    label: "Latest Video",
    suggestedTitle: "Watch my latest video",
    placeholderUrl: "https://youtube.com/watch?v=...",
  },
  {
    id: "latest_reel",
    category: "Content",
    label: "Latest Reel",
    suggestedTitle: "Watch my latest reel",
    placeholderUrl: "https://instagram.com/reel/...",
  },
  {
    id: "latest_post",
    category: "Content",
    label: "Latest Post",
    suggestedTitle: "View my latest post",
    placeholderUrl: "https://...",
  },
  {
    id: "featured_content",
    category: "Content",
    label: "Featured Content",
    suggestedTitle: "View my featured content",
    placeholderUrl: "https://...",
  },
  {
    id: "blog",
    category: "Content",
    label: "Blog",
    suggestedTitle: "Read my blog",
    placeholderUrl: "https://blog.example.com",
  },
  {
    id: "podcast",
    category: "Content",
    label: "Podcast",
    suggestedTitle: "Listen to my podcast",
    placeholderUrl: "https://podcast.example.com",
  },
  {
    id: "playlist",
    category: "Content",
    label: "Playlist",
    suggestedTitle: "Explore my playlist",
    placeholderUrl: "https://...",
  },
  {
    id: "live_stream",
    category: "Content",
    label: "Live Stream",
    suggestedTitle: "Watch my live stream",
    placeholderUrl: "https://...",
  },
  {
    id: "content_series",
    category: "Content",
    label: "Content Series",
    suggestedTitle: "Explore my content series",
    placeholderUrl: "https://...",
  },

  // GROUP 4 — PERSONAL
  {
    id: "about_me",
    category: "Personal",
    label: "About Me",
    suggestedTitle: "Learn more about me",
    placeholderUrl: "https://...",
  },
  {
    id: "my_story",
    category: "Personal",
    label: "My Story",
    suggestedTitle: "Read my story",
    placeholderUrl: "https://...",
  },
  {
    id: "personal_blog",
    category: "Personal",
    label: "Personal Blog",
    suggestedTitle: "Read my personal blog",
    placeholderUrl: "https://...",
  },
  {
    id: "recommendations",
    category: "Personal",
    label: "My Recommendations",
    suggestedTitle: "View my recommendations",
    placeholderUrl: "https://...",
  },
  {
    id: "favourite_tools",
    category: "Personal",
    label: "My Favourite Tools",
    suggestedTitle: "Explore my favourite tools",
    placeholderUrl: "https://...",
  },
  {
    id: "my_gear",
    category: "Personal",
    label: "My Gear",
    suggestedTitle: "See the gear I use",
    placeholderUrl: "https://...",
  },
  {
    id: "wishlist",
    category: "Personal",
    label: "My Wishlist",
    suggestedTitle: "View my wishlist",
    placeholderUrl: "https://...",
  },
  {
    id: "family_channel",
    category: "Personal",
    label: "Family Channel",
    suggestedTitle: "Visit our family channel",
    placeholderUrl: "https://...",
  },
  {
    id: "other_personal",
    category: "Personal",
    label: "Other Personal Link",
    suggestedTitle: "Read my travel journal",
    placeholderUrl: "https://...",
  },

  // GROUP 5 — OTHER
  {
    id: "other",
    category: "Other",
    label: "Other",
    suggestedTitle: "",
    placeholderUrl: "https://example.com",
  },
];

function renderTypeIcon(typeId?: string): React.ReactNode {
  switch (typeId) {
    case "instagram":
      return <InstagramIcon className="h-4 w-4 text-pink-600" />;
    case "youtube":
      return <YoutubeIcon className="h-4 w-4 text-red-600" />;
    case "facebook":
      return <FacebookIcon className="h-4 w-4 text-blue-600" />;
    case "twitter":
      return <XTwitterIcon className="h-4 w-4 text-slate-900" />;
    case "threads":
      return <ThreadsIcon className="h-4 w-4 text-slate-900" />;
    case "linkedin":
      return <LinkedinIcon className="h-4 w-4 text-blue-700" />;
    case "snapchat":
      return <SnapchatIcon className="h-4 w-4 text-amber-500" />;
    case "pinterest":
      return <PinterestIcon className="h-4 w-4 text-red-600" />;
    case "whatsapp":
      return <WhatsappIcon className="h-4 w-4 text-emerald-600" />;
    case "twitch":
      return <TwitchIcon className="h-4 w-4 text-purple-600" />;
    case "spotify":
      return <SpotifyIcon className="h-4 w-4 text-emerald-600" />;
    case "collab":
    case "behance":
      return <Briefcase className="h-4 w-4 text-[#803D63]" />;
    case "contact":
    case "newsletter":
    case "substack":
      return <Mail className="h-4 w-4 text-[#803D63]" />;
    case "mediakit":
    case "blog":
    case "personal_blog":
    case "my_story":
    case "latest_post":
    case "medium":
      return <FileText className="h-4 w-4 text-[#803D63]" />;
    case "portfolio":
    case "personal_website":
    case "business_website":
    case "github":
      return <Globe className="h-4 w-4 text-[#803D63]" />;
    case "store":
    case "merchandise":
    case "digital_product":
      return <ShoppingBag className="h-4 w-4 text-[#803D63]" />;
    case "book_call":
    case "appointment":
    case "event":
      return <Calendar className="h-4 w-4 text-[#803D63]" />;
    case "course":
      return <BookOpen className="h-4 w-4 text-[#803D63]" />;
    case "support":
      return <Coffee className="h-4 w-4 text-[#803D63]" />;
    case "affiliate":
    case "favourite_tools":
    case "my_gear":
      return <Bookmark className="h-4 w-4 text-[#803D63]" />;
    case "latest_video":
      return <Video className="h-4 w-4 text-[#803D63]" />;
    case "podcast":
    case "live_stream":
      return <Radio className="h-4 w-4 text-[#803D63]" />;
    case "content_series":
      return <Film className="h-4 w-4 text-[#803D63]" />;
    case "about_me":
    case "family_channel":
      return <User className="h-4 w-4 text-[#803D63]" />;
    case "recommendations":
    case "wishlist":
      return <Heart className="h-4 w-4 text-[#803D63]" />;
    case "featured_content":
    case "dribbble":
      return <Sparkles className="h-4 w-4 text-[#803D63]" />;
    case "tiktok":
    case "latest_reel":
    case "playlist":
    case "apple_music":
    case "soundcloud":
      return <Play className="h-4 w-4 text-[#803D63]" />;
    case "telegram":
    case "discord":
    case "community":
    case "reddit":
    case "quora":
      return <Share2 className="h-4 w-4 text-[#803D63]" />;
    default:
      return <Link2 className="h-4 w-4 text-[#803D63]" />;
  }
}

/* ==========================================================================
   1. CENTRED CUSTOM LINK MODAL
   ========================================================================== */
interface CustomLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit?: CustomLink | null;
  onSave: (title: string, url: string) => Promise<void>;
}

function CustomLinkModal({ isOpen, onClose, linkToEdit, onSave }: CustomLinkModalProps) {
  const isEditing = Boolean(linkToEdit);
  const [selectedType, setSelectedType] = useState<LinkTypeOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");

  const [title, setTitle] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize or reset on open
  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title || "");
      setUrl(linkToEdit.url || "");
      setIsTitleManuallyEdited(true);

      const found = LINK_TYPES.find(
        (t) => t.domainMatch && t.domainMatch.some((d) => (linkToEdit.url || "").toLowerCase().includes(d))
      );
      setSelectedType(found || LINK_TYPES.find((t) => t.id === "other") || null);
    } else {
      setTitle("");
      setUrl("");
      setSelectedType(null);
      setIsTitleManuallyEdited(false);
    }
    setTypeSearch("");
    setIsDropdownOpen(false);
    setErrors({});
  }, [linkToEdit, isOpen]);

  // Click outside to close type dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (isDropdownOpen) {
            setIsDropdownOpen(false);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, isDropdownOpen, onClose]);

  if (!isOpen) return null;

  // Filter types by search
  const filteredTypes = LINK_TYPES.filter(
    (t) =>
      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(typeSearch.toLowerCase()) ||
      t.suggestedTitle.toLowerCase().includes(typeSearch.toLowerCase())
  );

  // Group filtered types
  const groupedTypes = {
    "Social Platforms": filteredTypes.filter((t) => t.category === "Social Platforms"),
    "Creator and Business": filteredTypes.filter((t) => t.category === "Creator and Business"),
    Content: filteredTypes.filter((t) => t.category === "Content"),
    Personal: filteredTypes.filter((t) => t.category === "Personal"),
    Other: filteredTypes.filter((t) => t.category === "Other"),
  };

  const handleSelectType = (type: LinkTypeOption) => {
    setSelectedType(type);
    setIsDropdownOpen(false);
    setTypeSearch("");

    if (!isTitleManuallyEdited || !title.trim()) {
      setTitle(type.suggestedTitle);
      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleSelectCustomQuery = (queryText: string) => {
    const customType: LinkTypeOption = {
      id: "custom",
      category: "Other",
      label: queryText.trim(),
      suggestedTitle: queryText.trim(),
      placeholderUrl: "https://example.com",
    };
    setSelectedType(customType);
    setIsDropdownOpen(false);
    setTypeSearch("");

    if (!isTitleManuallyEdited || !title.trim()) {
      setTitle(queryText.trim());
      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  // Check domain mismatch warning
  const domainWarning = useMemo(() => {
    if (!selectedType || !selectedType.domainMatch || !url.trim()) return null;
    const lower = url.toLowerCase();
    const isMatched = selectedType.domainMatch.some((d) => lower.includes(d));
    if (!isMatched && (lower.startsWith("http://") || lower.startsWith("https://") || lower.includes("."))) {
      return `This link doesn't appear to be a ${selectedType.label} URL. Check the link or continue if it redirects to ${selectedType.label}.`;
    }
    return null;
  }, [selectedType, url]);

  const previewDomain = extractDomain(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!title.trim()) newErrors.title = "Enter a link title.";
    if (!url.trim()) newErrors.url = "Enter a valid URL.";

    const trimmedUrl = url.trim().toLowerCase();
    if (trimmedUrl.startsWith("javascript:") || trimmedUrl.startsWith("data:")) {
      newErrors.url = "Unsafe URL scheme is not allowed.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSave(title.trim(), url.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Dark Translucent Overlay */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Centred Modal Container */}
      <div className="relative z-10 flex w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex-col overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-7 shadow-2xl animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-2 duration-300 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#ECE8EB] pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#17131A]">
              {isEditing ? "Edit custom link" : "Add custom link"}
            </h2>
            <p className="text-xs text-[#6F6872] font-medium mt-0.5">
              {isEditing
                ? "Update how this link appears on your public creator profile."
                : "Add a useful destination to your public creator profile."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8FA] text-[#6F6872] hover:bg-[#F7EDF3] hover:text-[#803D63] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5 pt-4">
          {/* FIELD 1: LINK TYPE SELECTOR (Searchable Dropdown) */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#17131A]">
                Link type
              </label>
              <span className="text-[11px] text-[#6F6872]">
                Custom links do not sync stats
              </span>
            </div>

            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-[#ECE8EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#17131A] hover:border-[#803D63]/40 focus:outline-none transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                {selectedType ? (
                  <>
                    <div className="shrink-0">{renderTypeIcon(selectedType.id)}</div>
                    <span className="truncate">{selectedType.label}</span>
                  </>
                ) : (
                  <span className="text-[#6F6872]/60 font-normal">Choose a platform or link type</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-[#6F6872] shrink-0" />
            </button>

            {/* Searchable Options Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-y-auto rounded-2xl border border-[#ECE8EB] bg-white p-2 shadow-xl space-y-2 animate-in fade-in">
                {/* Search Input */}
                <div className="relative sticky top-0 bg-white pb-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                  <input
                    type="text"
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    placeholder="Search platforms, bookings, store..."
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-8 pr-3 py-1.5 text-xs text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63]"
                    autoFocus
                  />
                </div>

                {/* Grouped Options */}
                {Object.entries(groupedTypes).map(([categoryName, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={categoryName} className="space-y-0.5">
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6F6872]/80">
                        {categoryName}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectType(item)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
                              selectedType?.id === item.id
                                ? "bg-[#F7EDF3] text-[#803D63]"
                                : "text-[#17131A] hover:bg-[#FAF8FA]"
                            }`}
                          >
                            <div className="shrink-0">{renderTypeIcon(item.id)}</div>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.suggestedTitle && (
                              <span className="text-[10px] text-[#6F6872] truncate hidden sm:inline">
                                {item.suggestedTitle}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Custom search write-in if no exact item found */}
                {typeSearch.trim() && filteredTypes.length === 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectCustomQuery(typeSearch)}
                    className="flex w-full items-center gap-2 rounded-xl p-2.5 text-xs font-semibold text-[#803D63] bg-[#F7EDF3] hover:bg-[#F7EDF3]/80 transition-colors text-left cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Use &ldquo;{typeSearch.trim()}&rdquo; as a custom link title</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* FIELD 2: LINK TITLE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#17131A]">
                Link title <span className="text-rose-500">*</span>
              </label>
              {selectedType?.suggestedTitle && title !== selectedType.suggestedTitle && (
                <button
                  type="button"
                  onClick={() => setTitle(selectedType.suggestedTitle)}
                  className="text-[11px] font-semibold text-[#803D63] hover:underline cursor-pointer"
                >
                  Use suggested title
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsTitleManuallyEdited(true);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder={
                selectedType?.id === "other"
                  ? "e.g. Join my community"
                  : selectedType?.suggestedTitle || "e.g. Book a collaboration"
              }
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:outline-none transition-colors ${
                errors.title
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-[#ECE8EB] bg-white focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20"
              }`}
            />
            {errors.title && <p className="text-[11px] font-semibold text-rose-600">{errors.title}</p>}
          </div>

          {/* FIELD 3: DESTINATION URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#17131A]">
              URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url) setErrors((prev) => ({ ...prev, url: undefined }));
              }}
              placeholder={selectedType?.placeholderUrl || "https://example.com"}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#17131A] placeholder:text-[#6F6872]/50 focus:outline-none transition-colors ${
                errors.url
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-[#ECE8EB] bg-white focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20"
              }`}
            />
            {errors.url ? (
              <p className="text-[11px] font-semibold text-rose-600">{errors.url}</p>
            ) : domainWarning ? (
              <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl">
                {domainWarning}
              </p>
            ) : (
              <p className="text-[11px] text-[#6F6872]">
                Enter any valid destination URL (starts with https://)
              </p>
            )}
          </div>

          {/* FIELD 4: PROFILE PREVIEW */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6872]">
              Profile preview
            </label>
            <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#ECE8EB] shrink-0 text-[#803D63]">
                  {renderTypeIcon(selectedType?.id)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#17131A]">
                    {title.trim() || "Link Title"}
                  </p>
                  <p className="truncate text-[11px] font-medium text-[#6F6872]">
                    {previewDomain}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-[#803D63] shrink-0 opacity-70" />
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8EB] mt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-4 py-2.5 text-xs font-semibold text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !url.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{isEditing ? "Saving..." : "Adding..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Add Link"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. MAIN DASHBOARD LINKS & SOCIALS PAGE
   ========================================================================== */
export default function DashboardSocialsPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, updateSocials } = useCreator();
  const { showToast } = useToast();

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  // Custom Links state
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<CustomLink | null>(null);

  // Draft handle inputs for unconnected platforms
  const [draftInsta, setDraftInsta] = useState(() => extractUsername(socials?.instagram?.url || ""));
  const [draftYt, setDraftYt] = useState(() => extractUsername(socials?.youtube?.url || ""));
  const [draftFb, setDraftFb] = useState(() => extractUsername(socials?.facebook?.url || ""));

  // Modals
  const [disconnectModal, setDisconnectModal] = useState<{
    platform: "instagram" | "youtube" | "facebook";
    platformName: string;
    handle: string;
  } | null>(null);
  const [submittingDisconnect, setSubmittingDisconnect] = useState(false);

  const [linkToDelete, setLinkToDelete] = useState<CustomLink | null>(null);

  // Connected handles & booleans (safe optional chaining)
  const instaConnectedHandle = extractUsername(socials?.instagram?.url || "") || socials?.instagram?.username || "";
  const ytConnectedHandle = extractUsername(socials?.youtube?.url || "") || socials?.youtube?.username || "";
  const fbConnectedHandle = extractUsername(socials?.facebook?.url || "") || socials?.facebook?.username || "";

  const isInstaConnected = Boolean(socials?.instagram?.url || (socials?.instagram?.followers ?? 0) > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials?.youtube?.url || (socials?.youtube?.subscribers ?? 0) > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials?.facebook?.url || (socials?.facebook?.followers ?? 0) > 0 || fbConnectedHandle);

  const connectedCount = [isInstaConnected, isYtConnected, isFbConnected].filter(Boolean).length;

  // Load custom links on mount
  useEffect(() => {
    const localLinks = customLinksRepository.get();
    setLinks(Array.isArray(localLinks) ? localLinks : []);

    const authSession = authRepository.get();
    if (authSession?.email) {
      fetch(`/api/creator/custom-links?email=${encodeURIComponent(authSession.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.links)) {
            setLinks(data.links);
            customLinksRepository.save(data.links);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Save links helper
  const persistLinks = async (updatedList: CustomLink[]) => {
    setLinks(updatedList);
    customLinksRepository.save(updatedList);

    const authSession = authRepository.get();
    if (authSession?.email) {
      try {
        await fetch("/api/creator/custom-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authSession.email,
            links: updatedList,
          }),
        });
      } catch (err) {
        console.warn("Failed to sync custom links to cloud DB:", err);
      }
    }
  };

  // Add / Edit Custom Link
  const handleSaveCustomLink = async (title: string, url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let updatedList: CustomLink[];
    if (linkToEdit) {
      updatedList = links.map((l) => (l.id === linkToEdit.id ? { ...l, title, url: cleanUrl } : l));
      showToast("Link updated! ✨");
    } else {
      if (links.length >= MAX_CUSTOM_LINKS) {
        showToast("Maximum of 3 custom links reached during Early Access.", "info");
        return;
      }
      const newLink: CustomLink = {
        id: `link_${Date.now()}`,
        title,
        url: cleanUrl,
        isEnabled: true,
      };
      updatedList = [...links, newLink];
      showToast("Link added to public profile! ✨");
    }
    await persistLinks(updatedList);
  };

  // Move custom link order
  const handleMoveLink = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const updated = [...links];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    await persistLinks(updated);
    showToast("Link order updated! ✨");
  };

  // Delete custom link
  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    const updated = links.filter((l) => l.id !== linkToDelete.id);
    await persistLinks(updated);
    showToast("Link removed! 🗑️");
    setLinkToDelete(null);
  };

  // Sync single platform trigger
  const handleSyncPlatform = async (platform: "instagram" | "youtube" | "facebook") => {
    setSyncingPlatform(platform);
    updateSocials({});
    showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} audience stats refreshed! ✨`);
    setTimeout(() => setSyncingPlatform(null), 400);
  };

  // Disconnect Execution
  const handleExecuteDisconnect = async () => {
    if (!disconnectModal) return;
    setSubmittingDisconnect(true);
    const { platform } = disconnectModal;
    const email = authRepository.getPendingEmail() || profile.email;

    try {
      if (platform === "instagram") {
        updateSocials({ instagram: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", biography: "", lastSyncedAt: "" } });
        setDraftInsta("");
      } else if (platform === "youtube") {
        updateSocials({ youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0, username: "", channelTitle: "", avatarUrl: "", description: "", lastSyncedAt: "" } });
        setDraftYt("");
      } else if (platform === "facebook") {
        updateSocials({ facebook: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", intro: "", lastSyncedAt: "" } });
        setDraftFb("");
      }

      if (email) {
        await fetch(`/api/creator/socials?email=${encodeURIComponent(email)}&platform=${platform}`, {
          method: "DELETE",
        });
      }
      showToast(`${disconnectModal.platformName} disconnected!`);
      setDisconnectModal(null);
    } catch (err) {
      console.error("Failed to disconnect social account:", err);
      showToast("Could not disconnect account. Please try again.", "error");
    } finally {
      setSubmittingDisconnect(false);
    }
  };

  // Summary connected names list
  const connectedNamesText = useMemo(() => {
    const list: string[] = [];
    if (isInstaConnected) list.push("Instagram");
    if (isYtConnected) list.push("YouTube");
    if (isFbConnected) list.push("Facebook");
    if (list.length === 0) return "Connect platforms to show reach";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list[0]}, ${list[1]} and ${list[2]}`;
  }, [isInstaConnected, isYtConnected, isFbConnected]);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
          Links &amp; Socials
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
          Connect your platforms and manage the links shown on your creator profile.
        </p>
      </div>

      {/* 2. CONNECTED-PRESENCE SUMMARY (3 cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Connected Accounts */}
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6872] uppercase tracking-wider">
              Connected Accounts
            </span>
            <Share2 className="h-4 w-4 text-[#803D63]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#17131A]">
            {connectedCount} of 3
          </p>
          <p className="text-[11px] text-[#6F6872] font-medium truncate" title={connectedNamesText}>
            {connectedNamesText}
          </p>
        </div>

        {/* Card 2: Total Fanbase */}
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6872] uppercase tracking-wider">
              Total Fanbase
            </span>
            <span className="text-base">❤️</span>
          </div>
          <p className="font-display text-2xl font-bold text-[#17131A]">
            {formatCount(totalAudience || 0)}
          </p>
          <p className="text-[11px] text-[#6F6872] font-medium">
            Combined connected audience
          </p>
        </div>

        {/* Card 3: Custom Links */}
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6872] uppercase tracking-wider">
              Custom Links
            </span>
            <Link2 className="h-4 w-4 text-[#803D63]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#17131A]">
            {links.length} of {MAX_CUSTOM_LINKS}
          </p>
          <p className="text-[11px] text-[#6F6872] font-medium">
            Shown on your public profile
          </p>
        </div>
      </section>

      {/* 3. SOCIAL ACCOUNTS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="font-display text-base font-bold text-[#17131A]">
              Social accounts
            </h2>
            <p className="text-xs text-[#6F6872] font-medium mt-0.5">
              Connect your official profiles and keep your public audience information updated.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#6F6872]">
            {connectedCount} connected
          </span>
        </div>

        {/* Connected Cards Grid (3 Columns) */}
        {connectedCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* INSTAGRAM CONNECTED CARD */}
            {isInstaConnected && (
              <ConnectedSocialCard
                platformName="Instagram"
                icon={<InstagramIcon className="h-4 w-4" />}
                handle={instaConnectedHandle}
                displayName={socials?.instagram?.name || "Instagram Profile"}
                isVerified={socials?.instagram?.isVerified}
                count={socials?.instagram?.followers || 0}
                countLabel="Followers"
                lastSyncedAt={socials?.instagram?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.instagram?.url || `https://instagram.com/${instaConnectedHandle}`}
                isSyncing={syncingPlatform === "instagram"}
                onSync={() => handleSyncPlatform("instagram")}
                onDisconnect={() =>
                  setDisconnectModal({
                    platform: "instagram",
                    platformName: "Instagram",
                    handle: instaConnectedHandle,
                  })
                }
              />
            )}

            {/* YOUTUBE CONNECTED CARD */}
            {isYtConnected && (
              <ConnectedSocialCard
                platformName="YouTube"
                icon={<YoutubeIcon className="h-4 w-4" />}
                handle={ytConnectedHandle}
                displayName={socials?.youtube?.channelTitle || "YouTube Channel"}
                isVerified={socials?.youtube?.isVerified}
                count={socials?.youtube?.subscribers || 0}
                countLabel="Subscribers"
                lastSyncedAt={socials?.youtube?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.youtube?.url || `https://youtube.com/@${ytConnectedHandle}`}
                isSyncing={syncingPlatform === "youtube"}
                onSync={() => handleSyncPlatform("youtube")}
                onDisconnect={() =>
                  setDisconnectModal({
                    platform: "youtube",
                    platformName: "YouTube",
                    handle: ytConnectedHandle,
                  })
                }
              />
            )}

            {/* FACEBOOK CONNECTED CARD */}
            {isFbConnected && (
              <ConnectedSocialCard
                platformName="Facebook"
                icon={<FacebookIcon className="h-4 w-4" />}
                handle={fbConnectedHandle}
                displayName={socials?.facebook?.name || "Facebook Page"}
                isVerified={socials?.facebook?.isVerified}
                count={socials?.facebook?.followers || 0}
                countLabel="Page Followers"
                lastSyncedAt={socials?.facebook?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.facebook?.url || `https://facebook.com/${fbConnectedHandle}`}
                isSyncing={syncingPlatform === "facebook"}
                onSync={() => handleSyncPlatform("facebook")}
                onDisconnect={() =>
                  setDisconnectModal({
                    platform: "facebook",
                    platformName: "Facebook",
                    handle: fbConnectedHandle,
                  })
                }
              />
            )}
          </div>
        ) : null}

        {/* CONNECT ANOTHER PLATFORM SECTION (If any platform unconnected) */}
        {connectedCount < 3 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-sm font-bold text-[#17131A] text-[#6F6872] uppercase tracking-wider">
              {connectedCount === 0 ? "Connect your creator accounts" : "Connect another platform"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Instagram Unconnected */}
              {!isInstaConnected && (
                <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-3 shadow-2xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shrink-0">
                      <InstagramIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-[#17131A]">Instagram</h4>
                      <p className="text-[11px] text-[#6F6872]">Show your profile and follower count.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                      <input
                        type="text"
                        value={draftInsta}
                        onChange={(e) => setDraftInsta(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="Instagram username"
                        className="w-full rounded-xl border border-[#ECE8EB] bg-white pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63]"
                      />
                    </div>
                    <InstagramFetcher username={draftInsta} />
                  </div>
                </div>
              )}

              {/* YouTube Unconnected */}
              {!isYtConnected && (
                <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-3 shadow-2xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                      <YoutubeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-[#17131A]">YouTube</h4>
                      <p className="text-[11px] text-[#6F6872]">Show your channel and subscriber count.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                      <input
                        type="text"
                        value={draftYt}
                        onChange={(e) => setDraftYt(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="YouTube channel handle"
                        className="w-full rounded-xl border border-[#ECE8EB] bg-white pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63]"
                      />
                    </div>
                    <YoutubeFetcher handle={draftYt} />
                  </div>
                </div>
              )}

              {/* Facebook Unconnected */}
              {!isFbConnected && (
                <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-3 shadow-2xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                      <FacebookIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-[#17131A]">Facebook</h4>
                      <p className="text-[11px] text-[#6F6872]">Show your page and follower count.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                      <input
                        type="text"
                        value={draftFb}
                        onChange={(e) => setDraftFb(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="Facebook page username"
                        className="w-full rounded-xl border border-[#ECE8EB] bg-white pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63]"
                      />
                    </div>
                    <FacebookFetcher username={draftFb} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. CUSTOM LINKS SECTION */}
      <section className="space-y-3">
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
              Early Access • {links.length} of {MAX_CUSTOM_LINKS} links
            </span>
            <button
              type="button"
              onClick={() => {
                if (links.length >= MAX_CUSTOM_LINKS) {
                  showToast("Maximum of 3 custom links reached during Early Access.", "info");
                  return;
                }
                setLinkToEdit(null);
                setIsLinkModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Custom Links List */}
        {links.length === 0 ? (
          <div className="rounded-2xl border border-[#ECE8EB] bg-white p-6 text-center space-y-2 shadow-2xs">
            <p className="text-xs font-bold text-[#17131A]">Add your first custom link</p>
            <p className="text-xs text-[#6F6872] max-w-sm mx-auto">
              Give followers one-tap access to your latest content, booking page, store or community.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setLinkToEdit(null);
                  setIsLinkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#ECE8EB] bg-white divide-y divide-[#ECE8EB] overflow-hidden shadow-2xs">
            {links.map((link, index) => (
              <CustomLinkRow
                key={link.id || index}
                link={link}
                index={index}
                total={links.length}
                onEdit={() => {
                  setLinkToEdit(link);
                  setIsLinkModalOpen(true);
                }}
                onDelete={() => setLinkToDelete(link)}
                onMove={(dir) => handleMoveLink(index, dir)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. PUBLIC DATA ACCESS DISCLOSURE (Compact Panel) */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-4 sm:p-5 text-left space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#803D63]" />
            <h3 className="font-display text-xs sm:text-sm font-bold text-[#17131A]">
              How social data works
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16794A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
            <span className="h-1 w-1 rounded-full bg-[#16794A]" />
            Public-data access active
          </span>
        </div>

        <p className="text-xs text-[#6F6872] font-medium leading-relaxed">
          Inflixo reads publicly available profile information (such as your public handle, name, and audience count) to display connected channels and calculate Total Fanbase.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#6F6872] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#803D63]" />
            <span>Public profile information only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#803D63]" />
            <span>Inflixo never receives your social-platform password</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#803D63]" />
            <span>Disconnect an account at any time</span>
          </div>
        </div>
      </section>

      {/* 6. MODALS */}
      {/* Centred Custom Link Modal */}
      <CustomLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        linkToEdit={linkToEdit}
        onSave={handleSaveCustomLink}
      />

      {/* Disconnect Social Modal */}
      <ConfirmModal
        isOpen={Boolean(disconnectModal)}
        onClose={() => setDisconnectModal(null)}
        onConfirm={handleExecuteDisconnect}
        loading={submittingDisconnect}
        title={`Disconnect ${disconnectModal?.platformName}?`}
        description={`@${disconnectModal?.handle} will be removed from your Inflixo profile, and its audience count will no longer be included in Total Fanbase.`}
        confirmText="Disconnect"
        cancelText="Cancel"
      />

      {/* Delete Custom Link Modal */}
      <ConfirmModal
        isOpen={Boolean(linkToDelete)}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleDeleteLink}
        title="Delete this link?"
        description={`"${linkToDelete?.title}" will be removed from your public creator profile.`}
        confirmText="Delete Link"
        cancelText="Cancel"
      />
    </div>
  );
}

/* ==========================================================================
   3. CONNECTED SOCIAL CARD SUB-COMPONENT
   ========================================================================== */
interface ConnectedSocialCardProps {
  platformName: string;
  icon: React.ReactNode;
  handle: string;
  displayName: string;
  isVerified?: boolean;
  count: number;
  countLabel: string;
  lastSyncedAt?: string;
  profileUrl: string;
  isSyncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

function ConnectedSocialCard({
  platformName,
  icon,
  handle,
  displayName,
  isVerified,
  count,
  countLabel,
  lastSyncedAt,
  profileUrl,
  isSyncing,
  onSync,
  onDisconnect,
}: ConnectedSocialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-3 shadow-2xs text-left flex flex-col justify-between">
      {/* Top: Icon & Connected Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shrink-0">{icon}</div>
          <h3 className="font-display text-xs font-bold text-[#17131A]">{platformName}</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16794A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
          <span className="h-1 w-1 rounded-full bg-[#16794A]" />
          Connected
        </span>
      </div>

      {/* Identity & Audience */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <p className="font-bold text-xs text-[#17131A] truncate" title={displayName}>
            {displayName}
          </p>
          {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        </div>
        <p className="text-[11px] text-[#6F6872] font-medium truncate">@{handle}</p>
        <p className="font-display text-lg font-bold text-[#17131A] pt-1">
          {formatCount(count)}{" "}
          <span className="text-xs font-normal text-[#6F6872]">{countLabel}</span>
        </p>
      </div>

      {/* Bottom: Sync status & Actions */}
      <div className="pt-2 border-t border-[#ECE8EB] flex items-center justify-between text-[11px] text-[#6F6872]">
        <span className="truncate max-w-[120px]" title={lastSyncedAt ? formatSyncDate(lastSyncedAt) : "Synced"}>
          Synced {lastSyncedAt ? formatSyncDate(lastSyncedAt) : "just now"}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 rounded-lg border border-[#ECE8EB] bg-[#FAF8FA] hover:bg-[#F7EDF3] hover:text-[#803D63] px-2 py-1 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh audience stats"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#803D63]" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ECE8EB] bg-[#FAF8FA] text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
              aria-label="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1.5 w-40 rounded-xl border border-[#ECE8EB] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17131A] hover:bg-[#FAF8FA] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#6F6872]" />
                  <span>Open Profile</span>
                </a>

                <div className="my-1 border-t border-[#ECE8EB]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDisconnect();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. CUSTOM LINK ROW SUB-COMPONENT
   ========================================================================== */
interface CustomLinkRowProps {
  link: CustomLink;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}

function CustomLinkRow({ link, index, total, onEdit, onDelete, onMove }: CustomLinkRowProps) {
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const domain = extractDomain(link.url);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopy = async () => {
    setMenuOpen(false);
    const success = await copyToClipboard(link.url);
    if (success) {
      showToast("Link URL copied! ✨");
    }
  };

  return (
    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAFAFB] transition-colors text-left">
      {/* Left: Order badge & Link Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FAF8FA] border border-[#ECE8EB] text-[10px] font-bold text-[#6F6872] shrink-0">
          0{index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#17131A]">{link.title}</p>
          <p className="truncate text-[11px] font-medium text-[#6F6872] mt-0.5">{domain}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-2.5 py-1 text-xs font-semibold text-[#17131A] transition-colors"
          title="Open link in new tab"
        >
          <span className="hidden sm:inline">Open</span>
          <ExternalLink className="h-3 w-3 text-[#803D63]" />
        </a>

        {/* Reorder buttons if multiple */}
        {total > 1 && (
          <div className="hidden sm:flex items-center gap-0.5 border border-[#ECE8EB] rounded-lg bg-white overflow-hidden">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove("up")}
              className="p-1 text-[#6F6872] hover:bg-[#FAF8FA] disabled:opacity-30 cursor-pointer"
              title="Move Up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMove("down")}
              className="p-1 text-[#6F6872] hover:bg-[#FAF8FA] disabled:opacity-30 cursor-pointer"
              title="Move Down"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
            aria-label="More actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#ECE8EB] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17131A] hover:bg-[#FAF8FA] transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-[#6F6872]" />
                <span>Edit Link</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17131A] hover:bg-[#FAF8FA] transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-[#6F6872]" />
                <span>Copy Link</span>
              </button>

              <div className="my-1 border-t border-[#ECE8EB]" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
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
}
