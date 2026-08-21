"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Share2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  MessageCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  Check,
  X,
  FileSpreadsheet,
  Film,
  Layers,
  Award,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { MediaKitService, SAMPLE_PACKAGES } from "@/services/MediaKitService";
import { MediaKitPackage, MediaKitSettings } from "@/types";
import { authRepository } from "@/repositories/localRepository";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";

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

export default function DashboardMediaKitPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, series } = useCreator();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [expandedPkgIds, setExpandedPkgIds] = useState<Record<string, boolean>>({});

  const toggleExpandPkg = (id: string) => {
    setExpandedPkgIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Package Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Form inputs for package modal
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState<string>("Instagram Reel");
  const [formMinPrice, setFormMinPrice] = useState("");
  const [formMaxPrice, setFormMaxPrice] = useState("");
  const [formPackageName, setFormPackageName] = useState(""); // "Bronze Package" | "Silver Package" | "Gold Package" | custom badge
  const [formTurnaround, setFormTurnaround] = useState<number>(2);
  const [formDeliverableInput, setFormDeliverableInput] = useState("");
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);

  // Public Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const activeEmail = profile.email || authRepository.getPendingEmail() || "";
  const activeCreatorId = profile.id;
  const activeUsername = profile.username;
  const creatorQueryKey = activeCreatorId || activeEmail || activeUsername || "";

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
    showToast("Media Kit contact settings saved successfully! 💼");
  };

  const handleOpenAddModal = () => {
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
    setEditingPkgId(pkg.id);
    setFormTitle(pkg.title);
    setFormPlatform(pkg.platform);
    if (pkg.minPrice) {
      setFormMinPrice(pkg.minPrice);
      setFormMaxPrice(pkg.maxPrice || "");
    } else if (pkg.price.includes("–")) {
      const parts = pkg.price.split("–").map((s) => s.trim());
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
    const formattedPrice = maxStr ? `${minStr} – ${maxStr}` : minStr;
    const resolvedBadge = formPackageName.trim() || undefined;
    const resolvedIsPopular = formPackageName.includes("POPULAR");

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
    showToast(editingPkgId ? "Gig rate card updated successfully! ✨" : "New gig package published successfully! 🚀");
    setIsModalOpen(false);
  };

  const handleTogglePackageActive = async (id: string, currentActive: boolean) => {
    const updated = packages.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p));
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Package ${!currentActive ? "activated" : "paused"} successfully! ✨`);
  };

  const handleDeletePackage = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = packages.filter((p) => p.id !== id);
      setPackages(updated);
      if (activeEmail) {
        await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
      }
      showToast(`Package "${title}" removed successfully.`);
    }
  };

  const handleLoadSampleGigs = async () => {
    setPackages(SAMPLE_PACKAGES);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, SAMPLE_PACKAGES, activeCreatorId);
    }
    showToast("Sample rate card packages loaded! ⚡");
  };

  const handleShareMediaKit = async () => {
    const handle = profile.username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}?view=mediakit`
      : `https://inflixo.com/${handle}?view=mediakit`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast("Media Kit link copied to clipboard! 💼✨");
    } else {
      showToast("Could not copy link", "error");
    }
  };

  const handleExportPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleStr = profile.username || "username";
  const cleanPhone = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      {/* Sticky Page Subheader */}
      <div className="sticky top-0 z-30 bg-[#FAF8FA]/95 backdrop-blur-md border-b border-[#E8DCE4]/80 px-3 sm:px-6 py-3.5 shadow-2xs text-left mb-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
                Media Kit &amp; Brand Collaborations
              </h1>
              <span className="bg-[#803D63] text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">
                VIP PLAN
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              Manage your rate card gigs, direct WhatsApp/email lead routing &amp; brand portfolio
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-[#803D63]" />
              <span>Preview Public View</span>
            </button>
            <button
              type="button"
              onClick={handleShareMediaKit}
              className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Rate Card</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-6 text-left">
        
        {/* 1. VIP MEDIA KIT OVERVIEW HERO BANNER */}
        <div className="rounded-2xl border border-[#E8DCE4] bg-gradient-to-r from-[#F6EBF1] via-white to-[#F6EBF1] p-5 sm:p-6 shadow-2xs relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63] text-white px-3 py-0.5 text-xs font-black shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>VERIFIED CREATOR MEDIA KIT</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Land Brand Deals with Live Verified Analytics 💼
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Showcase your combined reach, audience demographics, and custom sponsorship packages directly to brand marketing managers.
              </p>
            </div>

            {/* Total Combined Reach Badge */}
            <div className="bg-white border border-[#E8DCE4] rounded-2xl p-4 text-center shrink-0 shadow-2xs w-full sm:w-auto">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#803D63]">
                TOTAL AUDIENCE REACH
              </p>
              <p className="font-display text-3xl font-black text-slate-900 mt-0.5">
                {formatCount(totalAudience)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified by Inflixo
              </p>
            </div>
          </div>

          {/* Social Platforms Stats Breakdown Strip */}
          <div className="pt-3 border-t border-[#E8DCE4]/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Instagram */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shrink-0">
                <InstagramIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Instagram Reach</p>
                <p className="text-sm font-black text-[#803D63]">{formatCount(socials.instagram.followers)} Followers</p>
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                <YoutubeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">YouTube Subscribers</p>
                <p className="text-sm font-black text-[#803D63]">{formatCount(socials.youtube.subscribers)} Subs</p>
              </div>
            </div>

            {/* Facebook */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <FacebookIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Facebook Audience</p>
                <p className="text-sm font-black text-[#803D63]">{formatCount(socials.facebook.followers)} Followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. COLLABORATION GIGS / RATE CARD MANAGER SECTION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#803D63]" />
                <span>Collaboration Gigs &amp; Rate Cards ({packages.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set custom rates and deliverables for Instagram Reels, YouTube integrations, and retainers
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create Gig</span>
              </button>
            </div>
          </div>

          {/* ZERO-DEFAULT EMPTY STATE CARD */}
          {packages.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E8DCE4] bg-white p-8 text-center space-y-4 shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] mx-auto">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-display text-base font-bold text-slate-900">
                  Create Your First Gig / Package
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Your Media Kit board is clean! Add your first custom sponsorship rate card for Instagram Reels, YouTube videos, or monthly retainers.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Create First Gig</span>
                </button>
              </div>
            </div>
          ) : (
            /* Rate Cards Grid (2 Gigs per Row for spacious layout) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-2xs transition-all relative ${
                    pkg.isPopular
                      ? "border-[#803D63] ring-1 ring-[#803D63]/30"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!pkg.isActive ? "opacity-60 bg-gray-50" : ""}`}
                >
                  {(pkg.badge || pkg.packageName || pkg.isPopular) && (
                    <span className="absolute -top-3 right-3 bg-[#803D63] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs tracking-tight">
                      {pkg.badge || pkg.packageName || "⭐ MOST POPULAR"}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#803D63] bg-[#F6EBF1] border border-[#E8DCE4] px-2.5 py-0.5 rounded-md truncate max-w-[140px]">
                        {pkg.platform}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> {pkg.turnaroundDays} Days TAT
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 leading-snug">
                        {pkg.title}
                      </h4>
                      <p className="font-display text-2xl font-black text-[#803D63] mt-1.5">
                        {formatCurrencyString(pkg.price)}
                      </p>
                    </div>

                    {/* Deliverables Checklist (Top 4 items + Expand Toggle) */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Included Deliverables:</span>
                        <span className="text-[9px] text-[#803D63] font-extrabold">{pkg.deliverables.length} items</span>
                      </p>
                      <ul className={`space-y-1.5 text-xs font-medium text-slate-700 ${expandedPkgIds[pkg.id] ? "max-h-52 overflow-y-auto pr-1" : ""}`}>
                        {(expandedPkgIds[pkg.id] ? pkg.deliverables : pkg.deliverables.slice(0, 4)).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>

                      {pkg.deliverables.length > 4 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandPkg(pkg.id)}
                          className="text-[11px] font-bold text-[#803D63] hover:underline pt-0.5 cursor-pointer flex items-center gap-1"
                        >
                          {expandedPkgIds[pkg.id]
                            ? "Collapse items ▲"
                            : `+ ${pkg.deliverables.length - 4} more items (View All) ▼`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Gig Controls (Active/Paused Toggle + Edit/Delete) */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTogglePackageActive(pkg.id, pkg.isActive)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        pkg.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {pkg.isActive ? "Active ✓" : "Paused ⏸"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(pkg)}
                        className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:text-[#803D63] hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Edit Gig"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Gig"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. DIRECT CONTACT & LEAD ROUTING SETTINGS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Direct Brand Inquiries &amp; Contact Routing
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Receive collaboration inquiries directly on WhatsApp &amp; official business email with 0% platform commission.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="text-xs font-bold text-[#803D63] hover:underline cursor-pointer shrink-0"
            >
              {isEditingSettings ? "Cancel" : "Edit Settings"}
            </button>
          </div>

          {isEditingSettings ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    💬 Business WhatsApp Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber || ""}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used for 1-click WhatsApp brand chat routing.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ✉️ Business / Sponsor Inquiry Email
                  </label>
                  <input
                    type="email"
                    value={settings.sponsorEmail || ""}
                    onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                    placeholder="nikunj.appz@gmail.com"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🛡️ Minimum Sponsorship Budget Filter
                </label>
                <input
                  type="text"
                  value={settings.minBudget || ""}
                  onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                  placeholder="₹0 (Accept All Deals)"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Media Kit Bio Pitch Tagline
                </label>
                <textarea
                  value={settings.bioHighlight || ""}
                  onChange={(e) => setSettings({ ...settings, bioHighlight: e.target.value })}
                  rows={2}
                  placeholder="Short pitch to brands explaining your audience demographics & content style..."
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Save Lead Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* WhatsApp Card */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1 relative group">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>💬 OFFICIAL WHATSAPP</span>
                </p>
                {settings.whatsappNumber ? (
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {settings.whatsappNumber}
                    </p>
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-50 transition-all cursor-pointer"
                      title="Live Test WhatsApp Link ↗"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(true)}
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>⚠️ Not Connected (Click to Add)</span>
                  </button>
                )}
              </div>

              {/* Email Card */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>✉️ BUSINESS EMAIL</span>
                </p>
                {settings.sponsorEmail ? (
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {settings.sponsorEmail}
                    </p>
                    <a
                      href={`mailto:${settings.sponsorEmail}`}
                      className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Live Test Email Link ↗"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(true)}
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>⚠️ Not Connected (Click to Add)</span>
                  </button>
                )}
              </div>

              {/* Min Budget Filter Card */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>🛡️ MIN. DEAL FILTER</span>
                </p>
                {settings.minBudget ? (
                  <p className="text-xs font-bold text-[#803D63]">
                    {(settings.minBudget === "₹0" || settings.minBudget === "0")
                      ? "₹0 (Accept All Deals)"
                      : settings.minBudget.includes("+")
                      ? settings.minBudget
                      : `${settings.minBudget}+`}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(true)}
                    className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-md transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>⚠️ Not Set (Click to Add)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. VISUAL PORTFOLIO & OTT SHOWCASE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-[#803D63]" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Visual Portfolio &amp; OTT Series Showcase
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Rendered on Public Media Kit
            </span>
          </div>

          {series && series.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {series.slice(0, 3).map((ser: any) => (
                <div key={ser.id} className="rounded-xl border border-gray-200 overflow-hidden bg-slate-900 text-white shadow-2xs group">
                  <div className="aspect-video relative bg-slate-800 flex items-center justify-center">
                    {ser.posterDataUrl ? (
                      <img src={ser.posterDataUrl} alt={ser.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <Film className="h-6 w-6" />
                        <span className="text-[10px] font-bold">16:9 OTT POSTER</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded text-indigo-300">
                      🎬 {ser.seasons?.[0]?.episodes?.length || 0} Episodes
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs truncate">{ser.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{ser.genre || "Web Series"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
              Create OTT Series in <Link href="/dashboard/series" className="text-[#803D63] font-bold underline">Series &amp; Episodes</Link> to automatically feature widescreen 16:9 production posters here for brand managers.
            </div>
          )}

          {/* Past Brand Collaborations Grayscale Bar */}
          <div className="pt-3 border-t border-gray-100 space-y-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Trusted by Leading Brands &amp; Sponsors:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-black text-slate-400 grayscale opacity-70">
              <span>NIKE</span>
              <span>boAt</span>
              <span>MAMAEARTH</span>
              <span>SWIGGY</span>
              <span>ZOMATO</span>
              <span>SAMSUNG</span>
              <span>TECHBURNER</span>
            </div>
          </div>
        </div>

        {/* 5. EXPORT DOCUMENT ACTION BAR */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-0.5">
            <h4 className="font-display text-sm font-bold text-slate-900">
              Download Printable Rate Card Document
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Export clean PDF rate cards to attach directly to brand proposal emails
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPDF}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF Media Kit</span>
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT GIG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingPkgId ? "Edit Collaboration Gig" : "Create New Rate Card Gig"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gig Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., 1x Instagram Reel or 3x Reels Pack"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Platform Type</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turnaround Time (TAT in Days)</label>
                  <input
                    type="number"
                    value={formTurnaround}
                    onChange={(e) => setFormTurnaround(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Min - Max Pricing Range Inputs (Dedicated Row) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pricing Range (in INR)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Min Price (₹)</label>
                    <input
                      type="text"
                      value={formMinPrice}
                      onChange={(e) => setFormMinPrice(e.target.value)}
                      placeholder="₹2,000"
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Max Price (Optional)</label>
                    <input
                      type="text"
                      value={formMaxPrice}
                      onChange={(e) => setFormMaxPrice(e.target.value)}
                      placeholder="₹5,000"
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  e.g. Min ₹2,000 – Max ₹5,000 (leave Max empty for fixed pricing)
                </p>
              </div>

              {/* Dynamic Deliverables List & 10 Suggestions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Included Deliverables List</label>
                <div className="flex items-center gap-2 mb-1">
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
                    className="flex-1 rounded-xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="bg-[#803D63] text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-[#6D3254]"
                  >
                    + Add
                  </button>
                </div>

                {/* 10 Tailored Deliverable Suggestion Chips */}
                <div className="space-y-1 bg-slate-50 border border-gray-200 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>💡 10 Suggested Deliverables for {formPlatform}:</span>
                    <span className="text-[9px] text-[#803D63] font-extrabold">Click chip to add +</span>
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
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            isAdded
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default opacity-70"
                              : "bg-white hover:bg-[#F6EBF1] text-slate-700 hover:text-[#803D63] border-gray-200 hover:border-[#E8DCE4]"
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added Deliverables ({formDeliverables.length}):</p>
                    {formDeliverables.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#FAF8FA] border border-[#E8DCE4] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800">
                        <span>• {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(idx)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Package Tier Name / Highlight Badge Input with Selectable Suggestions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Package Name / Highlight Badge Tag (Optional)
                </label>

                <input
                  type="text"
                  value={formPackageName}
                  onChange={(e) => setFormPackageName(e.target.value)}
                  placeholder="e.g. 🥈 Silver Package, ⭐ MOST POPULAR, 🔥 BEST VALUE..."
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                />

                {/* Selectable Suggestions below input */}
                <div className="space-y-1 pt-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selectable Suggestions:</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormPackageName("🥉 Bronze Package")}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      🥉 Bronze Package
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPackageName("🥈 Silver Package")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      🥈 Silver Package
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPackageName("🥇 Gold Package")}
                      className="bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-300 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      🥇 Gold Package
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPackageName("⭐ MOST POPULAR")}
                      className="bg-purple-50 hover:bg-purple-100 text-[#803D63] border border-purple-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      ⭐ MOST POPULAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPackageName("🔥 BEST VALUE (25% OFF)")}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      🔥 BEST VALUE
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-2xs"
                >
                  {editingPkgId ? "Save Changes" : "Create Gig"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC MEDIA KIT PREVIEW MODAL (LIVE BRAND VIEW) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900">
                    Live Brand View — {profile.displayName || "Creator"} Media Kit
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">This is how brand marketing managers view your verified reach &amp; lead routing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Public Header Preview */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 space-y-3 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-black">{profile.displayName || "Creator"}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black">
                      <ShieldCheck className="h-3 w-3" /> Verified by Inflixo
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium mt-0.5">
                    @{handleStr} • {profile.category || "Digital Creator"}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-xl text-left sm:text-right shrink-0">
                  <p className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider">Total Aggregated Reach</p>
                  <p className="text-2xl font-black text-white">{formatCount(totalAudience)}</p>
                </div>
              </div>
              {settings.bioHighlight && (
                <p className="text-xs text-slate-300 font-medium pt-2 border-t border-white/10 leading-relaxed">
                  "{settings.bioHighlight}"
                </p>
              )}
            </div>

            {/* Public Gigs Grid (Active Only) */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Official Collaboration Rate Cards ({packages.filter((p) => p.isActive).length})
              </h4>

              {packages.filter((p) => p.isActive).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-xs text-slate-500 font-medium">
                  No active gigs currently published.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.filter((p) => p.isActive).map((pkg) => {
                    const waText = encodeURIComponent(
                      `Hi ${profile.displayName || "Creator"}, I saw your "${pkg.title}" (${pkg.price}) package on Inflixo and want to collaborate.`
                    );
                    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
                    const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                    const mailBody = encodeURIComponent(`Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`);
                    const mailUrl = `mailto:${settings.sponsorEmail}?subject=${mailSubject}&body=${mailBody}`;

                    return (
                      <div key={pkg.id} className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-slate-50/60 hover:border-gray-300 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] text-[10px] font-bold px-2 py-0.5 rounded">
                              {pkg.platform}
                            </span>
                            <span className="font-black text-[#803D63] text-lg">{pkg.price}</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm leading-snug">{pkg.title}</h5>
                          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Turnaround: {pkg.turnaroundDays} Days
                          </p>
                          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                            {pkg.deliverables.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Frictionless Direct Lead Actions */}
                        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-2 rounded-xl transition-all inline-flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <MessageCircle className="h-3.5 w-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={mailUrl}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-2 rounded-xl transition-all inline-flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Send Email</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual Portfolio Showcase Section in Modal */}
            {series && series.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-[#803D63]" /> Production Portfolio Showcase
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {series.slice(0, 3).map((ser: any) => (
                    <div key={ser.id} className="rounded-xl border border-gray-200 overflow-hidden bg-slate-900 text-white">
                      <div className="aspect-video relative bg-slate-800 flex items-center justify-center">
                        {ser.posterDataUrl ? (
                          <img src={ser.posterDataUrl} alt={ser.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-500">
                            <Film className="h-5 w-5" />
                            <span className="text-[9px] font-bold">16:9 POSTER</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-xs text-[9px] font-bold px-1.5 py-0.5 rounded text-indigo-300">
                          {ser.seasons?.[0]?.episodes?.length || 0} Episodes
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="font-bold text-xs truncate">{ser.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Brand Collaborations Grayscale Bar */}
            <div className="pt-2 border-t border-gray-100 text-center space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Past Brand Collaborations</p>
              <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-black text-slate-400 grayscale opacity-75">
                <span>NIKE</span>
                <span>boAt</span>
                <span>MAMAEARTH</span>
                <span>SWIGGY</span>
                <span>ZOMATO</span>
                <span>SAMSUNG</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
