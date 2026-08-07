"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, BadgeCheck, Users, Sparkles } from "lucide-react";
import { formatCount } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";

export interface FetchedFacebookPage {
  name: string;
  username: string;
  page_id: string;
  url: string;
  image: string;
  cover_image: string;
  followers: number;
  likes: number;
  verified: boolean;
  categories: string[];
  intro: string;
}

interface FacebookFetcherProps {
  username: string;
  onConfirmSync?: (fetched: FetchedFacebookPage) => void;
}

export function FacebookFetcher({ username, onConfirmSync }: FacebookFetcherProps) {
  const { showToast } = useToast();
  const { updateProfile, updateSocials, socials, profile } = useCreator();

  const [loading, setLoading] = useState(false);
  const [fetchedPage, setFetchedPage] = useState<FetchedFacebookPage | null>(null);
  const [synced, setSynced] = useState(false);

  async function fetchDetails() {
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      showToast("Please enter a Facebook Page username first", "error");
      return;
    }

    setLoading(true);
    setFetchedPage(null);
    setSynced(false);

    try {
      const res = await fetch("/api/facebook/pageInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch Facebook Page details");
      }

      setFetchedPage(data.page);
      showToast(`Fetched Facebook Page "${data.page.name}"! 🎉`);
    } catch (err: any) {
      showToast(err.message || "Failed to fetch Facebook Page info", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!fetchedPage) return;

    // 1. Update Facebook Social Stats & Handles
    updateSocials({
      facebook: {
        ...socials.facebook,
        url: `https://facebook.com/${fetchedPage.username}`,
        followers: fetchedPage.followers,
      },
    });

    // 2. Auto-fill Profile Name / Photo / Bio if currently default or empty
    const patch: Partial<typeof profile> = {};
    if (!profile.displayName || profile.displayName === "Your name") {
      patch.displayName = fetchedPage.name || fetchedPage.username;
    }
    if (!profile.bio && fetchedPage.intro) {
      patch.bio = fetchedPage.intro.slice(0, 160);
    }
    if (!profile.photoDataUrl && fetchedPage.image) {
      patch.photoDataUrl = fetchedPage.image;
    }

    if (Object.keys(patch).length > 0) {
      updateProfile(patch);
    }

    setSynced(true);
    showToast(`Linked Facebook Page "${fetchedPage.name}"! ✨`);
    if (onConfirmSync) onConfirmSync(fetchedPage);
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Fetch Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={fetchDetails}
          disabled={loading || !username.trim()}
          className="tap-scale flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching Facebook Page...
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5" />
              Fetch Page Details
            </>
          )}
        </button>

        {synced && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
            Synced &amp; Confirmed
          </span>
        )}
      </div>

      {/* Fetched Result Card */}
      {fetchedPage && (
        <div
          className="relative overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-white p-4 shadow-lg transition-all"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(239,246,255,0.7), #ffffff 60%)" }}
        >
          <div className="flex items-start gap-3.5">
            {/* Avatar Pic */}
            <div className="relative">
              {fetchedPage.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fetchedPage.image}
                  alt={fetchedPage.name}
                  className="h-16 w-16 rounded-full border-2 border-blue-600 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  FB
                </div>
              )}
              {fetchedPage.verified && (
                <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-blue-600 text-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-base font-extrabold text-inflixo-navy">
                  {fetchedPage.name}
                </p>
                {fetchedPage.verified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-600 text-white" />
                )}
              </div>
              <p className="text-xs font-bold text-blue-600">facebook.com/{fetchedPage.username}</p>

              <div className="mt-1 flex items-center gap-1.5 text-xs font-black text-inflixo-navy">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>{formatCount(fetchedPage.followers)} followers</span>
              </div>

              {fetchedPage.categories && fetchedPage.categories.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {fetchedPage.categories.map((c) => (
                    <span key={c} className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Confirmation Banner & CTA */}
          <div className="mt-3.5 pt-3 border-t border-blue-100 flex flex-col gap-2">
            {!synced && (
              <p className="text-[11px] font-semibold text-blue-700 text-center">
                👉 Click below to confirm &amp; add this Facebook page to your live preview &amp; profile!
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition-all ${
                synced
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200"
                  : "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg animate-pulse hover:animate-none"
              }`}
            >
              {synced ? (
                <>
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  Confirmed &amp; Added to Preview!
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Confirm &amp; Link Facebook Page
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
