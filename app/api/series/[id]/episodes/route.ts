import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { validateVideoUrl } from "@/lib/videoUrl";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// POST /api/series/:id/episodes (Bulk add episodes)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { id: seriesId } = await context.params;
    if (!seriesId) {
      return apiError("Series ID is required", 400);
    }

    const creatorId = auth.creator.id;

    // Verify series ownership
    const [seriesRows]: any = await db.query(
      "SELECT id, platform FROM series WHERE id = ? AND creator_id = ?",
      [seriesId, creatorId]
    );

    if (!seriesRows || seriesRows.length === 0) {
      return apiError("Series not found or not owned by you", 404);
    }

    const body = await req.json();
    let rawItems: Array<{ url: string; title?: string }> = [];

    if (Array.isArray(body.urls)) {
      rawItems = body.urls
        .map((u: any) => (typeof u === "string" ? { url: u.trim() } : u))
        .filter((item: any) => item && item.url);
    } else if (Array.isArray(body.episodes)) {
      rawItems = body.episodes.map((ep: any) => ({
        url: ep.externalUrl || ep.url || "",
        title: ep.title || "",
      }));
    } else if (body.url) {
      rawItems = [{ url: String(body.url).trim(), title: body.title || "" }];
    }

    if (rawItems.length === 0) {
      return apiError("At least one video URL is required", 400);
    }

    const seriesPlatform = seriesRows[0]?.platform || "YouTube";

    // Validate each link against series platform
    const validatedEpisodes: Array<{
      url: string;
      title: string;
      platform: string;
    }> = [];

    const { validateUrlForSeriesPlatform } = await import("@/lib/videoUrl");

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const validation = validateUrlForSeriesPlatform(item.url, seriesPlatform);
      if (!validation.allowed) {
        return apiError(
          `Invalid link (#${i + 1}): ${validation.reason || "Not allowed for this series platform."}`,
          400,
          { code: "INVALID_PLATFORM_URL", index: i }
        );
      }

      validatedEpisodes.push({
        url: validation.normalizedUrl,
        title: (item.title || "").trim(),
        platform: validation.detectedPlatform,
      });
    }

    // Check plan quota limits
    const [subRows]: any = await db.query(
      "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
      [creatorId]
    );
    const activePlanKey = subRows[0]?.plan_key || "early_access";
    const quota = getPlanQuota(activePlanKey);

    const [existingEps]: any = await db.query(
      "SELECT id, episode_number FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
      [seriesId]
    );

    const currentCount = existingEps?.length || 0;
    if (quota.maxEpisodesPerSeries !== Infinity && currentCount + validatedEpisodes.length > quota.maxEpisodesPerSeries) {
      return apiError(
        `Episode limit reached (${quota.maxEpisodesPerSeries} max per series) for ${quota.name} plan. Upgrade your plan to add more episodes.`,
        403,
        { code: "LIMIT_REACHED", isLimitReached: true, type: "episode", limit: quota.maxEpisodesPerSeries }
      );
    }

    let nextEpisodeNumber = currentCount > 0
      ? Math.max(...existingEps.map((e: any) => Number(e.episode_number) || 0)) + 1
      : 1;

    const insertedEpisodes: any[] = [];

    for (const ep of validatedEpisodes) {
      let epTitle = ep.title;
      // Auto-fetch title if not provided
      if (!epTitle) {
        if (ep.platform === "YouTube") {
          try {
            const oembedRes = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(ep.url)}&format=json`
            );
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              if (oembedData.title) epTitle = oembedData.title;
            }
          } catch {}
        }
        if (!epTitle) {
          epTitle = `Episode ${nextEpisodeNumber}`;
        }
      }

      const epId = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.query(
        `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [epId, seriesId, nextEpisodeNumber, epTitle, ep.url, ep.platform]
      );

      insertedEpisodes.push({
        id: epId,
        episodeNumber: nextEpisodeNumber,
        title: epTitle,
        externalUrl: ep.url,
        platform: ep.platform,
      });

      nextEpisodeNumber++;
    }

    return apiSuccess(
      { episodes: insertedEpisodes },
      `Added ${insertedEpisodes.length} episode(s) successfully`
    );
  } catch (err: any) {
    console.error("POST /api/series/:id/episodes error:", err);
    return apiError(err.message || "Failed to add episodes", 500);
  }
}
