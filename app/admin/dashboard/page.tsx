"use client";

import { useState, useEffect, useMemo } from "react";
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
  TrendingUp,
  BarChart3,
  Layers,
  Activity,
  BadgeCheck,
  DollarSign,
  Globe,
  Server,
  Radio,
  Zap,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/AdminService";
import { Logo } from "@/components/shared/Logo";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { authRepository, profileRepository, onboardingRepository } from "@/repositories/localRepository";

const AVATAR_PALETTES = [
  "bg-blue-50 text-[#043084] border-blue-200/80",
  "bg-purple-50 text-purple-700 border-purple-200/80",
  "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  "bg-amber-50 text-amber-800 border-amber-200/80",
  "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  "bg-teal-50 text-teal-700 border-teal-200/80",
  "bg-rose-50 text-rose-700 border-rose-200/80",
];

function getInitialsBadgeColor(str?: string): string {
  if (!str) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name?: string, fallback = "CR"): string {
  if (!name) return fallback;
  const cleaned = name.replace(/[@_-]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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
  profileViews?: number;
  episodeClicks?: number;
  reviewsCount?: number;
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

interface FounderStats {
  totalCreators: number;
  activeCreators: number;
  suspendedCreators: number;
  newThisWeek: number;
  totalSeries: number;
  totalEpisodes: number;
  totalActiveGigs: number;
  totalProfileViews: number;
  totalEpisodeClicks: number;
  totalReviews: number;
  vipSubscribers: number;
  proSubscribers: number;
  starterSubscribers: number;
  freeTrialSubscribers: number;
  estimatedMRR: number;
}

const INITIAL_STATS: FounderStats = {
  totalCreators: 0,
  activeCreators: 0,
  suspendedCreators: 0,
  newThisWeek: 0,
  totalSeries: 0,
  totalEpisodes: 0,
  totalActiveGigs: 0,
  totalProfileViews: 0,
  totalEpisodeClicks: 0,
  totalReviews: 0,
  vipSubscribers: 0,
  proSubscribers: 0,
  starterSubscribers: 0,
  freeTrialSubscribers: 0,
  estimatedMRR: 0,
};

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "🎉 Welcome Creator",
    subject: "Welcome to Inflixo! Set up your creator series & link in bio 🚀",
    body: `<h2 style="color: #043084; margin-top: 0; font-size: 18px;">Welcome to Inflixo! 🎉</h2>
<p>Hi Creator,</p>
<p>Thank you for joining <strong>Inflixo</strong> — the video-first link in bio platform built for Indian creators to organize series, showcase their total fanbase, and feature brand collab rate cards.</p>
<p>Log in to your dashboard to organize your YouTube and Instagram playlists today!</p>
<div style="margin: 24px 0;">
  <a href="https://inflixo.com/login" style="background: #043084; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">Open Inflixo Dashboard</a>
</div>`,
  },
  {
    id: "upgrade_pro",
    name: "⭐ Upgrade to Pro / VIP",
    subject: "Unlock unlimited series, brand rate cards & custom media kit on Inflixo ⭐",
    body: `<h2 style="color: #043084; margin-top: 0; font-size: 18px;">Take your creator portfolio to the next level 🚀</h2>
<p>Hi Creator,</p>
<p>Your 7-day trial lets you experience the power of ordered series playlists. Upgrade to <strong>Pro or VIP</strong> to keep your public profile live 24/7, publish unlimited episodes, and share verified rate cards with brands.</p>
<div style="margin: 24px 0;">
  <a href="https://inflixo.com/dashboard/subscription" style="background: #043084; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">View Plans & Upgrade</a>
</div>`,
  },
  {
    id: "india_creators",
    name: "🇮🇳 India Creators Mission",
    subject: "Building India's biggest creator community together — Inflixo 🇮🇳✨",
    body: `<h2 style="color: #043084; margin-top: 0; font-size: 18px;">Hello Content Creator,</h2>
<p>First of all, a massive <strong>THANK YOU</strong> for inspiring millions by creating amazing content in India! 🇮🇳✨</p>
<p>As creators ourselves, we know how hard you work every day to script, shoot, and edit. Inflixo is built to ensure your best videos never get lost in the feed.</p>
<div style="margin: 24px 0;">
  <a href="https://inflixo.com" style="background: #043084; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">Visit Inflixo Home</a>
</div>`,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "creators" | "series" | "analytics" | "email">("overview");
  const [creatorFilter, setCreatorFilter] = useState<"all" | "trial" | "starter" | "pro" | "vip" | "gigs" | "suspended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [seriesList, setSeriesList] = useState<AdminSeries[]>([]);
  const [stats, setStats] = useState<FounderStats>(INITIAL_STATS);

  // Action Menu Dropdown State
  const [openActionMenuId, setOpenActionMenuId] = useState<string | number | null>(null);
  const [planChangerCreator, setPlanChangerCreator] = useState<AdminCreator | null>(null);

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
        setStats({ ...INITIAL_STATS, ...cRes.stats });
      }

      let loadedSeries: AdminSeries[] = [];
      if (sRes.success && Array.isArray(sRes.series)) {
        loadedSeries = sRes.series;
      }

      // Include local creator if missing from remote DB
      const localProfile = ProfileService.getProfile();
      if (localProfile.username || localProfile.displayName) {
        const exists = loadedCreators.some(
          (c) => c.username?.toLowerCase() === localProfile.username?.toLowerCase()
        );
        if (!exists) {
          loadedCreators.unshift({
            id: "local_1",
            email: "nikunj.appz@gmail.com",
            displayName: localProfile.displayName || "Demo Creator",
            username: localProfile.username || "creator",
            photoDataUrl: localProfile.photoDataUrl,
            category: localProfile.category || "Technology & AI",
            bio: localProfile.bio || "",
            themeKey: "minimal-white",
            isVerified: true,
            accountStatus: "active",
            createdAt: new Date().toISOString(),
            planKey: "creator_VIP",
            planName: "VIP",
            gigsCount: 2,
            minGigPrice: "₹2,000",
            maxGigPrice: "₹5,400",
            seriesCount: 1,
            profileViews: 142,
            episodeClicks: 88,
            reviewsCount: 3,
          });
        }
      }

      setCreators(loadedCreators);
      setSeriesList(loadedSeries);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Error loading founder dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await AdminService.logout();
    showToast("Admin logged out successfully 👋");
    router.push("/admin/login");
  }

  async function handleSetPlan(creator: AdminCreator, planKey: string, planName: string) {
    setOpenActionMenuId(null);
    setPlanChangerCreator(null);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_plan", creatorId: creator.id, email: creator.email, planKey, planName }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${planName} plan assigned to @${creator.username}! ⭐`);
        loadAdminData();
      } else {
        showToast(data.error || "Failed to update plan", "error");
      }
    } catch {
      showToast("Error updating creator plan", "error");
    }
  }

  async function handleToggleVerified(creator: AdminCreator) {
    setOpenActionMenuId(null);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_verified", creatorId: creator.id, email: creator.email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.isVerified ? `Verified badge granted to @${creator.username}! 🛡️` : `Verified badge removed from @${creator.username}`);
        loadAdminData();
      } else {
        showToast(data.error || "Failed to toggle verified badge", "error");
      }
    } catch {
      showToast("Error updating verified status", "error");
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
    showToast(`Logged in as @${creator.username}. Opening Dashboard... 🚀`);
    setTimeout(() => {
      router.push("/dashboard");
    }, 300);
  }

  async function handleViewGigs(creator: AdminCreator) {
    setOpenActionMenuId(null);
    setViewGigsCreator(creator);
    try {
      const res = await fetch(`/api/creator/mediakit?email=${encodeURIComponent(creator.email)}`);
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

  function handleAddRecipients(filterType: "all" | "vip" | "trial") {
    let targetList: string[] = [];
    if (filterType === "all") {
      targetList = creators.map((c) => c.email?.trim().toLowerCase()).filter(Boolean);
    } else if (filterType === "vip") {
      targetList = creators.filter((c) => c.planKey === "creator_VIP" || c.planName?.toLowerCase().includes("vip")).map((c) => c.email?.trim().toLowerCase()).filter(Boolean);
    } else if (filterType === "trial") {
      targetList = creators.filter((c) => !c.planKey || c.planKey === "free_trial").map((c) => c.email?.trim().toLowerCase()).filter(Boolean);
    }

    const uniqueEmails = Array.from(new Set(targetList));
    if (uniqueEmails.length === 0) {
      showToast("No emails found for this filter", "error");
      return;
    }
    setRecipientsInput(uniqueEmails.join(", "));
    showToast(`Added ${uniqueEmails.length} recipients to broadcast list! 📧`);
  }

  async function handleSendMail() {
    const emailsList = recipientsInput
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emailsList.length === 0) {
      showToast("Please enter at least 1 valid recipient email", "error");
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

  // Filtered Creators based on tab & query
  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.displayName?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (creatorFilter === "trial") {
        return !c.planKey || c.planKey === "free_trial" || c.planName?.toLowerCase().includes("trial");
      }
      if (creatorFilter === "starter") {
        return c.planKey === "starter" || c.planName?.toLowerCase().includes("starter");
      }
      if (creatorFilter === "pro") {
        return c.planKey === "pro" || c.planName?.toLowerCase().includes("pro");
      }
      if (creatorFilter === "vip") {
        return c.planKey === "creator_VIP" || c.planName?.toLowerCase().includes("vip");
      }
      if (creatorFilter === "gigs") {
        return Number(c.gigsCount || 0) > 0;
      }
      if (creatorFilter === "suspended") {
        return c.accountStatus === "suspended";
      }

      return true;
    });
  }, [creators, searchQuery, creatorFilter]);

  const filteredSeries = useMemo(() => {
    return seriesList.filter(
      (s) =>
        !searchQuery.trim() ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.creatorUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.genre?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [seriesList, searchQuery]);

  // Top Creators by Traffic
  const topCreators = useMemo(() => {
    return [...creators]
      .sort((a, b) => ((b.profileViews || 0) + (b.episodeClicks || 0)) - ((a.profileViews || 0) + (a.episodeClicks || 0)))
      .slice(0, 5);
  }, [creators]);

  // Recent Creators (Latest 6)
  const recentCreators = useMemo(() => {
    return [...creators].slice(0, 6);
  }, [creators]);

  if (!adminUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fafc]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#043084] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#043084]/10 selection:text-[#043084] text-left">
      {/* 1. TOP HEADER NAVBAR — TIGHT & CLEAN */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#043084] bg-[#043084]/5 border border-[#043084]/15 px-2 py-0.5 rounded-[6px]">
              Founder Cockpit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>DB Connected</span>
            </div>

            <button
              onClick={loadAdminData}
              className="tap-scale flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3 w-3 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <span className="hidden md:inline text-xs text-slate-400 font-medium px-1">|</span>
            <span className="hidden md:inline text-xs font-semibold text-slate-600 truncate max-w-[160px]">{adminUser.email}</span>

            <button
              onClick={handleLogout}
              className="tap-scale flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 space-y-4">
        {/* TOP FOUNDER KPI GRID — TIGHT, MINIMAL PADDING, HIGH DENSITY */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tile 1: Creators Count & New Growth */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Creators</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#043084]/10 text-[#043084]">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-slate-900 leading-tight">
              {stats.totalCreators || creators.length}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded text-[10px] font-bold">
                +{stats.newThisWeek || 0} this week
              </span>
              <span>•</span>
              <span>{stats.activeCreators || creators.length} active</span>
            </div>
          </div>

          {/* Tile 2: Revenue & Active Plans (MRR) */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estimated MRR</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-slate-900 leading-tight">
              ₹{stats.estimatedMRR.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              {stats.vipSubscribers} VIP • {stats.proSubscribers} Pro • {stats.starterSubscribers} Starter
            </p>
          </div>

          {/* Tile 3: Public Traffic (Views & Clicks) */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Platform Traffic</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-slate-900 leading-tight">
              {(stats.totalProfileViews + stats.totalEpisodeClicks).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              {stats.totalProfileViews} views • {stats.totalEpisodeClicks} episode clicks
            </p>
          </div>

          {/* Tile 4: Content Inventory & Gigs */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Catalog &amp; Gigs</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80">
                <Film className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-slate-900 leading-tight">
              {stats.totalSeries || seriesList.length} <span className="text-xs font-bold text-slate-500 font-sans">Series</span> / {stats.totalEpisodes || 0} <span className="text-xs font-bold text-slate-500 font-sans">Eps</span>
            </p>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              {stats.totalActiveGigs} Collab Gigs • {stats.totalReviews} Reviews
            </p>
          </div>
        </div>

        {/* 3. SUB-NAV TABS & SEARCH CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
          {/* Navigation Pills */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`tap-scale flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-[#043084] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`tap-scale flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "creators"
                  ? "bg-white text-[#043084] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Creators ({creators.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("series")}
              className={`tap-scale flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "series"
                  ? "bg-white text-[#043084] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Series ({seriesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`tap-scale flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white text-[#043084] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Traffic &amp; Ranks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`tap-scale flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "email"
                  ? "bg-white text-[#043084] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Broadcast</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== "email" && activeTab !== "overview" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: FOUNDER OVERVIEW / PULSE                      */}
        {/* ---------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Top Row: Plan Breakdown + System Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Plan Distribution Progress Card */}
              <div className="lg:col-span-8 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-[#043084]" />
                    <span>Subscription Plan Distribution</span>
                  </h2>
                  <span className="text-xs font-bold text-slate-700">Total: {stats.totalCreators} Accounts</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    style={{ width: `${stats.totalCreators ? (stats.vipSubscribers / stats.totalCreators) * 100 : 0}%` }}
                    className="bg-[#043084]"
                    title={`VIP: ${stats.vipSubscribers}`}
                  />
                  <div
                    style={{ width: `${stats.totalCreators ? (stats.proSubscribers / stats.totalCreators) * 100 : 0}%` }}
                    className="bg-blue-500"
                    title={`Pro: ${stats.proSubscribers}`}
                  />
                  <div
                    style={{ width: `${stats.totalCreators ? (stats.starterSubscribers / stats.totalCreators) * 100 : 0}%` }}
                    className="bg-emerald-500"
                    title={`Starter: ${stats.starterSubscribers}`}
                  />
                  <div
                    style={{ width: `${stats.totalCreators ? (stats.freeTrialSubscribers / stats.totalCreators) * 100 : 0}%` }}
                    className="bg-slate-300"
                    title={`Free Trial: ${stats.freeTrialSubscribers}`}
                  />
                </div>

                {/* Legend Items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#043084]" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800">{stats.vipSubscribers} VIP</p>
                      <p className="text-[10px] text-slate-500 font-medium">₹1,499/mo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800">{stats.proSubscribers} Pro</p>
                      <p className="text-[10px] text-slate-500 font-medium">₹599/mo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800">{stats.starterSubscribers} Starter</p>
                      <p className="text-[10px] text-slate-500 font-medium">₹199/mo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800">{stats.freeTrialSubscribers} Trial</p>
                      <p className="text-[10px] text-slate-500 font-medium">7 Days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Integrations Status Card */}
              <div className="lg:col-span-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-[#043084]" />
                  <span>System Infrastructure</span>
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">MySQL Database</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Pool Active (10)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Social Stats Cron</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      /api/cron/sync-socials
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Email Gateway</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Nodemailer SMTP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Signups Table */}
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#043084]" />
                    <span>Recent Creator Registrations</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("creators")}
                  className="text-xs font-bold text-[#043084] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Creators ({creators.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3.5 py-2">Creator</th>
                      <th className="px-3.5 py-2">Handle</th>
                      <th className="px-3.5 py-2">Plan</th>
                      <th className="px-3.5 py-2">Shows &amp; Eps</th>
                      <th className="px-3.5 py-2">Traffic</th>
                      <th className="px-3.5 py-2">Joined</th>
                      <th className="px-3.5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentCreators.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-semibold">
                          No creators registered yet.
                        </td>
                      </tr>
                    ) : (
                      recentCreators.map((c) => {
                        const isVip = c.planKey === "creator_VIP" || c.planName?.toLowerCase().includes("vip");
                        const isPro = c.planKey === "pro" || c.planName?.toLowerCase().includes("pro");
                        const isStarter = c.planKey === "starter" || c.planName?.toLowerCase().includes("starter");

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3.5 py-2">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-black text-[10px] uppercase tracking-tighter ${getInitialsBadgeColor(c.username || c.displayName)}`}>
                                  {getInitials(c.displayName || c.username || c.email)}
                                </div>
                                <div className="min-w-0 max-w-[180px]">
                                  <p className="font-bold text-slate-900 truncate">{c.displayName || "Creator"}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3.5 py-2">
                              <Link
                                href={`/${c.username || "username"}`}
                                target="_blank"
                                className="font-mono font-bold text-[#043084] hover:underline"
                              >
                                @{c.username}
                              </Link>
                            </td>
                            <td className="px-3.5 py-2">
                              {isVip ? (
                                <span className="inline-flex items-center gap-1 rounded bg-[#043084] text-white px-2 py-0.5 text-[10px] font-bold">
                                  ⭐ VIP
                                </span>
                              ) : isPro ? (
                                <span className="inline-flex items-center gap-1 rounded bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold">
                                  Pro
                                </span>
                              ) : isStarter ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold">
                                  Starter
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
                                  Free Trial
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 font-semibold">
                              {c.seriesCount || 0} Shows
                            </td>
                            <td className="px-3.5 py-2 font-semibold">
                              {(c.profileViews || 0) + (c.episodeClicks || 0)} views
                            </td>
                            <td className="px-3.5 py-2 text-slate-400 font-medium">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                            </td>
                            <td className="px-3.5 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  href={`/${c.username}`}
                                  target="_blank"
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>View</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(c)}
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#043084] hover:bg-[#043084]/5 transition-colors cursor-pointer"
                                  title="Login as this creator"
                                >
                                  Login As
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: CREATORS DIRECTORY & MANAGEMENT               */}
        {/* ---------------------------------------------------- */}
        {activeTab === "creators" && (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCreatorFilter("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "all"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All ({creators.length})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("vip")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "vip"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ⭐ VIP ({stats.vipSubscribers})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("pro")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "pro"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Pro ({stats.proSubscribers})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("starter")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "starter"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Starter ({stats.starterSubscribers})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("trial")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "trial"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Free Trial ({stats.freeTrialSubscribers})
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("gigs")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "gigs"
                    ? "bg-[#043084] text-white border-[#043084]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                💼 With Gigs
              </button>

              <button
                type="button"
                onClick={() => setCreatorFilter("suspended")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  creatorFilter === "suspended"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                🚫 Suspended ({stats.suspendedCreators})
              </button>
            </div>

            {/* High-density Creators Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Creator</th>
                    <th className="px-3.5 py-2.5">Handle</th>
                    <th className="px-3.5 py-2.5">Plan</th>
                    <th className="px-3.5 py-2.5">Shows / Gigs</th>
                    <th className="px-3.5 py-2.5">Traffic</th>
                    <th className="px-3.5 py-2.5">Badge</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Joined</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreators.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-slate-500 font-semibold">
                        No creators found matching current filter &amp; search.
                      </td>
                    </tr>
                  ) : (
                    filteredCreators.map((c) => {
                      const isVip = c.planKey === "creator_VIP" || c.planName?.toLowerCase().includes("vip");
                      const isPro = c.planKey === "pro" || c.planName?.toLowerCase().includes("pro");
                      const isStarter = c.planKey === "starter" || c.planName?.toLowerCase().includes("starter");
                      const isSuspended = c.accountStatus === "suspended";
                      const gigsCount = Number(c.gigsCount || 0);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* CREATOR AVATAR & NAME */}
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-black text-[10px] uppercase tracking-tighter ${getInitialsBadgeColor(c.username || c.displayName)}`}>
                                {getInitials(c.displayName || c.username || c.email)}
                              </div>
                              <div className="min-w-0 max-w-[180px]">
                                <p className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                                  <span>{c.displayName || "Inflixo Creator"}</span>
                                  {c.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* HANDLE */}
                          <td className="px-3.5 py-2">
                            <Link
                              href={`/${c.username || "username"}`}
                              target="_blank"
                              className="font-mono font-bold text-[#043084] hover:underline"
                            >
                              @{c.username || "username"}
                            </Link>
                          </td>

                          {/* SUBSCRIPTION PLAN */}
                          <td className="px-3.5 py-2">
                            {isVip ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#043084] text-white px-2 py-0.5 text-[10px] font-bold">
                                ⭐ VIP
                              </span>
                            ) : isPro ? (
                              <span className="inline-flex items-center gap-1 rounded bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold">
                                Pro
                              </span>
                            ) : isStarter ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold">
                                Starter
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
                                Free Trial
                              </span>
                            )}
                          </td>

                          {/* CONTENT / GIGS */}
                          <td className="px-3.5 py-2 font-semibold">
                            <span>{c.seriesCount || 0} Shows</span>
                            {gigsCount > 0 && (
                              <span className="text-slate-400 font-normal ml-1">({gigsCount} gigs)</span>
                            )}
                          </td>

                          {/* TRAFFIC */}
                          <td className="px-3.5 py-2 font-semibold">
                            {(c.profileViews || 0) + (c.episodeClicks || 0)} views
                          </td>

                          {/* VERIFIED BADGE TOGGLE */}
                          <td className="px-3.5 py-2">
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(c)}
                              className={`tap-scale inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer border ${
                                c.isVerified
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                              }`}
                              title="Toggle verified checkmark"
                            >
                              <BadgeCheck className="h-3 w-3" />
                              <span>{c.isVerified ? "Verified" : "Regular"}</span>
                            </button>
                          </td>

                          {/* STATUS */}
                          <td className="px-3.5 py-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              className={`tap-scale inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer border ${
                                isSuspended
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                              title="Toggle account status"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? "bg-rose-500" : "bg-emerald-500"}`} />
                              <span>{isSuspended ? "Suspended" : "Active"}</span>
                            </button>
                          </td>

                          {/* JOINED DATE */}
                          <td className="px-3.5 py-2 text-slate-400 font-medium">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-3.5 py-2 text-right relative">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/${c.username || "username"}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <span>View</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setOpenActionMenuId(openActionMenuId === c.id ? null : c.id)}
                                className="h-6 w-6 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Dropdown Popover */}
                            {openActionMenuId === c.id && (
                              <div className="absolute right-3.5 top-10 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg text-left space-y-0.5 animate-in fade-in duration-100">
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(c)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Login as Creator</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setPlanChangerCreator(c);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#043084] hover:bg-blue-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Crown className="h-3.5 w-3.5 text-[#043084]" />
                                  <span>Change Plan</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleViewGigs(c)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                  <span>View Gigs &amp; Rates</span>
                                </button>

                                <div className="my-0.5 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(c)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Ban className="h-3.5 w-3.5 text-rose-600" />
                                  <span>{isSuspended ? "Activate Account" : "Suspend Account"}</span>
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

        {/* ---------------------------------------------------- */}
        {/* TAB 3: ALL SERIES & EPISODES CATALOG (TABLE)         */}
        {/* ---------------------------------------------------- */}
        {activeTab === "series" && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Series Title</th>
                    <th className="px-3.5 py-2.5">Creator</th>
                    <th className="px-3.5 py-2.5">Genre</th>
                    <th className="px-3.5 py-2.5">Language</th>
                    <th className="px-3.5 py-2.5">Episodes</th>
                    <th className="px-3.5 py-2.5">Created</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSeries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 font-semibold">
                        No series found matching &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredSeries.map((s) => {
                      const episodesCount = s.seasons?.[0]?.episodes?.length || 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* SERIES TITLE & THUMBNAIL */}
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2.5">
                              <SeriesPoster
                                src={s.posterDataUrl}
                                title={s.title}
                                className="h-9 w-7 rounded shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0 max-w-[220px]">
                                <p className="font-bold text-slate-900 text-xs truncate leading-snug">
                                  {s.title}
                                </p>
                                {s.description && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {s.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* CREATOR */}
                          <td className="px-3.5 py-2">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {s.creatorName || `@${s.creatorUsername}`}
                              </p>
                              <Link
                                href={`/${s.creatorUsername}`}
                                target="_blank"
                                className="font-mono text-[10px] text-[#043084] hover:underline"
                              >
                                @{s.creatorUsername}
                              </Link>
                            </div>
                          </td>

                          {/* GENRE */}
                          <td className="px-3.5 py-2">
                            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                              {s.genre || "Series"}
                            </span>
                          </td>

                          {/* LANGUAGE */}
                          <td className="px-3.5 py-2 text-slate-600 font-medium">
                            {s.language || "English"}
                          </td>

                          {/* EPISODES COUNT */}
                          <td className="px-3.5 py-2">
                            <span className="inline-flex items-center gap-1 rounded bg-[#043084]/10 text-[#043084] font-bold px-2 py-0.5 text-[10px]">
                              <Film className="h-3 w-3" />
                              <span>{episodesCount} {episodesCount === 1 ? "Ep" : "Eps"}</span>
                            </span>
                          </td>

                          {/* CREATED DATE */}
                          <td className="px-3.5 py-2 text-slate-400 font-medium">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-3.5 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedSeries(s)}
                                className="tap-scale inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <span>Episodes</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>

                              <Link
                                href={`/${s.creatorUsername}/series/${s.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded border border-[#043084]/20 bg-[#043084]/5 px-2 py-1 text-[11px] font-bold text-[#043084] hover:bg-[#043084]/10 transition-colors"
                              >
                                <span>Public Page</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
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

        {/* ---------------------------------------------------- */}
        {/* TAB 4: TRAFFIC & CREATOR LEADERBOARD                 */}
        {/* ---------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Top Creators Leaderboard */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Top Performing Creators (By Traffic)</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">Top 5</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Creator</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Profile Views</th>
                      <th className="px-3 py-2">Episode Clicks</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topCreators.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2 font-black text-slate-900">
                          #{idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-black text-[10px] uppercase tracking-tighter ${getInitialsBadgeColor(c.username || c.displayName)}`}>
                              {getInitials(c.displayName || c.username || c.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">{c.displayName}</p>
                              <p className="text-[10px] text-slate-400 truncate">@{c.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-slate-100 text-slate-700 font-bold px-2 py-0.5 text-[10px]">
                            {c.planName || "Free"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {c.profileViews || 0}
                        </td>
                        <td className="px-3 py-2 font-bold text-[#043084]">
                          {c.episodeClicks || 0}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            href={`/${c.username}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#043084] hover:underline"
                          >
                            Open Profile
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Engagement Metrics Summary */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#043084]" />
                <span>Conversion Metrics</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-slate-500 font-medium text-[11px]">Click-Through Rate (CTR)</p>
                  <p className="font-display text-lg font-black text-slate-900">
                    {stats.totalProfileViews > 0
                      ? `${((stats.totalEpisodeClicks / stats.totalProfileViews) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </p>
                  <p className="text-[10px] text-slate-400">Visitors opening external YouTube / Instagram posts</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-slate-500 font-medium text-[11px]">Avg. Shows per Creator</p>
                  <p className="font-display text-lg font-black text-slate-900">
                    {stats.totalCreators > 0 ? (stats.totalSeries / stats.totalCreators).toFixed(1) : "0"}
                  </p>
                  <p className="text-[10px] text-slate-400">Series created across registered profiles</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-slate-500 font-medium text-[11px]">Paid Conversion Ratio</p>
                  <p className="font-display text-lg font-black text-emerald-700">
                    {stats.totalCreators > 0
                      ? `${(((stats.starterSubscribers + stats.proSubscribers + stats.vipSubscribers) / stats.totalCreators) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </p>
                  <p className="text-[10px] text-slate-400">Upgraded from 7-day free trial</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: EMAIL BROADCAST                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === "email" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Composer */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Admin Broadcast Mailer</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Sends verified transactional HTML emails via Nodemailer SMTP.
                </p>
              </div>

              {/* Template selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Quick Template:</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setEmailSubject(tmpl.subject);
                        setEmailBody(tmpl.body);
                      }}
                      className={`tap-scale rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer border ${
                        selectedTemplateId === tmpl.id
                          ? "bg-[#043084] text-white border-[#043084]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Quick Filters */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600">Recipients:</label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleAddRecipients("all")}
                      className="text-[#043084] font-bold hover:underline"
                    >
                      + All Creators ({creators.length})
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleAddRecipients("vip")}
                      className="text-[#043084] font-bold hover:underline"
                    >
                      + VIPs ({stats.vipSubscribers})
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleAddRecipients("trial")}
                      className="text-[#043084] font-bold hover:underline"
                    >
                      + Trial Users ({stats.freeTrialSubscribers})
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  placeholder="Enter email addresses separated by commas..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#043084] focus:outline-none"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Email Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-[#043084] focus:outline-none"
                />
              </div>

              {/* Body HTML */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Email Body (HTML supported):</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#043084] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendMail}
                disabled={sendingEmail}
                className="tap-scale inline-flex items-center gap-1.5 rounded-lg bg-[#043084] hover:bg-[#03256c] px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{sendingEmail ? "Sending Broadcast..." : "Send Broadcast Email"}</span>
              </button>
            </div>

            {/* Right Live Preview */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2 lg:sticky lg:top-20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Eye className="h-3 w-3 text-[#043084]" /> Preview
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">From: Inflixo App</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left space-y-2 max-h-[460px] overflow-y-auto">
                <div className="border-b border-slate-200 pb-1.5">
                  <p className="text-[11px] font-bold text-slate-700 truncate">
                    Subject: <span className="text-[#043084] font-black">{emailSubject || "(No Subject)"}</span>
                  </p>
                </div>
                <div
                  className="prose max-w-none text-xs text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: CHANGE PLAN MODAL                           */}
      {/* ---------------------------------------------------- */}
      {planChangerCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setPlanChangerCreator(null)}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Creator Plan</h3>
              <p className="text-xs text-slate-500">
                Select subscription tier for <span className="font-bold text-[#043084]">@{planChangerCreator.username}</span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSetPlan(planChangerCreator, "creator_VIP", "VIP")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#043084] hover:bg-blue-50/50 transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-xs text-[#043084] flex items-center gap-1">⭐ VIP Plan</p>
                  <p className="text-[10px] text-slate-500">Unlimited series, custom media kit, daily stats</p>
                </div>
                <span className="text-xs font-bold text-slate-700">₹1,499/mo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetPlan(planChangerCreator, "pro", "Pro")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-xs text-blue-700">Pro Plan</p>
                  <p className="text-[10px] text-slate-500">20 series, 20 custom links, 3 collab packages</p>
                </div>
                <span className="text-xs font-bold text-slate-700">₹599/mo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetPlan(planChangerCreator, "starter", "Starter")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-xs text-emerald-700">Starter Plan</p>
                  <p className="text-[10px] text-slate-500">Keep public profile live after 7-day trial</p>
                </div>
                <span className="text-xs font-bold text-slate-700">₹199/mo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetPlan(planChangerCreator, "free_trial", "Free Trial")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-xs text-slate-700">Free Trial (7 Days)</p>
                  <p className="text-[10px] text-slate-500">Goes private after 7 days without upgrade</p>
                </div>
                <span className="text-xs font-bold text-slate-500">₹0</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: GIGS & MEDIA KIT PREVIEW                    */}
      {/* ---------------------------------------------------- */}
      {viewGigsCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 p-5 shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setViewGigsCreator(null)}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-black text-xs uppercase tracking-tighter ${getInitialsBadgeColor(viewGigsCreator.username)}`}>
                {getInitials(viewGigsCreator.displayName || viewGigsCreator.username || viewGigsCreator.email)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{viewGigsCreator.displayName}</h3>
                <p className="text-xs text-[#043084] font-semibold">@{viewGigsCreator.username} &bull; Media Kit Packages</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Collab Packages ({creatorGigs.length})
              </p>
              {creatorGigs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 font-medium">
                  No active collab packages configured yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {creatorGigs.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-[#043084]/10 text-[#043084] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {pkg.platform}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{pkg.price}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800">{pkg.title}</h4>
                      <p className="text-[10px] text-slate-500">Delivery: {pkg.turnaroundDays} Days</p>
                      {pkg.deliverables && pkg.deliverables.length > 0 && (
                        <ul className="text-[11px] space-y-0.5 pt-1 border-t border-slate-200 text-slate-600">
                          {pkg.deliverables.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
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

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: SERIES DETAILS & EPISODES                   */}
      {/* ---------------------------------------------------- */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 p-5 shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setSelectedSeries(null)}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-3.5 items-start">
              <SeriesPoster
                src={selectedSeries.posterDataUrl}
                title={selectedSeries.title}
                className="h-32 w-24 rounded-lg shrink-0 border border-slate-200 shadow-sm"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    {selectedSeries.genre || "Series"}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {selectedSeries.language || "English"}
                  </span>
                </div>

                <h2 className="font-bold text-base text-slate-900 leading-snug">{selectedSeries.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {selectedSeries.description || "No description provided."}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <p className="font-semibold text-slate-500">
                    By <span className="text-[#043084] font-bold">{selectedSeries.creatorName || `@${selectedSeries.creatorUsername}`}</span>
                  </p>

                  <Link
                    href={`/${selectedSeries.creatorUsername}`}
                    target="_blank"
                    className="flex items-center gap-1 font-bold text-[#043084] hover:underline"
                  >
                    <span>Open Page</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-[#043084]" />
                <span>Episodes ({selectedSeries.seasons?.[0]?.episodes?.length || 0})</span>
              </h3>

              <div className="space-y-1.5">
                {(selectedSeries.seasons?.[0]?.episodes?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">No episodes uploaded yet.</p>
                ) : (
                  selectedSeries.seasons[0].episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0">
                          #{ep.episodeNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{ep.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ep.platform || "YouTube"}</p>
                        </div>
                      </div>

                      {ep.externalUrl && (
                        <a
                          href={ep.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="tap-scale inline-flex items-center gap-1 rounded bg-[#043084] px-2 py-1 text-[10px] font-bold text-white shrink-0 hover:bg-[#03256c] transition-colors"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Watch</span>
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
