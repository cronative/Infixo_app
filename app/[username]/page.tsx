"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, UserX, Home, Sparkles, Film, Users, Briefcase, ShieldCheck, Zap, MessageCircle, Mail, Clock, CheckCircle2, FileSpreadsheet, Tv } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { MediaKitService } from "@/services/MediaKitService";
import { ThemeCard } from "@/themes/registry";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, MediaKitPackage, MediaKitSettings, EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildProfileUrl, formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [theme, setTheme] = useState<ThemeKey>("minimal-white");
  const [series, setSeries] = useState<Series[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"series" | "mediakit">("series");
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadData() {
      const usernameParam = decodeURIComponent(params.username ?? "").trim().toLowerCase();
      if (!usernameParam) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      // 1. Initial check for local profile if logged in creator
      const localProfile = ProfileService.getProfile();
      if (localProfile.username && localProfile.username.toLowerCase() === usernameParam) {
        setProfile(localProfile);
        setSocials(SocialService.getAccounts());
        setTheme(ThemeService.getSelectedTheme());
        setSeries(SeriesService.getAllLocal());
        setLoaded(true);
      }

      // 2. Fetch Creator Profile & Media Kit by username from MySQL DB
      try {
        const [profRes, socRes, serRes, mkRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
          MediaKitService.fetchFromDb(usernameParam),
        ]);

        if (profRes.success && profRes.profile) {
          setProfile(profRes.profile);
          if (profRes.profile.themeKey) {
            setTheme(profRes.profile.themeKey as ThemeKey);
          }
          setNotFound(false);
        } else if (!localProfile.username || localProfile.username.toLowerCase() !== usernameParam) {
          setNotFound(true);
        }

        if (mkRes) {
          setPackages(mkRes.packages || []);
          setSettings(mkRes.settings || MediaKitService.DEFAULT_SETTINGS);
        }

        if (socRes.success && Array.isArray(socRes.socials)) {
          const accs: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
          socRes.socials.forEach((s: any) => {
            const handle = s.username || s.accountName || "";
            if (s.platform === "instagram") {
              accs.instagram = {
                ...accs.instagram,
                followers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://instagram.com/${handle.replace(/^@/, "")}` : "",
              };
            } else if (s.platform === "youtube") {
              accs.youtube = {
                ...accs.youtube,
                subscribers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://youtube.com/@${handle.replace(/^@/, "")}` : "",
              };
            } else if (s.platform === "facebook") {
              accs.facebook = {
                ...accs.facebook,
                followers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://facebook.com/${handle.replace(/^@/, "")}` : "",
              };
            }
          });
          setSocials(accs);
        }

        if (serRes.success && Array.isArray(serRes.series)) {
          setSeries(serRes.series);
        }
      } catch (e) {
        console.warn("Failed to load creator profile from DB deeplink:", e);
      } finally {
        setLoaded(true);
      }
    }
    loadData();
  }, [params.username]);

  // Dynamically check handle availability when profile is not found
  useEffect(() => {
    if (notFound && params.username) {
      const handle = decodeURIComponent(params.username).trim().toLowerCase();
      fetch(`/api/creator/check-username?username=${encodeURIComponent(handle)}`)
        .then((r) => r.json())
        .then((data) => {
          setUsernameAvailable(Boolean(data.available));
        })
        .catch(() => {
          setUsernameAvailable(false);
        });
    }
  }, [notFound, params.username]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!profile.displayName && !profile.username) return;

    const displayName = profile.displayName || profile.username || "Creator";
    const handle = profile.username || "creator";
    const pageTitle = `${displayName} (@${handle}) — Official Inflixo Creator Profile`;
    const pageDesc = profile.bio || `Check out ${displayName}'s official fanbase stats, connected social channels & original series on Inflixo.`;
    const pageUrl = `https://inflixo.com/${handle}`;
    const pageImg = profile.photoDataUrl || "https://inflixo.com/apple-icon.png";

    document.title = pageTitle;

    const setMeta = (nameOrProp: string, content: string, isProp = false) => {
      let el = document.querySelector(isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (isProp) el.setAttribute("property", nameOrProp);
        else el.setAttribute("name", nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", pageDesc);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", pageDesc, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:image", pageImg, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDesc);
    setMeta("twitter:image", pageImg);

    let scriptEl = document.getElementById("json-ld-profile");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "json-ld-profile";
      scriptEl.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptEl);
    }

    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": displayName,
        "alternateName": `@${handle}`,
        "identifier": handle,
        "description": pageDesc,
        "image": pageImg,
        "url": pageUrl,
        "sameAs": [
          socials.instagram.url,
          socials.youtube.url,
          socials.facebook.url,
        ].filter(Boolean),
      },
    });
  }, [profile, socials]);

  const totalAudience = SocialService.calculateTotalAudience(socials);
  const handleStr = profile.username || decodeURIComponent(params.username ?? "username");
  const fullUrl = buildProfileUrl(handleStr);
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  async function handleShare() {
    const shareText = `Check out ${profile.displayName ? `${profile.displayName}'s` : "my"} Inflixo profile to see fanbase stats, social channels & original series! 🎬✨`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName || "Creator"} on Inflixo`,
          text: shareText,
          url: fullUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    const shareText = `Check out ${profile.displayName ? `${profile.displayName}'s` : "my"} Inflixo profile to see fanbase stats, social channels & original series! 🎬✨`;
    const success = await copyToClipboard(`${shareText}\n${fullUrl}`);
    if (success) {
      setCopied(true);
      showToast("Profile link & message copied! ✨");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg px-5 py-10">
        <SkeletonProfileCard />
      </div>
    );
  }

  if (notFound) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-50/90 via-slate-50 to-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Light Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl" />

        <main className="relative z-10 w-full max-w-xl space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between px-2">
            <Logo />
            <span className="rounded-full bg-indigo-100 border border-indigo-200/80 px-3.5 py-1 text-xs font-black text-indigo-700 shadow-2xs">
              Creator Home by Inflixo
            </span>
          </div>

          {/* Main 404 Light Theme Card */}
          <div className="rounded-[32px] border border-indigo-100 bg-white/90 p-8 sm:p-12 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl space-y-6 text-center">
            {/* Animated Icon Badge */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#803D63] text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-100">
              <UserX className="h-10 w-10 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              {usernameAvailable === true ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-1">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>@{handle} is Available 🎉</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    @{handle} is available
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    Want this creator handle? Claim it now and set up your Inflixo page in minutes.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    <span>CREATOR NOT FOUND</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    @{handle} isn’t available
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    This creator profile may have moved, changed its username, or is no longer available.
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {usernameAvailable === true ? (
                <button
                  onClick={() => router.push(`/login`)}
                  className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-indigo-900/20 transition-all border border-indigo-400/30 hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Claim @{handle}</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-indigo-900/20 transition-all border border-indigo-400/30 hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create Your Inflixo</span>
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-xs font-black text-slate-700 transition-all hover:scale-[1.02]"
              >
                <Home className="h-4 w-4" />
                <span>Explore Inflixo</span>
              </button>
            </div>

            {/* Value Highlights Grid */}
            <div className="mt-8 border-t border-indigo-100 pt-6 grid grid-cols-3 gap-2 text-left">
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3">
                <Film className="h-4 w-4 text-[#803D63] mb-1" />
                <p className="text-[11px] font-black text-slate-900">Series &amp; Parts</p>
                <p className="text-[9px] text-slate-500 font-medium">Keep content in order</p>
              </div>

              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3">
                <Users className="h-4 w-4 text-[#803D63] mb-1" />
                <p className="text-[11px] font-black text-slate-900">Total Fanbase</p>
                <p className="text-[9px] text-slate-500 font-medium">Bring your audience together</p>
              </div>

              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3">
                <Sparkles className="h-4 w-4 text-[#803D63] mb-1" />
                <p className="text-[11px] font-black text-slate-900">Creator Themes</p>
                <p className="text-[9px] text-slate-500 font-medium">Make it yours</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400">
            Your fanbase. Your content. In order.
          </p>
        </main>
      </div>
    );
  }

  const activePackages = packages.filter((p) => p.isActive);
  const cleanPhone = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, "") : "";
  const publicHandleStr = profile.username ? profile.username.replace(/^@/, "") : "creator";

  const totalSeriesCount = series ? series.length : 0;
  const totalEpisodesCount = series
    ? series.reduce((acc: number, ser: any) => {
        const epCount = ser.seasons
          ? ser.seasons.reduce((sAcc: number, season: any) => sAcc + (season.episodes?.length || 0), 0)
          : (ser.episodesCount || 0);
        return acc + epCount;
      }, 0)
    : 0;

  return (
    <div className={`min-h-dvh transition-colors duration-300 ${pageBgStyle}`}>
      <main className="mx-auto max-w-3xl px-2.5 sm:px-8 py-4 sm:py-8 space-y-6 text-left">
        {/* 2-Tab Navigation Switcher */}
        <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-2xl border border-gray-200 shadow-2xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setActiveTab("series")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "series"
                ? "bg-[#803D63] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Film className="h-4 w-4" />
            <span>🎬 Series &amp; Shows</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mediakit")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "mediakit"
                ? "bg-[#803D63] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>💼 Media Kit &amp; Collabs</span>
          </button>
        </div>

        {/* TAB 1: 🎬 SERIES & SHOWS (FAN & VIEWER AUDIENCE VIEW) */}
        {activeTab === "series" && (
          <div className="animate-in fade-in duration-200">
            <ThemeCard
              themeKey={theme}
              profile={profile}
              socials={socials}
              series={series}
              totalAudience={totalAudience}
              variant="full"
              onShare={handleShare}
            />
          </div>
        )}

        {/* TAB 2: 💼 MEDIA KIT & COLLABS (BRAND MANAGER & SPONSOR VIEW) */}
        {activeTab === "mediakit" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Public Header Preview */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 space-y-5 relative shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl sm:text-3xl font-black">{profile.displayName || "Creator"}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 text-xs font-black">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified by Inflixo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-200 font-medium mt-1">
                    @{publicHandleStr} • {profile.category || "Digital Creator"}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-5 py-2.5 rounded-2xl text-left sm:text-right shrink-0">
                  <p className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider">Total Aggregated Reach</p>
                  <p className="text-3xl font-black text-white">{formatCount(totalAudience)}</p>
                </div>
              </div>

              {settings.bioHighlight && (
                <p className="text-xs sm:text-sm text-slate-300 font-medium pt-3 border-t border-white/10 leading-relaxed">
                  "{settings.bioHighlight}"
                </p>
              )}

              {/* Direct Contact Routing Bar */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" /> Direct Brand Inquiry Routing (0% Commission):
                </span>
                <div className="flex items-center gap-2">
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="h-4 w-4 fill-white" />
                      <span>💬 WhatsApp Chat</span>
                    </a>
                  )}
                  {settings.sponsorEmail && (
                    <a
                      href={`mailto:${settings.sponsorEmail}`}
                      className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md"
                    >
                      <Mail className="h-4 w-4 text-[#803D63]" />
                      <span>✉️ Send Email</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Public Gigs Grid (Active Only - 2 per row) */}
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#803D63]" />
                <span>Official Collaboration Rate Cards ({activePackages.length})</span>
              </h4>

              {activePackages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-xs text-slate-500 font-medium">
                  No active rate card packages published currently.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activePackages.map((pkg) => {
                    const waText = encodeURIComponent(
                      `Hi ${profile.displayName || "Creator"}, I saw your "${pkg.title}" (${pkg.price}) package on Inflixo and want to collaborate.`
                    );
                    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
                    const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                    const mailBody = encodeURIComponent(`Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`);
                    const mailUrl = `mailto:${settings.sponsorEmail}?subject=${mailSubject}&body=${mailBody}`;

                    return (
                      <div key={pkg.id} className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white hover:border-[#803D63] transition-all flex flex-col justify-between shadow-2xs relative">
                        {(pkg.badge || pkg.packageName || pkg.isPopular) && (
                          <span className="absolute -top-3 right-4 bg-[#803D63] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                            {pkg.badge || pkg.packageName || "⭐ MOST POPULAR"}
                          </span>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                              {pkg.platform}
                            </span>
                            <span className="font-black text-[#803D63] text-xl">{pkg.price}</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-base leading-snug">{pkg.title}</h5>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#803D63]" /> Turnaround: {pkg.turnaroundDays} Days
                          </p>
                          <ul className="text-xs text-slate-600 space-y-2 pt-1">
                            {pkg.deliverables.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Frictionless Direct Lead Actions */}
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <MessageCircle className="h-4 w-4 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={mailUrl}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Mail className="h-4 w-4" />
                            <span>Send Email</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OTT Series & Episodes Track Record Summary */}
            <div className="pt-3 border-t border-gray-200 space-y-3 bg-white p-6 rounded-2xl border border-gray-200">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="h-4 w-4 text-[#803D63]" /> Production Portfolio Track Record
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] shrink-0">
                    <Film className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Series</p>
                    <p className="font-display text-lg font-black text-slate-900">{totalSeriesCount} Series</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    <Tv className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Episodes</p>
                    <p className="font-display text-lg font-black text-slate-900">{totalEpisodesCount} Episodes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
