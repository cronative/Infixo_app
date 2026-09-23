import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { requireCreator } from "@/lib/creatorAuth";
import { requireSession, ownsResource } from "@/lib/session";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";

function normalizeCustomLinks(rows: any[]) {
  const parents: any[] = [];
  const childrenByParent = new Map<string, any[]>();

  for (const r of rows || []) {
    const row = {
      id: r.id,
      title: r.title,
      url: r.url || "",
      icon: r.icon || "link",
      isEnabled: Boolean(r.isEnabled),
      kind: r.linkType === "collection" ? "collection" : "link",
      parentId: r.parentId || null,
    };

    if (row.parentId) {
      const childList = childrenByParent.get(row.parentId) || [];
      childList.push({
        id: row.id,
        title: row.title,
        url: row.url,
        icon: row.icon,
        isEnabled: row.isEnabled,
      });
      childrenByParent.set(row.parentId, childList);
    } else {
      parents.push(row);
    }
  }

  return parents.map((link) => {
    if (link.kind !== "collection") {
      const { parentId, ...rest } = link;
      return rest;
    }
    const { parentId, ...rest } = link;
    return {
      ...rest,
      url: rest.url || "",
      items: childrenByParent.get(link.id) || [],
    };
  });
}

// GET /api/creator/socials?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (email) {
      const auth = requireSession(req);
      if (auth.error) return auth.error;
      if (!ownsResource(auth.session, email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    let creators: any = [];
    if (username) {
      const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
      [creators] = await db.query(
        "SELECT id, email FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ?",
        [cleanUser, username, `@${cleanUser}`]
      );
    } else {
      [creators] = await db.query("SELECT id, email FROM creators WHERE LOWER(email) = LOWER(?)", [email?.trim()]);
    }
    if (creators.length === 0) {
      return NextResponse.json({ success: true, socials: [], customLinks: [] });
    }

    const creatorId = creators[0].id;
    const accessError = await authorizeCreatorRead(req, creatorId, Boolean(username));
    if (accessError) return accessError;
    const targetEmail = email || creators[0].email || "";

    const [rows]: any = await db.query(
      "SELECT * FROM social_accounts WHERE creator_id = ?",
      [creatorId]
    );

    let customLinks: any[] = [];
    try {
      const [linkRows]: any = await db.query(
        `SELECT id, parent_id AS parentId, link_type AS linkType, title, url, icon, is_enabled AS isEnabled, sort_order AS sortOrder
         FROM creator_custom_links 
         WHERE creator_id = ? OR email = ?
         ORDER BY COALESCE(parent_id, id) ASC, parent_id IS NOT NULL ASC, sort_order ASC, created_at ASC`,
        [creatorId, targetEmail]
      );
      customLinks = normalizeCustomLinks(linkRows || []);
    } catch {}

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
      customLinks,
    });
  } catch (err: any) {
    console.error("GET Socials Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/socials (Upsert single platform social account)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { platform, accountName, username } = body;
    const email = auth.creator.email;

    if (!platform || !username) {
      return NextResponse.json({ error: "Platform and username required" }, { status: 400 });
    }
    const creatorId = auth.creator.id;

    await db.query(
      `INSERT INTO social_accounts (creator_id, platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         account_name = VALUES(account_name),
         username = VALUES(username),
         last_synced_at = last_synced_at`,
      [
        creatorId,
        platform,
        accountName || username,
        username,
        0,
        0,
        0,
        0,
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
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");

    if (!platform) {
      return NextResponse.json({ error: "Platform query param required" }, { status: 400 });
    }
    await db.query("DELETE FROM social_accounts WHERE creator_id = ? AND platform = ?", [auth.creator.id, platform]);

    return NextResponse.json({ success: true, message: `Removed ${platform} account from DB` });
  } catch (err: any) {
    console.error("DELETE Socials Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
