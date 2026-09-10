"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  X,
  Film,
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Copy,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Mail,
  MessageCircle,
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
import { MediaKitService } from "@/services/MediaKitService";
import { MediaKitPackage, MediaKitSettings } from "@/types";
import { authRepository } from "@/repositories/localRepository";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { canCreateGig } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

// 10 Tailored Deliverable Suggestion Chips for Reels, Cafe/Shop Visits & Brand Collabs
const DELIVERABLE_SUGGESTIONS: Record<string, string[]> = {
  "Instagram Reel": [
    "1x 30–60s Dedicated Promo Reel",
    "On-site Cafe / Restaurant Visit & Food Tasting",
    "Store / Shop Walkthrough & Product Showcase",
    "Store / Cafe Location & Map Pin Tag",
    "Brand Collaborator Tag on Post",
    "Exclusive Discount Code in Caption",
    "Direct Promo Link in Bio (24 Hours)",
    "1x Companion Instagram Story with Link",
    "Pinned Comment with Tracked Link",
    "Raw Video Footage Access for Brand Ads",
  ],
  "Instagram Bundle": [
    "3x Targeted Instagram Reels",
    "3x Companion Stories with Direct Links",
    "Store Visit + Unboxing + Dedicated Review",
    "Collaborator Co-Author Tag on all posts",
    "45 Days Digital Usage & Whitelisting Rights",
    "Bio Promo Link for Full Campaign Duration",
    "Product / Store Tagging in Reel & Stories",
    "Pinned Comments with Promo Codes",
    "RAW High-Res Footage for Performance Ads",
    "Weekly Performance & Engagement Reporting",
  ],
  "Instagram Story": [
    "3x Sequential Story Slides with Direct Swipe/Link",
    "Cafe / Store Location Map Tag",
    "Brand Mention Tag @BrandName",
    "Exclusive Discount Promo Code Display",
    "Interactive Poll / Question Sticker Engagement",
    "Story Saved to Creator's Profile Highlights",
    "Raw Story Analytics Screenshot Delivery",
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

const SERVICE_EXAMPLES = [
  {
    title: "Brand Promo Reel",
    platform: "Instagram Reel",
    turnaroundDays: 3,
    minPrice: "₹8,000",
    maxPrice: "₹12,000",
    badge: "Brand Favorite",
    description: "Dedicated or integrated reel for brands & D2C products with collaborator tag and bio link.",
    deliverables: [
      "1x 30–60s Dedicated Promo Reel",
      "Brand Collaborator Tag & Co-authoring",
      "Direct Promo Link in Bio (24 Hours)",
    ],
  },
  {
    title: "Cafe / Restaurant Visit Reel",
    platform: "Instagram Reel",
    turnaroundDays: 2,
    minPrice: "₹6,000",
    maxPrice: "₹10,000",
    badge: "Food & Dining",
    description: "In-person visit, food tasting, ambiance showcase, and trending reel with map location.",
    deliverables: [
      "On-site Visit, Food Tasting & Video Shoot",
      "1x High-Engagement Trending Reel",
      "Store / Cafe Location & Map Tag",
      "2x Instagram Story Slides with Direct Location",
    ],
  },
  {
    title: "Shop / Store Launch Reel",
    platform: "Instagram Reel",
    turnaroundDays: 2,
    minPrice: "₹7,000",
    maxPrice: "₹12,000",
    badge: "Store Promo",
    description: "Walkthrough of shop collection, customer experience, and special discount announcement.",
    deliverables: [
      "On-site Store Walkthrough & Collection Highlight",
      "Store Location Tag & Google Maps Mention",
      "Exclusive Promo Code in Caption",
      "1x Companion Story with Address Sticker",
    ],
  },
  {
    title: "Instagram Story Shoutout",
    platform: "Instagram Story",
    turnaroundDays: 1,
    minPrice: "₹2,500",
    maxPrice: "₹4,000",
    badge: "Quick Shoutout",
    description: "Sequential story slides with swipe-up/link sticker, brand mention, and location tag.",
    deliverables: [
      "2x Sequential Story Slides with Direct Link",
      "Brand / Store Mention Tag @Account",
      "Direct Link Sticker for Instant Traffic",
    ],
  },
  {
    title: "Monthly Reel Pack (4 Reels)",
    platform: "Instagram Bundle",
    turnaroundDays: 30,
    minPrice: "₹25,000",
    maxPrice: "₹40,000",
    badge: "Monthly Retainer",
    description: "Weekly dedicated reels for cafes, restaurants, gyms, or retail shops.",
    deliverables: [
      "4x Dedicated Reels (1 Reel per week)",
      "Collaborator Co-Author Tag on all reels",
      "Story mentions with direct link for each reel",
    ],
  },
];

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
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
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

  const activeEmail = profile.email || authRepository.getPendingEmail() || "";
  const activeCreatorId = profile.id;
  const activeUsername = profile.username;
  const creatorQueryKey = activeCreatorId || activeEmail || activeUsername || "";

  const hasContactConfigured = Boolean(settings.whatsappNumber || settings.sponsorEmail || profile.email);

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

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    MediaKitService.saveSettings(settings);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, packages, activeCreatorId);
    }
    setIsContactModalOpen(false);
    showToast("Brand contact options updated! 💼");
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

  const handleApplyTemplate = (template: (typeof SERVICE_EXAMPLES)[0]) => {
    if (!canCreateGig(packages.length, subscription?.planKey)) {
      setIsExamplesModalOpen(false);
      setIsLimitModalOpen(true);
      return;
    }
    setEditingPkgId(null);
    setFormTitle(template.title);
    setFormPlatform(template.platform);
    setFormMinPrice(template.minPrice);
    setFormMaxPrice(template.maxPrice);
    setFormPackageName(template.badge);
    setFormTurnaround(template.turnaroundDays);
    setFormDeliverables([...template.deliverables]);
    setFormDeliverableInput("");
    setIsExamplesModalOpen(false);
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
      showToast("Please enter a service title and starting price", "error");
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
    showToast(editingPkgId ? "Service updated! ✨" : "New service created! 🚀");
    setIsModalOpen(false);
  };

  const handleTogglePackageActive = async (id: string, currentActive: boolean) => {
    setActiveMenuId(null);
    const updated = packages.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p));
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Service ${!currentActive ? "is now active" : "is now hidden"}.`);
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    const updated = packages.filter((p) => p.id !== packageToDelete.id);
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Service "${packageToDelete.title}" deleted.`);
    setPackageToDelete(null);
  };

  const handleShareService = async (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    const handle = profile.username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}`
      : `https://inflixo.com/${handle}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast(`Link for "${pkg.title}" copied! ✨`);
    }
  };

  const getServicePlatformBadge = (pkg: MediaKitPackage) => {
    const platform = (pkg.platform || "").toLowerCase();
    if (platform.includes("instagram")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shrink-0 shadow-xs">
          <InstagramIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("youtube")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF0000] text-white shrink-0 shadow-xs">
          <YoutubeIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("facebook")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white shrink-0 shadow-xs">
          <FacebookIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("linkedin")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white shrink-0 shadow-xs">
          <LinkedinIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("twitter") || platform.includes("x ")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shrink-0 shadow-xs">
          <XTwitterIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("spotify") || platform.includes("podcast")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1DB954] text-white shrink-0 shadow-xs">
          <SpotifyIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3a2447]/10 text-[#3a2447] shrink-0">
        <Briefcase className="h-5 w-5" />
      </div>
    );
  };

  const contactMethodsLabel = [
    settings.whatsappNumber ? "WhatsApp" : "",
    (settings.sponsorEmail || profile.email) ? "Business email" : "",
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <div className="space-y-6 w-full pb-12 text-left">
      {/* 1. PAGE HEADER (Clean & Simple) */}
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
          Collab Services
        </h1>
        <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
          Promotional packages and reel pricing for brands, restaurants, cafes, and shops.
        </p>
      </div>

      {/* 2. COMPACT CONTACT STATUS ROW */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E3DC] bg-white px-5 py-3.5 shadow-xs text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 ${hasContactConfigured ? "bg-[#EAF7F0] text-[#17845B]" : "bg-amber-100 text-amber-700"}`}>
            {hasContactConfigured ? <Check className="h-3 w-3 stroke-[2.5]" /> : "!"}
          </span>
          <p className="text-sm font-medium text-[#181716] truncate">
            {hasContactConfigured ? (
              <>
                <span className="font-semibold text-[#181716]">Brand contact enabled</span>
                <span className="text-[#797570]/40 mx-2">·</span>
                <span className="text-[#54514D]">{contactMethodsLabel}</span>
              </>
            ) : (
              <span className="text-[#54514D]">Set up contact details to receive brand inquiries directly.</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsContactModalOpen(true)}
          className="text-xs font-semibold text-[#3a2447] hover:underline cursor-pointer shrink-0"
        >
          Manage
        </button>
      </div>

      {/* 3. MAIN SECTION: YOUR COLLAB PACKAGES */}
      <section className="space-y-4 text-left">
        {/* Section Heading & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#181716]">
              Your collab packages
            </h2>
            <p className="text-xs sm:text-[13px] text-[#54514D] font-normal mt-0.5">
              Set up rates for brand reels, restaurant visits, and store promotions.
            </p>
          </div>

          {/* Show top CTA only when services exist */}
          {packages.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="h-10 px-4 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Collab Package</span>
            </button>
          )}
        </div>

        {/* 4. SERVICES LIST OR COMPACT EMPTY STATE */}
        {packages.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-7 sm:p-8 text-center space-y-3.5 shadow-xs max-w-xl mx-auto min-h-[220px] flex flex-col items-center justify-center">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#181716]">
                Create your first collab package
              </h3>
              <p className="text-xs sm:text-sm text-[#797570] max-w-md mx-auto">
                Offer reels, store visits, and promotional packages for brands, cafes, and shops.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-10 px-5 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Create Collab Package</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExamplesModalOpen(true)}
              className="text-xs font-semibold text-[#3a2447] hover:underline cursor-pointer inline-flex items-center gap-1 pt-1"
            >
              <span>Not sure what to offer? See collab reel examples</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => {
              const displayPrice = formatPriceClean(pkg.price);
              const deliverableCount = (pkg.deliverables || []).length;

              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors ${pkg.isActive ? "hover:border-[#3a2447]/30" : "opacity-70 bg-[#FAF8F5]/50"}`}
                >
                  {/* Left: Platform Icon & Hierarchy */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {getServicePlatformBadge(pkg)}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-[#181716] truncate" title={pkg.title}>
                          {pkg.title}
                        </h3>

                        {/* Status badge: Active vs Hidden */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pkg.isActive
                            ? "bg-[#EAF7F0] text-[#17845B] border-[#17845B]/20"
                            : "bg-[#FAF8F5] text-[#797570] border-[#E7E3DC]"
                            }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? "bg-[#17845B]" : "bg-[#797570]"}`} />
                          {pkg.isActive ? "Active" : "Hidden"}
                        </span>

                        {(pkg.packageName || pkg.badge) && (
                          <span className="text-[10px] font-semibold text-[#54514D] bg-[#FAF8F5] border border-[#E7E3DC] px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {pkg.packageName || pkg.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#797570] font-normal truncate flex items-center gap-1.5 flex-wrap">
                        <span>{pkg.platform}</span>
                        <span>·</span>
                        <span>{deliverableCount} {deliverableCount === 1 ? "deliverable" : "deliverables"}</span>
                        <span>·</span>
                        <span>{formatDeliveryDays(pkg.turnaroundDays)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Price & Quick Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7E3DC]">
                    <span className="text-base sm:text-lg font-bold text-[#181716] whitespace-nowrap">
                      {displayPrice}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(pkg)}
                        className="px-3 py-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
                      >
                        Edit
                      </button>

                      {/* Three-dot menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === pkg.id ? null : pkg.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === pkg.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-[#E7E3DC] bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                          >
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
                              {pkg.isActive ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                                  <span>Hide from profile</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-[#797570]" />
                                  <span>Set as active</span>
                                </>
                              )}
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

      {/* 5. CREATE / EDIT SERVICE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingPkgId ? "Edit Collab Package" : "Create Collab Package"}
        description="Set up your promotional reel package, deliverables, and rates for brands, cafes, and shops."
        icon={<Briefcase className="h-4 w-4" />}
      >
        <form id="service-form" onSubmit={handleSavePackage} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">Package title <span className="text-[#C2414B]">*</span></label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Cafe Visit Reel, Brand Promo Reel, or Store Launch"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">Platform type</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3 text-xs sm:text-sm font-medium text-[#181716] focus:border-[#3a2447] focus:outline-none transition-colors"
                >
                  <option value="Instagram Reel">Instagram Reel</option>
                  <option value="Instagram Bundle">Instagram Bundle (Reels + Stories)</option>
                  <option value="Instagram Story">Instagram Story Sponsorship</option>
                  <option value="YouTube Dedicated Video">YouTube Dedicated Video</option>
                  <option value="YouTube Video Integration">YouTube Integration (60-90s)</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Multi-Platform Campaign">Multi-Platform Campaign</option>
                  <option value="Series Title Sponsorship">Series Title Sponsorship</option>
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
                  className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] focus:border-[#3a2447] focus:outline-none transition-colors"
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
                    placeholder="₹10,000"
                    className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#797570] mb-0.5">Max Price (Optional)</label>
                  <input
                    type="text"
                    value={formMaxPrice}
                    onChange={(e) => setFormMaxPrice(e.target.value)}
                    placeholder="₹15,000"
                    className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Deliverables List & Suggestions */}
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
                  placeholder="e.g. Brand Collaborator Tag"
                  className="flex-1 h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="h-10 px-4 rounded-xl bg-[#3a2447] text-white text-xs font-semibold hover:bg-[#2c1937] transition-colors cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="space-y-1 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl p-2.5">
                <p className="text-[10px] font-bold text-[#797570] uppercase tracking-wider flex items-center justify-between">
                  <span>💡 Suggestions for {formPlatform}:</span>
                  <span className="text-[9px] text-[#3a2447] font-bold">Click chip to add +</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pt-1">
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
                          : "bg-white hover:bg-[#FAF8F5] text-[#181716] hover:text-[#3a2447] border-[#E7E3DC]"
                          }`}
                      >
                        {isAdded ? `✓ ${item}` : `+ ${item}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Added Deliverables */}
              {formDeliverables.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                  <p className="text-[10px] font-bold text-[#797570] uppercase tracking-wider">Added Deliverables ({formDeliverables.length}):</p>
                  {formDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg px-2.5 py-1 text-xs font-medium text-[#181716]">
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

            {/* Optional badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#181716]">
                Highlight badge <span className="text-[#797570] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formPackageName}
                onChange={(e) => setFormPackageName(e.target.value)}
                placeholder="e.g. Most Popular, Best Value"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="service-form"
              className="h-10 px-5 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <span>{editingPkgId ? "Save Changes" : "Create Collab Package"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 6. EXAMPLES MODAL (Not sure what to offer? See examples) */}
      <Modal
        isOpen={isExamplesModalOpen}
        onClose={() => setIsExamplesModalOpen(false)}
        size="lg"
        title="Collab Reel Examples"
        description="Choose a pre-built package for brands, cafe/restaurant visits, or shop promotions."
        icon={<Sparkles className="h-4 w-4" />}
      >
        <ModalBody className="p-4 sm:p-5 space-y-3 text-left max-h-[70vh] overflow-y-auto">
          {SERVICE_EXAMPLES.map((example, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-2 hover:border-[#3a2447]/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#181716]">{example.title}</h4>
                  <span className="text-[10px] font-semibold text-[#3a2447] bg-[#3a2447]/[0.08] px-2 py-0.5 rounded-md">
                    {example.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#181716]">{example.minPrice}–{example.maxPrice}</span>
              </div>

              <p className="text-xs text-[#54514D] font-normal">{example.description}</p>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#E7E3DC]">
                <span className="text-[11px] text-[#797570]">{example.turnaroundDays}-day delivery · {example.deliverables.length} deliverables</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(example)}
                  className="px-3 py-1 rounded-lg bg-[#3a2447] text-white text-xs font-semibold hover:bg-[#2c1937] transition-colors cursor-pointer"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </ModalBody>
      </Modal>

      {/* 7. CONTACT SETUP MODAL */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Brand Contact Settings"
        description="Configure how brands can reach you when inquiring about collaborations."
        icon={<SlidersHorizontal className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveContactSettings} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Official WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#797570]">Enables instant WhatsApp collaboration inquiries.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Business Email Address
              </label>
              <input
                type="email"
                value={settings.sponsorEmail || ""}
                onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                placeholder={profile.email || "collabs@yourdomain.com"}
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#797570]">Brands will receive email routing to this address.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Minimum Campaign Budget (Optional)
              </label>
              <input
                type="text"
                value={settings.minBudget || ""}
                onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                placeholder="₹0 (Accept all deals)"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#3a2447] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#797570]">Filter out brand inquiries below this amount.</p>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              Save Settings
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 8. LIMIT REACHED MODAL */}
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        type="gig"
      />

      {/* 9. DELETE SERVICE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDeletePackage}
        title="Delete this service?"
        description={`"${packageToDelete?.title}" will be permanently removed from your services and public profile.`}
        confirmText="Delete Service"
        cancelText="Cancel"
      />
    </div>
  );
}
