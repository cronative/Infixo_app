"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { ThemeCard } from "@/themes/registry";
import { SocialService } from "@/services/SocialService";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getPlanQuota } from "@/services/subscriptionLimits";
import {
  CreatorProfile,
  EMPTY_SOCIAL_ACCOUNTS,
  SocialAccounts,
  ThemeKey,
  CreatorProduct,
} from "@/types";

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

function isFreeTrialExpired(subscription?: {
  planKey?: string;
  status?: string;
  activatedAt?: string | Date | null;
  trialEndsAt?: string | Date | null;
  endsAt?: string | Date | null;
  currentPeriodEndsAt?: string | Date | null;
}) {
  if (!subscription || subscription.planKey !== "early_access") return false;
  if (subscription.status && !["active", "trial"].includes(subscription.status)) return true;

  const nowMs = Date.now();
  const trialEndMs = subscription.trialEndsAt ? new Date(subscription.trialEndsAt).getTime() : 0;
  if (trialEndMs && nowMs > trialEndMs) return true;

  const periodEndMs = subscription.currentPeriodEndsAt
    ? new Date(subscription.currentPeriodEndsAt).getTime()
    : subscription.endsAt
      ? new Date(subscription.endsAt).getTime()
      : 0;
  if (periodEndMs && nowMs > periodEndMs) return true;

  if (subscription.activatedAt) {
    const actMs = new Date(subscription.activatedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (nowMs - actMs > thirtyDaysMs) return true;
  }
  return false;
}

function buildSocialAccounts(rows: Array<Record<string, unknown>>): SocialAccounts {
  const accounts: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
  rows.forEach((row) => {
    const platform = String(row.platform || "").toLowerCase();
    const handle = String(row.username || row.accountName || "");
    const cleanHandle = handle.replace(/^@/, "");
    const count = Number(row.followerCount || row.followers || 0);

    if (platform === "instagram") {
      accounts.instagram = {
        ...accounts.instagram,
        followers: count,
        username: handle,
        url: cleanHandle ? `https://instagram.com/${cleanHandle}` : "",
      };
    } else if (platform === "youtube") {
      accounts.youtube = {
        ...accounts.youtube,
        subscribers: count,
        username: handle,
        url: cleanHandle ? `https://youtube.com/@${cleanHandle}` : "",
      };
    } else if (platform === "facebook") {
      accounts.facebook = {
        ...accounts.facebook,
        followers: count,
        username: handle,
        url: cleanHandle ? `https://facebook.com/${cleanHandle}` : "",
      };
    }
  });
  return accounts;
}

export default function AllProductsClient() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [theme, setTheme] = useState<ThemeKey>("minimal-white");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      const usernameParam = Array.isArray(params.username) ? params.username[0] : params.username;
      if (!usernameParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const cleanHandle = decodeURIComponent(usernameParam).replace(/^@/, "");

      // Handle demo creator
      if (cleanHandle.toLowerCase() === "demo_creator") {
        const {
          EXPERT_DEMO_PROFILE,
          EXPERT_DEMO_SOCIALS,
          EXPERT_DEMO_PRODUCTS,
          EXPERT_DEMO_THEME,
        } = await import("@/data/expertDemoCreator");

        if (!isCancelled) {
          setProfile(EXPERT_DEMO_PROFILE);
          setSocials(EXPERT_DEMO_SOCIALS);
          setProducts(EXPERT_DEMO_PRODUCTS);
          setTheme(EXPERT_DEMO_THEME);
          setLoading(false);
        }
        return;
      }

      try {
        const [profRes, socialsRes, productsRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/public/products?username=${encodeURIComponent(usernameParam)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ status: 0 })),
        ]);

        if (isCancelled) return;

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const profData = profRes.data?.profile || profRes.profile;
        const subData = profRes.data?.subscription || profRes.subscription;

        if (!isProfOk || !profData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (isFreeTrialExpired(subData)) {
          setIsPrivate(true);
          setLoading(false);
          return;
        }

        const safeProf: CreatorProfile = {
          id: profData.id || `cr_${cleanHandle}`,
          displayName: profData.displayName || profData.display_name || cleanHandle,
          username: cleanHandle,
          bio: profData.bio || "",
          photoDataUrl: profData.photoDataUrl || profData.photo_url || null,
          category: profData.category || null,
          city: profData.city || null,
          state: profData.state || null,
          isVerified: Boolean(profData.isVerified || profData.is_verified),
          updatedAt: profData.updatedAt || new Date().toISOString(),
        };

        const resolvedTheme = (profData.themeKey || profData.theme_key || "minimal-white") as ThemeKey;

        const socialsData = socialsRes.data?.socials || socialsRes.socials || [];
        const mappedSocials = Array.isArray(socialsData)
          ? buildSocialAccounts(socialsData)
          : typeof socialsData === "object" && socialsData !== null
            ? socialsData
            : EMPTY_SOCIAL_ACCOUNTS;

        const rawProds = productsRes.status === 1 && Array.isArray(productsRes.data?.products)
          ? productsRes.data.products
          : [];
        const quota = getPlanQuota(subData?.planKey || "early_access");
        const prodsList =
          quota.maxProducts === Infinity
            ? rawProds
            : rawProds.slice(0, quota.maxProducts);

        setProfile(safeProf);
        setSocials(mappedSocials);
        setProducts(prodsList);
        setTheme(resolvedTheme);
        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load creator products page:", err);
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [params.username]);

  if (loading) {
    return <SyncingLoader message="Loading products..." />;
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UserX className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Creator Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">The requested creator shop does not exist or may have changed.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#043084] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Go to Inflixo Home
          </button>
        </main>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <main className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-amber-900">Page Private</h1>
          <p className="mt-2 text-sm text-slate-600">This creator shop is currently private.</p>
        </main>
      </div>
    );
  }

  const totalAudience = SocialService.calculateTotalAudience(socials);
  const cleanHandle = (profile.username || (Array.isArray(params.username) ? params.username[0] : params.username) || "creator").replace(/^@/, "");
  const productsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${cleanHandle}/products`
    : `https://inflixo.com/${cleanHandle}/products`;

  async function handleShareProductsList() {
    const title = `${profile.displayName || cleanHandle}'s Recommended Products on Inflixo`;
    const text = `Explore ${profile.displayName || cleanHandle}'s curated products and recommendations on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: productsUrl });
        return;
      }

      const copied = await copyToClipboard(productsUrl);
      showToast(copied ? "Product listing link copied! ✨" : "Could not copy link", copied ? "success" : "error");
    } catch {
      // User dismissed
    }
  }

  return (
    <CreatorPublicShell themeKey={theme}>
      <ThemeCard
        themeKey={theme}
        profile={profile}
        socials={socials}
        series={[]}
        products={products}
        customLinks={[]}
        mediaKitPackages={[]}
        reviews={[]}
        totalAudience={totalAudience}
        variant="full"
        containedScroll
        productsOnlyMode
        pageHeader={{ pageLabel: "Shop", backHref: `/${cleanHandle}`, backLabel: "Back to profile" }}
        onShare={handleShareProductsList}
      />
    </CreatorPublicShell>
  );
}
