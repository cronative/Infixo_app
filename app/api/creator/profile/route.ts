import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/creator/profile?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    let query = `
       SELECT c.*, s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
    `;
    const params: any[] = [];
    if (username) {
      query += ` WHERE c.username = ?`;
      params.push(username);
    } else {
      query += ` WHERE c.email = ?`;
      params.push(email);
    }

    const [rows]: any = await db.query(query, params);

    const creator = rows[0];
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: creator.id,
        email: creator.email,
        displayName: creator.display_name,
        username: creator.username,
        photoDataUrl: creator.photo_url,
        category: creator.category,
        profession: creator.profession || "",
        bio: creator.bio,
        city: creator.city || "",
        state: creator.state || "",
        country: creator.country || "",
        themeKey: creator.theme_key,
        isVerified: Boolean(creator.is_verified),
        updatedAt: creator.updated_at,
      },
    });
  } catch (err: any) {
    console.error("GET Creator Profile Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/profile
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, displayName, username, category, profession, bio, photoDataUrl, city, state, country, themeKey } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Ensure new columns exist in MySQL table dynamically
    try {
      await db.query("ALTER TABLE creators ADD COLUMN profession VARCHAR(100) DEFAULT NULL");
    } catch {}
    try {
      await db.query("ALTER TABLE creators ADD COLUMN city VARCHAR(100) DEFAULT NULL");
    } catch {}
    try {
      await db.query("ALTER TABLE creators ADD COLUMN state VARCHAR(100) DEFAULT NULL");
    } catch {}
    try {
      await db.query("ALTER TABLE creators ADD COLUMN country VARCHAR(100) DEFAULT NULL");
    } catch {}

    const cleanUsername = (username || email.split("@")[0]).replace(/[^a-z0-9_]/gi, "").toLowerCase();

    // Check if creator exists
    const [rows]: any = await db.query("SELECT id, username FROM creators WHERE email = ?", [email]);
    let creatorId = rows[0]?.id;
    const existingUsername = rows[0]?.username;

    if (creatorId) {
      // Username is permanently locked once created — do not overwrite existing handle
      const finalUsername = existingUsername || cleanUsername;

      // Update existing creator in MySQL
      await db.query(
        `UPDATE creators 
         SET display_name = COALESCE(?, display_name),
             username = ?,
             category = COALESCE(?, category),
             profession = COALESCE(?, profession),
             bio = COALESCE(?, bio),
             photo_url = COALESCE(?, photo_url),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             country = COALESCE(?, country),
             theme_key = COALESCE(?, theme_key)
         WHERE id = ?`,
        [displayName, finalUsername, category, profession, bio, photoDataUrl, city, state, country, themeKey, creatorId]
      );
    } else {
      // Insert new creator into MySQL
      creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.query(
        `INSERT INTO creators (id, email, display_name, username, category, profession, bio, photo_url, city, state, country, theme_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creatorId,
          email,
          displayName || cleanUsername,
          cleanUsername,
          category || null,
          profession || null,
          bio || "",
          photoDataUrl || null,
          city || null,
          state || null,
          country || null,
          themeKey || "modern-purple",
        ]
      );

      // Create default trial subscription
      await db.query(
        `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, trial_ends_at)
         VALUES (?, 'pro', 'Pro Plan', 'yearly', 'trial', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [creatorId]
      );
    }

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    try {
      await db.query(
        `INSERT INTO creator_onboarding_steps (email, creator_id, step_name, is_completed, completed_at)
         VALUES (?, ?, 'profile', TRUE, NOW())
         ON DUPLICATE KEY UPDATE creator_id = VALUES(creator_id), step_name = 'profile', is_completed = TRUE, completed_at = NOW()`,
        [email, creatorId]
      );
    } catch (e: any) {
      console.warn("⚠️ Could not record profile step:", e.message);
    }

    // Re-fetch updated profile
    const [updatedRows]: any = await db.query("SELECT * FROM creators WHERE id = ?", [creatorId]);
    const updated = updatedRows[0];

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        email: updated.email,
        displayName: updated.display_name,
        username: updated.username,
        photoDataUrl: updated.photo_url,
        category: updated.category,
        profession: updated.profession || "",
        bio: updated.bio,
        city: updated.city || "",
        state: updated.state || "",
        country: updated.country || "",
        themeKey: updated.theme_key,
        isVerified: Boolean(updated.is_verified),
        updatedAt: updated.updated_at,
      },
    });
  } catch (err: any) {
    console.error("POST Creator Profile Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
