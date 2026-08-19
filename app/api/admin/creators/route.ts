import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let creators: any[] = [];
    try {
      const [rows]: any = await db.query(`
        SELECT 
          c.id,
          c.email,
          c.display_name AS displayName,
          c.username,
          c.photo_url AS photoDataUrl,
          c.category,
          c.custom_category AS customCategory,
          c.profession,
          c.bio,
          c.city,
          c.state,
          c.country,
          c.theme_key AS themeKey,
          c.theme_changes_count AS themeChangesCount,
          c.is_verified AS isVerified,
          c.created_at AS createdAt,
          c.updated_at AS updatedAt,
          s.plan_name AS planName,
          s.status AS planStatus
        FROM creators c
        LEFT JOIN subscriptions s ON c.id = s.creator_id
        ORDER BY c.id DESC
      `);
      creators = rows || [];
    } catch (dbErr) {
      console.warn("Admin creators DB fetch fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      creators,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
