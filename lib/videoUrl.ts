/**
 * Video URL Validation, Normalization, and Platform Detection
 * 
 * Enforces strict video/post URLs (not homepages or profile links)
 * and strips tracking query parameters (utm_*, si=, feature=, igsh=, fbclid=, etc.)
 */

export type VideoPlatform = "YouTube" | "Instagram" | "Facebook" | "Other";

export interface VideoUrlValidationResult {
  isValid: boolean;
  platform: VideoPlatform;
  normalizedUrl: string;
  videoId?: string;
  error?: string;
}

/**
 * Strips tracking parameters and normalizes video URL.
 */
export function normalizeVideoUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);

    // List of tracking parameters to strip
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "si",
      "feature",
      "igsh",
      "fbclid",
      "ref",
      "ref_src",
      "ref_url",
      "share_id",
      "locale",
      "mibextid",
      "rdid",
    ];

    trackingParams.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Also strip generic utm_* params
    Array.from(url.searchParams.keys()).forEach((key) => {
      if (key.startsWith("utm_")) {
        url.searchParams.delete(key);
      }
    });

    // Normalize domain hosts
    const host = url.hostname.toLowerCase();
    if (host === "m.youtube.com" || host === "youtube.com") {
      url.hostname = "www.youtube.com";
    } else if (host === "m.facebook.com") {
      url.hostname = "www.facebook.com";
    } else if (host === "m.instagram.com") {
      url.hostname = "www.instagram.com";
    }

    url.hash = "";
    return url.href;
  } catch {
    return trimmed;
  }
}

/**
 * Validates that the link is an actual video / reel / post, not a homepage or channel.
 *
 * Rules:
 * - YouTube: watch?v=..., youtu.be/<id>, /shorts/<id>, /live/<id>
 * - Instagram: /reel/<id>, /p/<id>
 * - Facebook: /videos/<id>, /reel/<id>, fb.watch/<id>, /watch/?v=<id>
 */
export function validateVideoUrl(rawUrl: string): VideoUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return {
      isValid: false,
      platform: "Other",
      normalizedUrl: "",
      error: "Please enter a valid video link.",
    };
  }

  const normalized = normalizeVideoUrl(rawUrl);

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // 1. YouTube Validation
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      // youtu.be/<id>
      if (host.includes("youtu.be")) {
        const id = pathname.replace(/^\/+/, "").split("/")[0]?.split("?")[0];
        if (id && id.length >= 5) {
          return {
            isValid: true,
            platform: "YouTube",
            normalizedUrl: normalized,
            videoId: id,
          };
        }
      }

      // watch?v=<id>
      const v = url.searchParams.get("v");
      if (v && v.trim().length >= 5) {
        return {
          isValid: true,
          platform: "YouTube",
          normalizedUrl: normalized,
          videoId: v.trim(),
        };
      }

      // /shorts/<id>
      const shortsMatch = pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch && shortsMatch[1]) {
        return {
          isValid: true,
          platform: "YouTube",
          normalizedUrl: normalized,
          videoId: shortsMatch[1],
        };
      }

      // /live/<id>
      const liveMatch = pathname.match(/\/live\/([a-zA-Z0-9_-]+)/);
      if (liveMatch && liveMatch[1]) {
        return {
          isValid: true,
          platform: "YouTube",
          normalizedUrl: normalized,
          videoId: liveMatch[1],
        };
      }

      // If it's just youtube.com or youtube.com/@channel
      return {
        isValid: false,
        platform: "YouTube",
        normalizedUrl: normalized,
        error: "Enter a link to a specific YouTube video, Short or Live (e.g. watch?v=... or youtu.be/...).",
      };
    }

    // 2. Instagram Validation
    if (host.includes("instagram.com")) {
      // /reel/<id> or /reels/<id>
      const reelMatch = pathname.match(/\/reels?\/([a-zA-Z0-9_-]+)/);
      if (reelMatch && reelMatch[1]) {
        return {
          isValid: true,
          platform: "Instagram",
          normalizedUrl: normalized,
          videoId: reelMatch[1],
        };
      }

      // /p/<id>
      const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
      if (postMatch && postMatch[1]) {
        return {
          isValid: true,
          platform: "Instagram",
          normalizedUrl: normalized,
          videoId: postMatch[1],
        };
      }

      return {
        isValid: false,
        platform: "Instagram",
        normalizedUrl: normalized,
        error: "Enter a link to a specific Instagram Reel or Post (e.g. instagram.com/reel/...).",
      };
    }

    // 3. Facebook Validation
    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      // fb.watch/<id>
      if (host.includes("fb.watch")) {
        const id = pathname.replace(/^\/+/, "").split("/")[0];
        if (id) {
          return {
            isValid: true,
            platform: "Facebook",
            normalizedUrl: normalized,
            videoId: id,
          };
        }
      }

      // /reel/<id> or /reels/<id>
      const fbReelMatch = pathname.match(/\/reels?\/([a-zA-Z0-9_.-]+)/);
      if (fbReelMatch && fbReelMatch[1]) {
        return {
          isValid: true,
          platform: "Facebook",
          normalizedUrl: normalized,
          videoId: fbReelMatch[1],
        };
      }

      // /videos/<id>
      const fbVideoMatch = pathname.match(/\/videos\/([a-zA-Z0-9_.-]+)/);
      if (fbVideoMatch && fbVideoMatch[1]) {
        return {
          isValid: true,
          platform: "Facebook",
          normalizedUrl: normalized,
          videoId: fbVideoMatch[1],
        };
      }

      // /watch/?v=<id>
      const fbWatchV = url.searchParams.get("v");
      if (fbWatchV && fbWatchV.trim()) {
        return {
          isValid: true,
          platform: "Facebook",
          normalizedUrl: normalized,
          videoId: fbWatchV.trim(),
        };
      }

      return {
        isValid: false,
        platform: "Facebook",
        normalizedUrl: normalized,
        error: "Enter a link to a specific Facebook Video or Reel (e.g. fb.watch/... or facebook.com/reel/...).",
      };
    }

    // Other platforms
    return {
      isValid: true,
      platform: "Other",
      normalizedUrl: normalized,
    };
  } catch {
    return {
      isValid: false,
      platform: "Other",
      normalizedUrl: rawUrl,
      error: "Invalid URL format.",
    };
  }
}

/**
 * Extracts a thumbnail URL from video ID if known (e.g. YouTube).
 */
export function extractVideoThumbnail(url: string, platform?: string): string | null {
  const validation = validateVideoUrl(url);
  if (!validation.isValid) return null;

  if (validation.platform === "YouTube" && validation.videoId) {
    return `https://img.youtube.com/vi/${validation.videoId}/hqdefault.jpg`;
  }

  return null;
}

/**
 * Validates a video URL against a specific series platform (YouTube, Instagram, Facebook, Mix).
 */
export function validateUrlForSeriesPlatform(
  rawUrl: string,
  seriesPlatform: "YouTube" | "Instagram" | "Facebook" | "Mix" | string = "YouTube"
): {
  allowed: boolean;
  reason?: string;
  detectedPlatform: VideoPlatform;
  normalizedUrl: string;
} {
  const val = validateVideoUrl(rawUrl);
  if (!val.isValid) {
    return {
      allowed: false,
      reason: val.error || "Please enter a valid video link.",
      detectedPlatform: val.platform,
      normalizedUrl: val.normalizedUrl,
    };
  }

  const p = (seriesPlatform || "YouTube").trim();

  if (p === "YouTube") {
    if (val.platform !== "YouTube") {
      return {
        allowed: false,
        reason: "Only YouTube video links are allowed in a YouTube series.",
        detectedPlatform: val.platform,
        normalizedUrl: val.normalizedUrl,
      };
    }
  } else if (p === "Instagram") {
    if (val.platform !== "Instagram") {
      return {
        allowed: false,
        reason: "Only Instagram Reel / Post links are allowed in an Instagram series.",
        detectedPlatform: val.platform,
        normalizedUrl: val.normalizedUrl,
      };
    }
  } else if (p === "Facebook") {
    if (val.platform !== "Facebook") {
      return {
        allowed: false,
        reason: "Only Facebook Video / Reel links are allowed in a Facebook series.",
        detectedPlatform: val.platform,
        normalizedUrl: val.normalizedUrl,
      };
    }
  } else if (p === "Mix") {
    if (val.platform !== "YouTube" && val.platform !== "Instagram" && val.platform !== "Facebook") {
      return {
        allowed: false,
        reason: "Mix series only accepts YouTube, Instagram, and Facebook video links.",
        detectedPlatform: val.platform,
        normalizedUrl: val.normalizedUrl,
      };
    }
  }

  return {
    allowed: true,
    detectedPlatform: val.platform,
    normalizedUrl: val.normalizedUrl,
  };
}

/**
 * Checks whether an existing series with episodes can be switched to a new platform.
 */
export function canSwitchSeriesPlatform(
  episodes: Array<{ externalUrl?: string; platform?: string; url?: string }>,
  newPlatform: "YouTube" | "Instagram" | "Facebook" | "Mix" | string
): { canSwitch: boolean; reason?: string } {
  if (!episodes || episodes.length === 0) return { canSwitch: true };

  const targetPlatform = (newPlatform || "YouTube").trim();

  for (const ep of episodes) {
    const rawUrl = ep.externalUrl || ep.url || "";
    const check = validateUrlForSeriesPlatform(rawUrl, targetPlatform);
    if (!check.allowed) {
      if (targetPlatform === "YouTube") {
        return { canSwitch: false, reason: "Remove non-YouTube episodes first" };
      }
      if (targetPlatform === "Instagram") {
        return { canSwitch: false, reason: "Remove non-Instagram episodes first" };
      }
      if (targetPlatform === "Facebook") {
        return { canSwitch: false, reason: "Remove non-Facebook episodes first" };
      }
      return { canSwitch: false, reason: `Remove incompatible episodes before switching to ${targetPlatform}` };
    }
  }

  return { canSwitch: true };
}

/**
 * Creates a URL-friendly slug from series title.
 */
export function slugifySeriesTitle(title: string): string {
  if (!title) return "series";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with single hyphen
    .replace(/^-+|-+$/g, "") || "series";
}

