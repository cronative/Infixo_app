"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  Star,
  Users,
  Film,
  Building2,
  Handshake,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronRight,
  UserX,
} from "lucide-react";
import {
  CreatorProfile,
  SocialAccounts,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CreatorReview,
  CreatorBrand,
  CreatorCollaboration,
  TeamMember,
  CreatorTeam,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { Logo } from "@/components/shared/Logo";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { getInitials } from "@/lib/avatar";

export default function PublicMediaKitPage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [series, setSeries] = useState<Series[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings | null>(null);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [team, setTeam] = useState<{ team?: CreatorTeam | null; members: TeamMember[] }>({ members: [] });
  const [brands, setBrands] = useState<CreatorBrand[]>([]);
  const [collaborations, setCollaborations] = useState<CreatorCollaboration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  useEffect(() => {
    async function loadMediaKitData() {
      const rawUser = decodeURIComponent(params.username ?? "").trim();
      const usernameParam = rawUser.replace(/^@/, "").toLowerCase();
      if (!usernameParam) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      try {
        const [
          profRes,
          socRes,
          serRes,
          mediakitRes,
          revRes,
          teamRes,
          brandRes,
          collabRes,
        ] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/mediakit?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/team?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/brands?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/collaborations?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (profRes.success && profRes.profile && profRes.profile.username) {
          setProfile(profRes.profile);
          setNotFound(false);

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

          if (mediakitRes.success && Array.isArray(mediakitRes.packages)) {
            setPackages(mediakitRes.packages);
          }
          if (mediakitRes.success && mediakitRes.settings) {
            setSettings(mediakitRes.settings);
          }

          if (revRes.success && Array.isArray(revRes.reviews)) {
            setReviews(revRes.reviews);
          }

          if (teamRes.success && teamRes.team) {
            setTeam({ team: teamRes.team, members: teamRes.members || [] });
          }

          if (brandRes.success && Array.isArray(brandRes.brands)) {
            setBrands(brandRes.brands);
          }

          if (collabRes.success && Array.isArray(collabRes.collaborations)) {
            setCollaborations(collabRes.collaborations);
          }

          // Track Media Kit View
          try {
            fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creator_id: profRes.profile.id,
                creator_username: usernameParam,
                event_type: "mediakit_view",
                metadata: {
                  referrer: typeof document !== "undefined" ? document.referrer : "",
                },
              }),
            }).catch(() => {});
          } catch {}
        } else {
          try {
            const {
              profileRepository,
              seriesRepository,
              teamRepository,
              brandsRepository,
              collaborationsRepository,
              reviewsRepository,
            } = await import("@/repositories/localRepository");
            const local = profileRepository.get();
            const cleanLocalUser = (local?.username || "").replace(/^@/, "").toLowerCase();
            if (local && (cleanLocalUser === usernameParam || !local.username)) {
              setProfile({ ...local, username: local.username || usernameParam });
              setSeries(seriesRepository.getAll());
              setTeam(teamRepository.get());
              setBrands(brandsRepository.getAll());
              setCollaborations(collaborationsRepository.getAll());
              setReviews(reviewsRepository.getAll().filter((r) => r.status === "approved"));
              setNotFound(false);
              setLoaded(true);
              return;
            }
          } catch (localErr) {
            console.warn("Local fallback error:", localErr);
          }
          setNotFound(true);
        }
      } catch (e) {
        console.warn("Failed to load media kit data:", e);
        setNotFound(true);
      } finally {
        setLoaded(true);
      }
    }
    loadMediaKitData();
  }, [params.username]);

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      const success = await copyToClipboard(window.location.href);
      if (success) showToast("Media kit link copied! 💼✨");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!loaded) {
    return <SyncingLoader message="Loading Official Creator Media Kit..." fullScreen hideProgressBar={true} />;
  }

  if (notFound || !profile) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FAF8FA] px-4 py-12 text-center text-[#17131A]">
        <div className="max-w-md space-y-6">
          <Logo />
          <div className="rounded-3xl border border-[#ECE8EB] bg-white p-8 space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EDF3] text-[#803D63]">
              <UserX className="h-7 w-7" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#17131A]">Media Kit Not Found</h1>
            <p className="text-xs text-[#6F6872]">No creator media kit registered for @{handle}.</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl bg-[#803D63] text-white text-xs font-semibold hover:bg-[#6D3254] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAudience =
    (socials.instagram?.followers || 0) +
    (socials.youtube?.subscribers || 0) +
    (socials.facebook?.followers || 0);

  const activePackages = packages.filter((p) => p.isActive !== false);

  return (
    <div className="min-h-dvh bg-[#FAF8FA] text-[#17131A] pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#ECE8EB] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xs font-bold text-[#803D63] bg-[#F7EDF3] px-2 py-0.5 rounded-md">
              Media Kit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="h-3.5 w-3.5 text-[#803D63]" />
              <span className="hidden sm:inline">Share Media Kit</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#6F6872]" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <span>Work With Me</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6 text-left">
        {/* 1. HERO CREATOR IDENTIFICATION */}
        <section className="rounded-3xl border border-[#ECE8EB] bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={profile.displayName || "Creator"}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover aspect-square border border-[#ECE8EB] shadow-xs"
                textClassName="text-2xl font-bold"
                fallbackBgClass="bg-[#F7EDF3]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A]">
                    {profile.displayName || "Creator"}
                  </h1>
                  {profile.isVerified && <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#803D63]">
                  @{profile.username} • {profile.category || "Digital Creator"}
                </p>
                <p className="text-xs text-[#6F6872] max-w-xl leading-relaxed pt-1">
                  {profile.bio || "Official creator portfolio and brand collaboration kit."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-4 text-center sm:text-right shrink-0 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] block">
                Total Verified Fanbase
              </span>
              <p className="font-display text-3xl font-bold text-[#803D63]">
                {formatCount(totalAudience)}
              </p>
              <p className="text-[11px] text-[#6F6872]">Combined audience reach</p>
            </div>
          </div>

          {/* Social Reach Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#ECE8EB]">
            {/* Instagram */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                  <InstagramIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Instagram</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.instagram.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.instagram.followers || 0)}
              </p>
            </div>

            {/* YouTube */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <YoutubeIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">YouTube</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.youtube.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.youtube.subscribers || 0)}
              </p>
            </div>

            {/* Facebook */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FacebookIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Facebook</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.facebook.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.facebook.followers || 0)}
              </p>
            </div>
          </div>
        </section>

        {/* 2. COLLABORATION PACKAGES & RATE CARDS */}
        {activePackages.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
                  Collaboration Packages &amp; Deliverables
                </h2>
                <p className="text-xs text-[#6F6872]">
                  Standard sponsorship options and starting rate cards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-[#ECE8EB] bg-white p-5 flex flex-col justify-between space-y-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-[#803D63] bg-[#F7EDF3] px-2 py-0.5 rounded-lg">
                        {pkg.platform}
                      </span>
                      {(pkg.packageName || pkg.badge) && (
                        <span className="text-[10px] font-semibold text-[#6F6872] bg-[#FAF8FA] border border-[#ECE8EB] px-2 py-0.5 rounded-md">
                          {pkg.packageName || pkg.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[#17131A]">{pkg.title}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-display text-lg font-bold text-[#803D63]">
                          {pkg.price}
                        </span>
                        <span className="text-[11px] text-[#6F6872]">
                          • {pkg.turnaroundDays}-day delivery
                        </span>
                      </div>
                    </div>

                    {pkg.deliverables && pkg.deliverables.length > 0 && (
                      <ul className="space-y-1.5 pt-2 border-t border-[#ECE8EB] text-xs text-[#17131A]">
                        {pkg.deliverables.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(true)}
                    className="w-full py-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Request Booking
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. CLIENT REVIEWS */}
        {reviews.length > 0 && (
          <section className="space-y-3.5">
            <div className="px-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A] flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Verified Client Reviews ({reviews.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                  {rev.comment && <p className="text-xs text-[#17131A] italic">“{rev.comment}”</p>}
                  <p className="text-[11px] font-bold text-[#6F6872] pt-1">
                    {rev.clientName} {rev.clientDesignation ? `• ${rev.clientDesignation}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. CREATOR TEAM */}
        {team.members && team.members.length > 0 && (
          <section className="space-y-3.5">
            <div className="px-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#803D63]" />
                {team.team?.teamName || "Creator Team"} ({team.members.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {team.members.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[#ECE8EB] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#803D63] text-white font-extrabold text-xs shrink-0 ring-2 ring-[#F7EDF3]">
                    {getInitials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-[#17131A] truncate">{m.name}</p>
                    <p className="text-[11px] font-semibold text-[#803D63] truncate">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. BOTTOM CONTACT & INQUIRY FOOTER */}
        <section className="rounded-3xl border border-[#ECE8EB] bg-[#F7EDF3]/50 p-6 sm:p-8 text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-[#17131A]">
            Ready to start a brand collaboration?
          </h2>
          <p className="text-xs text-[#6F6872] max-w-md mx-auto">
            Get in touch directly with @{profile.username} for tailored sponsorship campaigns and custom deliverables.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <span>Submit Brand Inquiry</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </main>

      {/* Inquiry Modal */}
      <CollaborationInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        creatorId={profile.id || profile.username || "creator"}
        creatorEmail={profile.email}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        packages={packages}
      />
    </div>
  );
}
