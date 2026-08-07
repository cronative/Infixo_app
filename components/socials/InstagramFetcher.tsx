"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, BadgeCheck, Users, Grid, Heart, Sparkles } from "lucide-react";
import { formatCount } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";

export interface FetchedInstagramUser {
  username: string;
  full_name: string;
  follower_count: number;
  media_count: number;
  following_count: number;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
}

interface InstagramFetcherProps {
  username: string;
  onConfirmSync?: (fetched: FetchedInstagramUser) => void;
}

export function InstagramFetcher({ username, onConfirmSync }: InstagramFetcherProps) {
  const { showToast } = useToast();
  const { updateProfile, updateSocials, socials, profile } = useCreator();

  const [loading, setLoading] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<FetchedInstagramUser | null>(null);
  const [synced, setSynced] = useState(false);

  async function fetchDetails() {
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      showToast("Please enter an Instagram username first", "error");
      return;
    }

    setLoading(true);
    setFetchedUser(null);
    setSynced(false);

    try {
      const res = await fetch("/api/instagram/userInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch Instagram details");
      }

      setFetchedUser(data.user);
      showToast(`Fetched profile for @${data.user.username}! 🎉`);
    } catch (err: any) {
      showToast(err.message || "Failed to fetch Instagram profile", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!fetchedUser) return;

    // 1. Update Instagram Social Stats & Handles
    updateSocials({
      instagram: {
        ...socials.instagram,
        url: `https://instagram.com/${fetchedUser.username}`,
        followers: fetchedUser.follower_count,
        posts: fetchedUser.media_count,
      },
    });

    // 2. Auto-fill Profile Name / Photo / Bio if currently default or empty
    const patch: Partial<typeof profile> = {};
    if (!profile.displayName || profile.displayName === "Your name") {
      patch.displayName = fetchedUser.full_name || fetchedUser.username;
    }
    if (!profile.bio && fetchedUser.biography) {
      patch.bio = fetchedUser.biography.slice(0, 160);
    }
    if (!profile.photoDataUrl && fetchedUser.profile_pic_url) {
      patch.photoDataUrl = fetchedUser.profile_pic_url;
    }

    if (Object.keys(patch).length > 0) {
      updateProfile(patch);
    }

    setSynced(true);
    showToast(`Linked @${fetchedUser.username} to your Inflixo profile! ✨`);
    if (onConfirmSync) onConfirmSync(fetchedUser);
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Fetch Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={fetchDetails}
          disabled={loading || !username.trim()}
          className="tap-scale flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching Instagram Profile...
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5" />
              Fetch Profile Details
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
      {fetchedUser && (
        <div
          className="relative overflow-hidden rounded-3xl border-2 border-pink-500/30 bg-white p-4 shadow-lg transition-all"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(253,242,248,0.7), #ffffff 60%)" }}
        >
          <div className="flex items-start gap-3.5">
            {/* Avatar Pic */}
            <div className="relative">
              {fetchedUser.profile_pic_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fetchedUser.profile_pic_url}
                  alt={fetchedUser.full_name}
                  className="h-16 w-16 rounded-full border-2 border-pink-500 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600">
                  IG
                </div>
              )}
              {fetchedUser.is_verified && (
                <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-sky-500 text-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Instagram Full Name */}
              <div className="flex items-center gap-1.5">
                <p className="truncate text-base font-extrabold text-inflixo-navy">
                  {fetchedUser.full_name || fetchedUser.username}
                </p>
                {fetchedUser.is_verified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 fill-sky-500 text-white" />
                )}
              </div>

              {/* Instagram Username */}
              <p className="text-xs font-extrabold text-pink-600">@{fetchedUser.username}</p>

              {/* Followers Count Badge */}
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-pink-100/90 px-2.5 py-0.5 text-xs font-black text-pink-700 border border-pink-200 shadow-2xs">
                <Users className="h-3 w-3 text-pink-600" />
                <span>{formatCount(fetchedUser.follower_count)} Followers</span>
              </div>

              {fetchedUser.biography && (
                <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
                  {fetchedUser.biography}
                </p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/80 p-3 text-center border border-pink-100">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted flex items-center justify-center gap-1">
                <Users className="h-3 w-3 text-pink-500" />
                Followers
              </p>
              <p className="text-sm font-black text-inflixo-navy mt-0.5">
                {formatCount(fetchedUser.follower_count)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted flex items-center justify-center gap-1">
                <Grid className="h-3 w-3 text-pink-500" />
                Posts
              </p>
              <p className="text-sm font-black text-inflixo-navy mt-0.5">
                {formatCount(fetchedUser.media_count)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted flex items-center justify-center gap-1">
                <Heart className="h-3 w-3 text-pink-500" />
                Following
              </p>
              <p className="text-sm font-black text-inflixo-navy mt-0.5">
                {formatCount(fetchedUser.following_count)}
              </p>
            </div>
          </div>

          {/* Mandatory Confirmation Banner & CTA */}
          <div className="mt-3.5 pt-3 border-t border-pink-100 flex flex-col gap-2">
            {!synced && (
              <p className="text-[11px] font-semibold text-pink-700 text-center">
                👉 Click below to confirm &amp; add this Instagram profile to your live preview &amp; profile!
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition-all ${
                synced
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200"
                  : "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 text-white shadow-md hover:shadow-lg animate-pulse hover:animate-none"
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
                  Confirm &amp; Link Instagram Profile
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
