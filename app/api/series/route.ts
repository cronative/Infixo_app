import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { debugLog } from "@/lib/debugLogger";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { requireCreator } from "@/lib/creatorAuth";
import { requireSession, ownsResource } from "@/lib/session";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/series?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const seriesId = searchParams.get("seriesId") || searchParams.get("id");

    if (email) {
      const auth = requireSession(req);
      if (auth.error) return auth.error;
      if (!ownsResource(auth.session, email)) {
        return apiError("Forbidden", 403);
      }
    }

    if (seriesId && seriesId.trim() !== "") {
      const [seriesRows]: any = await db.query("SELECT * FROM series WHERE id = ?", [seriesId]);
      if (!seriesRows || seriesRows.length === 0) {
        return apiError("Series not found", 404);
      }
      const s = seriesRows[0];
      const accessError = await authorizeCreatorRead(req, s.creator_id, true);
      if (accessError) return accessError;
      const [epRows]: any = await db.query("SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC", [s.id]);
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
        createdAt: s.created_at,
        creator: creator ? {
          displayName: creator.display_name,
          username: creator.username,
          photoDataUrl: creator.photo_url,
          themeKey: creator.theme_key,
          totalFanbase,
        } : null,
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

    debugLog("API_SERIES", "Received query for email/username:", { email, username });

    let creatorId: string | null = null;

    if (username && username.trim() !== "") {
      const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
      const [creatorsByUsername]: any = await db.query(
        "SELECT id FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ?",
        [cleanUser, username, `@${cleanUser}`]
      );
      if (creatorsByUsername.length > 0) {
        creatorId = creatorsByUsername[0].id;
      }
    }

    if (!creatorId && email && email.trim() !== "") {
      const [creatorsByEmail]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
      if (creatorsByEmail.length > 0) {
        creatorId = creatorsByEmail[0].id;
      }
    }

    if (!creatorId) {
      return apiSuccess({ series: [] }, "No series found");
    }
    const accessError = await authorizeCreatorRead(req, creatorId, Boolean(username));
    if (accessError) return accessError;

    // Fetch series
    const [seriesRows]: any = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creatorId]
    );

    if (seriesRows.length === 0) {
      return apiSuccess({ series: [] }, "No series found");
    }

    const seriesIds = seriesRows.map((s: any) => s.id);
    const [epRows]: any = await db.query(
      "SELECT * FROM episodes WHERE series_id IN (?) ORDER BY episode_number ASC",
      [seriesIds]
    );

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

    console.log(`✅ [GET /api/series] Returning ${seriesList.length} series for creatorId ${creatorId}`);
    return apiSuccess({ series: seriesList }, "Series list retrieved successfully");
  } catch (err: any) {
    console.error("❌ GET Series MySQL Error:", err);
    return apiError(err.message || "Failed to retrieve series", 500);
  }
}

// POST /api/series (Create Series in MySQL)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    console.log("📥 [POST /api/series] Request payload:", body);

    const email = auth.creator.email;
    const { title, posterDataUrl, description, genre, language, episodes, isEpisodeOnly } = body;

    if (!isEpisodeOnly && !title) {
      console.error("❌ [POST /api/series] Missing series title!");
      return apiError("Series Title is required", 400);
    }

    const creatorId = auth.creator.id;

    const seriesId = body.seriesId || `ser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isEpisodeOnlyFlag = Boolean(isEpisodeOnly || body.title === "Update" || !title);

    // Fetch creator active plan to enforce server-side quota
    const [subRows]: any = await db.query(
      "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
      [creatorId]
    );
    const activePlanKey = subRows[0]?.plan_key || "early_access";
    const quota = getPlanQuota(activePlanKey);

    if (!isEpisodeOnlyFlag) {
      // Check if this is a new series creation (not an edit of existing series)
      const [existingSeries]: any = await db.query(
        "SELECT id FROM series WHERE id = ? AND creator_id = ?",
        [seriesId, creatorId]
      );
      if (!existingSeries || existingSeries.length === 0) {
        const [totalSeriesRows]: any = await db.query(
          "SELECT COUNT(*) as count FROM series WHERE creator_id = ?",
          [creatorId]
        );
        const currentSeriesCount = Number(totalSeriesRows[0]?.count || 0);
        if (currentSeriesCount >= quota.maxSeries) {
          return apiError(
            `Series limit reached (${quota.maxSeries} max) for ${quota.name} plan. Upgrade your plan to add more series.`,
            403,
            { isLimitReached: true, type: "series" }
          );
        }
      }

      const finalPosterUrl = await saveBase64ImageToStorage(posterDataUrl, "posters", "poster") || (posterDataUrl && !posterDataUrl.startsWith("data:") ? posterDataUrl : null);

      // Upsert Series into MySQL DB
      await db.query(
        `INSERT INTO series (id, creator_id, title, poster_url, description, genres, language)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           poster_url = COALESCE(VALUES(poster_url), poster_url),
           description = VALUES(description),
           genres = VALUES(genres),
           language = VALUES(language)`,
        [seriesId, creatorId, title, finalPosterUrl, description || "", genre || "", language || "Hindi"]
      );
      console.log(`💾 [POST /api/series] Saved Series "${title}" in MySQL DB for Creator: ${creatorId}`);
    }

    // Insert Episodes if provided
    if (episodes && Array.isArray(episodes) && episodes.length > 0) {
      if (quota.maxEpisodesPerSeries !== Infinity) {
        const [existingEps]: any = await db.query(
          "SELECT id FROM episodes WHERE series_id = ?",
          [seriesId]
        );
        const existingEpIds = new Set((existingEps || []).map((e: any) => e.id));
        const newEpisodesCount = episodes.filter((e: any) => !existingEpIds.has(e.id)).length;
        const projectedTotal = (existingEps?.length || 0) + newEpisodesCount;

        if (projectedTotal > quota.maxEpisodesPerSeries) {
          return apiError(
            `Episode limit reached (${quota.maxEpisodesPerSeries} max per series) for ${quota.name} plan. Upgrade your plan to add more episodes.`,
            403,
            { isLimitReached: true, type: "episode" }
          );
        }
      }

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const epId = ep.id || `ep_${Date.now()}_${i}`;
        const platformVal = (ep.platform || "YouTube").trim() || "YouTube";

        try {
          await db.query(
            `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               episode_number = VALUES(episode_number),
               title = VALUES(title),
               external_url = VALUES(external_url),
               platform = VALUES(platform)`,
            [
              epId,
              seriesId,
              ep.episodeNumber || i + 1,
              ep.title || `Episode ${i + 1}`,
              ep.externalUrl || "",
              platformVal,
            ]
          );
        } catch (insertErr: any) {
          if (insertErr?.code === "WARN_DATA_TRUNCATED" || insertErr?.errno === 1265) {
            try {
              await db.query("ALTER TABLE episodes MODIFY COLUMN platform VARCHAR(50) NOT NULL DEFAULT 'YouTube'");
              await db.query(
                `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   episode_number = VALUES(episode_number),
                   title = VALUES(title),
                   external_url = VALUES(external_url),
                   platform = VALUES(platform)`,
                [
                  epId,
                  seriesId,
                  ep.episodeNumber || i + 1,
                  ep.title || `Episode ${i + 1}`,
                  ep.externalUrl || "",
                  platformVal,
                ]
              );
            } catch {
              // Final safe fallback to 'YouTube' if legacy enum cannot be altered
              await db.query(
                `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   episode_number = VALUES(episode_number),
                   title = VALUES(title),
                   external_url = VALUES(external_url),
                   platform = VALUES(platform)`,
                [
                  epId,
                  seriesId,
                  ep.episodeNumber || i + 1,
                  ep.title || `Episode ${i + 1}`,
                  ep.externalUrl || "",
                  "YouTube",
                ]
              );
            }
          } else {
            throw insertErr;
          }
        }
        console.log(`🎬 [POST /api/series] Saved Episode "${ep.title}" to Series ID: ${seriesId}`);
      }
    }

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "series", creatorId);

    return apiSuccess({ seriesId }, "Series created in MySQL");
  } catch (err: any) {
    console.error("POST Series MySQL Error:", err);
    return apiError(err.message || "Failed to create series", 500);
  }
}

// DELETE /api/series?id=... or /api/series?episodeId=...
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
      return apiSuccess({}, "Episode deleted from MySQL");
    }

    if (!seriesId) {
      return apiError("Series ID or Episode ID required", 400);
    }

    await db.query(
      "DELETE e FROM episodes e INNER JOIN series s ON s.id = e.series_id WHERE e.series_id = ? AND s.creator_id = ?",
      [seriesId, auth.creator.id]
    );
    await db.query("DELETE FROM series WHERE id = ? AND creator_id = ?", [seriesId, auth.creator.id]);
    return apiSuccess({}, "Series deleted from MySQL");
  } catch (err: any) {
    console.error("DELETE Series MySQL Error:", err);
    return apiError(err.message || "Failed to delete series", 500);
  }
}

// PUT /api/series (Update Single Episode or Series details in MySQL)
export async function PUT(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { episodeId, seriesId, episodeNumber, title, externalUrl, platform } = body;

    if (episodeId) {
      await db.query(
        `UPDATE episodes e
         INNER JOIN series s ON s.id = e.series_id
         SET episode_number = ?, title = ?, external_url = ?, platform = ?
         WHERE e.id = ? AND s.creator_id = ?`,
        [episodeNumber || 1, title || "Episode", externalUrl || "", platform || "YouTube", episodeId, auth.creator.id]
      );
      return apiSuccess({}, "Episode updated in MySQL");
    }

    if (seriesId) {
      await db.query(
        `UPDATE series
         SET title = ?, description = ?, genres = ?, language = ?
         WHERE id = ? AND creator_id = ?`,
        [body.title, body.description || "", body.genre || "", body.language || "Hindi", seriesId, auth.creator.id]
      );
      return apiSuccess({}, "Series updated in MySQL");
    }

    return apiError("episodeId or seriesId required", 400);
  } catch (err: any) {
    console.error("PUT Series/Episode MySQL Error:", err);
    return apiError(err.message || "Failed to update series", 500);
  }
}
