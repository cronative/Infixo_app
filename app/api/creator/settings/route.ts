import { db } from "@/lib/db";
import { ensureCreatorSettingsTable } from "@/lib/settingsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/creator/settings?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureCreatorSettingsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return apiError("Email or username parameter is required", 400);
    }

    // Resolve creator ID
    let creatorQuery = "SELECT id FROM creators WHERE ";
    let param = "";
    if (username) {
      creatorQuery += "username = ?";
      param = username;
    } else {
      creatorQuery += "email = ?";
      param = email!;
    }

    const [cRows]: any = await db.query(creatorQuery, [param]);
    if (!cRows || cRows.length === 0) {
      return apiError("Creator not found", 404);
    }

    const creatorId = cRows[0].id;
    const accessError = await authorizeCreatorRead(req, creatorId, Boolean(username));
    if (accessError) return accessError;

    // Fetch settings from dedicated creator_settings table
    const [sRows]: any = await db.query(
      "SELECT visibility_settings, public_profile_layout FROM creator_settings WHERE creator_id = ?",
      [creatorId]
    );

    let visibilitySettings = null;
    let publicProfileLayout = "default";
    if (sRows && sRows.length > 0) {
      if (sRows[0].visibility_settings) {
        try {
          visibilitySettings = typeof sRows[0].visibility_settings === "string"
            ? JSON.parse(sRows[0].visibility_settings)
            : sRows[0].visibility_settings;
        } catch (e) {}
      }
      if (sRows[0].public_profile_layout) {
        publicProfileLayout = sRows[0].public_profile_layout;
      }
    }

    const ALLOWED_LAYOUTS = ["default", "minimal", "creator", "spotlight", "studio"];
    if (!ALLOWED_LAYOUTS.includes(publicProfileLayout)) {
      publicProfileLayout = "default";
    }

    if (visibilitySettings && typeof visibilitySettings === "object") {
      visibilitySettings.publicProfileLayout = publicProfileLayout;
    }

    return apiSuccess({
      creatorId,
      publicProfileLayout,
      visibilitySettings,
    }, "Settings retrieved successfully");
  } catch (err: any) {
    console.error("GET /api/creator/settings error:", err);
    return apiError(err.message || "Failed to retrieve settings", 500);
  }
}

// POST /api/creator/settings — Upsert settings into dedicated creator_settings table
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    await ensureCreatorSettingsTable();

    const body = await req.json();
    const { visibilitySettings } = body;
    const creatorId = auth.creator.id;

    const ALLOWED_LAYOUTS = ["default", "minimal", "creator", "spotlight", "studio"];
    const layoutCandidate = body.publicProfileLayout || visibilitySettings?.publicProfileLayout;
    const safeLayout = ALLOWED_LAYOUTS.includes(layoutCandidate) ? layoutCandidate : "default";

    if (visibilitySettings && typeof visibilitySettings === "object") {
      visibilitySettings.publicProfileLayout = safeLayout;
    }

    const visibilityJson = visibilitySettings ? JSON.stringify(visibilitySettings) : null;

    // Upsert into dedicated creator_settings table
    await db.query(
      `INSERT INTO creator_settings (creator_id, visibility_settings, public_profile_layout)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         visibility_settings = VALUES(visibility_settings),
         public_profile_layout = VALUES(public_profile_layout),
         updated_at = CURRENT_TIMESTAMP`,
      [creatorId, visibilityJson, safeLayout]
    );

    // Also update creators table column for backward compatibility
    try {
      await db.query("UPDATE creators SET visibility_settings = ?, public_profile_layout = ? WHERE id = ?", [visibilityJson, safeLayout, creatorId]);
    } catch (e) {}

    return apiSuccess({
      publicProfileLayout: safeLayout,
      visibilitySettings,
    }, "Page visibility settings saved successfully to creator_settings table!");
  } catch (err: any) {
    console.error("POST /api/creator/settings error:", err);
    return apiError(err.message || "Failed to save settings", 500);
  }
}
