import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

// GET /api/creator/socials?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    let creators: any = [];
    if (username) {
      [creators] = await db.query("SELECT id FROM creators WHERE username = ?", [username]);
    } else {
      [creators] = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    }
    if (creators.length === 0) {
      return NextResponse.json({ socials: [] });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM social_accounts WHERE creator_id = ?",
      [creators[0].id]
    );

    return NextResponse.json({
      success: true,
      socials: rows.map((r: any) => ({
        id: r.id,
        platform: r.platform,
        accountName: r.account_name,
        username: r.username,
        followerCount: r.follower_count,
        mediaCount: r.media_count,
        audienceCount: r.audience_count,
        isVerified: Boolean(r.is_verified),
        lastSyncedAt: r.last_synced_at,
      })),
    });
  } catch (err: any) {
    console.error("GET Socials Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/socials (Upsert single platform social account)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, platform, accountName, username, followerCount, mediaCount, audienceCount, isVerified } = body;

    if (!email || !platform || !username) {
      return NextResponse.json({ error: "Email, platform, and username required" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const creatorId = creators[0].id;

    await db.query(
      `INSERT INTO social_accounts (creator_id, platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         account_name = VALUES(account_name),
         username = VALUES(username),
         follower_count = VALUES(follower_count),
         media_count = VALUES(media_count),
         audience_count = VALUES(audience_count),
         is_verified = VALUES(is_verified),
         last_synced_at = NOW()`,
      [
        creatorId,
        platform,
        accountName || username,
        username,
        followerCount || 0,
        mediaCount || 0,
        audienceCount || 0,
        isVerified ? 1 : 0,
      ]
    );

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "socials", creatorId);

    return NextResponse.json({ success: true, message: `Saved ${platform} account to MySQL` });
  } catch (err: any) {
    console.error("POST Socials Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/socials?email=...&platform=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const platform = searchParams.get("platform");

    if (!email || !platform) {
      return NextResponse.json({ error: "Email and platform query params required" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (creators.length > 0) {
      await db.query("DELETE FROM social_accounts WHERE creator_id = ? AND platform = ?", [creators[0].id, platform]);
    }

    return NextResponse.json({ success: true, message: `Removed ${platform} account from DB` });
  } catch (err: any) {
    console.error("DELETE Socials Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
