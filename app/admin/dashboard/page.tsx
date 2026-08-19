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
  Layers,
  Crown,
  Filter,
  ArrowUpRight,
  Check,
  Mail,
  Send,
  Loader2,
  FileText,
  AtSign,
  AlertCircle,
  Plus,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/AdminService";
import { Logo } from "@/components/shared/Logo";
import { formatCount, formatSyncDate } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { SeriesService } from "@/services/SeriesService";

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
  createdAt: string;
  planName?: string;
  planStatus?: string;
  totalFanbase?: number;
  seriesCount?: number;
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
    id: "welcome",
    name: "🎉 Welcome Creator Template",
    subject: "Welcome to Inflixo! Set up your creator page 🚀",
    body: `<h2 style="color: #6512FA; margin-top: 0;">Welcome to Inflixo Creator Home! 🎉</h2>
<p>Hi Creator,</p>
<p>Thank you for joining <strong>Inflixo</strong> — the single link platform built for video creators to organize series, showcase seasons, and feature their total fanbase.</p>
<p style="background-color: #F1F5F9; padding: 16px; border-radius: 12px; border-left: 4px solid #6512FA;">
<strong>Next Steps:</strong> Add your Instagram, YouTube & Facebook handles, upload your OTT series, and pick from 20 aesthetic design themes.
</p>
<p>Log in to your dashboard to complete your page setup!</p>
<p>Best regards,<br/><strong>The Inflixo Team</strong></p>`,
  },
  {
    id: "update",
    name: "✨ New Feature Release Template",
    subject: "New on Inflixo: OTT Series & 20 Aesthetic Themes 🎬",
    body: `<h2 style="color: #6512FA; margin-top: 0;">Exciting New Feature Release! ✨</h2>
<p>Hello Creator,</p>
<p>We've just launched major enhancements to your Inflixo Creator Page:</p>
<ul>
  <li><strong>20 Design Themes:</strong> Choose between Minimal, Cyberpunk, Midnight, Emerald Luxe & 16 more styles.</li>
  <li><strong>OTT Series Accordion:</strong> Organize your YouTube/Instagram videos into seasons & parts.</li>
  <li><strong>Timezone Sync Stats:</strong> Combined audience counters across all your connected socials.</li>
</ul>
<p>Check out your updated dashboard today!</p>
<p>Cheers,<br/><strong>Inflixo Product Team</strong></p>`,
  },
  {
    id: "early_access",
    name: "👑 Pro Plan Early Access Invite",
    subject: "Special Invitation: Unlock Early Access Features 👑",
    body: `<h2 style="color: #6512FA; margin-top: 0;">You're Invited to Early Access Pro Features 👑</h2>
<p>Dear Creator,</p>
<p>As one of our early Inflixo creators, you get exclusive access to unlimited series creation, custom domain deeplinking, and priority sync stats.</p>
<p style="text-align: center; margin: 24px 0;">
  <a href="https://inflixo.com/dashboard" style="background-color: #6512FA; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
</p>
<p>Keep creating,<br/><strong>Inflixo Team</strong></p>`,
  },
  {
    id: "custom",
    name: "📝 Custom Broadcast Message",
    subject: "Important update from Inflixo",
    body: `<p>Hi Creator,</p>
<p>Write your custom email announcement or message here...</p>
<p>Best regards,<br/><strong>Inflixo Team</strong></p>`,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"creators" | "series" | "email">("creators");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [seriesList, setSeriesList] = useState<AdminSeries[]>([]);

  // Selected Series Modal State
  const [selectedSeries, setSelectedSeries] = useState<AdminSeries | null>(null);

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
      // 1. Fetch DB records
      const [cRes, sRes] = await Promise.all([
        fetch("/api/admin/creators").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/series").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      let loadedCreators: AdminCreator[] = [];
      if (cRes.success && Array.isArray(cRes.creators)) {
        loadedCreators = cRes.creators;
      }

      let loadedSeries: AdminSeries[] = [];
      if (sRes.success && Array.isArray(sRes.series)) {
        loadedSeries = sRes.series;
      }

      // 2. Include local profile & local series if not already present
      const localProfile = ProfileService.getProfile();
      if (localProfile.username || localProfile.displayName) {
        const exists = loadedCreators.some((c) => c.username?.toLowerCase() === localProfile.username?.toLowerCase());
        if (!exists) {
          loadedCreators.unshift({
            id: "local_1",
            email: "nikunj.appz@gmail.com",
            displayName: localProfile.displayName || "Creator Profile",
            username: localProfile.username || "creator",
            photoDataUrl: localProfile.photoDataUrl,
            category: localProfile.category || "Technology",
            bio: localProfile.bio || "",
            themeKey: "minimal-white",
            isVerified: true,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const localSeries = SeriesService.getAllLocal();
      if (Array.isArray(localSeries) && localSeries.length > 0) {
        localSeries.forEach((ls) => {
          const exists = loadedSeries.some((s) => s.id === ls.id);
          if (!exists) {
            loadedSeries.unshift({
              id: ls.id,
              creatorEmail: "nikunj.appz@gmail.com",
              creatorName: localProfile.displayName || "Creator",
              creatorUsername: localProfile.username || "creator",
              title: ls.title,
              posterDataUrl: ls.posterDataUrl,
              description: ls.description || "",
              genre: ls.genre || "General",
              language: ls.language || "English",
              createdAt: ls.createdAt || new Date().toISOString(),
              seasons: ls.seasons || [],
            });
          }
        });
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

  function handleTemplateSelect(tmplId: string) {
    setSelectedTemplateId(tmplId);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setEmailSubject(tmpl.subject);
      setEmailBody(tmpl.body);
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

    if (!emailSubject.trim()) {
      showToast("Please enter an email subject line", "error");
      return;
    }

    if (!emailBody.trim()) {
      showToast("Please enter email message content", "error");
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
        showToast(`Sent ${data.sentCount} ${data.sentCount === 1 ? "email" : "emails"} successfully from inflixoapp@gmail.com! ✉️`);
        if (data.failedCount > 0) {
          showToast(`Warning: ${data.failedCount} failed to deliver`, "info");
        }
      } else {
        showToast(data.error || "Could not send emails", "error");
      }
    } catch (err: any) {
      console.error("Send mail error:", err);
      showToast("Failed to send broadcast emails. Try again!", "error");
    } finally {
      setSendingEmail(false);
    }
  }

  // Filtered lists
  const filteredCreators = creators.filter(
    (c) =>
      c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSeries = seriesList.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEpisodesCount = seriesList.reduce((acc, s) => {
    return acc + (s.seasons?.[0]?.episodes?.length || 0);
  }, 0);

  if (!adminUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF8FF]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#651FFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAF8FF] text-[#0F172A] font-sans selection:bg-purple-100 selection:text-[#651FFF]">
      {/* 1. TOP LIGHT ADMIN NAVBAR */}
      <header className="safe-top sticky top-0 z-40 border-b border-purple-100 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-[#651FFF]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#651FFF]" />
              <span>Inflixo Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="tap-scale flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#651FFF] ${loading ? "animate-spin" : ""}`} />
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

      {/* 2. MAIN LIGHT CONTENT CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-6 space-y-6 text-left">
        {/* KPI Analytics Cards (Light Theme) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Creators */}
          <div className="rounded-3xl border border-purple-200/80 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Registered Creators
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-[#651FFF]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{creators.length}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Active creator accounts
            </p>
          </div>

          {/* Card 2: Total OTT Series */}
          <div className="rounded-3xl border border-purple-200/80 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Total OTT Series
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-[#651FFF]">
                <Film className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{seriesList.length}</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Across {totalEpisodesCount} published episodes
            </p>
          </div>

          {/* Card 3: Email Broadcast Status */}
          <div className="rounded-3xl border border-purple-200/80 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Email Dispatcher
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-[#651FFF]">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-slate-900 truncate">inflixoapp@gmail.com</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Official Admin SMTP Mailer
            </p>
          </div>

          {/* Card 4: System Health */}
          <div className="rounded-3xl border border-purple-200/80 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                System Status
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-black text-emerald-600 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              Operational
            </p>
            <p className="text-[11px] font-semibold text-slate-500">
              Database &amp; APIs Online
            </p>
          </div>
        </div>

        {/* 3. TABS AND SEARCH CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 border border-purple-100 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`tap-scale flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeTab === "creators"
                  ? "bg-[#651FFF] text-white shadow-md shadow-purple-600/20"
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
                  ? "bg-[#651FFF] text-white shadow-md shadow-purple-600/20"
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
                  ? "bg-[#651FFF] text-white shadow-md shadow-purple-600/20"
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
                className="w-full rounded-2xl border border-purple-100 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#651FFF] focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all shadow-2xs"
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

        {/* 4. TAB 1: CREATORS LISTING */}
        {activeTab === "creators" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-3xl border border-purple-100 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-purple-100 bg-purple-50/60 uppercase text-[10px] font-black text-purple-900 tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Creator</th>
                    <th className="px-5 py-4">Handle</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Theme</th>
                    <th className="px-5 py-4">Joined Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-semibold">
                        No creators found matching &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredCreators.map((c) => (
                      <tr key={c.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <CreatorAvatar
                              src={c.photoDataUrl}
                              name={c.displayName || c.email}
                              className="h-9 w-9 rounded-2xl shrink-0 border border-purple-100"
                            />
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate">
                                {c.displayName || "Inflixo Creator"}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono font-extrabold text-[#651FFF]">
                            @{c.username || "username"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-block rounded-full bg-purple-50 border border-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-900">
                            {c.category || "General"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="capitalize font-semibold text-slate-700">
                            {c.themeKey || "minimal-white"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-500 font-medium">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/${c.username || "username"}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-black text-[#651FFF] hover:bg-purple-100 transition-all"
                          >
                            <span>View Page</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
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
                <div className="col-span-full rounded-3xl border border-purple-100 bg-white p-12 text-center text-slate-500 font-semibold">
                  No series found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredSeries.map((s) => {
                  const episodesCount = s.seasons?.[0]?.episodes?.length || 0;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSeries(s)}
                      className="group tap-scale relative overflow-hidden rounded-3xl border border-purple-100 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md cursor-pointer text-left space-y-3"
                    >
                      <div className="flex gap-3">
                        <SeriesPoster
                          src={s.posterDataUrl}
                          title={s.title}
                          className="h-28 w-20 rounded-2xl shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-black text-purple-700 uppercase">
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
                            By <span className="text-[#651FFF] font-extrabold">{s.creatorName || `@${s.creatorUsername}`}</span>
                          </p>
                          <p className="text-[11px] font-extrabold text-purple-700">
                            {episodesCount} {episodesCount === 1 ? "Episode" : "Episodes"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Click to view full details</span>
                        <span className="flex items-center gap-1 font-extrabold text-[#651FFF] group-hover:translate-x-1 transition-transform">
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
            <div className="lg:col-span-7 rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#651FFF]" />
                    Send Admin Email Broadcast
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Sends real HTML emails from <span className="font-mono text-[#651FFF]">inflixoapp@gmail.com</span>
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
                      onClick={() => handleTemplateSelect(tmpl.id)}
                      className={`tap-scale p-3 rounded-2xl border text-left transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "border-[#651FFF] bg-purple-50/80 text-[#651FFF] font-black shadow-2xs"
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
                    className="text-[11px] font-extrabold text-[#651FFF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Select All Registered Creators ({creators.length})
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  placeholder="Enter email addresses separated by commas or new lines (e.g. creator@gmail.com, test@inflixo.com)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#651FFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#651FFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#651FFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="button"
                disabled={sendingEmail}
                onClick={handleSendMail}
                className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#782BFB] via-[#6512FA] to-[#500CD6] py-3.5 text-xs font-black text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="lg:col-span-5 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#651FFF]" /> Live Email HTML Preview
                </p>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#651FFF]">
                  Sender: inflixoapp@gmail.com
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FAFAFC] p-4 text-left space-y-3 max-h-[500px] overflow-y-auto">
                <div className="border-b border-slate-200 pb-2">
                  <p className="text-[11px] text-slate-500 font-bold">
                    From: <span className="text-slate-900 font-semibold">&quot;Inflixo App&quot; &lt;inflixoapp@gmail.com&gt;</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    Subject: <span className="text-[#651FFF] font-black">{emailSubject || "No Subject"}</span>
                  </p>
                </div>

                <div
                  className="prose prose-purple max-w-none text-xs text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 7. LIGHT THEME SERIES DETAILS MODAL */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-purple-100 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSeries(null)}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <SeriesPoster
                src={selectedSeries.posterDataUrl}
                title={selectedSeries.title}
                className="h-44 w-32 rounded-2xl shrink-0 border border-slate-200 shadow-md"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-black text-purple-700 uppercase">
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

                {/* Creator Attribution Box */}
                <div className="pt-2 flex items-center justify-between border-t border-purple-100">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Creator Account</p>
                    <p className="text-xs font-black text-[#651FFF]">
                      {selectedSeries.creatorName || `@${selectedSeries.creatorUsername}`} ({selectedSeries.creatorEmail})
                    </p>
                  </div>

                  <Link
                    href={`/${selectedSeries.creatorUsername || "username"}`}
                    target="_blank"
                    className="tap-scale flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-[#651FFF] hover:bg-purple-100 transition-all"
                  >
                    <span>Visit Profile</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Episode List Section */}
            <div className="space-y-3 pt-4 border-t border-purple-100">
              <h3 className="font-display text-base font-black text-slate-900 flex items-center gap-2">
                <Film className="h-4 w-4 text-[#651FFF]" />
                Episodes ({selectedSeries.seasons?.[0]?.episodes?.length || 0})
              </h3>

              <div className="space-y-2.5">
                {(selectedSeries.seasons?.[0]?.episodes?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No episodes uploaded yet.</p>
                ) : (
                  selectedSeries.seasons[0].episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-slate-50/60 p-3.5 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] text-xs font-black shrink-0">
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
                          className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#651FFF] hover:bg-[#500CD6] px-3 py-1.5 text-xs font-bold text-white transition-all self-end sm:self-auto shadow-2xs"
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
