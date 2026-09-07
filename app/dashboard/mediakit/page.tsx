"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Sparkles,
  Plus,
  Trash2,
  Share2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check,
  X,
  FileSpreadsheet,
  Film,
  Tv,
  Play,
  Layers,
  Link2,
  Globe,
  MoreVertical,
  Pencil,
  Power,
  SlidersHorizontal,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  LinkedinIcon,
  XTwitterIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { MediaKitService, SAMPLE_PACKAGES } from "@/services/MediaKitService";
import { MediaKitPackage, MediaKitSettings, CustomLink } from "@/types";
import { authRepository, customLinksRepository } from "@/repositories/localRepository";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { canCreateGig } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

// 10 Tailored Deliverable Suggestion Chips per Platform Type
const DELIVERABLE_SUGGESTIONS: Record<string, string[]> = {
  "Instagram Reel": [
    "1x 30–60s Dedicated/Integrated Reel",
    "Brand Collaborator Tag & Co-authoring",
    "Direct Promo Link in Bio (24 Hours)",
    "30 Days Digital Usage Rights",
    "1x Companion Instagram Story with Link",
    "Pinned Comment with Tracked Link",
    "Product Placement in Opening Hook",
    "Raw Video Footage Access for Brand Ads",
    "Custom Audio / Sound Track Licensing",
    "Detailed Impression & Reach Analytics",
  ],
  "Instagram Bundle": [
    "3x Targeted Instagram Reels",
    "3x Companion Stories with Direct Links",
    "Collaborator Co-Author Tag on all posts",
    "45 Days Digital Usage & Whitelisting Rights",
    "Bio Promo Link for Full Campaign Duration",
    "Product Tagging in Reel & Stories",
    "Dedicated Unboxing / First Impression Reel",
    "Pinned Comments with Promo Codes",
    "RAW High-Res Footage for Performance Ads",
    "Weekly Performance & Engagement Reporting",
  ],
  "Instagram Story": [
    "3x Sequential Story Slides with Direct Swipe/Link",
    "Brand Mention Tag @BrandName",
    "Exclusive Discount Promo Code Display",
    "Interactive Poll / Question Sticker Engagement",
    "Story Saved to Creator's Profile Highlights",
    "Raw Story Analytics Screenshot Delivery",
    "Swipe-Up Link Tracking",
    "Call-To-Action (CTA) Voiceover",
    "High-Resolution Product Closeups",
    "24-Hour Active Link Guarantee",
  ],
  "YouTube Dedicated Video": [
    "1x Dedicated 8–15 Min Product Breakdown Video",
    "First Link in Description & Pinned Comment",
    "Verbal CTA with Discount Promo Code",
    "Custom Logo Watermark & Graphic Overlay",
    "YouTube Community Post & Story Shoutout",
    "No Competitor Brand Mentions in Video",
    "Permanent Video Listing (No Expiry)",
    "Full Commercial Rights & Ad Whitelisting",
    "Unboxing + In-Depth Feature Review",
    "Full Audience Viewership Analytics",
  ],
  "YouTube Video Integration": [
    "60–90s Dedicated Product Segment in Main Video",
    "Description Top Link & Pinned Comment",
    "Verbal Product Call-To-Action",
    "On-Screen Brand Logo Overlay",
    "Companion YouTube Shorts Clip",
    "Permanent Placement in Video",
    "No Category Competitor Sponsorship",
    "Exclusive Discount Code for Viewers",
    "High-CTR Thumbnail Feature Option",
    "Full Commercial Usage Rights (60 Days)",
  ],
  "YouTube Shorts": [
    "1x 30–60s High-Retention YouTube Short",
    "Pinned Comment with Direct Website Link",
    "Product Tagging & Shopping Link",
    "Sound Licensing & Custom BGM",
    "Cross-Promotion on Instagram Reels",
    "30 Days Ad Usage & Whitelisting Rights",
    "High-Impact Visual Hook Placement",
    "Permanent Short Listing on Channel",
    "Verbal CTA & Discount Code",
    "Audience Demographic Report",
  ],
  "Multi-Platform Campaign": [
    "Cross-Platform Campaign (Reels + Shorts + Stories)",
    "Unified Brand Messaging across Platforms",
    "Permanent Bio Link on Instagram & YouTube",
    "60 Days Digital Usage & Ad Rights",
    "Product Placement in 3+ Videos",
    "Collaborator Co-Author Tag on Instagram",
    "Dedicated Story Highlights & Posts",
    "Raw Content Clips for Performance Ads",
    "Comprehensive Cross-Platform Analytics Report",
    "Priority Fast Turnaround Delivery",
  ],
  "Series Title Sponsorship": [
    "Main Series Title Sponsor ('Presented by Brand')",
    "15s Pre-Roll & Post-Roll Sponsor Billboard",
    "Brand Logo on All Episode Posters & Cards",
    "Product Integration inside Series Storyline",
    "Dedicated Sponsored Finale / Special Episode",
    "Custom Promo Link in Every Episode Description",
    "Category Exclusivity (Zero Competitor Ads)",
    "Social Media Co-Promotion across Reels & Shorts",
    "Closing Credits Special Thanks & Logo",
    "Full Rights to Series Stills & Promo Clips",
  ],
  "Podcast Episode Integration": [
    "60s Host-Read Audio Segment & Shoutout",
    "Logo & Link in Podcast Episode Notes",
    "Video Podcast On-Screen Banner Overlay",
    "Short Clip Excerpt for Reels & TikTok",
    "Exclusive Viewer / Listener Discount Code",
    "Permanent Audio Placement in Episode",
    "Social Media Promo Post across Channels",
    "Host Product Testimonial & Endorsement",
    "Category Exclusivity for Podcast Episode",
    "Listener Impression & Download Analytics",
  ],
  "Monthly Creator Retainer": [
    "4x–8x Monthly Dedicated Content Deliverables",
    "Exclusive Brand Ambassador Status & Tag",
    "Permanent Bio Link Placement (30 Days)",
    "Raw High-Res Footage Access for Performance Ads",
    "Full Commercial & Whitelisting Rights (90 Days)",
    "Monthly Strategy Sync & Campaign Reporting",
    "First Rights to New Series / Feature Placements",
    "Category Exclusivity across Creator's Channels",
    "Co-Author Collaboration Tag on All Reels",
    "Priority Content Turnaround & Fast Edits",
  ],
};

function formatCurrencyString(rawStr: string): string {
  if (!rawStr) return "";
  const trimmed = rawStr.trim();
  if (trimmed.startsWith("₹")) return trimmed;
  const num = parseInt(trimmed.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return trimmed;
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatDeliveryDays(days: number): string {
  if (!days || days <= 1) return "1-day delivery";
  return `${days}-day delivery`;
}

function formatPriceClean(price: string): string {
  if (!price) return "Contact for pricing";
  return price.replace(/\s*–\s*/g, "–").replace(/\s*-\s*/g, "–");
}

export default function DashboardMediaKitPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, series, subscription } = useCreator();
  const { showToast } = useToast();

  const totalSeriesCount = series ? series.length : 0;
  const totalEpisodesCount = series
    ? series.reduce((acc: number, ser: any) => {
      const epCount = ser.seasons
        ? ser.seasons.reduce((sAcc: number, season: any) => sAcc + (season.episodes?.length || 0), 0)
        : (ser.episodesCount || 0);
      return acc + epCount;
    }, 0)
    : 0;

  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<MediaKitPackage | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Form inputs for package modal
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState<string>("Instagram Reel");
  const [formMinPrice, setFormMinPrice] = useState("");
  const [formMaxPrice, setFormMaxPrice] = useState("");
  const [formPackageName, setFormPackageName] = useState("");
  const [formTurnaround, setFormTurnaround] = useState<number>(2);
  const [formDeliverableInput, setFormDeliverableInput] = useState("");
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);

  // Public Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"mediakit" | "series">("mediakit");
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);

  const activeEmail = profile.email || authRepository.getPendingEmail() || "";
  const activeCreatorId = profile.id;
  const activeUsername = profile.username;
  const creatorQueryKey = activeCreatorId || activeEmail || activeUsername || "";

  const isInstaConnected = Boolean(socials?.instagram?.url || (socials?.instagram?.followers ?? 0) > 0);
  const isYtConnected = Boolean(socials?.youtube?.url || (socials?.youtube?.subscribers ?? 0) > 0);
  const isFbConnected = Boolean(socials?.facebook?.url || (socials?.facebook?.followers ?? 0) > 0);
  const connectedPlatformsCount = [isInstaConnected, isYtConnected, isFbConnected].filter(Boolean).length;

  const activeServicesCount = useMemo(() => packages.filter((p) => p.isActive).length, [packages]);

  const hasContactConfigured = Boolean(settings.whatsappNumber || settings.sponsorEmail || profile.email);

  useEffect(() => {
    setCustomLinks(customLinksRepository.get());
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    async function initMediaKit() {
      if (creatorQueryKey) {
        const { settings: dbSettings, packages: dbPackages } = await MediaKitService.fetchFromDb(creatorQueryKey, activeCreatorId);
        setPackages(dbPackages);
        setSettings({
          ...dbSettings,
          sponsorEmail: dbSettings.sponsorEmail ?? "",
          whatsappNumber: dbSettings.whatsappNumber ?? "",
          minBudget: dbSettings.minBudget ?? "",
        });
      }
    }
    initMediaKit();
  }, [creatorQueryKey, activeCreatorId]);

  const handleSaveSettings = async () => {
    MediaKitService.saveSettings(settings);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, packages, activeCreatorId);
    }
    setIsEditingSettings(false);
    showToast("Contact routing settings saved! 💼");
  };

  const handleOpenAddModal = () => {
    if (!canCreateGig(packages.length, subscription?.planKey)) {
      setIsLimitModalOpen(true);
      return;
    }
    setEditingPkgId(null);
    setFormTitle("");
    setFormPlatform("Instagram Reel");
    setFormMinPrice("");
    setFormMaxPrice("");
    setFormPackageName("");
    setFormTurnaround(2);
    setFormDeliverableInput("");
    setFormDeliverables([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    setEditingPkgId(pkg.id);
    setFormTitle(pkg.title);
    setFormPlatform(pkg.platform);
    if (pkg.minPrice) {
      setFormMinPrice(pkg.minPrice);
      setFormMaxPrice(pkg.maxPrice || "");
    } else if (pkg.price.includes("–") || pkg.price.includes("-")) {
      const parts = pkg.price.split(/[–-]/).map((s) => s.trim());
      setFormMinPrice(parts[0] || "₹0");
      setFormMaxPrice(parts[1] || "");
    } else {
      setFormMinPrice(pkg.price);
      setFormMaxPrice("");
    }
    setFormPackageName(pkg.packageName || pkg.badge || "");
    setFormTurnaround(pkg.turnaroundDays);
    setFormDeliverableInput("");
    setFormDeliverables([...pkg.deliverables]);
    setIsModalOpen(true);
  };

  const handleAddDeliverable = () => {
    if (!formDeliverableInput.trim()) return;
    setFormDeliverables([...formDeliverables, formDeliverableInput.trim()]);
    setFormDeliverableInput("");
  };

  const handleRemoveDeliverable = (index: number) => {
    setFormDeliverables(formDeliverables.filter((_, i) => i !== index));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMinPrice.trim()) {
      showToast("Please enter a package title and minimum price", "error");
      return;
    }

    const minStr = formatCurrencyString(formMinPrice);
    const maxStr = formMaxPrice.trim() ? formatCurrencyString(formMaxPrice) : "";
    const formattedPrice = maxStr ? `${minStr}–${maxStr}` : minStr;
    const resolvedBadge = formPackageName.trim() || undefined;
    const resolvedIsPopular = formPackageName.toLowerCase().includes("popular");

    let updatedPkgs: MediaKitPackage[] = [];
    if (editingPkgId) {
      updatedPkgs = packages.map((p) =>
        p.id === editingPkgId
          ? {
            ...p,
            title: formTitle.trim(),
            platform: formPlatform,
            price: formattedPrice,
            minPrice: minStr,
            maxPrice: maxStr || undefined,
            packageName: formPackageName.trim() || undefined,
            turnaroundDays: Number(formTurnaround) || 2,
            deliverables: formDeliverables.length > 0 ? formDeliverables : ["Product Integration"],
            badge: resolvedBadge,
            isPopular: resolvedIsPopular,
          }
          : p
      );
    } else {
      const newPkg: MediaKitPackage = {
        id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        platform: formPlatform,
        price: formattedPrice,
        minPrice: minStr,
        maxPrice: maxStr || undefined,
        packageName: formPackageName.trim() || undefined,
        turnaroundDays: Number(formTurnaround) || 2,
        deliverables: formDeliverables.length > 0 ? formDeliverables : ["Product Integration"],
        badge: resolvedBadge,
        isPopular: resolvedIsPopular,
        isActive: true,
      };
      updatedPkgs = [newPkg, ...packages];
    }

    setPackages(updatedPkgs);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updatedPkgs, activeCreatorId);
    }
    showToast(editingPkgId ? "Service updated! ✨" : "New service published! 🚀");
    setIsModalOpen(false);
  };

  const handleTogglePackageActive = async (id: string, currentActive: boolean) => {
    setActiveMenuId(null);
    const updated = packages.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p));
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Service ${!currentActive ? "activated" : "paused"}.`);
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    const updated = packages.filter((p) => p.id !== packageToDelete.id);
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Service "${packageToDelete.title}" removed.`);
    setPackageToDelete(null);
  };

  const handleLoadSampleGigs = async () => {
    setPackages(SAMPLE_PACKAGES);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, SAMPLE_PACKAGES, activeCreatorId);
    }
    showToast("Sample collaboration services loaded! ✨");
  };

  const handleShareMediaKit = async () => {
    const handle = profile.username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}?view=mediakit`
      : `https://inflixo.com/${handle}?view=mediakit`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast("Profile link copied to clipboard! 💼✨");
    } else {
      showToast("Could not copy link", "error");
    }
  };

  const handleShareService = async (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    const handle = profile.username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}?view=mediakit`
      : `https://inflixo.com/${handle}?view=mediakit`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast(`Link for "${pkg.title}" copied! ✨`);
    }
  };

  const handleExportPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleStr = profile.username || "username";
  const cleanPhone = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");

  const getServicePlatformBadge = (pkg: MediaKitPackage) => {
    const platform = (pkg.platform || "").toLowerCase();
    if (platform.includes("instagram")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white shrink-0 shadow-2xs">
          <InstagramIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("youtube")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF0000] text-white shrink-0 shadow-2xs">
          <YoutubeIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("facebook")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white shrink-0 shadow-2xs">
          <FacebookIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("linkedin")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A66C2] text-white shrink-0 shadow-2xs">
          <LinkedinIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("twitter") || platform.includes("x ")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#000000] text-white shrink-0 shadow-2xs">
          <XTwitterIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("spotify") || platform.includes("podcast")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1DB954] text-white shrink-0 shadow-2xs">
          <SpotifyIcon className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (platform.includes("series") || platform.includes("ott")) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] shrink-0">
          <Film className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] font-bold text-xs shrink-0">
        <Briefcase className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
            Services &amp; Brand Work
          </h1>
          <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
            Show brands how they can work with you and manage your collaboration details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleShareMediaKit}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-[#600a0f]" />
            <span>Share Profile</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 1 — BRAND-READY COLLABORATION PROFILE SUMMARY */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 text-left space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E3DC] pb-3">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Your collaboration profile
            </h2>
            <p className="text-[11px] sm:text-xs text-[#797570] font-medium mt-0.5">
              Give brands a clear view of your audience, services and ways to contact you.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActivePreviewTab("mediakit");
              setIsPreviewModalOpen(true);
            }}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f]/[0.09] hover:bg-[#600a0f]/15 px-3 py-1.5 text-xs font-semibold text-[#600a0f] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Profile</span>
          </button>
        </div>

        {/* 3 Compact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">
              Total Fanbase
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              {formatCount(totalAudience || 0)}
            </p>
            <p className="text-[11px] text-[#797570] font-medium">
              Across {connectedPlatformsCount || 1} connected {connectedPlatformsCount === 1 ? "account" : "accounts"}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">
              Active Services
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              {activeServicesCount}
            </p>
            <p className="text-[11px] text-[#797570] font-medium">
              Available for brand enquiries
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">
              Contact Setup
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${hasContactConfigured ? "bg-[#EAF7F0] text-[#17845B]" : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasContactConfigured ? "bg-[#17845B]" : "bg-amber-600"}`} />
                {hasContactConfigured ? "Active" : "Action Needed"}
              </span>
            </div>
            <p className="text-[11px] text-[#797570] font-medium">
              {hasContactConfigured ? "WhatsApp and business email" : "Set up contact options below"}
            </p>
          </div>
        </div>

        {/* Connected Audience Breakdown */}
        <div className="pt-3.5 border-t border-[#E7E3DC] space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-bold text-[#181716] uppercase tracking-wider">
              Connected audience overview
            </h3>
            <span className="text-[11px] text-[#797570] font-medium">
              Audience counts from your connected social profiles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Instagram */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 shrink-0">
                  <InstagramIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#181716]">Instagram</p>
                  <p className="text-[10px] text-[#797570] truncate">@{socials.instagram?.username || handleStr}</p>
                </div>
              </div>
              <p className="font-display text-xs font-bold text-[#181716] shrink-0">
                {formatCount(socials.instagram?.followers || 0)}{" "}
                <span className="font-normal text-[10px] text-[#797570]">followers</span>
              </p>
            </div>

            {/* YouTube */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <YoutubeIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#181716]">YouTube</p>
                  <p className="text-[10px] text-[#797570] truncate">
                    {socials.youtube?.channelTitle || `@${socials.youtube?.username || handleStr}`}
                  </p>
                </div>
              </div>
              <p className="font-display text-xs font-bold text-[#181716] shrink-0">
                {formatCount(socials.youtube?.subscribers || 0)}{" "}
                <span className="font-normal text-[10px] text-[#797570]">subscribers</span>
              </p>
            </div>

            {/* Facebook */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <FacebookIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#181716]">Facebook</p>
                  <p className="text-[10px] text-[#797570] truncate">
                    {socials.facebook?.name || `@${socials.facebook?.username || handleStr}`}
                  </p>
                </div>
              </div>
              <p className="font-display text-xs font-bold text-[#181716] shrink-0">
                {formatCount(socials.facebook?.followers || 0)}{" "}
                <span className="font-normal text-[10px] text-[#797570]">followers</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2 — COLLABORATION SERVICES */}
      <section className="space-y-3 sm:space-y-3.5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Creator services
            </h2>
            <p className="text-[11px] sm:text-xs text-[#797570] font-medium mt-0.5">
              Create clear collaboration options with pricing, deliverables and turnaround time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#797570]">
              {packages.length} {packages.length === 1 ? "service" : "services"}
            </span>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Service</span>
            </button>
          </div>
        </div>

        {/* Services Unified Divided List or Empty State */}
        {packages.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-8 sm:p-10 text-center space-y-3 max-w-xl mx-auto shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#600a0f]/[0.09] text-[#600a0f]">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-sm sm:text-base font-bold text-[#181716]">
                Show brands how they can work with you
              </h3>
              <p className="text-xs text-[#797570] font-medium max-w-md mx-auto leading-relaxed">
                Add your collaboration formats, starting rates, deliverables and turnaround time (sponsored reels, video integrations, story promotions).
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Service</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleGigs}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#600a0f]" />
                <span>Load Sample Services</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] shadow-xs">
            {packages.map((pkg) => {
              const displayPrice = formatPriceClean(pkg.price);
              const deliverableCount = (pkg.deliverables || []).length;

              return (
                <div
                  key={pkg.id}
                  className={`px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors text-left ${pkg.isActive ? "" : "opacity-60 bg-[#FAF8F5]/40"
                    }`}
                >
                  {/* Left: Platform Squircle Badge + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getServicePlatformBadge(pkg)}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate font-bold text-xs sm:text-[13px] text-[#181716]">{pkg.title}</h3>
                        {(pkg.packageName || pkg.badge) && (
                          <span className="text-[10px] font-semibold text-[#797570] bg-[#FAF8F5] border border-[#E7E3DC] px-1.5 py-0.5 rounded-md truncate max-w-[130px]">
                            {pkg.packageName || pkg.badge}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pkg.isActive
                            ? "bg-[#EAF7F0] text-[#17845B]"
                            : "bg-zinc-100 text-zinc-500"
                            }`}
                        >
                          {pkg.isActive ? "Active" : "Paused"}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#797570] truncate flex items-center gap-1.5 flex-wrap">
                        <span>{pkg.platform}</span>
                        <span>•</span>
                        <span>{formatDeliveryDays(pkg.turnaroundDays)}</span>
                        {deliverableCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{deliverableCount} {deliverableCount === 1 ? "deliverable" : "deliverables"}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price Tag + Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs sm:text-[13px] text-[#600a0f] text-right whitespace-nowrap">
                      {displayPrice}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(pkg)}
                        className="tap-scale hidden sm:flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                        title="Edit Service"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Three-dot menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === pkg.id ? null : pkg.id);
                          }}
                          className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {activeMenuId === pkg.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenEditModal(pkg);
                              }}
                              className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                              <span>Edit Service</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareService(pkg)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#797570]" />
                              <span>Share Link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePackageActive(pkg.id, pkg.isActive)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                              <Power className="h-3.5 w-3.5 text-[#797570]" />
                              <span>{pkg.isActive ? "Pause Service" : "Activate"}</span>
                            </button>

                            <div className="my-1 border-t border-[#E7E3DC]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setPackageToDelete(pkg);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Service</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. SECTION 3 — BRAND ENQUIRY ROUTING */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 text-left space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E3DC] pb-3">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Brand enquiries
            </h2>
            <p className="text-[11px] sm:text-xs text-[#797570] font-medium mt-0.5">
              Receive collaboration enquiries through your selected contact methods.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#600a0f]" />
            <span>{isEditingSettings ? "Close Settings" : "Manage Contact Settings"}</span>
          </button>
        </div>

        {/* Inline Edit Form when toggled */}
        {isEditingSettings ? (
          <div className="space-y-3.5 p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5]/60 border border-[#E7E3DC] animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Official WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+91 9XXXXXXXXX"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#600a0f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Business Email Address
                </label>
                <input
                  type="email"
                  value={settings.sponsorEmail || ""}
                  onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                  placeholder={profile.email || "business@example.com"}
                  className="w-full rounded-xl border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#600a0f]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Minimum Sponsorship Budget Filter (Optional)
                </label>
                <input
                  type="text"
                  value={settings.minBudget || ""}
                  onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                  placeholder="₹0 (Accept all enquiries)"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#600a0f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Bio Pitch Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={settings.bioHighlight || ""}
                  onChange={(e) => setSettings({ ...settings, bioHighlight: e.target.value })}
                  placeholder="Short pitch for brand partners..."
                  className="w-full rounded-xl border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#600a0f]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E3DC]">
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#797570] hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="tap-scale bg-[#600a0f] hover:bg-[#6F3456] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* WhatsApp Tile */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                Official WhatsApp
              </span>
              {settings.whatsappNumber ? (
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-[#181716] truncate">
                    {settings.whatsappNumber}
                  </p>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#600a0f] p-1 rounded-md hover:bg-white transition-colors"
                    title="Test WhatsApp Link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(true)}
                  className="text-xs font-semibold text-[#600a0f] hover:underline cursor-pointer"
                >
                  + Add WhatsApp Number
                </button>
              )}
            </div>

            {/* Business Email Tile */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                Business Email
              </span>
              {settings.sponsorEmail || profile.email ? (
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-[#181716] truncate">
                    {settings.sponsorEmail || profile.email}
                  </p>
                  <a
                    href={`mailto:${settings.sponsorEmail || profile.email}`}
                    className="text-[#600a0f] p-1 rounded-md hover:bg-white transition-colors"
                    title="Test Email Link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(true)}
                  className="text-xs font-semibold text-[#600a0f] hover:underline cursor-pointer"
                >
                  + Add Business Email
                </button>
              )}
            </div>

            {/* Min Budget Filter Tile */}
            <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                Min. Deal Filter
              </span>
              <p className="text-xs font-bold text-[#181716]">
                {settings.minBudget
                  ? settings.minBudget === "0" || settings.minBudget === "₹0"
                    ? "Accept all deals"
                    : `${settings.minBudget}+`
                  : "Accept all deals"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 5. SECTION 4 — OTT PRODUCTION TRACK RECORD */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 text-left space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E3DC] pb-3">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#600a0f]" />
            <h2 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Production track record
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#797570]">
            Series and episode catalog shown to brand partners
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-3 sm:p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600a0f]/[0.09] text-[#600a0f] shrink-0">
              <Film className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                Total Created Series
              </span>
              <p className="font-display text-lg sm:text-xl font-bold text-[#181716]">
                {totalSeriesCount} {totalSeriesCount === 1 ? "Series" : "Series"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 p-3 sm:p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600a0f]/[0.09] text-[#600a0f] shrink-0">
              <Tv className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                Total Published Episodes
              </span>
              <p className="font-display text-lg sm:text-xl font-bold text-[#181716]">
                {totalEpisodesCount} {totalEpisodesCount === 1 ? "Episode" : "Episodes"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. CREATE / EDIT GIG MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingPkgId ? "Edit Service" : "Create Service"}
        description="Set up your collaboration package, deliverables, and rates."
        icon={<Briefcase className="h-4 w-4" />}
      >
        <form id="gig-form" onSubmit={handleSavePackage} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">Service title <span className="text-[#C2414B]">*</span></label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., 1x Instagram Reel or 3x Reels Pack"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">Platform type</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="Instagram Reel">Instagram Reel</option>
                  <option value="Instagram Bundle">Instagram Bundle (Reels + Stories)</option>
                  <option value="Instagram Story">Instagram Story Sponsorship</option>
                  <option value="YouTube Dedicated Video">YouTube Dedicated Video</option>
                  <option value="YouTube Video Integration">YouTube Integration (60-90s)</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Multi-Platform Campaign">Multi-Platform Campaign</option>
                  <option value="Series Title Sponsorship">Series Title Sponsorship ("Presented by")</option>
                  <option value="Podcast Episode Integration">Podcast Episode Integration</option>
                  <option value="Monthly Creator Retainer">Monthly Creator Retainer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">Turnaround time (Days)</label>
                <input
                  type="number"
                  value={formTurnaround}
                  onChange={(e) => setFormTurnaround(Number(e.target.value))}
                  min={1}
                  max={30}
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Min - Max Pricing Range Inputs */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Pricing range (in INR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#797570] mb-0.5">Min Price (₹) <span className="text-[#C2414B]">*</span></label>
                  <input
                    type="text"
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value)}
                    placeholder="₹2,000"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#797570] mb-0.5">Max Price (Optional)</label>
                  <input
                    type="text"
                    value={formMaxPrice}
                    onChange={(e) => setFormMaxPrice(e.target.value)}
                    placeholder="₹5,000"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#797570]">
                e.g. Min ₹2,000 – Max ₹5,000 (leave Max empty for fixed pricing)
              </p>
            </div>

            {/* Dynamic Deliverables List & 10 Suggestions */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#181716]">Included deliverables</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formDeliverableInput}
                  onChange={(e) => setFormDeliverableInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDeliverable();
                    }
                  }}
                  placeholder="Add deliverable (e.g. Brand Collaborator Tag)"
                  className="flex-1 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="tap-scale bg-[#600a0f] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#6F3456] transition-colors cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>

              {/* 10 Tailored Deliverable Suggestion Chips */}
              <div className="space-y-1 bg-[#FAF8F5]/60 border border-[#E7E3DC] rounded-xl p-2.5">
                <p className="text-[10px] font-bold text-[#797570] uppercase tracking-wider flex items-center justify-between">
                  <span>💡 Suggested Deliverables for {formPlatform}:</span>
                  <span className="text-[9px] text-[#600a0f] font-bold">Click chip to add +</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {(DELIVERABLE_SUGGESTIONS[formPlatform] || DELIVERABLE_SUGGESTIONS["Instagram Reel"]).map((item, idx) => {
                    const isAdded = formDeliverables.includes(item);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isAdded) {
                            setFormDeliverables([...formDeliverables, item]);
                          }
                        }}
                        disabled={isAdded}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${isAdded
                          ? "bg-[#EAF7F0] text-[#17845B] border-[#17845B]/20 cursor-default opacity-70"
                          : "bg-white hover:bg-[#600a0f]/[0.09] text-[#181716] hover:text-[#600a0f] border-[#E7E3DC]"
                          }`}
                      >
                        {isAdded ? `✓ ${item}` : `+ ${item}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Included Items Chips */}
              {formDeliverables.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                  <p className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">Added Deliverables ({formDeliverables.length}):</p>
                  {formDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-[#E7E3DC] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#181716]">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="text-[#C2414B] hover:text-rose-700 p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Package Tier Name / Highlight Badge */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#181716]">
                Package name or badge tag <span className="text-[#797570] font-normal">(Optional)</span>
              </label>

              <input
                type="text"
                value={formPackageName}
                onChange={(e) => setFormPackageName(e.target.value)}
                placeholder="e.g. 🥈 Silver Package, ⭐ MOST POPULAR, 🔥 BEST VALUE..."
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
              />

              <div className="space-y-1 pt-0.5">
                <p className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">Selectable Suggestions:</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {["🥉 Bronze Package", "🥈 Silver Package", "🥇 Gold Package", "⭐ MOST POPULAR", "🔥 BEST VALUE (25% OFF)"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormPackageName(tag)}
                      className="bg-[#FAF8F5] hover:bg-[#600a0f]/[0.09] text-[#181716] hover:text-[#600a0f] border border-[#E7E3DC] text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="gig-form"
              className="tap-scale bg-[#600a0f] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <span>{editingPkgId ? "Save Changes" : "Create Service"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 2. PUBLIC MEDIA KIT PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        size="xl"
        title={`Media Kit & Rate Card — ${profile.displayName || "Creator"}`}
        description="Verified creator portfolio, aggregated fanbase analytics & direct brand collab rates"
        icon={<Briefcase className="h-4 w-4" />}
      >
        <ModalBody className="p-5 sm:p-6 space-y-5 text-left">
          {/* Quick Actions Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleExportPDF}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print / Save as PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>
          </div>

          {/* 2-Tab Navigation Bar */}
          <div className="flex items-center gap-2 bg-[#fbfbfb] p-1.5 rounded-2xl border border-[#E7E3DC]">
            <button
              type="button"
              onClick={() => setActivePreviewTab("mediakit")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activePreviewTab === "mediakit"
                ? "bg-[#600a0f] text-white shadow-xs"
                : "text-[#54514D] hover:text-[#181716] hover:bg-white/60"
                }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>💼 Media Kit &amp; Rate Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePreviewTab("series")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activePreviewTab === "series"
                ? "bg-[#600a0f] text-white shadow-xs"
                : "text-[#54514D] hover:text-[#181716] hover:bg-white/60"
                }`}
            >
              <Film className="h-4 w-4" />
              <span>🎬 Series &amp; Shows ({series ? series.length : 0})</span>
            </button>
          </div>

          {/* TAB 1: 💼 MEDIA KIT & RATE CARD */}
          {activePreviewTab === "mediakit" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Creator Identity Card */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 space-y-5 relative overflow-hidden shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {profile.photoDataUrl ? (
                        <img
                          src={profile.photoDataUrl}
                          alt={profile.displayName || "Creator"}
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
                        />
                      ) : (
                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-[#600a0f] text-2xl font-black text-white shadow-md">
                          {(profile.displayName || "C").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#17845B] text-white shadow-xs" title="Verified Creator">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>

                    {/* Name & Handle */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-xl sm:text-2xl font-black text-white">
                          {profile.displayName || "Creator Name"}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black">
                          <ShieldCheck className="h-3 w-3" /> Verified by Inflixo
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 font-medium">
                        @{handleStr} • <span className="text-amber-300 font-bold">{profile.category || "Digital Creator"}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        inflixo.com/{handleStr}
                      </p>
                    </div>
                  </div>

                  {/* Total Aggregated Reach Card */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-left sm:text-right shrink-0">
                    <p className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider flex items-center sm:justify-end gap-1">
                      <span>❤️</span> TOTAL FANBASE
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {formatCount(totalAudience)}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                      ✓ Verified Aggregated Reach
                    </p>
                  </div>
                </div>

                {/* Bio Highlight */}
                {(profile.bio || settings.bioHighlight) && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    {settings.bioHighlight && (
                      <p className="text-xs sm:text-sm text-amber-200/90 font-semibold italic leading-relaxed">
                        "{settings.bioHighlight}"
                      </p>
                    )}
                    {profile.bio && (
                      <p className="text-xs text-slate-300 font-normal leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                )}

                {/* Direct Contact Routing Bar */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Direct Brand Inquiry Routing:
                  </span>
                  <div className="flex items-center gap-2">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#17845B] hover:bg-[#146c4b] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 fill-white" />
                        <span>WhatsApp Direct</span>
                      </a>
                    )}
                    {(settings.sponsorEmail || profile.email) && (
                      <a
                        href={`mailto:${settings.sponsorEmail || profile.email}`}
                        className="bg-white hover:bg-slate-100 text-[#181716] text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Mail className="h-3.5 w-3.5 text-[#600a0f]" />
                        <span>Email Proposal</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected Channels Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#181716] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#600a0f]" />
                    <span>Connected Social Channels &amp; Metrics</span>
                  </h4>
                  <span className="text-[11px] font-bold text-[#797570]">Live Synchronized</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white shadow-2xs">
                        <InstagramIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#181716]">Instagram</p>
                        <p className="text-[10px] text-[#797570] font-medium truncate max-w-[100px]">
                          @{socials.instagram?.username || handleStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-black text-[#181716]">
                        {formatCount(socials.instagram?.followers || 0)}
                      </p>
                      <p className="text-[9px] text-[#797570] uppercase font-bold">Followers</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF0000] text-white shadow-2xs">
                        <YoutubeIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#181716]">YouTube</p>
                        <p className="text-[10px] text-[#797570] font-medium truncate max-w-[100px]">
                          {socials.youtube?.channelTitle || `@${socials.youtube?.username || handleStr}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-black text-[#181716]">
                        {formatCount(socials.youtube?.subscribers || 0)}
                      </p>
                      <p className="text-[9px] text-[#797570] uppercase font-bold">Subscribers</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-2xs">
                        <FacebookIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#181716]">Facebook</p>
                        <p className="text-[10px] text-[#797570] font-medium truncate max-w-[100px]">
                          {socials.facebook?.name || `@${socials.facebook?.username || handleStr}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-black text-[#181716]">
                        {formatCount(socials.facebook?.followers || 0)}
                      </p>
                      <p className="text-[9px] text-[#797570] uppercase font-bold">Followers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Creator Links */}
              {customLinks && customLinks.filter((l) => l.isEnabled !== false).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#181716] uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="h-4 w-4 text-[#600a0f]" />
                      <span>Official Portfolio &amp; Links ({customLinks.filter((l) => l.isEnabled !== false).length})</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customLinks
                      .filter((l) => l.isEnabled !== false)
                      .map((link) => {
                        const displayDomain = link.url.replace(/^https?:\/\//, "").split("/")[0];
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-[#E7E3DC] bg-white hover:border-[#600a0f]/40 hover:bg-[#fbfbfb] transition-all text-left shadow-2xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#600a0f]/[0.09] text-[#600a0f] border border-[#600a0f]/20 shrink-0">
                                <Globe className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#181716] truncate group-hover:text-[#600a0f] transition-colors">
                                  {link.title}
                                </p>
                                <p className="text-[10px] text-[#797570] truncate">{displayDomain}</p>
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-[#797570] group-hover:text-[#600a0f] shrink-0" />
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Collaboration Gigs Preview List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#181716] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-[#600a0f]" />
                    <span>Official Collaboration Rate Cards (Top {Math.min(3, packages.filter((p) => p.isActive).length)})</span>
                  </h4>
                  <span className="text-[11px] font-bold text-[#600a0f]">Verified Deliverables</span>
                </div>

                {packages.filter((p) => p.isActive).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E7E3DC] bg-[#fbfbfb] p-6 text-center text-xs text-[#797570] font-medium">
                    No active rate card packages published currently.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {packages
                      .filter((p) => p.isActive)
                      .slice(0, 3)
                      .map((pkg) => {
                        const waText = encodeURIComponent(
                          `Hi ${profile.displayName || "Creator"}, I saw your "${pkg.title}" (${pkg.price}) package on Inflixo and want to collaborate.`
                        );
                        const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
                        const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                        const mailBody = encodeURIComponent(
                          `Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`
                        );
                        const mailUrl = `mailto:${settings.sponsorEmail || profile.email}?subject=${mailSubject}&body=${mailBody}`;

                        const hasPhone = Boolean(cleanPhone);
                        const hasEmail = Boolean(settings?.sponsorEmail || profile.email);

                        return (
                          <div
                            key={pkg.id}
                            className="border border-[#E7E3DC] rounded-2xl p-4 space-y-3 bg-white text-left transition-all flex flex-col justify-between shadow-2xs hover:border-[#600a0f]/30"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="bg-[#600a0f]/[0.09] text-[#600a0f] border border-[#600a0f]/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider truncate">
                                  {pkg.platform}
                                </span>
                                {(pkg.badge || pkg.packageName || pkg.isPopular) && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                    {pkg.badge || pkg.packageName || "⭐ POPULAR"}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between gap-1">
                                  <span className="font-display text-base font-extrabold text-[#600a0f]">
                                    {pkg.price}
                                  </span>
                                </div>
                                <h5 className="font-bold text-[#181716] text-xs leading-snug mt-0.5 line-clamp-2">
                                  {pkg.title}
                                </h5>
                                <p className="text-[10px] text-[#797570] font-medium mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" /> Turnaround: {pkg.turnaroundDays} Days
                                </p>
                              </div>

                              <ul className="text-[11px] text-[#54514D] space-y-1 pt-2 border-t border-[#E7E3DC]">
                                {pkg.deliverables.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-[#17845B] shrink-0 mt-0.5" />
                                    <span className="leading-tight line-clamp-2">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="pt-2 border-t border-[#E7E3DC] flex gap-1.5">
                              {hasPhone && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-[#17845B] hover:bg-[#146c4b] text-white text-[11px] font-bold py-1.5 px-2 rounded-xl transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                                >
                                  <MessageCircle className="h-3 w-3 fill-white" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {hasEmail && (
                                <a
                                  href={mailUrl}
                                  className="flex-1 bg-[#181716] hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 px-2 rounded-xl transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                                >
                                  <Mail className="h-3 w-3" />
                                  <span>Email</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 🎬 SERIES & SHOWS */}
          {activePreviewTab === "series" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#181716] uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-[#600a0f]" />
                  <span>Featured Series &amp; Shows ({series ? series.length : 0})</span>
                </h4>
                <span className="text-[11px] font-semibold text-[#797570]">
                  Default Audience View
                </span>
              </div>

              {series && series.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {series.map((ser: any) => {
                    const episodeCount = ser.seasons
                      ? ser.seasons.reduce((acc: number, season: any) => acc + (season.episodes?.length || 0), 0)
                      : (ser.episodesCount || 0);

                    return (
                      <div key={ser.id} className="rounded-2xl border border-[#E7E3DC] overflow-hidden bg-slate-950 text-white shadow-md flex flex-col justify-between group hover:border-[#600a0f] transition-all">
                        <div className="aspect-video relative bg-slate-900 flex items-center justify-center overflow-hidden">
                          {ser.posterDataUrl ? (
                            <img src={ser.posterDataUrl} alt={ser.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-500">
                              <Film className="h-8 w-8 text-slate-600" />
                              <span className="text-[10px] font-bold">16:9 WIDESCREEN POSTER</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                          <span className="absolute bottom-2 left-2 bg-[#600a0f] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                            🎬 {ser.seasons?.length || 1} Season • {episodeCount} Episodes
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">{ser.title}</h5>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{ser.genre || "Web Series"} • {ser.language || "Hindi"}</p>
                            </div>
                            {ser.rating && (
                              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                                ⭐ {ser.rating}
                              </span>
                            )}
                          </div>
                          {ser.description && (
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {ser.description}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Play className="h-3 w-3 text-indigo-400 fill-indigo-400" /> Free Episode Playlist
                            </span>
                            <span className="text-[#600a0f] font-bold">Watch Now →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-[#fbfbfb] p-8 text-center space-y-2">
                  <Film className="h-8 w-8 text-[#797570] mx-auto" />
                  <h4 className="font-bold text-[#181716] text-sm">No Series Published Yet</h4>
                  <p className="text-xs text-[#797570] max-w-sm mx-auto">
                    Create OTT Series in <Link href="/dashboard/series" className="text-[#600a0f] font-bold underline">Series &amp; Episodes</Link> to show widescreen posters &amp; episode playlists to your fans!
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* 3. LIMIT REACHED MODAL */}
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        type="gig"
      />

      {/* 4. DELETE SERVICE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDeletePackage}
        title="Delete this service?"
        description={`"${packageToDelete?.title}" will be removed from your collaboration profile and public rate card.`}
        confirmText="Delete Service"
        cancelText="Cancel"
      />
    </div>
  );
}
