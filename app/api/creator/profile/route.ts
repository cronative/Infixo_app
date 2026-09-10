import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { ensureCreatorSettingsTable } from "@/lib/settingsDb";
import { saveBase64Image } from "@/lib/imageStorage";

// GET /api/creator/profile?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureCreatorSettingsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    let query = `
       SELECT c.*, s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status, cs.visibility_settings AS settings_visibility
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       LEFT JOIN creator_settings cs ON c.id = cs.creator_id
    `;
    const params: any[] = [];
    if (username) {
      const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
      query += ` WHERE LOWER(c.username) = ? OR c.username = ? OR LOWER(c.username) = ?`;
      params.push(cleanUser, username, `@${cleanUser}`);
    } else {
      query += ` WHERE LOWER(c.email) = LOWER(?)`;
      params.push(email?.trim());
    }

    const [rows]: any = await db.query(query, params);

    const creator = rows[0];
    if (!creator) {
      // If queried by email (e.g. during onboarding for a new user), return 200 OK with clean new profile and onboardingStep: "profile"
      if (email) {
        return NextResponse.json({
          success: true,
          isNewUser: true,
          onboardingStep: "profile",
          profile: {
            id: null,
            email: email.trim(),
            displayName: "",
            username: "",
            photoDataUrl: null,
            category: null,
            profession: null,
            bio: "",
            themeKey: "minimal-white",
            onboardingStep: "profile",
          },
        });
      }
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }



    const rawVis = creator.settings_visibility || creator.visibility_settings;
    let visibilitySettings = null;
    if (rawVis) {
      try {
        visibilitySettings = typeof rawVis === "string" 
          ? JSON.parse(rawVis) 
          : rawVis;
      } catch (e) {}
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
        visibilitySettings,
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
    await ensureCreatorSettingsTable();

    const body = await req.json();
    const { email, displayName, username, category, customCategory, profession, bio, photoDataUrl, city, state, country, themeKey, incrementThemeCount, visibilitySettings } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Ensure column types and capacities exist in MySQL table dynamically
    try { await db.query("ALTER TABLE creators MODIFY COLUMN category VARCHAR(500) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators MODIFY COLUMN profession VARCHAR(500) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators MODIFY COLUMN bio TEXT DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators MODIFY COLUMN photo_url TEXT DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators MODIFY COLUMN custom_category VARCHAR(500) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN profession VARCHAR(500) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN custom_category VARCHAR(500) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN city VARCHAR(100) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN state VARCHAR(100) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN country VARCHAR(100) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN theme_changes_count INT DEFAULT 0"); } catch {}
    try { await db.query("ALTER TABLE creators ADD COLUMN visibility_settings TEXT DEFAULT NULL"); } catch {}

    const cleanUsername = username ? username.trim().replace(/[^a-z0-9_]/gi, "").toLowerCase() : "";

    // Check if creator exists
    const [rows]: any = await db.query("SELECT id, username FROM creators WHERE email = ?", [email]);
    let creatorId = rows[0]?.id;
    const existingUsername = rows[0]?.username;

    const safeCategory = category ? String(category).substring(0, 490) : null;
    const safeCustomCategory = customCategory ? String(customCategory).substring(0, 490) : "";
    const safeProfession = profession ? String(profession).substring(0, 490) : null;
    const visibilityJson = visibilitySettings ? JSON.stringify(visibilitySettings) : null;
    const finalPhotoUrl = saveBase64Image(photoDataUrl, "avatars", "avatar") || (photoDataUrl && !photoDataUrl.startsWith("data:") ? photoDataUrl : null);

    // If only updating onboarding step (e.g. from setStep("profile") / setStep("finish")):
    const isStepOnlyUpdate = Boolean(
      body.onboardingStep &&
      !displayName &&
      !username &&
      !category &&
      !profession &&
      !bio &&
      !photoDataUrl &&
      !city &&
      !state &&
      !country
    );

    if (isStepOnlyUpdate) {
      if (creatorId) {
        await recordOnboardingStep(email, body.onboardingStep, creatorId);
      }
      return NextResponse.json({ success: true, onboardingStep: body.onboardingStep });
    }


    if (creatorId) {
      // If user typed a username, update it; otherwise preserve existing handle without default fallback
      const finalUsername = cleanUsername || existingUsername || "";

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
             theme_key = ?,
             visibility_settings = COALESCE(?, visibility_settings)
          WHERE id = ?`,
        [displayName || null, finalUsername, safeCategory, safeCustomCategory, safeProfession, bio, finalPhotoUrl, city, state, country, safeThemeKey, visibilityJson, creatorId]
      );

      if (incrementThemeCount) {
        await db.query("UPDATE creators SET theme_changes_count = theme_changes_count + 1 WHERE id = ?", [creatorId]);
      }
    } else {
      // Guard: ONLY insert a new creator if user provided a displayName or username
      if (!displayName?.trim() && !cleanUsername) {
        return NextResponse.json({
          success: true,
          message: "No creator created: Profile details not provided yet",
        });
      }

      // Insert new creator into MySQL with user provided fields
      creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeThemeKey = (!themeKey || themeKey === "modern-purple") ? "minimal-white" : themeKey;

      await db.query(
        `INSERT INTO creators (id, email, display_name, username, category, profession, bio, photo_url, city, state, country, theme_key, theme_changes_count, visibility_settings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          creatorId,
          email,
          displayName || "",
          cleanUsername || "",
          safeCategory,
          safeProfession,
          bio || "",
          finalPhotoUrl || null,
          city || null,
          state || null,
          country || null,
          safeThemeKey,
          visibilityJson,
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

    // Upsert into dedicated creator_settings table
    if (visibilityJson) {
      try {
        await db.query(
          `INSERT INTO creator_settings (creator_id, visibility_settings)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE 
             visibility_settings = VALUES(visibility_settings),
             updated_at = CURRENT_TIMESTAMP`,
          [creatorId, visibilityJson]
        );
      } catch (e) {
        console.warn("Could not upsert into creator_settings:", e);
      }
    }

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    const stepToRecord = body.onboardingStep || "profile";
    await recordOnboardingStep(email, stepToRecord, creatorId);

    // Re-fetch updated profile with LEFT JOIN on creator_settings
    const [updatedRows]: any = await db.query(
      `SELECT c.*, cs.visibility_settings AS settings_visibility 
       FROM creators c 
       LEFT JOIN creator_settings cs ON c.id = cs.creator_id 
       WHERE c.id = ?`,
      [creatorId]
    );
    const updated = updatedRows[0];

    const rawVis = updated.settings_visibility || updated.visibility_settings;
    let parsedVisibility = null;
    if (rawVis) {
      try {
        parsedVisibility = typeof rawVis === "string"
          ? JSON.parse(rawVis)
          : rawVis;
      } catch (e) {}
    }

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
        visibilitySettings: parsedVisibility,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err: any) {
    console.error("POST Creator Profile Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/profile?email=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [cRows]: any = await db.query("SELECT id FROM creators WHERE email = ?", [cleanEmail]);
    if (cRows && cRows.length > 0) {
      const creatorId = cRows[0].id;
      // Clean up child tables
      try { await db.query("DELETE FROM episodes WHERE series_id IN (SELECT id FROM series WHERE creator_id = ?)", [creatorId]); } catch {}
      try { await db.query("DELETE FROM series WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM social_accounts WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM subscriptions WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM creator_settings WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM custom_links WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM creator_reviews WHERE creator_id = ?", [creatorId]); } catch {}
      try { await db.query("DELETE FROM creators WHERE id = ?", [creatorId]); } catch {}
    }
    try { await db.query("DELETE FROM creator_onboarding_steps WHERE email = ?", [cleanEmail]); } catch {}
    try { await db.query("DELETE FROM otps WHERE email = ?", [cleanEmail]); } catch {}

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (err: any) {
    console.error("DELETE Creator Profile Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
