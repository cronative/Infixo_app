import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { calculateTotalFanbase } from "@/lib/creatorEra";
import { syncCreatorPeakFanbase } from "@/lib/creatorEraDb";
import { ensureSocialAccountsColumns } from "@/lib/socialsDb";
import { getCreatorPlanKey, limitReachedError } from "@/lib/planServer";
import { getPlan } from "@/config/plans";

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

// GET /api/creator/socials (identity from session, or public ?username=...)
export async function GET(req: Request) {
  try {
    await ensureSocialAccountsColumns();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    let creatorId: string | null = null;
    let targetEmail: string = "";

    if (username) {
      const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
      const [creators]: any = await db.query(
        "SELECT id, email FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ?",
        [cleanUser, username, `@${cleanUser}`]
      );
      if (!creators || creators.length === 0) {
        return apiSuccess({ socials: [], customLinks: [] }, "No socials found");
      }
      creatorId = String(creators[0].id);
      targetEmail = creators[0].email || "";

      const accessError = await authorizeCreatorRead(req, creatorId, true);
      if (accessError) return accessError;
    } else {
      const auth = await requireCreator(req);
      if (auth.error) return auth.error;
      creatorId = auth.creator.id;
      targetEmail = auth.creator.email || "";
    }

    const [rows]: any = await db.query(
      "SELECT * FROM social_accounts WHERE creator_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC",
      [creatorId]
    );

    const visibleRows = username
      ? (rows || []).filter((r: any) => !Boolean(r.is_hidden))
      : rows || [];

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

    return apiSuccess({
      socials: visibleRows.map((r: any) => ({
        id: r.id,
        platform: r.platform,
        accountName: r.username,
        username: r.username,
        followerCount: Boolean(r.is_primary) ? Number(r.follower_count) || 0 : 0,
        mediaCount: Boolean(r.is_primary) ? Number(r.media_count) || 0 : 0,
        audienceCount: Boolean(r.is_primary) ? Number(r.audience_count) || 0 : 0,
        isVerified: Boolean(r.is_verified),
        isPrimary: Boolean(r.is_primary),
        isHidden: Boolean(r.is_hidden),
        lastSyncedAt: r.last_synced_at,
      })),
      customLinks,
    }, "Social accounts retrieved successfully");
  } catch (err: any) {
    console.error("GET Socials Error:", err);
    return apiError(err.message || "Failed to retrieve socials", 500);
  }
}

// POST /api/creator/socials (Add/link social account; identity from session)
export async function POST(req: Request) {
  try {
    await ensureSocialAccountsColumns();
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const creatorId = auth.creator.id;
    const email = auth.creator.email;

    const body = await req.json();
    const { platform, accountName, username } = body;

    if (!platform || !username) {
      return apiError("Platform and username required", 400);
    }

    const cleanPlatform = String(platform).toLowerCase().trim();
    const cleanUsername = String(username).replace(/^@/, "").trim();

    if (!cleanUsername) {
      return apiError("Invalid username", 400);
    }

    // 1. Guard against duplicate username per platform for this creator (or refresh primary if requested)
    const [existingRows]: any = await db.query(
      "SELECT id, is_primary, is_hidden FROM social_accounts WHERE creator_id = ? AND platform = ? AND LOWER(username) = LOWER(?)",
      [creatorId, cleanPlatform, cleanUsername]
    );

    if (existingRows && existingRows.length > 0) {
      const existing = existingRows[0];
      if (body.isRefresh && Boolean(existing.is_primary)) {
        const rawFollowers =
          body.followerCount ??
          body.followers ??
          body.subscribers ??
          body.count ??
          0;
        const refreshedFollowers = Math.max(0, Number(rawFollowers) || 0);
        const rawMedia = body.mediaCount ?? body.posts ?? body.videos ?? 0;
        const refreshedMedia = Math.max(0, Number(rawMedia) || 0);
        const refreshedVerified = Boolean(body.isVerified) ? 1 : 0;

        await db.query(
          `UPDATE social_accounts
           SET follower_count = ?, media_count = ?, audience_count = ?, is_verified = ?, last_synced_at = NOW()
           WHERE id = ? AND creator_id = ?`,
          [refreshedFollowers, refreshedMedia, refreshedFollowers, refreshedVerified, existing.id, creatorId]
        );

        try {
          const [allSocials]: any = await db.query(
            "SELECT platform, username, account_name, follower_count, audience_count, is_primary FROM social_accounts WHERE creator_id = ?",
            [creatorId]
          );
          const currentFanbase = calculateTotalFanbase(allSocials);
          await syncCreatorPeakFanbase(creatorId, currentFanbase);
        } catch (e) {
          console.error("Failed to sync creator peak fanbase on refresh:", e);
        }

        return apiSuccess(
          {
            id: existing.id,
            creatorId,
            platform: cleanPlatform,
            accountName: cleanUsername,
            username: cleanUsername,
            followerCount: refreshedFollowers,
            mediaCount: refreshedMedia,
            audienceCount: refreshedFollowers,
            isVerified: Boolean(refreshedVerified),
            isPrimary: true,
            isHidden: Boolean(existing.is_hidden),
            lastSyncedAt: new Date().toISOString(),
          },
          `Updated @${cleanUsername} count`
        );
      }

      return apiError(
        `@${cleanUsername} is already linked on ${cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1)}`,
        409,
        { code: "DUPLICATE_SOCIAL_ACCOUNT" }
      );
    }

    // 2. Check existing count for this platform & plan limits
    const [countRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM social_accounts WHERE creator_id = ? AND platform = ?",
      [creatorId, cleanPlatform]
    );
    const platformAccountCount = Number(countRows?.[0]?.count || 0);

    const planKey = await getCreatorPlanKey(creatorId);
    const plan = getPlan(planKey);
    const limit = plan.limits.socialAccountsPerPlatform ?? 5;

    if (platformAccountCount >= limit) {
      return limitReachedError("socialAccountsPerPlatform", planKey);
    }

    // 3. First account on this platform is primary; extras are secondary (username only, no count)
    const isPrimary = platformAccountCount === 0;

    const rawFollowers =
      body.followerCount ??
      body.followers ??
      body.subscribers ??
      body.count ??
      0;
    const followerCount = isPrimary ? Math.max(0, Number(rawFollowers) || 0) : 0;

    const rawMedia =
      body.mediaCount ??
      body.posts ??
      body.videos ??
      0;
    const mediaCount = isPrimary ? Math.max(0, Number(rawMedia) || 0) : 0;

    const audienceCount = isPrimary
      ? body.audienceCount !== undefined
        ? Math.max(0, Number(body.audienceCount) || 0)
        : followerCount
      : 0;

    const isVerified = isPrimary && Boolean(body.isVerified) ? 1 : 0;
    const displayName = cleanUsername;

    // 4. Insert row
    const [insertResult]: any = await db.query(
      `INSERT INTO social_accounts (
         creator_id, platform, account_name, username,
         follower_count, media_count, audience_count,
         is_verified, is_primary, last_synced_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        creatorId,
        cleanPlatform,
        displayName,
        cleanUsername,
        followerCount,
        mediaCount,
        audienceCount,
        isVerified,
        isPrimary ? 1 : 0,
      ]
    );

    const insertedId = insertResult.insertId;

    // 5. Record onboarding step if primary
    if (email && isPrimary) {
      await recordOnboardingStep(email, "socials", creatorId).catch(() => {});
    }

    // 6. Sync Creator Peak Fanbase (only primary accounts counted)
    try {
      const [allSocials]: any = await db.query(
        "SELECT platform, username, account_name, follower_count, audience_count, is_primary FROM social_accounts WHERE creator_id = ?",
        [creatorId]
      );
      const currentFanbase = calculateTotalFanbase(allSocials);
      await syncCreatorPeakFanbase(creatorId, currentFanbase);
    } catch (e) {
      console.error("Failed to sync creator peak fanbase:", e);
    }

    // 7. Return the created row
    const createdRow = {
      id: insertedId,
      creatorId,
      platform: cleanPlatform,
      accountName: displayName,
      username: cleanUsername,
      followerCount,
      mediaCount,
      audienceCount,
      isVerified: Boolean(isVerified),
      isPrimary,
      lastSyncedAt: new Date().toISOString(),
    };

    return apiSuccess(createdRow, `Linked ${cleanPlatform} account @${cleanUsername}`);
  } catch (err: any) {
    console.error("POST Socials Error:", err);
    return apiError(err.message || "Failed to save social account", 500);
  }
}

// DELETE /api/creator/socials (Delete by ?id=... with trial & primary account guards)
export async function DELETE(req: Request) {
  try {
    await ensureSocialAccountsColumns();
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const creatorId = auth.creator.id;

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return apiError("Account id query param required", 400);
    }

    const accountId = Number(idParam);
    if (!accountId || isNaN(accountId)) {
      return apiError("Invalid account id", 400);
    }

    // 2. Fetch the target account
    const [rows]: any = await db.query(
      "SELECT id, platform, username, is_primary FROM social_accounts WHERE id = ? AND creator_id = ?",
      [accountId, creatorId]
    );

    if (!rows || rows.length === 0) {
      return apiError("Social account not found", 404);
    }

    const targetAccount = rows[0];
    let promotedAccount: { id: number; platform: string; username: string } | null = null;

    // 3. If the Primary account is deleted and secondaries exist, the oldest secondary becomes Primary
    if (Boolean(targetAccount.is_primary)) {
      const [oldestSecondary]: any = await db.query(
        "SELECT id, platform, username FROM social_accounts WHERE creator_id = ? AND platform = ? AND id != ? ORDER BY id ASC LIMIT 1",
        [creatorId, targetAccount.platform, accountId]
      );
      if (oldestSecondary && oldestSecondary.length > 0) {
        promotedAccount = oldestSecondary[0];
        await db.query("UPDATE social_accounts SET is_primary = 1 WHERE id = ?", [promotedAccount!.id]);
      }
    }

    // 4. Delete the account
    await db.query(
      "DELETE FROM social_accounts WHERE id = ? AND creator_id = ?",
      [accountId, creatorId]
    );

    // 5. Recalculate fanbase & sync peak
    try {
      const [remaining]: any = await db.query(
        "SELECT platform, username, follower_count, audience_count, is_primary FROM social_accounts WHERE creator_id = ?",
        [creatorId]
      );
      const currentFanbase = calculateTotalFanbase(remaining);
      await syncCreatorPeakFanbase(creatorId, currentFanbase);
    } catch (e) {
      console.error("Failed to sync peak fanbase after deletion:", e);
    }

    return apiSuccess({ id: accountId, promotedAccount }, "Social account removed successfully");
  } catch (err: any) {
    console.error("DELETE Socials Error:", err);
    return apiError(err.message || "Failed to remove social account", 500);
  }
}

// PATCH /api/creator/socials — reorder secondary accounts of one platform: { platform, order: number[] }
export async function PATCH(req: Request) {
  try {
    await ensureSocialAccountsColumns();
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const creatorId = auth.creator.id;
    const body = await req.json().catch(() => ({}));
    const platform = String(body.platform || "").toLowerCase().trim();
    const order: number[] = Array.isArray(body.order) ? body.order.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0) : [];
    if (!platform || order.length === 0) return apiError("platform and order required", 400);

    await Promise.all(
      order.map((id, index) =>
        db.query("UPDATE social_accounts SET sort_order = ? WHERE id = ? AND creator_id = ? AND platform = ?", [index + 1, id, creatorId, platform]),
      ),
    );
    return apiSuccess({ platform, order }, "Order saved");
  } catch (err: any) {
    console.error("PATCH /api/creator/socials Error:", err);
    return apiError(err.message || "Failed to reorder accounts", 500);
  }
}
