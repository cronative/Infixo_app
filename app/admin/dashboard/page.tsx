"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Film,
  Sparkles,
  ShieldCheck,
  Search,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  Play,
  Copy,
  Briefcase,
  Crown,
  Filter,
  ArrowUpRight,
  Check,
  Mail,
  Send,
  Loader2,
  MoreVertical,
  UserCheck,
  Ban,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/AdminService";
import { Logo } from "@/components/shared/Logo";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { SeriesService } from "@/services/SeriesService";
import { authRepository, profileRepository, onboardingRepository } from "@/repositories/localRepository";

interface AdminCreator {
  id: number | string;
  email: string;
  displayName: string;
  username: string;
  photoDataUrl: string | null;
  category: string;
  bio: string;
  themeKey: string;
  isVerified: boolean;
  accountStatus: "active" | "suspended" | string;
  createdAt: string;
  planKey?: string;
  planName?: string;
  planStatus?: string;
  seriesCount?: number;
  gigsCount?: number;
  minGigPrice?: string;
  maxGigPrice?: string;
}

interface AdminSeries {
  id: string;
  creatorId?: string | number;
  creatorEmail: string;
  creatorName: string;
  creatorUsername: string;
  title: string;
  posterDataUrl: string | null;
  description: string;
  genre: string;
  language: string;
  createdAt: string;
  seasons: {
    id: string;
    seasonNumber: number;
    title: string;
    episodes: {
      id: string;
      episodeNumber: number;
      title: string;
      thumbnailDataUrl: string | null;
      platform: string;
      externalUrl: string;
      description: string;
    }[];
  }[];
}

const EMAIL_TEMPLATES = [
  {
    id: "india_creators",
    name: "🇮🇳 India Creators 100K Mission",
    subject: "Thank you for creating content in India — Join the Inflixo 100K Mission 🚀",
    body: `<h2 style="color: #7A1C3C; margin-top: 0; font-size: 20px;">Hello Content Creator,</h2>
<p>First of all, a massive <strong>THANK YOU</strong> for inspiring millions by creating amazing content in India! 🇮🇳✨</p>
<p>As creators ourselves, we know how hard you work every day to script, shoot, and edit. Inflixo helps you organize your OTT Series &amp; Media Kit Rate Cards in one home.</p>
<div style="text-align: center; margin: 28px 0;">
  <a href="https://inflixo.com/login" style="background: #7A1C3C; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block;">JOIN NOW — CREATE YOUR INFLIXO</a>
</div>`,
  },
  {
    id: "welcome",
    name: "🎉 Welcome Creator Template",
    subject: "Welcome to Inflixo! Set up your creator page 🚀",
    body: `<h2 style="color: #7A1C3C; margin-top: 0;">Welcome to Inflixo Creator Home! 🎉</h2>
<p>Hi Creator,</p>
<p>Thank you for joining <strong>Inflixo</strong> — the single link platform built for video creators to organize series, showcase seasons, and feature their rate cards.</p>
<p>Log in to your dashboard to complete your page setup!</p>`,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"creators" | "series" | "email">("creators");
  const [creatorFilter, setCreatorFilter] = useState<"all" | "vip" | "gigs" | "early">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [seriesList, setSeriesList] = useState<AdminSeries[]>([]);
  const [stats, setStats] = useState({
    totalCreators: 0,
    totalSeries: 0,
    totalEpisodes: 0,
    totalActiveGigs: 0,
    vipSubscribers: 0,
  });

  // Action Menu Dropdown State
  const [openActionMenuId, setOpenActionMenuId] = useState<string | number | null>(null);

  // Selected Series Modal State
  const [selectedSeries, setSelectedSeries] = useState<AdminSeries | null>(null);

  // Creator Gigs Preview Modal State
  const [viewGigsCreator, setViewGigsCreator] = useState<AdminCreator | null>(null);
  const [creatorGigs, setCreatorGigs] = useState<any[]>([]);

  // Email Broadcast State
  const [selectedTemplateId, setSelectedTemplateId] = useState("welcome");
  const [emailSubject, setEmailSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [emailBody, setEmailBody] = useState(EMAIL_TEMPLATES[0].body);
  const [recipientsInput, setRecipientsInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Authenticate Admin
  useEffect(() => {
    const session = AdminService.getSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    setAdminUser(session);
    loadAdminData();
  }, [router]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/admin/creators").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/series").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      let loadedCreators: AdminCreator[] = [];
      if (cRes.success && Array.isArray(cRes.creators)) {
        loadedCreators = cRes.creators;
      }
      if (cRes.stats) {
        setStats(cRes.stats);
      }

      let loadedSeries: AdminSeries[] = [];
      if (sRes.success && Array.isArray(sRes.series)) {
        loadedSeries = sRes.series;
      }

      // Include local profile if missing
      const localProfile = ProfileService.getProfile();
      if (localProfile.username || localProfile.displayName) {
        const exists = loadedCreators.some(
          (c) => c.username?.toLowerCase() === localProfile.username?.toLowerCase()
        );
        if (!exists) {
          loadedCreators.unshift({
            id: "local_1",
            email: "nikunj.appz@gmail.com",
            displayName: localProfile.displayName || "Creator Profile",
            username: localProfile.username || "creator",
            photoDataUrl: localProfile.photoDataUrl,
            category: localProfile.category || "Technology & AI",
            bio: localProfile.bio || "",
            themeKey: "minimal-white",
            isVerified: true,
            accountStatus: "active",
            createdAt: new Date().toISOString(),
            planKey: "creator_VIP",
            planName: "Creator VIP",
            gigsCount: 2,
            minGigPrice: "₹2,000",
            maxGigPrice: "₹5,400",
            seriesCount: 1,
          });
        }
      }

      setCreators(loadedCreators);
      setSeriesList(loadedSeries);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Error loading admin records", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    AdminService.logout();
    showToast("Admin logged out successfully 👋");
    router.push("/admin/login");
  }

  async function handleGrantVIP(creator: AdminCreator) {
    setOpenActionMenuId(null);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_vip", creatorId: creator.id, email: creator.email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`VIP Plan granted to ${creator.displayName || creator.username}! ⭐`);
        loadAdminData();
      } else {
        showToast(data.error || "Failed to grant VIP Plan", "error");
      }
    } catch {
      showToast("Error granting VIP Plan", "error");
    }
  }

  async function handleToggleStatus(creator: AdminCreator) {
    setOpenActionMenuId(null);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", creatorId: creator.id, email: creator.email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Account status updated to ${data.newStatus}`);
        loadAdminData();
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Error updating account status", "error");
    }
  }

  function handleImpersonate(creator: AdminCreator) {
    setOpenActionMenuId(null);
    authRepository.save({
      email: creator.email,
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider: "email",
    });
    profileRepository.save({
      id: String(creator.id),
      email: creator.email,
      displayName: creator.displayName,
      username: creator.username,
      category: creator.category,
      bio: creator.bio,
      photoDataUrl: creator.photoDataUrl,
      updatedAt: new Date().toISOString(),
    });
    onboardingRepository.saveStep("finish");
    showToast(`Impersonating @${creator.username}... Redirecting to Dashboard 🚀`);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  }

  async function handleViewGigs(creator: AdminCreator) {
    setOpenActionMenuId(null);
    setViewGigsCreator(creator);
    try {
      const res = await fetch(`/api/creator/mediakit?identifier=${encodeURIComponent(creator.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.packages)) {
        setCreatorGigs(data.packages);
      } else {
        setCreatorGigs([]);
      }
    } catch {
      setCreatorGigs([]);
    }
  }

  function handleAddAllCreatorsToRecipients() {
    const allEmails = Array.from(
      new Set(creators.map((c) => c.email?.trim().toLowerCase()).filter(Boolean))
    );
    if (allEmails.length === 0) {
      showToast("No creator email addresses available", "error");
      return;
    }
    setRecipientsInput(allEmails.join(", "));
    showToast(`Added ${allEmails.length} registered creator emails! 📧`);
  }

  async function handleSendMail() {
    const emailsList = recipientsInput
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emailsList.length === 0) {
      showToast("Please enter at least 1 valid recipient email ID", "error");
      return;
    }

    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast("Please enter subject and message body", "error");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emailsList,
          subject: emailSubject,
          bodyHtml: emailBody,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Sent ${data.sentCount} emails successfully! ✉️`);
      } else {
        showToast(data.error || "Could not send emails", "error");
      }
    } catch {
      showToast("Failed to send broadcast emails", "error");
    } finally {
      setSendingEmail(false);
    }
  }

  // Filter calculations
  const totalCreatorsCount = creators.length;
  const vipCreatorsCount = creators.filter(
    (c) => c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip"))
  ).length;
  const gigsCreatorsCount = creators.filter((c) => Number(c.gigsCount || 0) > 0).length;
  const earlyBirdCount = totalCreatorsCount - vipCreatorsCount;

  // Filtered Creators based on tab & query
  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (creatorFilter === "vip") {
      return c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip"));
    }
    if (creatorFilter === "gigs") {
      return Number(c.gigsCount || 0) > 0;
    }
    if (creatorFilter === "early") {
      return !(c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip")));
    }

    return true;
  });

  const filteredSeries = seriesList.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEpisodesCount = stats.totalEpisodes || seriesList.reduce((acc, s) => {
    return acc + (s.seasons?.[0]?.episodes?.length || 0);
  }, 0);

  if (!adminUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF8FF]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#7A1C3C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAF8FF] text-[#0F172A] font-sans selection:bg-rose-100 selection:text-[#7A1C3C]">
      {/* 1. TOP MAROON ADMIN NAVBAR */}
      <header className="safe-top sticky top-0 z-40 border-b border-rose-100 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="flex items-center gap-1.5 rounded-full border border-[#7A1C3C]/20 bg-[#7A1C3C]/10 px-3.5 py-1 text-xs font-black text-[#7A1C3C]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7A1C3C]" />
              <span>Admin Control Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="tap-scale flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#7A1C3C] ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-500 font-bold">
              <span>{adminUser.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="tap-scale flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-6 space-y-6 text-left">
        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Creators */}
          <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7A1C3C]">
                Total Creators
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7A1C3C]/10 text-[#7A1C3C]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{stats.totalCreators || creators.length}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Registered Accounts
            </p>
          </div>

          {/* Card 2: Total OTT Series */}
          <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7A1C3C]">
                Total OTT Series
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7A1C3C]/10 text-[#7A1C3C]">
                <Film className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{stats.totalSeries || seriesList.length} <span className="text-sm font-bold text-slate-500">Shows</span></p>
            <p className="text-[11px] font-semibold text-slate-500">
              {totalEpisodesCount} Published Episodes
            </p>
          </div>

          {/* Card 3: Total Active Gigs */}
          <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7A1C3C]">
                Total Active Gigs
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7A1C3C]/10 text-[#7A1C3C]">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{stats.totalActiveGigs}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Live Collab Gigs Published
            </p>
          </div>

          {/* Card 4: VIP Subscribers */}
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7A1C3C]">
                VIP Subscribers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7A1C3C] text-white">
                <Crown className="h-4 w-4 fill-amber-300 text-amber-300" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-[#7A1C3C]">{stats.vipSubscribers || vipCreatorsCount}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Active VIP Creators
            </p>
          </div>
        </div>

        {/* 3. TABS AND SEARCH CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 border border-rose-100 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`tap-scale flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeTab === "creators"
                  ? "bg-[#7A1C3C] text-white shadow-md shadow-[#7A1C3C]/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Creators ({creators.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("series")}
              className={`tap-scale flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeTab === "series"
                  ? "bg-[#7A1C3C] text-white shadow-md shadow-[#7A1C3C]/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>All Series ({seriesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`tap-scale flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeTab === "email"
                  ? "bg-[#7A1C3C] text-white shadow-md shadow-[#7A1C3C]/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Send Mails</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== "email" && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full rounded-2xl border border-rose-100 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#7A1C3C] focus:outline-none focus:ring-2 focus:ring-[#7A1C3C]/20 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. TAB 1: CREATORS LISTING & FILTER PILLS */}
        {activeTab === "creators" && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCreatorFilter("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "all"
                    ? "bg-[#7A1C3C] text-white border-[#7A1C3C]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                All Creators ({totalCreatorsCount})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("vip")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "vip"
                    ? "bg-[#7A1C3C] text-white border-[#7A1C3C]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                ⭐ VIP Members ({vipCreatorsCount})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("gigs")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "gigs"
                    ? "bg-[#7A1C3C] text-white border-[#7A1C3C]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                💼 With Active Gigs ({gigsCreatorsCount})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("early")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "early"
                    ? "bg-[#7A1C3C] text-white border-[#7A1C3C]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                ⚡ Free / Early Bird ({earlyBirdCount})
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-rose-100 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-rose-100 bg-rose-50/50 text-[11px] font-bold text-[#7A1C3C] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Creator</th>
                    <th className="px-5 py-4">Handle</th>
                    <th className="px-5 py-4">Subscription Plan</th>
                    <th className="px-5 py-4">Active Gigs</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Joined Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreators.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500 font-semibold">
                        No creators found matching current filter &amp; search.
                      </td>
                    </tr>
                  ) : (
                    filteredCreators.map((c) => {
                      const isVip = c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip"));
                      const isSuspended = c.accountStatus === "suspended";
                      const gigsCount = Number(c.gigsCount || 0);

                      return (
                        <tr key={c.id} className="hover:bg-rose-50/20 transition-colors">
                          {/* CREATOR */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <CreatorAvatar
                                src={c.photoDataUrl}
                                name={c.displayName || c.email}
                                className="h-9 w-9 rounded-2xl shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 text-sm truncate">
                                  {c.displayName || "Inflixo Creator"}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium truncate">{c.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* HANDLE */}
                          <td className="px-5 py-4">
                            <Link
                              href={`/${c.username || "username"}`}
                              target="_blank"
                              className="font-mono font-bold text-[#7A1C3C] hover:underline"
                            >
                              @{c.username || "username"}
                            </Link>
                          </td>

                          {/* SUBSCRIPTION PLAN */}
                          <td className="px-5 py-4">
                            {isVip ? (
                              <span className="inline-flex items-center gap-1 bg-[#7A1C3C] text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
                                <span>⭐ VIP Plan</span>
                              </span>
                            ) : c.planStatus === "expired" ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <span>⚠️ Expired</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <span>⚡ Early Bird</span>
                              </span>
                            )}
                          </td>

                          {/* ACTIVE GIGS */}
                          <td className="px-5 py-4">
                            {gigsCount > 0 ? (
                              <span className="font-extrabold text-slate-900">
                                {gigsCount} {gigsCount === 1 ? "Gig" : "Gigs"}{" "}
                                {c.minGigPrice && (
                                  <span className="text-slate-500 text-[11px] font-semibold">
                                    ({c.minGigPrice} - {c.maxGigPrice || c.minGigPrice})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs">0 Gigs</span>
                            )}
                          </td>

                          {/* CATEGORY */}
                          <td className="px-5 py-4">
                            <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                              {c.category || "General"}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <span>🔴 Suspended</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <span>🟢 Active</span>
                              </span>
                            )}
                          </td>

                          {/* JOINED DATE */}
                          <td className="px-5 py-4 text-slate-500 font-medium">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                          </td>

                          {/* ACTIONS COLUMN WITH THREE DOTS MENU */}
                          <td className="px-5 py-4 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/${c.username || "username"}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-[#7A1C3C] hover:bg-[#7A1C3C]/10 transition-colors"
                              >
                                <span>View Page</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>

                              {/* Three Dots Button */}
                              <button
                                type="button"
                                onClick={() => setOpenActionMenuId(openActionMenuId === c.id ? null : c.id)}
                                className="h-7 w-7 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Dropdown Popover */}
                            {openActionMenuId === c.id && (
                              <div className="absolute right-5 top-12 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl text-left space-y-0.5 animate-in fade-in duration-150">
                                <button
                                  type="button"
                                  onClick={() => handleGrantVIP(c)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#7A1C3C] hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Crown className="h-3.5 w-3.5 text-[#7A1C3C]" />
                                  <span>Grant / Extend VIP Plan</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleViewGigs(c)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                  <span>View Gigs &amp; Media Kit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(c)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Login as Creator</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(c)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Ban className="h-3.5 w-3.5 text-rose-600" />
                                  <span>{isSuspended ? "Activate Account" : "Deactivate / Ban Account"}</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TAB 2: SERIES LISTING */}
        {activeTab === "series" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSeries.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-rose-100 bg-white p-12 text-center text-slate-500 font-semibold">
                  No series found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredSeries.map((s) => {
                  const episodesCount = s.seasons?.[0]?.episodes?.length || 0;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSeries(s)}
                      className="group tap-scale relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md cursor-pointer text-left space-y-3"
                    >
                      <div className="flex gap-3">
                        <SeriesPoster
                          src={s.posterDataUrl}
                          title={s.title}
                          className="h-28 w-20 rounded-2xl shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-black text-[#7A1C3C] uppercase">
                              {s.genre || "Series"}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              {s.language || "English"}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-black text-slate-900 leading-snug line-clamp-2">
                            {s.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            By <span className="text-[#7A1C3C] font-extrabold">{s.creatorName || `@${s.creatorUsername}`}</span>
                          </p>
                          <p className="text-[11px] font-extrabold text-[#7A1C3C]">
                            {episodesCount} {episodesCount === 1 ? "Episode" : "Episodes"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Click to view full details</span>
                        <span className="flex items-center gap-1 font-extrabold text-[#7A1C3C] group-hover:translate-x-1 transition-transform">
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 6. TAB 3: EMAIL BROADCAST & MAIL SENDER TOOL */}
        {activeTab === "email" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Email Composer Form */}
            <div className="lg:col-span-7 rounded-3xl border border-rose-100 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#7A1C3C]" />
                    Send Admin Email Broadcast
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Sends real HTML emails from <span className="font-mono text-[#7A1C3C]">inflixoapp@gmail.com</span>
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Select Email Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMAIL_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setEmailSubject(tmpl.subject);
                        setEmailBody(tmpl.body);
                      }}
                      className={`tap-scale p-3 rounded-2xl border text-left transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "border-[#7A1C3C] bg-rose-50/80 text-[#7A1C3C] font-black shadow-2xs"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 font-semibold"
                      }`}
                    >
                      <p className="text-xs">{tmpl.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Recipient Email Addresses
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAllCreatorsToRecipients}
                    className="text-[11px] font-extrabold text-[#7A1C3C] hover:underline flex items-center gap-1"
                  >
                    <span>Select All Registered Creators ({creators.length})</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  placeholder="Enter email addresses separated by commas or new lines"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#7A1C3C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1C3C]/20 transition-all"
                />
              </div>

              {/* Email Subject Line */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject line"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#7A1C3C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1C3C]/20 transition-all"
                />
              </div>

              {/* Email Message Content (HTML) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Email Message Body (HTML / Text)
                </label>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your email body HTML..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#7A1C3C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1C3C]/20 transition-all"
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="button"
                disabled={sendingEmail}
                onClick={handleSendMail}
                className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7A1C3C] hover:bg-[#631430] py-3.5 text-xs font-black text-white transition-all disabled:opacity-50 cursor-pointer shadow-none"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Sending Mails from inflixoapp@gmail.com...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Broadcast Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Live Email HTML Preview */}
            <div className="lg:col-span-5 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#7A1C3C]" /> Live Email HTML Preview
                </p>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#7A1C3C]">
                  Sender: inflixoapp@gmail.com
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FAFAFC] p-4 text-left space-y-3 max-h-[500px] overflow-y-auto">
                <div className="border-b border-slate-200 pb-2">
                  <p className="text-[11px] text-slate-500 font-bold">
                    From: <span className="text-slate-900 font-semibold">&quot;Inflixo App&quot; &lt;inflixoapp@gmail.com&gt;</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    Subject: <span className="text-[#7A1C3C] font-black">{emailSubject || "No Subject"}</span>
                  </p>
                </div>

                <div
                  className="prose max-w-none text-xs text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 7. VIEW GIGS PREVIEW MODAL */}
      {viewGigsCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-rose-100 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <button
              onClick={() => setViewGigsCreator(null)}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <CreatorAvatar
                src={viewGigsCreator.photoDataUrl}
                name={viewGigsCreator.displayName || viewGigsCreator.email}
                className="h-12 w-12 rounded-2xl border border-slate-200"
              />
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {viewGigsCreator.displayName || "Creator"}
                </h3>
                <p className="text-xs text-[#7A1C3C] font-bold">@{viewGigsCreator.username} &bull; Media Kit &amp; Rate Cards</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Active Collab Gigs ({creatorGigs.length})</p>
              {creatorGigs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-semibold">
                  No active collab packages published yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {creatorGigs.map((pkg) => (
                    <div key={pkg.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-[#7A1C3C]/10 text-[#7A1C3C] border border-[#7A1C3C]/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          {pkg.platform}
                        </span>
                        <span className="font-display text-base font-black text-[#7A1C3C]">{pkg.price}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{pkg.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">⚡ Turnaround: {pkg.turnaroundDays} Days</p>
                      {pkg.deliverables && pkg.deliverables.length > 0 && (
                        <ul className="text-xs space-y-1 pt-1.5 border-t border-slate-200 text-slate-700">
                          {pkg.deliverables.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. SERIES DETAILS MODAL */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-rose-100 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            <button
              onClick={() => setSelectedSeries(null)}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <SeriesPoster
                src={selectedSeries.posterDataUrl}
                title={selectedSeries.title}
                className="h-44 w-32 rounded-2xl shrink-0 border border-slate-200 shadow-md"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-black text-[#7A1C3C] uppercase">
                    {selectedSeries.genre || "OTT Series"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {selectedSeries.language || "English"}
                  </span>
                </div>

                <h2 className="font-display text-2xl font-black text-slate-900">{selectedSeries.title}</h2>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {selectedSeries.description || "No description provided for this series."}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-rose-100">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Creator Account</p>
                    <p className="text-xs font-black text-[#7A1C3C]">
                      {selectedSeries.creatorName || `@${selectedSeries.creatorUsername}`} ({selectedSeries.creatorEmail})
                    </p>
                  </div>

                  <Link
                    href={`/${selectedSeries.creatorUsername || "username"}`}
                    target="_blank"
                    className="tap-scale flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-[#7A1C3C] hover:bg-rose-100 transition-all"
                  >
                    <span>Visit Profile</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-rose-100">
              <h3 className="font-display text-base font-black text-slate-900 flex items-center gap-2">
                <Film className="h-4 w-4 text-[#7A1C3C]" />
                Episodes ({selectedSeries.seasons?.[0]?.episodes?.length || 0})
              </h3>

              <div className="space-y-2.5">
                {(selectedSeries.seasons?.[0]?.episodes?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No episodes uploaded yet.</p>
                ) : (
                  selectedSeries.seasons[0].episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-slate-50/60 p-3.5 hover:border-rose-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-[#7A1C3C] text-xs font-black shrink-0">
                          #{ep.episodeNumber}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{ep.title}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Platform: {ep.platform || "YouTube"}</p>
                        </div>
                      </div>

                      {ep.externalUrl && (
                        <a
                          href={ep.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#7A1C3C] hover:bg-[#631430] px-3 py-1.5 text-xs font-bold text-white transition-all self-end sm:self-auto shadow-2xs"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Watch Video</span>
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
