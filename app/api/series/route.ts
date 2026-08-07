import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/series?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

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
      const [allCreators]: any = await db.query("SELECT id FROM creators ORDER BY updated_at DESC LIMIT 1");
      if (allCreators.length > 0) {
        creatorId = allCreators[0].id;
        console.log("⚠️ [GET /api/series] Matched active creatorId from DB fallback:", creatorId);
      }
    }

    if (!creatorId) {
      console.log("ℹ️ [GET /api/series] No creator found in DB, returning empty series list.");
      return NextResponse.json({ success: true, series: [] });
    }

    // Fetch series
    const [seriesRows]: any = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creatorId]
    );

    // Fetch episodes for all series
    const seriesList = await Promise.all(
      seriesRows.map(async (s: any) => {
        const [epRows]: any = await db.query(
          "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
          [s.id]
        );

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
      })
    );

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

    let { email, title, posterDataUrl, description, genre, language, episodes } = body;

    if (!title) {
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
      const [allCreators]: any = await db.query("SELECT id FROM creators ORDER BY updated_at DESC LIMIT 1");
      if (allCreators.length > 0) {
        creatorId = allCreators[0].id;
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
    const isEpisodeOnly = Boolean(body.isEpisodeOnly || body.title === "Update" || !title);

    if (!isEpisodeOnly) {
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
    try {
      await db.query(
        `INSERT INTO creator_onboarding_steps (email, creator_id, step_name, is_completed, completed_at)
         VALUES (?, ?, 'series', TRUE, NOW())
         ON DUPLICATE KEY UPDATE creator_id = VALUES(creator_id), step_name = 'series', is_completed = TRUE, completed_at = NOW()`,
        [email, creatorId]
      );
    } catch (e: any) {
      console.warn("⚠️ Could not record series step:", e.message);
    }

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
