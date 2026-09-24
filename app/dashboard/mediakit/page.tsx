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
  Gift,
  Share2,
  Download,
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
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCount } from "@/utils/format";

const COLLABORATION_TYPES = [
  "Instagram Reel",
  "Instagram Story",
  "Instagram Post / Carousel",
  "Instagram Bundle (Reel + Stories)",
  "YouTube Dedicated Video",
  "YouTube Video Integration",
  "YouTube Shorts",
  "UGC Content ⭐",
  "Cafe / Restaurant Visit ⭐",
  "Store / Product Visit ⭐",
  "Event Appearance / Coverage ⭐",
  "Multi-Platform Campaign",
  "Monthly Brand Retainer",
  "Other",
] as const;

// 10 Tailored Deliverable Suggestion Chips for all Collaboration Types
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
  "Instagram Post / Carousel": [
    "1x High-Quality Feed Carousel (Up to 10 Slides)",
    "In-depth Product Showcase & Feature Highlights",
    "Collaborator Co-Author Tag on Post",
    "Brand Mention in First Line of Caption",
    "Direct Tracked Promo Link in Bio (48 Hours)",
    "Exclusive Discount Code for Followers",
    "1x Supporting Story Slide with Swipe Link",
    "Pinned Comment with Call-To-Action",
    "High-Res Photography for Brand Digital Reposting",
    "Engagement & Reach Analytics Delivery",
  ],
  "Instagram Bundle (Reel + Stories)": [
    "1x Dedicated 30–60s Instagram Reel",
    "3x Companion Stories with Direct Links",
    "Collaborator Co-Author Tag on Reel",
    "Store / Product Pin & Map Location Tag",
    "Promo Code Highlight in Caption & Stories",
    "Bio Link Active for 7 Days",
    "Interactive Sticker / Poll on Story",
    "Raw Footage Access for Brand Paid Ads",
    "Pinned Comment with Tracked Link",
    "Full Insights & Reach Screenshot Report",
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
  "UGC Content ⭐": [
    "Raw 9:16 Vertical Video for Brand Meta/TikTok Ads",
    "Authentic Problem-Solution Hook (3 Variations)",
    "High-Energy Unboxing & First Impression",
    "Voiceover + Dynamic Captions Included",
    "Direct-to-Camera Testimonial & Review",
    "Multiple B-Roll Angles & Closeups",
    "30 Days Digital Paid Ads Usage Rights",
    "Full Commercial Rights (Whitelisting Ready)",
    "Color Graded 4K Master Video File",
    "Fast 48–72h Delivery Turnaround",
  ],
  "Cafe / Restaurant Visit ⭐": [
    "On-Site Visit & Food Tasting Experience",
    "1x Aesthetic Ambience & Food Reel",
    "3x Real-Time Story Highlights with Location Tag",
    "Google Maps / Zomato Review & Pin Tag",
    "Exclusive Creator Menu Item / Discount Shoutout",
    "Chef / Staff Interaction & Signature Dish Showcase",
    "High-Res Food & Ambience Photography for Cafe",
    "Co-Author Collaboration Tag on Instagram",
    "Direct Geo-Tagging on All Posts",
    "Story Added to Dedicated Food / Cafe Highlights",
  ],
  "Store / Product Visit ⭐": [
    "In-Store Walkthrough & Shopping Experience",
    "1x Dedicated Try-On / Store Tour Reel",
    "Live Store Location & Address Tag in Bio/Stories",
    "Staff & Collection Interaction Highlights",
    "Special In-Store Discount Code for Followers",
    "3x Sequential Stories with Swipe/Location Tag",
    "High-Res In-Store Stills for Brand Use",
    "Collaborator Tag with Brand Account",
    "Pinned Comment with Store Landmark Directions",
    "Post-Visit Footfall & Reach Insights",
  ],
  "Event Appearance / Coverage ⭐": [
    "Creator VIP Event / Red Carpet Attendance",
    "Live On-Ground Story Coverage (5+ Slides)",
    "1x Event Highlights & Experience Reel",
    "Interactive Fan / Attendee Interaction",
    "Keynote / Panel Appearance or Ribbon Cutting",
    "Event Location & Official Hashtag Co-Promotion",
    "Pre-Event Announcement Story Shoutout",
    "High-Resolution Event Photos & Media Access",
    "Co-Author Tag on All Event Content",
    "Full Event Day Coverage Insights",
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
  "Podcast Integration": [
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
  "Monthly Brand Retainer": [
    "4x Dedicated Reels / Shorts per Month",
    "8x High-Converting Companion Stories",
    "Official Brand Ambassador Title & Tag",
    "Permanent Bio Link for Full Month Duration",
    "Full Paid Ad Whitelisting & Digital Usage Rights",
    "Monthly Strategy & Content Planning Sync",
    "Category Exclusivity (No Competitor Collaborations)",
    "Co-Author Collaboration Tag on All Assets",
    "Raw Footage Access for Brand Marketing",
    "Comprehensive Monthly Analytics & ROI Report",
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
  "Other": [
    "Custom Tailored Content Deliverable",
    "Dedicated Brand Storytelling & Creative Concept",
    "Collaborator Tag & Brand Co-Authorship",
    "Direct Trackable Link in Bio",
    "Exclusive Audience Promo Code",
    "Full Commercial Rights & Digital Usage",
    "Raw Asset Files & High-Res Footage",
    "Companion Stories with Engagement Stickers",
    "Category Exclusivity for Campaign",
    "Detailed Performance & Engagement Insights",
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
    platform: "Instagram Bundle (Reel + Stories)",
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
  const { profile, subscription, socials, totalAudience } = useCreator();
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
  const [customPlatform, setCustomPlatform] = useState("");
  const [formMinPrice, setFormMinPrice] = useState("");
  const [formMaxPrice, setFormMaxPrice] = useState("");
  const [formPackageName, setFormPackageName] = useState("");
  const [formTurnaround, setFormTurnaround] = useState<number>(2);
  const [formDeliverableInput, setFormDeliverableInput] = useState("");
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const activeEmail = profile.email || authRepository.getPendingEmail() || "";
  const activeCreatorId = profile.id;
  const activeUsername = profile.username;
  const creatorQueryKey = activeCreatorId || activeEmail || activeUsername || "";

  const hasContactConfigured = Boolean(settings.whatsappNumber || settings.sponsorEmail || profile.email);

  useEffect(() => {
    // Ignore presses inside a package menu so its items receive their click.
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.("[data-pkg-menu]")) return;
      setActiveMenuId(null);
    };
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    async function initMediaKit() {
      if (creatorQueryKey) {
        const { settings: dbSettings, packages: dbPackages } = await MediaKitService.fetchFromDb(activeEmail || activeUsername || creatorQueryKey, activeCreatorId);
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
    setCustomPlatform("");
    setFormMinPrice("");
    setFormMaxPrice("");
    setFormPackageName("");
    setFormTurnaround(2);
    setFormDeliverableInput("");
    setFormDeliverables([]);
    setShowAllSuggestions(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    setEditingPkgId(pkg.id);
    setFormTitle(pkg.title);
    const isStandard = (COLLABORATION_TYPES as readonly string[]).includes(pkg.platform) && pkg.platform !== "Other";
    if (isStandard) {
      setFormPlatform(pkg.platform);
      setCustomPlatform("");
    } else {
      setFormPlatform("Other");
      setCustomPlatform(pkg.platform === "Other" ? "" : pkg.platform);
    }
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
    setShowAllSuggestions(false);
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
    setCustomPlatform("");
    setFormMinPrice(template.minPrice);
    setFormMaxPrice(template.maxPrice);
    setFormPackageName(template.badge);
    setFormTurnaround(template.turnaroundDays);
    setFormDeliverables([...template.deliverables]);
    setFormDeliverableInput("");
    setShowAllSuggestions(false);
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

    if (formPlatform === "Other" && !customPlatform.trim()) {
      showToast("Please enter a custom collaboration type", "error");
      return;
    }

    const resolvedPlatform = formPlatform === "Other" ? customPlatform.trim() : formPlatform;

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
            platform: resolvedPlatform,
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
        platform: resolvedPlatform,
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
    if (platform.includes("bundle") || platform.includes("gift")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF5FF] border border-purple-200/80 text-purple-600 shrink-0 shadow-xs">
          <Gift className="h-5 w-5 text-purple-600 stroke-[2.2]" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#043084]/10 text-[#043084] shrink-0">
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

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");
  const mediaKitPath = `/${cleanHandle}/media-kit`;
  const mediaKitUrl = typeof window !== "undefined" ? `${window.location.origin}${mediaKitPath}` : mediaKitPath;
  const activePackages = packages.filter((p) => p.isActive).length;
  // Same "connected" rule as the Socials page.
  const connectedPlatforms = [
    socials?.instagram?.url || socials?.instagram?.username || (socials?.instagram?.followers ?? 0) > 0,
    socials?.youtube?.url || socials?.youtube?.username || (socials?.youtube?.subscribers ?? 0) > 0,
    socials?.facebook?.url || socials?.facebook?.username || (socials?.facebook?.followers ?? 0) > 0,
  ].filter(Boolean).length;

  const handleCopyMediaKit = async () => {
    const ok = await copyToClipboard(mediaKitUrl);
    showToast(ok ? "Media kit link copied! 💼" : "Could not copy link", ok ? "success" : "error");
  };

  const handleShareMediaKit = async () => {
    const title = `${profile.displayName || cleanHandle} — Media Kit`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: `${title} on Inflixo`, url: mediaKitUrl });
        return;
      }
      await handleCopyMediaKit();
    } catch {
      // Share sheet dismissed.
    }
  };

  const kitStats: { label: string; value: string; ok: boolean; href?: string; onClick?: () => void }[] = [
    { label: "Total fanbase", value: totalAudience > 0 ? formatCount(totalAudience) : "Not connected", ok: totalAudience > 0, href: "/dashboard/socials" },
    { label: "Platforms", value: `${connectedPlatforms} connected`, ok: connectedPlatforms > 0, href: "/dashboard/socials" },
    { label: "Packages", value: `${activePackages} active`, ok: activePackages > 0 },
    { label: "Brand contact", value: hasContactConfigured ? contactMethodsLabel || "Enabled" : "Not set up", ok: hasContactConfigured, onClick: () => setIsContactModalOpen(true) },
  ];

  const ghostBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer";

  return (
    <div className="space-y-4 w-full pb-8 text-left">
      {/* 1. PAGE HEADER */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">Media Kit</h1>
        <p className="mt-0.5 text-xs sm:text-[13px] text-[#64748b]">
          Your professional rate card for brands — share one link, or send a PDF.
        </p>
      </div>

      {/* 2. YOUR MEDIA KIT — link, what brands see, and share actions */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0f172a]">Your media kit link</p>
            <a
              href={mediaKitPath}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-sm text-[#475569] hover:text-[#043084] hover:underline"
            >
              {mediaKitUrl.replace(/^https?:\/\//, "")}
            </a>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center">
            <button
              type="button"
              onClick={handleShareMediaKit}
              className="order-first col-span-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#043084] px-3.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover cursor-pointer sm:order-last sm:ml-1 sm:h-9"
            >
              <Share2 className="h-4 w-4" />
              <span>Share media kit</span>
            </button>
            <a href={mediaKitPath} target="_blank" rel="noopener noreferrer" className={`${ghostBtn} justify-center`}>
              <Eye className="h-4 w-4 text-[#64748b]" />
              <span>Preview</span>
            </a>
            <a href={`${mediaKitPath}?download=pdf`} target="_blank" rel="noopener noreferrer" className={`${ghostBtn} justify-center`}>
              <Download className="h-4 w-4 text-[#64748b]" />
              <span>PDF</span>
            </a>
            <button type="button" onClick={handleCopyMediaKit} className={`${ghostBtn} justify-center`}>
              <Copy className="h-4 w-4 text-[#64748b]" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[#e2e8f0] sm:grid-cols-4">
          {kitStats.map((stat, i) => {
            const content = (
              <>
                <span className="block text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">{stat.label}</span>
                <span className={`mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold ${stat.ok ? "text-[#0f172a]" : "text-[#B45309]"}`}>
                  {stat.ok ? null : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />}
                  <span className="truncate">{stat.value}</span>
                </span>
              </>
            );
            const cellClass = `block min-w-0 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] ${i % 2 === 1 ? "border-l border-[#e2e8f0]" : ""} ${i >= 2 ? "border-t border-[#e2e8f0] sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`;
            return stat.href ? (
              <Link key={stat.label} href={stat.href} className={cellClass}>{content}</Link>
            ) : stat.onClick ? (
              <button key={stat.label} type="button" onClick={stat.onClick} className={`${cellClass} cursor-pointer`}>{content}</button>
            ) : (
              <div key={stat.label} className={cellClass}>{content}</div>
            );
          })}
        </div>
      </section>

      {/* 3. COLLAB PACKAGES */}
      <section className="space-y-2.5 text-left">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#0f172a]">
              Collab packages {packages.length > 0 && <span className="font-normal text-[#64748b]">({packages.length})</span>}
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Rates for brand reels, restaurant visits and store promotions.
            </p>
          </div>

          {packages.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-medium text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#64748b]" />
              <span>New package</span>
            </button>
          )}
        </div>

        {/* 4. SERVICES LIST OR COMPACT EMPTY STATE */}
        {packages.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-7 w-7" />}
            title="Create your first collab package"
            description="Offer reels, store visits, and promotional packages for brands, cafes, and shops."
            action={
              <div className="flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#043084] px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Collab Package</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExamplesModalOpen(true)}
                  className="text-xs font-semibold text-[#043084] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Not sure what to offer? See collab reel examples</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            }
          />
        ) : (
          <div className="rounded-xl border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0]">
            {packages.map((pkg) => {
              const displayPrice = formatPriceClean(pkg.price);
              const deliverableCount = (pkg.deliverables || []).length;

              return (
                <div
                  key={pkg.id}
                  className={`px-3 sm:px-4 py-3 flex items-center justify-between gap-3 first:rounded-t-xl last:rounded-b-xl ${pkg.isActive ? "" : "bg-[#f8fafc]"}`}
                >
                  {/* Left: Platform Icon & Hierarchy */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getServicePlatformBadge(pkg)}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-sm truncate ${pkg.isActive ? "text-[#0f172a]" : "text-[#64748b]"}`} title={pkg.title}>
                          {pkg.title}
                        </h3>

                        {/* Status badge: Active vs Hidden */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${pkg.isActive ? "text-[#047857]" : "text-[#64748b]"}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? "bg-[#10b981]" : "bg-[#94a3b8]"}`} />
                          {pkg.isActive ? "Active" : "Hidden"}
                        </span>

                        {(pkg.packageName || pkg.badge) && (
                          <span className="text-[11px] text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {pkg.packageName || pkg.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748b] truncate">
                        {pkg.platform} · {deliverableCount} {deliverableCount === 1 ? "deliverable" : "deliverables"} · {formatDeliveryDays(pkg.turnaroundDays)}
                      </p>
                      <p className="sm:hidden text-sm font-semibold text-[#0f172a]">{displayPrice}</p>
                    </div>
                  </div>

                  {/* Right: Price & Quick Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <span className="hidden sm:inline text-base font-semibold text-[#0f172a] whitespace-nowrap">
                      {displayPrice}
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(pkg)}
                        className="hidden sm:inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      {/* Three-dot menu */}
                      <div className="relative" data-pkg-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === pkg.id ? null : pkg.id);
                          }}
                          className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
                          aria-label="More options"
                          aria-expanded={activeMenuId === pkg.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === pkg.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenEditModal(pkg);
                              }}
                              className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
                              <span>Edit package</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareService(pkg)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#64748b]" />
                              <span>Share Link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePackageActive(pkg.id, pkg.isActive)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              {pkg.isActive ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-[#64748b]" />
                                  <span>Hide from profile</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-[#64748b]" />
                                  <span>Set as active</span>
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-[#e2e8f0]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setPackageToDelete(pkg);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#C2414B] hover:bg-[#fef2f2] transition-colors cursor-pointer"
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
              <label className="block text-[13px] font-medium text-[#0f172a]">Package title <span className="text-[#C2414B]">*</span></label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Cafe Visit Reel, Brand Promo Reel, or Store Launch"
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">Collaboration Type</label>
                <select
                  value={formPlatform}
                  onChange={(e) => {
                    setFormPlatform(e.target.value);
                    setShowAllSuggestions(false);
                  }}
                  className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs sm:text-sm font-medium text-[#043084] focus:border-[#043084] focus:outline-none transition-colors"
                >
                  {COLLABORATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">Delivery Time</label>
                  <span className="text-[10px] text-[#64748b] font-medium">
                    {formTurnaround} {formTurnaround === 1 ? "day" : "days"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 7, 14].map((days) => {
                    const isSelected = formTurnaround === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFormTurnaround(days)}
                        className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#043084] text-white border-[#043084] shadow-xs"
                            : "bg-white text-[#043084] border-[#e2e8f0] hover:bg-[#f8fafc]"
                        }`}
                      >
                        {days}D
                      </button>
                    );
                  })}
                  <div className="relative w-20 shrink-0">
                    <input
                      type="number"
                      value={formTurnaround}
                      onChange={(e) => setFormTurnaround(Math.max(1, Number(e.target.value)))}
                      min={1}
                      max={60}
                      title="Custom Days"
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-2 text-center text-xs font-semibold text-[#043084] focus:border-[#043084] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {formPlatform === "Other" && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Specify Collaboration Type <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="e.g., Live Stream Sponsorship, Workshop, Brand Ambassador"
                  className="w-full h-10 rounded-xl border border-[#043084] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:outline-none transition-colors shadow-xs"
                  required
                />
              </div>
            )}

            {/* Package Pricing Inputs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Package Pricing (INR)
                </label>
                <span className="text-[10px] text-[#64748b]">
                  Leave &quot;Up to&quot; empty for fixed price
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] mb-0.5">
                    Starting Price (₹) <span className="text-[#C2414B]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value)}
                    placeholder="₹10,000"
                    className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] mb-0.5">
                    Up to ₹ <span className="text-[#64748b] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formMaxPrice}
                    onChange={(e) => setFormMaxPrice(e.target.value)}
                    placeholder="e.g. ₹15,000"
                    className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Deliverables List & Suggestions */}
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-[#0f172a]">Included deliverables</label>
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
                  className="flex-1 h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="h-10 px-4 rounded-xl bg-[#043084] text-white text-xs font-semibold hover:bg-brand-hover transition-colors cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>

              {/* Suggestions */}
              {(() => {
                const suggestionsList = DELIVERABLE_SUGGESTIONS[formPlatform] || DELIVERABLE_SUGGESTIONS["Instagram Reel"] || [];
                const displayedList = showAllSuggestions ? suggestionsList : suggestionsList.slice(0, 5);
                const hasMore = suggestionsList.length > 5;

                return (
                  <div className="space-y-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                      <span>💡 Popular suggestions for {formPlatform === "Other" ? (customPlatform.trim() || "Collaboration") : formPlatform}:</span>
                      <span className="text-[9px] text-[#043084] font-bold">Click chip to add +</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {displayedList.map((item, idx) => {
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
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isAdded
                                ? "bg-[#EAF7F0] text-[#17845B] border-[#17845B]/20 cursor-default opacity-70"
                                : "bg-white hover:bg-[#f1f5f9] text-[#043084] border-[#e2e8f0] hover:border-[#043084]/30"
                            }`}
                          >
                            {isAdded ? `✓ ${item}` : `+ ${item}`}
                          </button>
                        );
                      })}
                    </div>
                    {hasMore && (
                      <div className="pt-0.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                          className="text-[11px] font-bold text-[#043084] hover:underline cursor-pointer"
                        >
                          {showAllSuggestions ? "Show fewer suggestions ↑" : `+ Show ${suggestionsList.length - 5} more suggestions ↓`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Added Deliverables */}
              {formDeliverables.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Added Deliverables ({formDeliverables.length}):</p>
                  {formDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1 text-xs font-medium text-[#043084]">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="text-[#C2414B] hover:text-[#043084] p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlight badge with Quick Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Highlight badge <span className="text-[#64748b] font-normal">(Optional)</span>
                </label>
                {formPackageName && (
                  <button
                    type="button"
                    onClick={() => setFormPackageName("")}
                    className="text-[10px] font-bold text-[#C2414B] hover:underline cursor-pointer"
                  >
                    Clear badge
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "Most Popular", icon: "🔥" },
                  { label: "Best Value", icon: "💎" },
                  { label: "Recommended", icon: "⭐" },
                  { label: "Premium", icon: "👑" },
                ].map((badge) => {
                  const isSelected = formPackageName === badge.label;
                  return (
                    <button
                      key={badge.label}
                      type="button"
                      onClick={() => setFormPackageName(isSelected ? "" : badge.label)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#043084] text-white border-[#043084] shadow-xs"
                          : "bg-white text-[#043084] border-[#e2e8f0] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span>{badge.icon} {badge.label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={formPackageName}
                onChange={(e) => setFormPackageName(e.target.value)}
                placeholder="Or type a custom badge (e.g. Creator Choice, Limited Edition)"
                className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="service-form"
              className="h-10 px-5 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5"
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
              className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 sm:p-4 space-y-2 hover:border-[#cbd5e1] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#043084]">{example.title}</h4>
                  <span className="text-[10px] font-semibold text-[#043084] bg-[#043084]/[0.08] px-2 py-0.5 rounded-md">
                    {example.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#043084]">{example.minPrice}–{example.maxPrice}</span>
              </div>

              <p className="text-xs text-[#475569] font-normal">{example.description}</p>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#e2e8f0]">
                <span className="text-[11px] text-[#64748b]">{example.turnaroundDays}-day delivery · {example.deliverables.length} deliverables</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(example)}
                  className="px-3 py-1 rounded-lg bg-[#043084] text-white text-xs font-semibold hover:bg-brand-hover transition-colors cursor-pointer"
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
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Official WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#64748b]">Enables instant WhatsApp collaboration inquiries.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Business Email Address
              </label>
              <input
                type="email"
                value={settings.sponsorEmail || ""}
                onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                placeholder={profile.email || "collabs@yourdomain.com"}
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#64748b]">Brands will receive email routing to this address.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Minimum Campaign Budget (Optional)
              </label>
              <input
                type="text"
                value={settings.minBudget || ""}
                onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                placeholder="₹0 (Accept all deals)"
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#64748b]">Filter out brand inquiries below this amount.</p>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5"
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
