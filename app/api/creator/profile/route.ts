import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

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
        customCategory: creator.custom_category || "",
        profession: creator.profession || "",
        bio: creator.bio,
        city: creator.city || "",
        state: creator.state || "",
        country: creator.country || "",
        themeKey: (!creator.theme_key || creator.theme_key === "modern-purple") ? "minimal-white" : creator.theme_key,
        themeChangesCount: Number(creator.theme_changes_count || 0),
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
    const { email, displayName, username, category, customCategory, profession, bio, photoDataUrl, city, state, country, themeKey, incrementThemeCount } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Ensure new columns exist in MySQL table dynamically
    try {
      await db.query("ALTER TABLE creators ADD COLUMN profession VARCHAR(100) DEFAULT NULL");
    } catch {}
    try {
      await db.query("ALTER TABLE creators ADD COLUMN custom_category VARCHAR(150) DEFAULT NULL");
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
    try {
      await db.query("ALTER TABLE creators ADD COLUMN theme_changes_count INT DEFAULT 0");
    } catch {}

    const cleanUsername = (username || email.split("@")[0]).replace(/[^a-z0-9_]/gi, "").toLowerCase();

    // Check if creator exists
    const [rows]: any = await db.query("SELECT id, username FROM creators WHERE email = ?", [email]);
    let creatorId = rows[0]?.id;
    const existingUsername = rows[0]?.username;

    if (creatorId) {
      // Username is permanently locked once created — do not overwrite existing handle
      const finalUsername = existingUsername || cleanUsername;

      const safeThemeKey = (!themeKey || themeKey === "modern-purple") ? "minimal-white" : themeKey;

      // Update existing creator in MySQL
      await db.query(
        `UPDATE creators 
         SET display_name = COALESCE(?, display_name),
             username = ?,
             category = COALESCE(?, category),
             custom_category = COALESCE(?, custom_category),
             profession = COALESCE(?, profession),
             bio = COALESCE(?, bio),
             photo_url = COALESCE(?, photo_url),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             country = COALESCE(?, country),
             theme_key = ?
          WHERE id = ?`,
        [displayName, finalUsername, category, customCategory, profession, bio, photoDataUrl, city, state, country, safeThemeKey, creatorId]
      );

      if (incrementThemeCount) {
        await db.query("UPDATE creators SET theme_changes_count = theme_changes_count + 1 WHERE id = ?", [creatorId]);
      }
    } else {
      // Insert new creator into MySQL
      creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeThemeKey = (!themeKey || themeKey === "modern-purple") ? "minimal-white" : themeKey;
      await db.query(
        `INSERT INTO creators (id, email, display_name, username, category, profession, bio, photo_url, city, state, country, theme_key, theme_changes_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
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
          safeThemeKey,
        ]
      );

      // Create default Early Access subscription record in MySQL DB
      await db.query(
        `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
         VALUES (?, 'early_access', 'Early Access', 'yearly', 'active', NOW())
         ON DUPLICATE KEY UPDATE plan_key = 'early_access', plan_name = 'Early Access', status = 'active'`,
        [creatorId]
      );
    }

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "profile", creatorId);

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
        themeChangesCount: Number(updated.theme_changes_count || 0),
        isVerified: Boolean(updated.is_verified),
        updatedAt: updated.updated_at,
      },
    });
  } catch (err: any) {
    console.error("POST Creator Profile Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
