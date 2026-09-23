import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCreatorSettingsTable } from "@/lib/settingsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";

// GET /api/creator/settings?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureCreatorSettingsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username parameter is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const creatorId = cRows[0].id;
    const accessError = await authorizeCreatorRead(req, creatorId, Boolean(username));
    if (accessError) return accessError;

    // Fetch settings from dedicated creator_settings table
    const [sRows]: any = await db.query(
      "SELECT visibility_settings FROM creator_settings WHERE creator_id = ?",
      [creatorId]
    );

    let visibilitySettings = null;
    if (sRows && sRows.length > 0 && sRows[0].visibility_settings) {
      try {
        visibilitySettings = typeof sRows[0].visibility_settings === "string"
          ? JSON.parse(sRows[0].visibility_settings)
          : sRows[0].visibility_settings;
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      creatorId,
      visibilitySettings,
    });
  } catch (err: any) {
    console.error("GET /api/creator/settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const visibilityJson = visibilitySettings ? JSON.stringify(visibilitySettings) : null;

    // Upsert into dedicated creator_settings table
    await db.query(
      `INSERT INTO creator_settings (creator_id, visibility_settings)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE 
         visibility_settings = VALUES(visibility_settings),
         updated_at = CURRENT_TIMESTAMP`,
      [creatorId, visibilityJson]
    );

    // Also update creators table column for backward compatibility
    try {
      await db.query("UPDATE creators SET visibility_settings = ? WHERE id = ?", [visibilityJson, creatorId]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Page visibility settings saved successfully to creator_settings table!",
      visibilitySettings,
    });
  } catch (err: any) {
    console.error("POST /api/creator/settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
