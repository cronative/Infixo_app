"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, BadgeCheck, Users, Sparkles } from "lucide-react";
import { YoutubeIcon } from "@/components/shared/BrandIcons";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";

export interface FetchedYoutubeChannel {
  channel_id: string;
  channel_name: string;
  title: string;
  description: string;
  subscriber_count_text: string;
  subscribers: number;
  avatar_url: string;
  verified: boolean;
}

interface YoutubeFetcherProps {
  handle: string;
  onConfirmSync?: (fetched: FetchedYoutubeChannel) => void;
}

export function YoutubeFetcher({ handle, onConfirmSync }: YoutubeFetcherProps) {
  const { showToast } = useToast();
  const { updateProfile, updateSocials, socials, profile } = useCreator();

  const [loading, setLoading] = useState(false);
  const [fetchedChannel, setFetchedChannel] = useState<FetchedYoutubeChannel | null>(null);
  const [synced, setSynced] = useState(false);

  async function fetchDetails() {
    const cleanHandle = handle.trim().replace(/^@/, "");
    if (!cleanHandle) {
      showToast("Please enter a YouTube handle first", "error");
      return;
    }

    setLoading(true);
    setFetchedChannel(null);
    setSynced(false);

    try {
      const res = await fetch("/api/youtube/channelInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName: cleanHandle }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch YouTube channel details");
      }

      setFetchedChannel(data.channel);
      showToast(`Fetched YouTube channel @${data.channel.channel_name}! 🎉`);
    } catch (err: any) {
      showToast(err.message || "Failed to fetch YouTube channel info", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!fetchedChannel) return;

    // 1. Update YouTube Social Stats & Handles
    updateSocials({
      youtube: {
        ...socials.youtube,
        url: `https://youtube.com/@${fetchedChannel.channel_name}`,
        subscribers: fetchedChannel.subscribers,
      },
    });

    // 2. Auto-fill Profile Name / Photo / Bio if currently default or empty
    const patch: Partial<typeof profile> = {};
    if (!profile.displayName || profile.displayName === "Your name") {
      patch.displayName = fetchedChannel.title || fetchedChannel.channel_name;
    }
    if (!profile.bio && fetchedChannel.description) {
      patch.bio = fetchedChannel.description.slice(0, 160);
    }
    if (!profile.photoDataUrl && fetchedChannel.avatar_url) {
      patch.photoDataUrl = fetchedChannel.avatar_url;
    }

    if (Object.keys(patch).length > 0) {
      updateProfile(patch);
    }

    setSynced(true);
    showToast(`Linked YouTube channel @${fetchedChannel.channel_name}! ✨`);
    if (onConfirmSync) onConfirmSync(fetchedChannel);
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Fetch Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={fetchDetails}
          disabled={loading || !handle.trim()}
          className="tap-scale flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching YouTube Channel...
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5" />
              Fetch Channel Details
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
      {fetchedChannel && (
        <div
          className="relative overflow-hidden rounded-3xl border-2 border-red-500/30 bg-white p-4 shadow-lg transition-all"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(254,242,242,0.7), #ffffff 60%)" }}
        >
          <div className="flex items-start gap-3.5">
            {/* Avatar Pic */}
            <div className="relative">
              {fetchedChannel.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fetchedChannel.avatar_url}
                  alt={fetchedChannel.title}
                  className="h-16 w-16 rounded-full border-2 border-red-500 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                  YT
                </div>
              )}
              {fetchedChannel.verified && (
                <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-slate-700 text-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-base font-extrabold text-inflixo-navy">
                  {fetchedChannel.title}
                </p>
                {fetchedChannel.verified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 fill-slate-700 text-white" />
                )}
              </div>
              <p className="text-xs font-bold text-red-600">@{fetchedChannel.channel_name}</p>

              <div className="mt-1 flex items-center gap-1.5 text-xs font-black text-inflixo-navy">
                <Users className="h-3.5 w-3.5 text-red-500" />
                <span>{fetchedChannel.subscriber_count_text}</span>
              </div>

              {fetchedChannel.description && (
                <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
                  {fetchedChannel.description}
                </p>
              )}
            </div>
          </div>

          {/* Mandatory Confirmation Banner & CTA */}
          <div className="mt-3.5 pt-3 border-t border-red-100 flex flex-col gap-2">
            {!synced && (
              <p className="text-[11px] font-semibold text-red-700 text-center">
                👉 Click below to confirm &amp; add this YouTube channel to your live preview &amp; profile!
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition-all ${
                synced
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200"
                  : "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg animate-pulse hover:animate-none"
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
                  Confirm &amp; Link YouTube Channel
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
