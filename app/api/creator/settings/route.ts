import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCreatorSettingsTable } from "@/lib/settingsDb";

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
    await ensureCreatorSettingsTable();

    const body = await req.json();
    const { email, username, visibilitySettings } = body;

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    // Resolve creator ID from creators table
    let creatorQuery = "SELECT id FROM creators WHERE ";
    let param = "";
    if (email) {
      creatorQuery += "email = ?";
      param = email;
    } else {
      creatorQuery += "username = ?";
      param = username;
    }

    const [cRows]: any = await db.query(creatorQuery, [param]);
    let creatorId = cRows && cRows.length > 0 ? cRows[0].id : null;

    if (!creatorId) {
      // Fallback: If creator row does not exist yet, generate ID
      creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanUsername = (username || email.split("@")[0]).replace(/[^a-z0-9_]/gi, "").toLowerCase();
      await db.query(
        "INSERT INTO creators (id, email, display_name, username) VALUES (?, ?, ?, ?)",
        [creatorId, email || `${cleanUsername}@inflixo.com`, cleanUsername, cleanUsername]
      );
    }

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
