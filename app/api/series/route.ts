import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

// GET /api/series?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const seriesId = searchParams.get("seriesId") || searchParams.get("id");

    if (seriesId && seriesId.trim() !== "") {
      const [seriesRows]: any = await db.query("SELECT * FROM series WHERE id = ?", [seriesId]);
      if (!seriesRows || seriesRows.length === 0) {
        return NextResponse.json({ success: false, error: "Series not found" }, { status: 404 });
      }
      const s = seriesRows[0];
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
      return NextResponse.json({ success: true, series: singleSeries });
    }

    console.log("📥 [GET /api/series] Received query for email/username:", { email, username });

    let creatorId: string | null = null;

    if (username && username.trim() !== "") {
      const [creatorsByUsername]: any = await db.query("SELECT id FROM creators WHERE username = ?", [username]);
      if (creatorsByUsername.length > 0) {
        creatorId = creatorsByUsername[0].id;
      }
    }

    if (!creatorId && email && email.trim() !== "") {
      const [creatorsByEmail]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
      if (creatorsByEmail.length > 0) {
        creatorId = creatorsByEmail[0].id;
      } else {
        const cleanUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
        const [creatorsByUsername]: any = await db.query("SELECT id FROM creators WHERE username = ?", [cleanUsername]);
        if (creatorsByUsername.length > 0) {
          creatorId = creatorsByUsername[0].id;
        }
      }
    }

    if (!creatorId) {
      console.log("ℹ️ [GET /api/series] No matching creator found for query, returning empty series list.");
      return NextResponse.json({ success: true, series: [] });
    }

    // Fetch series
    const [seriesRows]: any = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creatorId]
    );

    if (seriesRows.length === 0) {
      return NextResponse.json({ success: true, series: [] });
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
    return NextResponse.json({ success: true, series: seriesList });
  } catch (err: any) {
    console.error("❌ GET Series MySQL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/series (Create Series in MySQL)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 [POST /api/series] Request payload:", body);

    let { email, title, posterDataUrl, description, genre, language, episodes, isEpisodeOnly } = body;

    if (!isEpisodeOnly && !title) {
      console.error("❌ [POST /api/series] Missing series title!");
      return NextResponse.json({ error: "Series Title is required" }, { status: 400 });
    }

    if (!email || email.trim() === "") {
      const [anyCreator]: any = await db.query("SELECT email FROM creators ORDER BY updated_at DESC LIMIT 1");
      if (anyCreator.length > 0 && anyCreator[0].email) {
        email = anyCreator[0].email;
        console.log("⚠️ [POST /api/series] Used DB active email fallback:", email);
      } else {
        email = "creator@inflixo.com";
      }
    }

    let [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    let creatorId = creators[0]?.id;

    if (!creatorId) {
      const cleanUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
      const [byUsername]: any = await db.query("SELECT id FROM creators WHERE username = ?", [cleanUsername]);
      if (byUsername.length > 0) {
        creatorId = byUsername[0].id;
      }
    }


    if (!creatorId) {
      creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
      await db.query(
        `INSERT INTO creators (id, email, display_name, username) VALUES (?, ?, ?, ?)`,
        [creatorId, email, cleanUsername, cleanUsername]
      );
      console.log("✨ [POST /api/series] Created new creator in DB:", creatorId);
    }

    const seriesId = body.seriesId || `ser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isEpisodeOnlyFlag = Boolean(isEpisodeOnly || body.title === "Update" || !title);

    if (!isEpisodeOnlyFlag) {
      let finalPosterUrl = posterDataUrl || null;
      if (finalPosterUrl && typeof finalPosterUrl === "string" && finalPosterUrl.startsWith("data:image/")) {
        try {
          const matches = finalPosterUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
            const fileBuffer = Buffer.from(matches[2], "base64");
            const fs = require("fs");
            const path = require("path");
            const uploadsDir = path.join(process.cwd(), "public", "uploads", "posters");
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const fileName = `poster_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, fileBuffer);
            finalPosterUrl = `/uploads/posters/${fileName}`;
            console.log(`📸 [POST /api/series] Converted base64 poster to disk file: ${finalPosterUrl}`);
          }
        } catch (e: any) {
          console.error("Failed to convert base64 poster in API route:", e);
        }
      }

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
    if (episodes && Array.isArray(episodes)) {
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const epId = ep.id || `ep_${Date.now()}_${i}`;
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
            ep.platform || "YouTube",
          ]
        );
        console.log(`🎬 [POST /api/series] Saved Episode "${ep.title}" to Series ID: ${seriesId}`);
      }
    }

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "series", creatorId);

    return NextResponse.json({ success: true, message: "Series created in MySQL", seriesId });
  } catch (err: any) {
    console.error("POST Series MySQL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/series?id=... or /api/series?episodeId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("id");
    const episodeId = searchParams.get("episodeId");

    if (episodeId) {
      await db.query("DELETE FROM episodes WHERE id = ?", [episodeId]);
      return NextResponse.json({ success: true, message: "Episode deleted from MySQL" });
    }

    if (!seriesId) {
      return NextResponse.json({ error: "Series ID or Episode ID required" }, { status: 400 });
    }

    await db.query("DELETE FROM episodes WHERE series_id = ?", [seriesId]);
    await db.query("DELETE FROM series WHERE id = ?", [seriesId]);
    return NextResponse.json({ success: true, message: "Series deleted from MySQL" });
  } catch (err: any) {
    console.error("DELETE Series MySQL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/series (Update Single Episode or Series details in MySQL)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { episodeId, seriesId, episodeNumber, title, externalUrl, platform } = body;

    if (episodeId) {
      await db.query(
        `UPDATE episodes
         SET episode_number = ?, title = ?, external_url = ?, platform = ?
         WHERE id = ?`,
        [episodeNumber || 1, title || "Episode", externalUrl || "", platform || "YouTube", episodeId]
      );
      return NextResponse.json({ success: true, message: "Episode updated in MySQL" });
    }

    if (seriesId) {
      await db.query(
        `UPDATE series
         SET title = ?, description = ?, genres = ?, language = ?
         WHERE id = ?`,
        [body.title, body.description || "", body.genre || "", body.language || "Hindi", seriesId]
      );
      return NextResponse.json({ success: true, message: "Series updated in MySQL" });
    }

    return NextResponse.json({ error: "episodeId or seriesId required" }, { status: 400 });
  } catch (err: any) {
    console.error("PUT Series/Episode MySQL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
