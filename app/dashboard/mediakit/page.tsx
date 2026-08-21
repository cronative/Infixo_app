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
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";

export default function DashboardMediaKitPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, series } = useCreator();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Package Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Form inputs for package modal
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState<string>("Instagram Reel");
  const [formPrice, setFormPrice] = useState("");
  const [formTurnaround, setFormTurnaround] = useState<number>(2);
  const [formDeliverableInput, setFormDeliverableInput] = useState("");
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);
  const [formBadgeOption, setFormBadgeOption] = useState<string>("none"); // "none" | "popular" | "value" | "custom"
  const [formCustomBadge, setFormCustomBadge] = useState("");

  // Public Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    setPackages(MediaKitService.getPackages());
    const savedSettings = MediaKitService.getSettings();
    setSettings({
      ...savedSettings,
      sponsorEmail: savedSettings.sponsorEmail || profile.email || "business@inflixo.com",
      whatsappNumber: savedSettings.whatsappNumber || "+919876543210",
      minBudget: savedSettings.minBudget ?? "₹0",
    });
  }, [profile.email]);

  const handleSaveSettings = () => {
    MediaKitService.saveSettings(settings);
    setIsEditingSettings(false);
    showToast("Media Kit sponsorship settings saved! 💼");
  };

  const handleOpenAddModal = () => {
    setEditingPkgId(null);
    setFormTitle("1x High-Engagement Instagram Reel");
    setFormPlatform("Instagram Reel");
    setFormPrice("₹2,000");
    setFormTurnaround(2);
    setFormDeliverableInput("");
    setFormDeliverables([
      "1x 30–60s Dedicated/Integrated Reel",
      "Brand Collaborator Tag & Co-authoring",
      "Direct Link/Promo Code in Bio (24 Hours)",
      "30 Days Digital Usage Rights",
    ]);
    setFormBadgeOption("none");
    setFormCustomBadge("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: MediaKitPackage) => {
    setEditingPkgId(pkg.id);
    setFormTitle(pkg.title);
    setFormPlatform(pkg.platform);
    setFormPrice(pkg.price);
    setFormTurnaround(pkg.turnaroundDays);
    setFormDeliverableInput("");
    setFormDeliverables([...pkg.deliverables]);
    if (pkg.isPopular) {
      setFormBadgeOption("popular");
    } else if (pkg.badge && pkg.badge.includes("BEST VALUE")) {
      setFormBadgeOption("value");
    } else if (pkg.badge) {
      setFormBadgeOption("custom");
      setFormCustomBadge(pkg.badge);
    } else {
      setFormBadgeOption("none");
    }
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

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice.trim()) {
      showToast("Please enter a package title and price", "error");
      return;
    }

    let resolvedBadge: string | undefined = undefined;
    let resolvedIsPopular = false;

    if (formBadgeOption === "popular") {
      resolvedBadge = "⭐ MOST POPULAR";
      resolvedIsPopular = true;
    } else if (formBadgeOption === "value") {
      resolvedBadge = "🔥 BEST VALUE (25% OFF)";
    } else if (formBadgeOption === "custom" && formCustomBadge.trim()) {
      resolvedBadge = formCustomBadge.trim();
    }

    if (editingPkgId) {
      const updated = MediaKitService.updatePackage(editingPkgId, {
        title: formTitle.trim(),
        platform: formPlatform,
        price: formPrice.trim(),
        turnaroundDays: Number(formTurnaround) || 2,
        deliverables: formDeliverables.length > 0 ? formDeliverables : ["Product Integration"],
        badge: resolvedBadge,
        isPopular: resolvedIsPopular,
      });
      setPackages(updated);
      showToast("Collaboration package updated! ✨");
    } else {
      MediaKitService.addPackage({
        title: formTitle.trim(),
        platform: formPlatform,
        price: formPrice.trim(),
        turnaroundDays: Number(formTurnaround) || 2,
        deliverables: formDeliverables.length > 0 ? formDeliverables : ["Product Integration"],
        badge: resolvedBadge,
        isPopular: resolvedIsPopular,
        isActive: true,
      });
      setPackages(MediaKitService.getPackages());
      showToast("New collaboration gig created! 🚀");
    }

    setIsModalOpen(false);
  };

  const handleTogglePackageActive = (id: string, currentActive: boolean) => {
    const updated = MediaKitService.updatePackage(id, { isActive: !currentActive });
    setPackages(updated);
    showToast(`Package ${!currentActive ? "activated" : "paused"}!`);
  };

  const handleDeletePackage = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = MediaKitService.deletePackage(id);
      setPackages(updated);
      showToast(`Package "${title}" removed.`);
    }
  };

  const handleLoadSampleGigs = () => {
    MediaKitService.savePackages(SAMPLE_PACKAGES);
    setPackages(SAMPLE_PACKAGES);
    showToast("Loaded sample micro-creator gigs! ⚡");
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
              {packages.length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadSampleGigs}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  ⚡ Load Sample Gigs
                </button>
              )}
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
                <button
                  type="button"
                  onClick={handleLoadSampleGigs}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-[#803D63]" />
                  <span>Load Template Micro-Gigs (₹2,000+)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Rate Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-2xs transition-all relative ${
                    pkg.isPopular
                      ? "border-[#803D63] ring-1 ring-[#803D63]/30"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!pkg.isActive ? "opacity-60 bg-gray-50" : ""}`}
                >
                  {(pkg.badge || pkg.isPopular) && (
                    <span className="absolute -top-3 right-3 bg-[#803D63] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs tracking-tight">
                      {pkg.badge || "⭐ MOST POPULAR"}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#803D63] bg-[#F6EBF1] border border-[#E8DCE4] px-2.5 py-0.5 rounded-md">
                        {pkg.platform}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {pkg.turnaroundDays} Days TAT
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 leading-snug">
                        {pkg.title}
                      </h4>
                      <p className="font-display text-2xl font-black text-[#803D63] mt-1.5">
                        {pkg.price}
                      </p>
                    </div>

                    {/* Deliverables Checklist */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Included Deliverables:
                      </p>
                      <ul className="space-y-1.5 text-xs font-medium text-slate-700">
                        {pkg.deliverables.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
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
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4]">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Frictionless Lead Routing (WhatsApp &amp; Email)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Direct WhatsApp chat &amp; email inquiry links — zero payment gateway or bank KYC required
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="text-xs font-bold text-[#803D63] hover:underline cursor-pointer"
            >
              {isEditingSettings ? "Cancel" : "Edit Settings"}
            </button>
          </div>

          {isEditingSettings ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business WhatsApp Number (with Country Code)
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
                    Business / Sponsor Inquiry Email
                  </label>
                  <input
                    type="email"
                    value={settings.sponsorEmail || ""}
                    onChange={(e) => setSettings({ ...settings, sponsorEmail: e.target.value })}
                    placeholder="business@yourname.com"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Sponsorship Budget Filter
                </label>
                <input
                  type="text"
                  value={settings.minBudget || ""}
                  onChange={(e) => setSettings({ ...settings, minBudget: e.target.value })}
                  placeholder="₹0 or ₹2,000"
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
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-emerald-600" /> WhatsApp Routing
                </p>
                <p className="text-xs font-bold text-slate-900 truncate">{settings.whatsappNumber || "Not Set"}</p>
              </div>

              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-indigo-600" /> Direct Email
                </p>
                <p className="text-xs font-bold text-slate-900 truncate">{settings.sponsorEmail}</p>
              </div>

              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min. Budget Filter</p>
                <p className="text-xs font-bold text-[#803D63]">{settings.minBudget || "₹0"}</p>
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
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                  >
                    <option value="Instagram Reel">Instagram Reel</option>
                    <option value="Instagram Bundle">Instagram Bundle</option>
                    <option value="YouTube Video">YouTube Video</option>
                    <option value="Multi-Platform Bundle">Multi-Platform Bundle</option>
                    <option value="Series Sponsorship">Series Sponsorship</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pricing (in INR)</label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. ₹2,000 or ₹5,400"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                    required
                  />
                </div>
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

              {/* Dynamic Deliverables List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Included Deliverables List</label>
                <div className="flex items-center gap-2 mb-2">
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

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {formDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Badge Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Highlight Badge Tag</label>
                <select
                  value={formBadgeOption}
                  onChange={(e) => setFormBadgeOption(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#803D63] focus:outline-hidden"
                >
                  <option value="none">None (Standard Gig)</option>
                  <option value="popular">⭐ MOST POPULAR</option>
                  <option value="value">🔥 BEST VALUE (25% OFF)</option>
                  <option value="custom">Custom Badge Text</option>
                </select>

                {formBadgeOption === "custom" && (
                  <input
                    type="text"
                    value={formCustomBadge}
                    onChange={(e) => setFormCustomBadge(e.target.value)}
                    placeholder="e.g. ⚡ Save 10%"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900"
                  />
                )}
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
