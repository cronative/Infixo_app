import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { ensureCreatorSettingsTable } from "@/lib/settingsDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { requireSession, ownsResource } from "@/lib/session";
import { isCreatorPublic } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { isReservedUsername } from "@/lib/constants";

// GET /api/creator/profile?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureCreatorSettingsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (email) {
      const auth = requireSession(req);
      if (auth.error) return auth.error;
      if (!ownsResource(auth.session, email)) {
        return apiError("Forbidden", 403);
      }
    }

    if (!email && !username) {
      return apiError("Email or username query param required", 400);
    }

    let query = `
       SELECT c.*, s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status,
              s.activated_at AS sub_activated_at, s.created_at AS sub_created_at,
              s.trial_ends_at AS sub_trial_ends_at, s.ends_at AS sub_ends_at,
              s.current_period_ends_at AS sub_current_period_ends_at,
              cs.visibility_settings AS settings_visibility,
              cs.public_profile_layout AS settings_layout
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
        return apiSuccess({
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
        }, "New user profile initialized");
      }
      return apiError("Creator not found", 404);
    }

    if (username && !(await isCreatorPublic(creator.id))) {
      return apiError("Creator profile is private", 404);
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

    const ALLOWED_LAYOUTS = ["default", "minimal", "creator", "spotlight", "studio"];
    const layoutCandidate = creator.public_profile_layout || creator.settings_layout || visibilitySettings?.publicProfileLayout || "default";
    const publicProfileLayout = ALLOWED_LAYOUTS.includes(layoutCandidate) ? layoutCandidate : "default";

    if (visibilitySettings && typeof visibilitySettings === "object") {
      visibilitySettings.publicProfileLayout = publicProfileLayout;
    }

    return apiSuccess({
      profile: {
        id: creator.id,
        ...(username ? {} : { email: creator.email }),
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
        publicProfileLayout,
        visibilitySettings,
        updatedAt: creator.updated_at,
      },
      subscription: {
        planKey: creator.plan_key || "early_access",
        planName: creator.plan_name || "Free Trial",
        billingCycle: creator.billing_cycle || "yearly",
        status: creator.sub_status || "trial",
        activatedAt: creator.sub_activated_at || creator.sub_created_at || creator.created_at,
        trialEndsAt: creator.sub_trial_ends_at || null,
        endsAt: creator.sub_ends_at || null,
        currentPeriodEndsAt: creator.sub_current_period_ends_at || null,
      },
    }, "Profile retrieved successfully");
  } catch (err: any) {
    console.error("GET Creator Profile Error:", err);
    return apiError(err.message || "Failed to retrieve profile", 500);
  }
}

// POST /api/creator/profile
export async function POST(req: Request) {
  try {
    // ── Auth guard ──────────────────────────────────────────────────────────
    const { session, error: authError } = requireSession(req);
    if (authError) return authError;

    await ensureCreatorSettingsTable();

    const body = await req.json();
    const { displayName, username, category, customCategory, profession, bio, photoDataUrl, city, state, country, themeKey, incrementThemeCount, visibilitySettings } = body;
    const email = session.email;

    const cleanUsername = username ? username.trim().replace(/[^a-z0-9_]/gi, "").toLowerCase() : "";

    if (cleanUsername && isReservedUsername(cleanUsername)) {
      return apiError("This username is reserved for platform use", 400);
    }

    // Check if creator exists
    const [rows]: any = await db.query("SELECT id, username FROM creators WHERE email = ?", [email]);
    let creatorId = rows[0]?.id;
    const existingUsername = rows[0]?.username;

    const safeCategory = category ? String(category).substring(0, 490) : null;
    const safeCustomCategory = customCategory ? String(customCategory).substring(0, 490) : "";
    const safeProfession = profession ? String(profession).substring(0, 490) : null;
    const visibilityJson = visibilitySettings ? JSON.stringify(visibilitySettings) : null;
    const finalPhotoUrl = await saveBase64ImageToStorage(photoDataUrl, "avatars", "avatar") || (photoDataUrl && !photoDataUrl.startsWith("data:") ? photoDataUrl : null);

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
      return apiSuccess({ onboardingStep: body.onboardingStep }, "Onboarding step updated");
    }

    const ALLOWED_LAYOUTS = ["default", "minimal", "creator", "spotlight", "studio"];
    const layoutCandidate = body.publicProfileLayout || visibilitySettings?.publicProfileLayout;
    const safeLayout = ALLOWED_LAYOUTS.includes(layoutCandidate) ? layoutCandidate : null;

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
             public_profile_layout = COALESCE(?, public_profile_layout),
             visibility_settings = COALESCE(?, visibility_settings)
          WHERE id = ?`,
        [displayName || null, finalUsername, safeCategory, safeCustomCategory, safeProfession, bio, finalPhotoUrl, city, state, country, safeThemeKey, safeLayout, visibilityJson, creatorId]
      );

      if (incrementThemeCount) {
        await db.query("UPDATE creators SET theme_changes_count = theme_changes_count + 1 WHERE id = ?", [creatorId]);
      }
    } else {
      // Guard: ONLY insert a new creator if user provided a displayName or username
      if (!displayName?.trim() && !cleanUsername) {
        return apiSuccess({
          profile: null,
        }, "No creator created: Profile details not provided yet");
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

    }

    // Upsert into dedicated creator_settings table
    if (visibilityJson || safeLayout) {
      try {
        await db.query(
          `INSERT INTO creator_settings (creator_id, visibility_settings, public_profile_layout)
           VALUES (?, ?, COALESCE(?, 'default'))
           ON DUPLICATE KEY UPDATE 
             visibility_settings = COALESCE(VALUES(visibility_settings), visibility_settings),
             public_profile_layout = COALESCE(VALUES(public_profile_layout), public_profile_layout),
             updated_at = CURRENT_TIMESTAMP`,
          [creatorId, visibilityJson, safeLayout]
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
      `SELECT c.*, cs.visibility_settings AS settings_visibility, cs.public_profile_layout AS settings_layout 
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

    const publicProfileLayout = updated.settings_layout || updated.public_profile_layout || "default";
    if (parsedVisibility && typeof parsedVisibility === "object") {
      parsedVisibility.publicProfileLayout = publicProfileLayout;
    }

    return apiSuccess({
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
        publicProfileLayout,
        visibilitySettings: parsedVisibility,
        updatedAt: updated.updated_at,
      },
    }, "Profile saved successfully");
  } catch (err: any) {
    console.error("POST Creator Profile Error:", err);
    return apiError(err.message || "Failed to save profile", 500);
  }
}

// DELETE /api/creator/profile?email=...
export async function DELETE(req: Request) {
  try {
    const auth = requireSession(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const requestedEmail = searchParams.get("email");
    if (requestedEmail && !ownsResource(auth.session, requestedEmail)) {
      return apiError("Forbidden", 403);
    }
    const cleanEmail = auth.session.email;

    const [cRows]: any = await db.query("SELECT id FROM creators WHERE email = ?", [cleanEmail]);
    if (cRows && cRows.length > 0) {
      const creatorId = cRows[0].id;
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM episodes WHERE series_id IN (SELECT id FROM series WHERE creator_id = ?)", [creatorId]);
        await connection.query("DELETE FROM series WHERE creator_id = ?", [creatorId]);
        const creatorTables = [
          "social_accounts", "subscriptions", "creator_settings", "creator_custom_links",
          "creator_reviews", "creator_profile_sections", "creator_brands", "creator_collaborations",
          "creator_other_socials", "creator_setup_items", "team_members", "creator_teams",
          "collaboration_requests", "mediakit_gigs", "mediakit_settings", "analytics_events",
          "payment_checkout_intents",
        ];
        const [tableRows]: any = await connection.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
        );
        const existingTables = new Set(tableRows.map((row: any) => row.TABLE_NAME || row.table_name));
        for (const table of creatorTables.filter((name) => existingTables.has(name))) {
          await connection.query(`DELETE FROM \`${table}\` WHERE creator_id = ?`, [creatorId]);
        }
        for (const table of ["creator_onboarding_steps", "creator_login_logs", "otps"].filter((name) => existingTables.has(name))) {
          await connection.query(`DELETE FROM \`${table}\` WHERE email = ?`, [cleanEmail]);
        }
        await connection.query("DELETE FROM creators WHERE id = ?", [creatorId]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      const [tableRows]: any = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
      );
      const existingTables = new Set(tableRows.map((row: any) => row.TABLE_NAME || row.table_name));
      for (const table of ["creator_onboarding_steps", "creator_login_logs", "otps"].filter((name) => existingTables.has(name))) {
        await db.query(`DELETE FROM \`${table}\` WHERE email = ?`, [cleanEmail]);
      }
    }

    return apiSuccess({}, "Account deleted successfully");
  } catch (err: any) {
    console.error("DELETE Creator Profile Error:", err);
    return apiError(err.message || "Failed to delete account", 500);
  }
}
