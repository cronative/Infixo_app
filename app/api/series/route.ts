import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { requireCreator } from "@/lib/creatorAuth";
import { requireSession, ownsResource, getSessionFromRequest } from "@/lib/session";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { validateVideoUrl, validateUrlForSeriesPlatform } from "@/lib/videoUrl";
import { resolveThemeKey } from "@/lib/themeKeys";

// GET /api/series
// Identity comes from session cookie by default (or ?username= for public profiles)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const seriesId = searchParams.get("seriesId") || searchParams.get("id");

    // If email is explicitly provided, enforce ownership against session
    if (email) {
      const auth = requireSession(req);
      if (auth.error) return auth.error;
      if (!ownsResource(auth.session, email)) {
        return apiError("Forbidden: Cannot view another user's series", 403);
      }
    }

    // Specific single series lookup
    if (seriesId && seriesId.trim() !== "") {
      const [seriesRows]: any = await db.query("SELECT * FROM series WHERE id = ?", [seriesId]);
      if (!seriesRows || seriesRows.length === 0) {
        return apiError("Series not found", 404);
      }
      const s = seriesRows[0];
      const accessError = await authorizeCreatorRead(req, s.creator_id, true);
      if (accessError) return accessError;
      const [epRows]: any = await db.query(
        "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
        [s.id]
      );
      const [creatorRows]: any = await db.query("SELECT * FROM creators WHERE id = ?", [s.creator_id]);
      const creator = creatorRows[0] || null;

      let totalFanbase = 0;
      if (creator) {
        const [socRows]: any = await db.query(
          "SELECT SUM(follower_count) as total FROM social_accounts WHERE creator_id = ?",
          [creator.id]
        );
        totalFanbase = Number(socRows[0]?.total || 0);
      }

      const singleSeries = {
        id: s.id,
        title: s.title,
        posterDataUrl: s.poster_url,
        description: s.description,
        genre: s.genres || "",
        language: s.language || "Hindi",
        platform: s.platform || "YouTube",
        createdAt: s.created_at,
        creator: creator
          ? {
              displayName: creator.display_name,
              username: creator.username,
              photoDataUrl: creator.photo_url,
              themeKey: resolveThemeKey(creator.theme_key),
              totalFanbase,
            }
          : null,
        seasons: [
          {
            id: `sn_1_${s.id}`,
            title: "Season 1",
            seasonNumber: 1,
            episodes: epRows.map((ep: any) => ({
              id: ep.id,
              episodeNumber: ep.episode_number,
              title: ep.title,
              thumbnailDataUrl: null,
              platform: ep.platform,
              externalUrl: ep.external_url,
              description: "",
            })),
          },
        ],
      };
      return apiSuccess({ series: singleSeries }, "Series retrieved successfully");
    }

    let creatorId: string | null = null;
    let isPublicUsernameRead = false;

    if (username && username.trim() !== "") {
      const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
      const [creatorsByUsername]: any = await db.query(
        "SELECT id FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ?",
        [cleanUser, username, `@${cleanUser}`]
      );
      if (creatorsByUsername.length > 0) {
        creatorId = creatorsByUsername[0].id;
        isPublicUsernameRead = true;
      }
    }

    // Authenticated user session
    if (!creatorId) {
      const session = getSessionFromRequest(req);
      if (session?.creatorId) {
        creatorId = session.creatorId;
      } else if (session?.email) {
        const [creatorsByEmail]: any = await db.query("SELECT id FROM creators WHERE email = ?", [session.email]);
        if (creatorsByEmail.length > 0) {
          creatorId = creatorsByEmail[0].id;
        }
      }
    }

    if (!creatorId) {
      return apiError("Unauthorized — please log in", 401);
    }

    if (isPublicUsernameRead) {
      const accessError = await authorizeCreatorRead(req, creatorId, true);
      if (accessError) return accessError;
    }

    // Fetch subscription plan for limits & usage strip
    const [subRows]: any = await db.query(
      "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
      [creatorId]
    );
    const planKey = subRows[0]?.plan_key || "early_access";
    const quota = getPlanQuota(planKey);

    // Fetch series for creator
    const [seriesRows]: any = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creatorId]
    );

    let epRows: any[] = [];
    if (seriesRows.length > 0) {
      const seriesIds = seriesRows.map((s: any) => s.id);
      const [rows]: any = await db.query(
        "SELECT * FROM episodes WHERE series_id IN (?) ORDER BY episode_number ASC",
        [seriesIds]
      );
      epRows = rows || [];
    }

    // Group episodes by series_id
    const episodesBySeries = new Map<string, any[]>();
    epRows.forEach((ep: any) => {
      const list = episodesBySeries.get(ep.series_id) || [];
      list.push(ep);
      episodesBySeries.set(ep.series_id, list);
    });

    const seriesList = seriesRows.map((s: any) => {
      const eps = episodesBySeries.get(s.id) || [];
      return {
        id: s.id,
        title: s.title,
        posterDataUrl: s.poster_url,
        description: s.description,
        genre: s.genres || "",
        language: s.language || "Hindi",
        platform: s.platform || "YouTube",
        createdAt: s.created_at,
        seasons: [
          {
            id: `sn_1_${s.id}`,
            title: "Season 1",
            seasonNumber: 1,
            episodes: eps.map((ep: any) => ({
              id: ep.id,
              episodeNumber: ep.episode_number,
              title: ep.title,
              thumbnailDataUrl: null,
              platform: ep.platform,
              externalUrl: ep.external_url,
              description: "",
            })),
          },
        ],
      };
    });

    const totalEpisodesCount = epRows.length;

    // Public profile: series/episodes beyond the plan limit are hidden (kept in the dashboard).
    if (isPublicUsernameRead) {
      seriesList.splice(quota.maxSeries);
      for (const s of seriesList) s.seasons[0].episodes.splice(quota.maxEpisodesPerSeries);
    }

    // Return series plus plan limits and usage
    return apiSuccess(
      {
        series: seriesList,
        plan: quota.name,
        planKey,
        limits: {
          series: quota.maxSeries,
          episodesPerSeries: quota.maxEpisodesPerSeries,
        },
        used: {
          series: seriesList.length,
          episodes: totalEpisodesCount,
        },
      },
      "Series list retrieved successfully"
    );
  } catch (err: any) {
    console.error("❌ GET Series Error:", err);
    return apiError(err.message || "Failed to retrieve series", 500);
  }
}

// POST /api/series (Create Series with optional initial episodes)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const creatorId = auth.creator.id;
    const email = auth.creator.email;
    const { title, posterDataUrl, description, genre, language, platform, episodes } = body;

    const cleanTitle = (title || "").trim();
    if (!cleanTitle) {
      return apiError("Series Title is required", 400);
    }

    // Check plan limits
    const [subRows]: any = await db.query(
      "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
      [creatorId]
    );
    const activePlanKey = subRows[0]?.plan_key || "early_access";
    const quota = getPlanQuota(activePlanKey);

    const [totalSeriesRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM series WHERE creator_id = ?",
      [creatorId]
    );
    const currentSeriesCount = Number(totalSeriesRows[0]?.count || 0);

    if (currentSeriesCount >= quota.maxSeries) {
      return apiError(
        `Series limit reached (${quota.maxSeries} max) for ${quota.name} plan. Upgrade your plan to add more series.`,
        403,
        { code: "LIMIT_REACHED", isLimitReached: true, type: "series", limit: quota.maxSeries }
      );
    }

    const seriesId = `ser_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalPosterUrl =
      (await saveBase64ImageToStorage(posterDataUrl, "posters", "poster")) ||
      (posterDataUrl && !posterDataUrl.startsWith("data:") ? posterDataUrl : null);

    // Determine platform (YouTube, Instagram, Facebook, Mix)
    const seriesPlatform = (platform || "YouTube").trim();
    const validPlatforms = ["YouTube", "Instagram", "Facebook", "Mix"];
    if (!validPlatforms.includes(seriesPlatform)) {
      return apiError("Platform must be YouTube, Instagram, Facebook, or Mix", 400);
    }

    // Validate episodes if provided
    const validEpisodes: Array<{
      url: string;
      title: string;
      platform: string;
    }> = [];

    if (Array.isArray(episodes) && episodes.length > 0) {
      if (quota.maxEpisodesPerSeries !== Infinity && episodes.length > quota.maxEpisodesPerSeries) {
        return apiError(
          `Cannot add ${episodes.length} episodes: Limit is ${quota.maxEpisodesPerSeries} per series on ${quota.name} plan.`,
          403,
          { isLimitReached: true, type: "episode", limit: quota.maxEpisodesPerSeries }
        );
      }

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const rawUrl = ep.externalUrl || ep.url || "";
        const validation = validateUrlForSeriesPlatform(rawUrl, seriesPlatform);
        if (!validation.allowed) {
          return apiError(
            `Invalid link (#${i + 1}): ${validation.reason || "Not allowed for this platform."}`,
            400,
            { code: "INVALID_PLATFORM_URL", index: i }
          );
        }

        validEpisodes.push({
          url: validation.normalizedUrl,
          title: (ep.title || "").trim() || `Episode ${i + 1}`,
          platform: validation.detectedPlatform,
        });
      }
    }

    // Insert series into MySQL
    await db.query(
      `INSERT INTO series (id, creator_id, title, poster_url, description, platform, genres, language, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        seriesId,
        creatorId,
        cleanTitle,
        finalPosterUrl,
        description || "",
        seriesPlatform,
        genre || "",
        language || "Hindi",
      ]
    );

    // Insert episodes
    for (let i = 0; i < validEpisodes.length; i++) {
      const ep = validEpisodes[i];
      const epId = `ep_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      await db.query(
        `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [epId, seriesId, i + 1, ep.title, ep.url, ep.platform]
      );
    }

    if (email) {
      await recordOnboardingStep(email, "series", creatorId);
    }

    return apiSuccess({ seriesId }, "Series created successfully");
  } catch (err: any) {
    console.error("POST /api/series error:", err);
    return apiError(err.message || "Failed to create series", 500);
  }
}

// DELETE /api/series?id=... or ?episodeId=... (Legacy fallback)
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("id");
    const episodeId = searchParams.get("episodeId");

    if (episodeId) {
      await db.query(
        "DELETE e FROM episodes e INNER JOIN series s ON s.id = e.series_id WHERE e.id = ? AND s.creator_id = ?",
        [episodeId, auth.creator.id]
      );
      return apiSuccess({}, "Episode deleted successfully");
    }

    if (!seriesId) {
      return apiError("Series ID or Episode ID required", 400);
    }

    await db.query(
      "DELETE e FROM episodes e INNER JOIN series s ON s.id = e.series_id WHERE e.series_id = ? AND s.creator_id = ?",
      [seriesId, auth.creator.id]
    );
    await db.query("DELETE FROM series WHERE id = ? AND creator_id = ?", [seriesId, auth.creator.id]);
    return apiSuccess({}, "Series deleted successfully");
  } catch (err: any) {
    console.error("DELETE /api/series error:", err);
    return apiError(err.message || "Failed to delete", 500);
  }
}

// PUT /api/series (Legacy fallback with fixed ambiguous column aliases)
export async function PUT(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { episodeId, seriesId, episodeNumber, title, externalUrl, platform } = body;

    if (episodeId) {
      if (externalUrl) {
        const validation = validateVideoUrl(externalUrl);
        if (!validation.isValid) {
          return apiError(validation.error || "Invalid video link", 400);
        }
      }

      // Explicitly qualify column names with 'e.' to prevent ambiguous column 1052 error!
      await db.query(
        `UPDATE episodes e
         INNER JOIN series s ON s.id = e.series_id
         SET e.episode_number = COALESCE(?, e.episode_number),
             e.title = COALESCE(?, e.title),
             e.external_url = COALESCE(?, e.external_url),
             e.platform = COALESCE(?, e.platform)
         WHERE e.id = ? AND s.creator_id = ?`,
        [
          episodeNumber || null,
          title || null,
          externalUrl || null,
          platform || null,
          episodeId,
          auth.creator.id,
        ]
      );
      return apiSuccess({}, "Episode updated successfully");
    }

    if (seriesId) {
      await db.query(
        `UPDATE series
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             genres = COALESCE(?, genres),
             language = COALESCE(?, language),
             platform = COALESCE(?, platform)
         WHERE id = ? AND creator_id = ?`,
        [
          body.title || null,
          body.description || null,
          body.genre || body.genres || null,
          body.language || null,
          body.platform || null,
          seriesId,
          auth.creator.id,
        ]
      );
      return apiSuccess({}, "Series updated successfully");
    }

    return apiError("episodeId or seriesId required", 400);
  } catch (err: any) {
    console.error("PUT /api/series error:", err);
    return apiError(err.message || "Failed to update", 500);
  }
}
