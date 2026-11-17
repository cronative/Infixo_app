"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Briefcase,
  Plus,
  Trash2,
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
  FileText,
  Loader2,
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
import {
  MediaKitPackage,
  MediaKitSettings,
  CommercialTerms,
  MEDIAKIT_PROMISE_PRESETS,
} from "@/types";
import { authRepository } from "@/repositories/localRepository";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { formatFans } from "@/lib/creatorEra";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { CommercialTermsCard } from "@/components/mediakit/CommercialTermsCard";
import { PackageForm } from "@/components/mediakit/PackageForm";
import { formatPackagePrice } from "@/components/mediakit/PackageCard";
import { StatCard, StatCardGrid } from "@/components/dashboard/StatCard";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { PDF_PREPARING_LABEL, useMediaKitPdf } from "@/hooks/useMediaKitPdf";
import { canCreateGig, getPlanQuota } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";

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

export default function DashboardMediaKitPage() {
  const { profile, subscription, socials, totalAudience } = useCreator();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<MediaKitPackage | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Package being edited / template to start from (PackageForm keeps its own field state).
  const [formInitial, setFormInitial] = useState<MediaKitPackage | null>(null);

  // "About you for brands" Media Kit v2 fields
  const [brandIntro, setBrandIntro] = useState("");
  const [brandNowMaking, setBrandNowMaking] = useState("");
  const [brandAudienceDesc, setBrandAudienceDesc] = useState("");
  const [brandAvailability, setBrandAvailability] = useState<"open" | "busy">("open");
  const [brandReplyTime, setBrandReplyTime] = useState("Within 24h");
  const [brandFitTags, setBrandFitTags] = useState<[string, string, string]>(["", "", ""]);
  const [brandNofitTags, setBrandNofitTags] = useState<[string, string, string]>(["", "", ""]);
  const [brandPromises, setBrandPromises] = useState<string[]>([]);
  const [brandSignatureName, setBrandSignatureName] = useState("");
  const [savingBrandStory, setSavingBrandStory] = useState(false);

  // Collab requests & snapshot fields
  const [collabRequests, setCollabRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [settingAvgReelViews, setSettingAvgReelViews] = useState("");
  const [settingEngagementRate, setSettingEngagementRate] = useState("");
  const [settingTopCities, setSettingTopCities] = useState("");
  const [settingLanguages, setSettingLanguages] = useState("");
  const [settingCategories, setSettingCategories] = useState("");
  const [settingPastBrands, setSettingPastBrands] = useState("");
  const [settingAllowWhatsapp, setSettingAllowWhatsapp] = useState(true);
  const [settingAllowEmail, setSettingAllowEmail] = useState(true);

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
        setSettingAvgReelViews(String(dbSettings.avgReelViews || ""));
        setSettingEngagementRate(String(dbSettings.engagementRate || ""));
        setSettingTopCities(String(dbSettings.topCities || ""));
        setSettingLanguages(Array.isArray(dbSettings.contentLanguages) ? dbSettings.contentLanguages.join(", ") : String(dbSettings.contentLanguages || ""));
        setSettingCategories(Array.isArray(dbSettings.categories) ? dbSettings.categories.join(", ") : String(dbSettings.categories || ""));
        setSettingPastBrands(Array.isArray(dbSettings.pastBrands) ? dbSettings.pastBrands.map((b: any) => b.name).join(", ") : "");
        setSettingAllowWhatsapp(dbSettings.allowWhatsapp !== false);
        setSettingAllowEmail(dbSettings.allowEmail !== false);

        setBrandIntro(dbSettings.intro || "");
        setBrandNowMaking(dbSettings.nowMaking || "");
        setBrandAudienceDesc(dbSettings.audienceDesc || "");
        setBrandAvailability(dbSettings.availability === "busy" ? "busy" : "open");
        setBrandReplyTime(dbSettings.replyTime || "Within 24h");
        const incomingFit = Array.isArray(dbSettings.fitTags) ? dbSettings.fitTags : [];
        setBrandFitTags([incomingFit[0] || "", incomingFit[1] || "", incomingFit[2] || ""]);
        const incomingNofit = Array.isArray(dbSettings.nofitTags) ? dbSettings.nofitTags : [];
        setBrandNofitTags([incomingNofit[0] || "", incomingNofit[1] || "", incomingNofit[2] || ""]);
        setBrandPromises(Array.isArray(dbSettings.promises) ? dbSettings.promises : []);
        setBrandSignatureName(dbSettings.signatureName || profile.displayName || "");
      }
    }
    initMediaKit();
  }, [creatorQueryKey, activeCreatorId]);

  useEffect(() => {
    async function loadCollabRequests() {
      if (!creatorQueryKey) return;
      setLoadingRequests(true);
      try {
        const res = await fetch(`/api/collab-requests?creatorId=${encodeURIComponent(activeCreatorId || creatorQueryKey)}`);
        const data = await res.json();
        if ((data.success || data.status === 1) && Array.isArray(data.data?.requests)) {
          setCollabRequests(data.data.requests);
        }
      } catch {
        // non-fatal
      } finally {
        setLoadingRequests(false);
      }
    }
    loadCollabRequests();
  }, [creatorQueryKey, activeCreatorId]);

  const handleUpdateStatus = async (requestId: string, newStatus: "new" | "replied" | "closed") => {
    setCollabRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch("/api/collab-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
          creatorId: activeCreatorId || creatorQueryKey,
        }),
      });
      if (!res.ok) {
        showToast("Failed to update status", "error");
      } else {
        showToast(`Request marked as ${newStatus}`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("collab-requests-updated"));
        }
      }
    } catch {
      showToast("Network error updating status", "error");
    }
  };

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLanguages = settingLanguages.split(",").map((s) => s.trim()).filter(Boolean);
    const parsedCategories = settingCategories.split(",").map((s) => s.trim()).filter(Boolean);
    const parsedPastBrands = settingPastBrands.split(",").map((s) => ({ name: s.trim() })).filter((b) => Boolean(b.name));

    const updatedSettings: MediaKitSettings = {
      ...settings,
      avgReelViews: settingAvgReelViews.trim() || undefined,
      engagementRate: settingEngagementRate.trim() || undefined,
      topCities: settingTopCities.trim() || undefined,
      contentLanguages: parsedLanguages,
      categories: parsedCategories,
      pastBrands: parsedPastBrands,
      allowWhatsapp: settingAllowWhatsapp,
      allowEmail: settingAllowEmail,
      updatedAt: new Date().toISOString(),
    };

    setSettings(updatedSettings);
    MediaKitService.saveSettings(updatedSettings);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, updatedSettings, packages, activeCreatorId);
    }
    setIsContactModalOpen(false);
    showToast("Media kit & brand contact options updated! 💼");
  };

  const handleSaveBrandStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrandStory(true);
    try {
      const updatedSettings: MediaKitSettings = {
        ...settings,
        intro: brandIntro.trim().slice(0, 300),
        nowMaking: brandNowMaking.trim().slice(0, 80),
        audienceDesc: brandAudienceDesc.trim().slice(0, 200),
        availability: brandAvailability,
        replyTime: brandReplyTime.trim() || "Within 24h",
        fitTags: brandFitTags.map((t) => t.trim()).filter(Boolean).slice(0, 3),
        nofitTags: brandNofitTags.map((t) => t.trim()).filter(Boolean).slice(0, 3),
        promises: brandPromises.slice(0, 4),
        signatureName: brandSignatureName.trim().slice(0, 120),
        updatedAt: new Date().toISOString(),
      };
      setSettings(updatedSettings);
      MediaKitService.saveSettings(updatedSettings);
      if (activeEmail) {
        await MediaKitService.saveToDb(activeEmail, updatedSettings, packages, activeCreatorId);
      }
      showToast("Saved 'About you for brands'! ✨");
    } finally {
      setSavingBrandStory(false);
    }
  };

  const handleSaveCommercialTerms = async (terms: CommercialTerms) => {
    const updatedSettings: MediaKitSettings = { ...settings, commercialTerms: terms, updatedAt: new Date().toISOString() };
    setSettings(updatedSettings);
    MediaKitService.saveSettings(updatedSettings);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, updatedSettings, packages, activeCreatorId);
    }
    showToast("Saved rates, GST & payment terms 🇮🇳");
  };

  const handleOpenAddModal = () => {
    if (!canCreateGig(packages.length, subscription?.planKey)) {
      setIsLimitModalOpen(true);
      return;
    }
    setEditingPkgId(null);
    setFormInitial(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    setEditingPkgId(pkg.id);
    setFormInitial(pkg);
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (template: (typeof SERVICE_EXAMPLES)[0]) => {
    if (!canCreateGig(packages.length, subscription?.planKey)) {
      setIsExamplesModalOpen(false);
      setIsLimitModalOpen(true);
      return;
    }
    setEditingPkgId(null);
    setFormInitial({
      id: "",
      title: template.title,
      description: template.description,
      platform: template.platform,
      price: template.minPrice,
      minPrice: template.minPrice,
      turnaroundDays: template.turnaroundDays,
      deliverables: [...template.deliverables],
      isActive: true,
    });
    setIsExamplesModalOpen(false);
    setIsModalOpen(true);
  };

  const persistPackages = async (updated: MediaKitPackage[]) => {
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
  };

  const newPackageId = () => `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  /** Save from the package form: a draft stays hidden from brands; publish makes it live. */
  const handleSubmitPackage = async (pkg: MediaKitPackage, mode: "draft" | "publish") => {
    const next: MediaKitPackage = {
      ...pkg,
      id: editingPkgId || newPackageId(),
      isDraft: mode === "draft",
      isActive: mode === "publish" ? true : pkg.isActive,
    };
    const updated = editingPkgId ? packages.map((p) => (p.id === editingPkgId ? next : p)) : [next, ...packages];
    await persistPackages(updated);
    showToast(
      mode === "draft"
        ? "Draft saved — brands won't see it until you publish"
        : editingPkgId
          ? "Package updated"
          : "Package published on your media kit 🎉"
    );
    setIsModalOpen(false);
  };

  const handleDuplicatePackage = async (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    setMenuAnchor(null);
    if (!canCreateGig(packages.length, subscription?.planKey)) {
      setIsLimitModalOpen(true);
      return;
    }
    const copy: MediaKitPackage = { ...pkg, id: newPackageId(), title: `${pkg.title} (copy)`.slice(0, 80), isDraft: true, isPopular: false };
    const index = packages.findIndex((p) => p.id === pkg.id);
    const updated = [...packages.slice(0, index + 1), copy, ...packages.slice(index + 1)];
    await persistPackages(updated);
    showToast("Duplicated as a draft");
  };

  const handlePublishPackage = async (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    setMenuAnchor(null);
    await persistPackages(packages.map((p) => (p.id === pkg.id ? { ...p, isDraft: false, isActive: true } : p)));
    showToast("Package published on your media kit 🎉");
  };

  const handleTogglePackageActive = async (id: string, currentActive: boolean) => {
    setActiveMenuId(null);
    const updated = packages.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p));
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast(`Package ${!currentActive ? "is now live" : "is now hidden"}`);
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    const updated = packages.filter((p) => p.id !== packageToDelete.id);
    setPackages(updated);
    if (activeEmail) {
      await MediaKitService.saveToDb(activeEmail, settings, updated, activeCreatorId);
    }
    showToast("Package deleted");
    setPackageToDelete(null);
  };

  const handleShareService = async (pkg: MediaKitPackage) => {
    setActiveMenuId(null);
    const handle = (profile.username || "creator").replace(/^@/, "");
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}/mediakit`
      : `https://inflixo.com/${handle}/mediakit`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast(`Link for "${pkg.title}" copied! ✨`);
    }
  };

  const getServicePlatformBadge = (pkg: MediaKitPackage) => {
    const platform = (pkg.platform || "").toLowerCase();
    if (platform.includes("instagram")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shrink-0 shadow-xs">
          <InstagramIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("youtube")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FF0000] text-white shrink-0 shadow-xs">
          <YoutubeIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("facebook")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#1877F2] text-white shrink-0 shadow-xs">
          <FacebookIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("linkedin")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#0A66C2] text-white shrink-0 shadow-xs">
          <LinkedinIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("twitter") || platform.includes("x ")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-black text-white shrink-0 shadow-xs">
          <XTwitterIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("spotify") || platform.includes("podcast")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#1DB954] text-white shrink-0 shadow-xs">
          <SpotifyIcon className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (platform.includes("bundle") || platform.includes("gift")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FAF5FF] border border-purple-200/80 text-purple-600 shrink-0 shadow-xs">
          <Gift className="h-5 w-5 text-purple-600 stroke-[2.2]" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#7A2253]/10 text-[#7A2253] shrink-0">
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
  const mediaKitPath = `/${cleanHandle}/mediakit`;
  const mediaKitUrl = typeof window !== "undefined" ? `${window.location.origin}${mediaKitPath}` : mediaKitPath;
  const activePackages = packages.filter((p) => p.isActive).length;
  const hasInstagram = Boolean(socials?.instagram?.url || socials?.instagram?.username || (socials?.instagram?.followers ?? 0) > 0);
  const hasYoutube = Boolean(socials?.youtube?.url || socials?.youtube?.username || (socials?.youtube?.subscribers ?? 0) > 0);
  const hasFacebook = Boolean(socials?.facebook?.url || socials?.facebook?.username || (socials?.facebook?.followers ?? 0) > 0);
  const connectedPlatforms = [hasInstagram, hasYoutube, hasFacebook].filter(Boolean).length;

  const { download: downloadPdf, loading: pdfLoading } = useMediaKitPdf(cleanHandle);

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
    { label: "Total fanbase", value: totalAudience > 0 ? formatFans(totalAudience) : "Not connected", ok: totalAudience > 0, href: "/dashboard/socials" },
    { label: "Platforms", value: `${connectedPlatforms} connected`, ok: connectedPlatforms > 0, href: "/dashboard/socials" },
    { label: "Packages", value: `${activePackages} active`, ok: activePackages > 0 },
    { label: "Brand contact", value: hasContactConfigured ? contactMethodsLabel || "Enabled" : "Not set up", ok: hasContactConfigured, onClick: () => setIsContactModalOpen(true) },
  ];

  const activeMenuPkg = activeMenuId ? packages.find((p) => p.id === activeMenuId) || null : null;

  return (
    <PageContainer className="text-left">
      {/* 1. PAGE HEADER */}
      <PageHeader
        {...PAGE_COPY.mediakit}
        actions={
          <>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfLoading}
              aria-busy={pdfLoading}
              className="dash-btn-secondary disabled:cursor-wait disabled:opacity-70"
              title="Download A4 Media Kit PDF"
            >
              {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              <span>{pdfLoading ? PDF_PREPARING_LABEL : "Download PDF"}</span>
            </button>
            <button type="button" onClick={handleShareMediaKit} className="dash-btn-secondary" title="Share public media kit">
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
            <button type="button" onClick={handleOpenAddModal} className="dash-btn-primary">
              <Plus className="h-4 w-4" />
              <span>New package</span>
            </button>
          </>
        }
      />

      {/* 2. STAT CARDS */}
      <StatCardGrid cols={4}>
        <StatCard label="Total fanbase" value={totalAudience > 0 ? formatFans(totalAudience) : "0"} />
        <StatCard
          label="Connected platforms"
          value={connectedPlatforms}
          badge={
            connectedPlatforms > 0 ? (
              <span className="flex items-center gap-1.5">
                {hasInstagram && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white" title="Instagram">
                    <InstagramIcon className="h-3 w-3 text-white" />
                  </span>
                )}
                {hasYoutube && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF0000] text-white" title="YouTube">
                    <YoutubeIcon className="h-3 w-3 text-white" />
                  </span>
                )}
                {hasFacebook && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white" title="Facebook">
                    <FacebookIcon className="h-3 w-3 text-white" />
                  </span>
                )}
              </span>
            ) : (
              "None connected"
            )
          }
        />
        <StatCard label="Active packages" value={activePackages} badge={activePackages > 0 ? "Active" : "None active"} />
        <StatCard
          label="Contact email"
          value={settings.sponsorEmail || profile.email || "nikunj.appz@gmail.com"}
          action={{ label: "Edit", onClick: () => setIsContactModalOpen(true), title: "Configure brand contact" }}
        />
      </StatCardGrid>

      {/* 2.5 ABOUT YOU FOR BRANDS (MEDIA KIT V2) */}
      <SectionCard
        title="About you for brands"
        subtitle="Your editorial story, audience voice, brand fit, and promises shown on your public media kit and PDF."
        icon={<Sparkles className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfLoading}
              aria-busy={pdfLoading}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B6B76] hover:text-[#7A2253] transition-colors cursor-pointer disabled:cursor-wait"
            >
              {pdfLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              {pdfLoading ? PDF_PREPARING_LABEL : "Download PDF"}
            </button>
            <a
              href={mediaKitPath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[#7A2253] hover:underline"
            >
              View public media kit
            </a>
          </div>
        }
        className="text-left"
        bodyClassName="p-4 sm:p-5"
      >
        <form onSubmit={handleSaveBrandStory} className="space-y-4">
          {/* Row 1: Intro + Audience Desc */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-semibold text-[#18181B]">
                  Hello / Brand introduction
                </label>
                <span className="text-[11px] text-[#6B6B76] font-medium">{brandIntro.length}/300</span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                value={brandIntro}
                onChange={(e) => setBrandIntro(e.target.value.slice(0, 300))}
                placeholder="Write a warm, first-person note to brands about who you are and the stories you tell..."
                className="w-full rounded-[5px] border border-[#ECECF0] bg-white p-3 text-xs sm:text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-semibold text-[#18181B]">
                  Who follows along (Audience story)
                </label>
                <span className="text-[11px] text-[#6B6B76] font-medium">{brandAudienceDesc.length}/200</span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={brandAudienceDesc}
                onChange={(e) => setBrandAudienceDesc(e.target.value.slice(0, 200))}
                placeholder="Describe the people who watch your work — what they care about, trust you for, and ask you about..."
                className="w-full rounded-[5px] border border-[#ECECF0] bg-white p-3 text-xs sm:text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Row 2: Now making + Availability + Reply time + Signature name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-semibold text-[#18181B]">Currently making</label>
                <span className="text-[10px] text-[#6B6B76]">{brandNowMaking.length}/80</span>
              </div>
              <input
                type="text"
                maxLength={80}
                value={brandNowMaking}
                onChange={(e) => setBrandNowMaking(e.target.value.slice(0, 80))}
                placeholder="e.g., A 6-part series on hidden cafes"
                className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-[#18181B]">Availability</label>
              <div className="grid grid-cols-2 gap-1.5 h-9">
                <button
                  type="button"
                  onClick={() => setBrandAvailability("open")}
                  className={`rounded-[5px] border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    brandAvailability === "open"
                      ? "bg-[#EAF7F0] border-[#10b981] text-[#047857]"
                      : "bg-white border-[#ECECF0] text-[#6B6B76] hover:bg-[#FAFAFB]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span>Open</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBrandAvailability("busy")}
                  className={`rounded-[5px] border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    brandAvailability === "busy"
                      ? "bg-[#FFFBEB] border-[#f59e0b] text-[#b45309]"
                      : "bg-white border-[#ECECF0] text-[#6B6B76] hover:bg-[#FAFAFB]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                  <span>Busy</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-[#18181B]">Typical reply time</label>
              <select
                value={brandReplyTime}
                onChange={(e) => setBrandReplyTime(e.target.value)}
                className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-xs font-medium text-[#18181B] focus:border-[#7A2253] focus:outline-none cursor-pointer"
              >
                <option value="Within 24h">Within 24h</option>
                <option value="Within 48h">Within 48h</option>
                <option value="2–3 business days">2–3 business days</option>
                <option value="Within a week">Within a week</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-[#18181B]">Closing signature name</label>
              <input
                type="text"
                maxLength={120}
                value={brandSignatureName}
                onChange={(e) => setBrandSignatureName(e.target.value)}
                placeholder={profile.displayName || "Your signature"}
                className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Fit tags (3) & Not-fit tags (3) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#18181B]">
                Great fit for (up to 3 tags)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={`fit-${idx}`}
                    type="text"
                    maxLength={40}
                    value={brandFitTags[idx] || ""}
                    onChange={(e) => {
                      const next: [string, string, string] = [...brandFitTags] as [string, string, string];
                      next[idx] = e.target.value;
                      setBrandFitTags(next);
                    }}
                    placeholder={idx === 0 ? "e.g., Specialty coffee" : idx === 1 ? "e.g., Indie D2C" : "e.g., Travel gear"}
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#18181B]">
                Not a fit for (up to 3 tags)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={`nofit-${idx}`}
                    type="text"
                    maxLength={40}
                    value={brandNofitTags[idx] || ""}
                    onChange={(e) => {
                      const next: [string, string, string] = [...brandNofitTags] as [string, string, string];
                      next[idx] = e.target.value;
                      setBrandNofitTags(next);
                    }}
                    placeholder={idx === 0 ? "e.g., Betting apps" : idx === 1 ? "e.g., Crypto tokens" : "e.g., Hard scripts"}
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Promises (4 presets) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[12px] font-semibold text-[#18181B]">
              My promises to brands (select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MEDIAKIT_PROMISE_PRESETS.map((preset) => {
                const checked = brandPromises.includes(preset);
                return (
                  <label
                    key={preset}
                    className={`flex items-center gap-2.5 rounded-[5px] border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      checked
                        ? "border-[#7A2253] bg-[#FFF0F5]/60 text-[#7A2253]"
                        : "border-[#ECECF0] bg-white text-[#3F3F46] hover:bg-[#FAFAFB]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setBrandPromises(brandPromises.filter((p) => p !== preset));
                        } else {
                          setBrandPromises([...brandPromises, preset]);
                        }
                      }}
                      className="rounded accent-[#7A2253]"
                    />
                    <span>{preset}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-[#F4F4F5]">
            <button
              type="submit"
              disabled={savingBrandStory}
              className="dash-btn-primary"
            >
              <span>{savingBrandStory ? "Saving..." : "Save brand story"}</span>
            </button>
          </div>
        </form>
      </SectionCard>

      {/* 2.6 RATES, GST & PAYMENT (India-specific commercial terms) */}
      <CommercialTermsCard value={settings.commercialTerms} onSave={handleSaveCommercialTerms} />

      {/* 3. COLLAB PACKAGES (NO TABS) */}
      <SectionCard
        title={`Collab packages${packages.length > 0 ? ` (${packages.length})` : ""}`}
        subtitle="Create different packages for brand reels, restaurant visits, product features and more."
        icon={<Briefcase className="h-4 w-4" />}
        action={
          <a href={mediaKitPath} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#7A2253] hover:underline">
            View public media kit
          </a>
        }
        className="text-left"
        bodyClassName="p-4 space-y-3"
      >
        {/* 4. SERVICES LIST OR EMPTY STATE */}
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
                  className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#7A2253] px-4 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Collab Package</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExamplesModalOpen(true)}
                  className="text-xs font-semibold text-[#7A2253] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Not sure what to offer? See collab reel examples</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (NO IMAGE) */}
            <div className="hidden md:block overflow-x-auto rounded-[5px] border border-[#ECECF0] bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ECECF0] bg-[#FAFAFB]/80 text-[11px] font-bold uppercase tracking-wider text-[#6B6B76]">
                    <th className="py-3 px-4 min-w-[220px]">Package</th>
                    <th className="py-3 px-4 min-w-[140px]">Category</th>
                    <th className="py-3 px-4 min-w-[220px]">Deliverables</th>
                    <th className="py-3 px-4 min-w-[110px]">Delivery Time</th>
                    <th className="py-3 px-4 min-w-[130px]">Price</th>
                    <th className="py-3 px-4 min-w-[100px]">Status</th>
                    <th className="py-3 px-4 min-w-[110px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECF0]">
                  {packages.map((pkg) => {
                    const displayPrice = formatPackagePrice(pkg);
                    const turnaroundText = pkg.turnaroundDays ? `${pkg.turnaroundDays} ${pkg.turnaroundDays === 1 ? "day" : "days"}` : "3 days";
                    const badgeText = pkg.packageName || pkg.badge;

                    return (
                      <tr key={pkg.id} className="hover:bg-[#fafafa] transition-colors">
                        {/* 1. Package Name & Type (NO IMAGE) */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <p className="flex flex-wrap items-center gap-1.5 font-bold text-sm text-[#18181B] leading-snug">
                              {pkg.title}
                              {packages.indexOf(pkg) >= getPlanQuota(subscription?.planKey).maxGigs && <OverLimitBadge />}
                            </p>
                            <p className="text-xs text-[#6B6B76]">
                              {pkg.platform}
                            </p>
                            {pkg.storyPitch && (
                              <p className="text-[11px] italic text-[#52525B] line-clamp-2">
                                &ldquo;{pkg.storyPitch}&rdquo;
                              </p>
                            )}
                            {badgeText && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] px-2 py-0.5 text-[11px] font-semibold text-[#7A2253]">
                                  ⭐ {badgeText}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. Category badge */}
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center rounded-[5px] bg-[#F4F4F5] px-2.5 py-1 text-xs font-semibold text-[#52525B]">
                            {pkg.category || "—"}
                          </span>
                        </td>

                        {/* 3. Deliverables list */}
                        <td className="py-4 px-4 align-top">
                          <ul className="space-y-1 text-xs text-[#3F3F46]">
                            {pkg.deliverables && pkg.deliverables.length > 0 ? (
                              pkg.deliverables.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                  <span className="text-[#C2414B] font-bold text-xs leading-none mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-[#A1A1AA] italic">Custom deliverables</li>
                            )}
                          </ul>
                        </td>

                        {/* 4. Delivery Time */}
                        <td className="py-4 px-4 align-top text-xs font-medium text-[#18181B] whitespace-nowrap">
                          {turnaroundText}
                        </td>

                        {/* 5. Price */}
                        <td className="py-4 px-4 align-top text-sm font-bold text-[#18181B] whitespace-nowrap">
                          {displayPrice}
                        </td>

                        {/* 6. Status */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          {pkg.isDraft ? (
                            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#FFFBEB] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                              Draft
                            </span>
                          ) : pkg.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#EAF7F0] px-2.5 py-1 text-xs font-semibold text-[#047857]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#F4F4F5] px-2.5 py-1 text-xs font-semibold text-[#6B6B76]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#A1A1AA]" />
                              Hidden
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(pkg)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#3F3F46] hover:bg-[#FAFAFB] hover:text-[#7A2253] transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            <div className="relative" data-pkg-menu>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeMenuId === pkg.id) {
                                    setActiveMenuId(null);
                                    setMenuAnchor(null);
                                  } else {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setMenuAnchor({
                                      top: rect.bottom + 6,
                                      right: Math.max(12, window.innerWidth - rect.right),
                                    });
                                    setActiveMenuId(pkg.id);
                                  }
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B] transition-colors cursor-pointer"
                                aria-label="More options"
                                aria-expanded={activeMenuId === pkg.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (NO IMAGE) */}
            <div className="block md:hidden space-y-3">
              {packages.map((pkg) => {
                const displayPrice = formatPackagePrice(pkg);
                const turnaroundText = pkg.turnaroundDays ? `${pkg.turnaroundDays} ${pkg.turnaroundDays === 1 ? "day" : "days"}` : "3 days";
                const badgeText = pkg.packageName || pkg.badge;

                return (
                  <div
                    key={pkg.id}
                    className="rounded-[5px] border border-[#ECECF0] bg-white p-3.5 space-y-3 text-left shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-[#18181B] leading-tight">
                          {pkg.title}
                        </h3>
                        <p className="text-xs text-[#6B6B76] mt-0.5">
                          {pkg.platform}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {pkg.isDraft ? (
                            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#FFFBEB] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                              Draft
                            </span>
                          ) : pkg.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#EAF7F0] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-semibold text-[#6B6B76]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#A1A1AA]" />
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {pkg.category && (
                        <span className="inline-flex items-center rounded-[5px] bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium text-[#52525B]">
                          {pkg.category}
                        </span>
                      )}
                      {badgeText && (
                        <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] px-2 py-0.5 text-[11px] font-semibold text-[#7A2253]">
                          ⭐ {badgeText}
                        </span>
                      )}
                    </div>

                    {pkg.storyPitch && (
                      <p className="text-xs italic text-[#52525B]">
                        &ldquo;{pkg.storyPitch}&rdquo;
                      </p>
                    )}

                    {/* Deliverables list */}
                    {pkg.deliverables && pkg.deliverables.length > 0 && (
                      <div className="rounded-[5px] bg-[#FAFAFB] border border-[#F4F4F5] p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">Deliverables</p>
                        <ul className="space-y-1 text-xs text-[#3F3F46]">
                          {pkg.deliverables.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-[#C2414B] font-bold text-xs">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#F4F4F5]">
                      <div>
                        <p className="text-[11px] text-[#6B6B76]">Delivery: <span className="font-semibold text-[#18181B]">{turnaroundText}</span></p>
                        <p className="text-sm font-bold text-[#18181B] mt-0.5">{displayPrice}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(pkg)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#3F3F46] hover:bg-[#FAFAFB] hover:text-[#7A2253] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setPackageToDelete(pkg);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#C2414B] hover:bg-rose-50 cursor-pointer"
                          aria-label="Delete package"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </SectionCard>

      {/* Portal-rendered Package ⋮ Dropdown Menu (never clips when 1 package) */}
      {typeof document !== "undefined" && activeMenuPkg && menuAnchor &&
        createPortal(
          <div
            data-pkg-menu
            onClick={(e) => e.stopPropagation()}
            style={{ top: menuAnchor.top, right: menuAnchor.right }}
            className="fixed w-44 rounded-[5px] border border-[#ECECF0] bg-white p-1.5 shadow-lg z-[9999] space-y-0.5 animate-in fade-in text-left"
          >
            <button
              type="button"
              onClick={() => handleShareService(activeMenuPkg)}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-[13px] font-medium text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-[#6B6B76]" />
              <span>Share Link</span>
            </button>

            {activeMenuPkg.isDraft && (
              <button
                type="button"
                onClick={() => handlePublishPackage(activeMenuPkg)}
                className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-[13px] font-semibold text-[#7A2253] hover:bg-[#F7EEF2] transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Publish</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDuplicatePackage(activeMenuPkg)}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-[13px] font-medium text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-[#6B6B76]" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => handleTogglePackageActive(activeMenuPkg.id, activeMenuPkg.isActive)}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-[13px] font-medium text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer"
            >
              {activeMenuPkg.isActive ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-[#6B6B76]" />
                  <span>Hide from profile</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-[#6B6B76]" />
                  <span>Set as active</span>
                </>
              )}
            </button>

            <div className="my-1 border-t border-[#ECECF0]" />

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                setMenuAnchor(null);
                setPackageToDelete(activeMenuPkg);
              }}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-[13px] font-medium text-[#C2414B] hover:bg-[#fef2f2] transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete package</span>
            </button>
          </div>,
          document.body
        )}

      {/* 4.5. COLLAB REQUESTS INBOX */}
      <div id="requests" className="scroll-mt-6">
        <SectionCard
          title="Collab requests"
          subtitle="Requests brands send from your public profile."
          icon={<Mail className="h-4 w-4" />}
          action={
            <span className="text-[12px] text-[#6B6B76]">
              {collabRequests.length} {collabRequests.length === 1 ? "request" : "requests"}
            </span>
          }
          bodyClassName="p-4"
        >
          {loadingRequests ? (
            <div className="p-8 text-center text-xs text-[#6B6B76] bg-white rounded-[5px] border border-[#ECECF0]">
              Loading collab requests...
            </div>
          ) : collabRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[5px] border border-dashed border-[#D4D4D8]">
              <Mail className="h-8 w-8 text-[#A1A1AA] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#18181B]">No collab requests yet</p>
              <p className="text-[11px] text-[#6B6B76] mt-1 max-w-sm mx-auto">
                When brands submit an inquiry via the &quot;Send a collab request&quot; button on your profile, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collabRequests.map((req) => {
                const brand = req.brandName || req.brand_name || "Brand";
                const contactPerson = req.contactName || req.contact_name;
                const pkgTitle = req.packageName || req.package_name || "Custom collab";
                const budgetText = req.budget || "Budget not specified";
                const dateRaw = req.createdAt || req.created_at;
                const dateFormatted = dateRaw
                  ? new Date(dateRaw).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                  : "";
                const email = req.workEmail || req.work_email || req.email || "";
                const phone = req.phone || req.whatsapp || "";
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const creatorName = profile.displayName || profile.username || "Creator";
                const currentStatus = req.status || "new";
                const isExpanded = Boolean(expandedRequests[req.id]);
                const rawMessage = req.message || "";
                const isLongMessage = rawMessage.length > 140;

                return (
                  <div key={req.id} className="p-4 bg-white rounded-[5px] border border-[#ECECF0] shadow-2xs space-y-3 text-left">
                    {/* Top line: brand · name · package · budget · date · status chip (New / Replied / Closed) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F4F4F5] pb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#52525B]">
                        <span className="font-bold text-sm text-[#18181B]">{brand}</span>
                        {contactPerson && (
                          <>
                            <span className="text-[#A1A1AA]">·</span>
                            <span className="text-[#3F3F46] font-medium">{contactPerson}</span>
                          </>
                        )}
                        <span className="text-[#A1A1AA]">·</span>
                        <span className="font-medium text-[#18181B]">{pkgTitle}</span>
                        <span className="text-[#A1A1AA]">·</span>
                        <span className="text-[#6B6B76]">{budgetText}</span>
                        {dateFormatted && (
                          <>
                            <span className="text-[#A1A1AA]">·</span>
                            <span className="text-[#A1A1AA]">{dateFormatted}</span>
                          </>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] border ${
                            currentStatus === "new"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : currentStatus === "replied"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {currentStatus === "new" ? "New" : currentStatus === "replied" ? "Replied" : "Closed"}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6B76]">
                      {email && (
                        <div>
                          <span className="text-[#A1A1AA]">Email:</span>{" "}
                          <a href={`mailto:${email}`} className="text-[#7A2253] hover:underline font-medium">
                            {email}
                          </a>
                        </div>
                      )}
                      {phone && (
                        <div>
                          <span className="text-[#A1A1AA]">Phone:</span>{" "}
                          <span className="font-medium text-[#27272A]">{phone}</span>
                        </div>
                      )}
                      {req.timeline && (
                        <div>
                          <span className="text-[#A1A1AA]">Timeline:</span>{" "}
                          <span className="font-medium text-[#27272A]">{req.timeline}</span>
                        </div>
                      )}
                      {(req.campaignLocation || req.campaign_location) && (
                        <div>
                          <span className="text-[#A1A1AA]">Location:</span>{" "}
                          <span className="font-medium text-[#27272A]">{req.campaignLocation || req.campaign_location}</span>
                        </div>
                      )}
                      {(req.websiteOrSocial || req.website_or_social) && (
                        <div>
                          <span className="text-[#A1A1AA]">Link:</span>{" "}
                          <a
                            href={
                              (req.websiteOrSocial || req.website_or_social).startsWith("http")
                                ? (req.websiteOrSocial || req.website_or_social)
                                : `https://${req.websiteOrSocial || req.website_or_social}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#7A2253] hover:underline"
                          >
                            {req.websiteOrSocial || req.website_or_social}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Message (Full / Expandable) */}
                    {rawMessage && (
                      <div className="text-xs text-[#3F3F46] bg-[#FAFAFB] p-2.5 rounded-[5px] border border-[#F4F4F5] leading-relaxed">
                        <p className={`whitespace-pre-wrap ${!isExpanded && isLongMessage ? "line-clamp-2" : ""}`}>
                          {rawMessage}
                        </p>
                        {isLongMessage && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRequests((prev) => ({
                                ...prev,
                                [req.id]: !prev[req.id],
                              }))
                            }
                            className="mt-1 text-[11px] font-semibold text-[#7A2253] hover:underline cursor-pointer"
                          >
                            {isExpanded ? "Show less" : "Read full message"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Bar: "Reply on email", "WhatsApp" (if phone given), status dropdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {email && (
                          <a
                            href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${pkgTitle} collab with ${creatorName}`)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Reply on email</span>
                          </a>
                        )}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#6B6B76]">
                        <span className="text-[11px] font-medium">Status:</span>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value as "new" | "replied" | "closed")}
                          className="h-7 px-2 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-medium text-[#18181B] outline-none focus:border-[#7A2253] cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="replied">Replied</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 5. CREATE / EDIT COLLAB PACKAGE */}
      <PackageForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initial={formInitial}
        isEdit={Boolean(editingPkgId)}
        pricesPlusGst={settings.commercialTerms?.pricesPlusGst}
        themeKey={profile?.themeKey}
        onSubmit={handleSubmitPackage}
      />

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
              className="rounded-[5px] border border-[#ECECF0] bg-white p-3.5 sm:p-4 space-y-2 hover:border-[#D4D4D8] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#7A2253]">{example.title}</h4>
                  <span className="text-[10px] font-semibold text-[#7A2253] bg-[#7A2253]/[0.08] px-2 py-0.5 rounded-[5px]">
                    {example.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#7A2253]">{example.minPrice}–{example.maxPrice}</span>
              </div>

              <p className="text-xs text-[#52525B] font-normal">{example.description}</p>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#ECECF0]">
                <span className="text-[11px] text-[#6B6B76]">{example.turnaroundDays}-day delivery · {example.deliverables.length} deliverables</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(example)}
                  className="px-3 py-1 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 shadow-sm shadow-[#7A2253]/20 transition-all cursor-pointer"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </ModalBody>
        <ModalFooter className="px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={() => setIsExamplesModalOpen(false)}
            className="h-10 px-5 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </ModalFooter>
      </Modal>

      {/* 7. CONTACT & MEDIA KIT SETTINGS MODAL */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        size="lg"
        title="Collab & Media Kit Settings"
        description="Configure your audience snapshot, past brand logos, and direct contact options for brand inquiries."
        icon={<SlidersHorizontal className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveContactSettings} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left max-h-[70vh] overflow-y-auto">
            {/* Section A: Audience Snapshot */}
            <div className="space-y-3 pb-3 border-b border-[#ECECF0]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A2253]">Audience Snapshot</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#18181B]">Avg. Reel Views</label>
                  <input
                    type="text"
                    value={settingAvgReelViews}
                    onChange={(e) => setSettingAvgReelViews(e.target.value)}
                    placeholder="e.g., 45K or 1.2M"
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#18181B]">Engagement Rate (%)</label>
                  <input
                    type="text"
                    value={settingEngagementRate}
                    onChange={(e) => setSettingEngagementRate(e.target.value)}
                    placeholder="e.g., 4.8%"
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#18181B]">Top Cities</label>
                <input
                  type="text"
                  value={settingTopCities}
                  onChange={(e) => setSettingTopCities(e.target.value)}
                  placeholder="e.g., Mumbai, Delhi, Bengaluru (up to 3)"
                  className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#18181B]">Content Languages</label>
                  <input
                    type="text"
                    value={settingLanguages}
                    onChange={(e) => setSettingLanguages(e.target.value)}
                    placeholder="e.g., Hindi, English (comma-separated)"
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#18181B]">Categories / Niches</label>
                  <input
                    type="text"
                    value={settingCategories}
                    onChange={(e) => setSettingCategories(e.target.value)}
                    placeholder="e.g., Street Food, Travel, Vlogs"
                    className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#18181B]">Past Brands Worked With</label>
                <input
                  type="text"
                  value={settingPastBrands}
                  onChange={(e) => setSettingPastBrands(e.target.value)}
                  placeholder="e.g., Chai Tapri Co., Masala Munch Snacks, Monsoon Sips"
                  className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                />
                <p className="text-[11px] text-[#6B6B76]">Separate multiple brands with commas.</p>
              </div>
            </div>

            {/* Section B: Contact & Routing */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A2253]">Contact Options</h4>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#18181B]">
                  Official WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#18181B]">
                  Business Email Address
                </label>
                <input
                  type="email"
                  value={settings.sponsorEmail || ""}
                  onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                  placeholder={profile.email || "collabs@yourdomain.com"}
                  className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#18181B]">
                  <input
                    type="checkbox"
                    checked={settingAllowWhatsapp}
                    onChange={(e) => setSettingAllowWhatsapp(e.target.checked)}
                    className="rounded accent-[#7A2253]"
                  />
                  <span>Show &quot;Prefer WhatsApp?&quot; direct link in collab sheet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#18181B]">
                  <input
                    type="checkbox"
                    checked={settingAllowEmail}
                    onChange={(e) => setSettingAllowEmail(e.target.checked)}
                    className="rounded accent-[#7A2253]"
                  />
                  <span>Show &quot;Email instead&quot; direct link in collab sheet</span>
                </label>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-xs font-medium text-[#18181B]">
                  Minimum Campaign Budget (Optional)
                </label>
                <input
                  type="text"
                  value={settings.minBudget || ""}
                  onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                  placeholder="₹0 (Accept all deals)"
                  className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-xs font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none"
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3 border-t border-[#ECECF0] bg-[#FAFAFB]">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 rounded-[5px] border border-[#ECECF0] text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#7A2253] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
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
        title="Delete this package?"
        description={`"${packageToDelete?.title}" will be permanently removed from your services and public profile.`}
        confirmText="Delete package"
        cancelText="Cancel"
      />
    </PageContainer>
  );
}
