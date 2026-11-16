import { Globe } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  PinterestIcon,
  SnapchatIcon,
  SpotifyIcon,
  ThreadsIcon,
  TwitchIcon,
  XTwitterIcon,
  YoutubeIcon,
} from "@/components/shared/BrandIcons";

// ── Brand colours ─────────────────────────────────────────────

const IG_GRADIENT = "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)";
export const PLATFORM_BRAND: Record<string, { bg: string; bar: string; label: string; ink?: string }> = {
  instagram: { bg: IG_GRADIENT, bar: "linear-gradient(90deg, #FA7E1E 0%, #D62976 50%, #962FBF 100%)", label: "Instagram" },
  youtube: { bg: "#FF0000", bar: "#FF0000", label: "YouTube" },
  facebook: { bg: "#1877F2", bar: "#1877F2", label: "Facebook" },
  twitter: { bg: "#000000", bar: "#000000", label: "X" },
  linkedin: { bg: "#0A66C2", bar: "#0A66C2", label: "LinkedIn" },
  threads: { bg: "#000000", bar: "#000000", label: "Threads" },
  snapchat: { bg: "#FFFC00", bar: "#FFFC00", label: "Snapchat", ink: "#000000" },
  pinterest: { bg: "#E60023", bar: "#E60023", label: "Pinterest" },
  twitch: { bg: "#9146FF", bar: "#9146FF", label: "Twitch" },
  spotify: { bg: "#1DB954", bar: "#1DB954", label: "Spotify" },
};

function Glyph({ platform, size }: { platform: string; size: number }) {
  const p = { width: size, height: size };
  switch (platform) {
    case "instagram": return <InstagramIcon {...p} />;
    case "youtube": return <YoutubeIcon {...p} />;
    case "facebook": return <FacebookIcon {...p} />;
    case "twitter": return <XTwitterIcon {...p} />;
    case "linkedin": return <LinkedinIcon {...p} />;
    case "threads": return <ThreadsIcon {...p} />;
    case "snapchat": return <SnapchatIcon {...p} />;
    case "pinterest": return <PinterestIcon {...p} />;
    case "twitch": return <TwitchIcon {...p} />;
    case "spotify": return <SpotifyIcon {...p} />;
    default: return <Globe {...p} />;
  }
}

/** Brand-colour tile with a white glyph (IG gradient, YT red, FB blue…). */
export function BrandPlatformIcon({ platform, size = 32 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase();
  const brand = PLATFORM_BRAND[p];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[5px]"
      style={{ width: size, height: size, background: brand?.bg ?? "#71717A", color: brand?.ink ?? "#FFFFFF" }}
      aria-hidden
    >
      <Glyph platform={p} size={Math.round(size * 0.55)} />
    </span>
  );
}
