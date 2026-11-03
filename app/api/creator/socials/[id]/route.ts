import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { getCreatorPlanKey } from "@/lib/planServer";
import { calculateTotalFanbase } from "@/lib/creatorEra";
import { syncCreatorPeakFanbase } from "@/lib/creatorEraDb";
import { ensureSocialAccountsColumns } from "@/lib/socialsDb";

// PATCH /api/creator/socials/:id (Toggle isHidden on Pro/VIP, or refresh Primary account count)
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const creatorId = auth.creator.id;

    const { id } = await props.params;
    const accountId = Number(id);
    if (!accountId || isNaN(accountId)) {
      return apiError("Invalid account id", 400);
    }

    await ensureSocialAccountsColumns();

    const [rows]: any = await db.query(
      "SELECT id, platform, username, is_primary, is_hidden FROM social_accounts WHERE id = ? AND creator_id = ?",
      [accountId, creatorId]
    );

    if (!rows || rows.length === 0) {
      return apiError("Social account not found", 404);
    }

    const targetAccount = rows[0];
    const body = await req.json().catch(() => ({}));

    // 1. Toggle visibility on profile (Pro/VIP only)
    if (typeof body.isHidden === "boolean") {
      const planKey = await getCreatorPlanKey(creatorId);
      if (planKey !== "pro" && planKey !== "vip") {
        return apiError(
          "Hiding accounts from your public profile is available on Pro and VIP plans.",
          403,
          { code: "HIDE_NOT_ALLOWED_ON_PLAN" }
        );
      }

      const nextHidden = body.isHidden ? 1 : 0;
      await db.query(
        "UPDATE social_accounts SET is_hidden = ? WHERE id = ? AND creator_id = ?",
        [nextHidden, accountId, creatorId]
      );

      return apiSuccess(
        { id: accountId, isHidden: Boolean(nextHidden) },
        body.isHidden ? "Account hidden from profile" : "Account visible on profile"
      );
    }

    // 2. Refresh follower count (Primary accounts only)
    if (body.followerCount !== undefined) {
      if (!Boolean(targetAccount.is_primary)) {
        return apiError("Follower counts are only tracked for primary accounts", 400);
      }

      const followerCount = Math.max(0, Number(body.followerCount) || 0);
      const mediaCount = Math.max(0, Number(body.mediaCount) || 0);
      const isVerified = Boolean(body.isVerified) ? 1 : 0;

      await db.query(
        `UPDATE social_accounts
         SET follower_count = ?, media_count = ?, audience_count = ?, is_verified = ?, last_synced_at = NOW()
         WHERE id = ? AND creator_id = ?`,
        [followerCount, mediaCount, followerCount, isVerified, accountId, creatorId]
      );

      try {
        const [allSocials]: any = await db.query(
          "SELECT platform, username, follower_count, audience_count, is_primary FROM social_accounts WHERE creator_id = ?",
          [creatorId]
        );
        const currentFanbase = calculateTotalFanbase(allSocials);
        await syncCreatorPeakFanbase(creatorId, currentFanbase);
      } catch (e) {
        console.error("Failed to sync peak fanbase after refresh:", e);
      }

      return apiSuccess(
        { id: accountId, followerCount, mediaCount, isVerified: Boolean(isVerified) },
        "Follower count updated"
      );
    }

    // 3. Make this account the platform's primary (counts toward Total Fans once refreshed)
    if (body.makePrimary === true) {
      if (Boolean(targetAccount.is_primary)) return apiSuccess({ id: accountId, isPrimary: true }, "Already primary");
      await db.query("UPDATE social_accounts SET is_primary = 0 WHERE creator_id = ? AND platform = ?", [creatorId, targetAccount.platform]);
      await db.query("UPDATE social_accounts SET is_primary = 1, sort_order = 0 WHERE id = ? AND creator_id = ?", [accountId, creatorId]);
      return apiSuccess({ id: accountId, isPrimary: true }, "Primary account updated");
    }

    // 4. Edit the handle of a secondary account (primary handles are re-linked via Add to fetch counts)
    if (typeof body.username === "string") {
      if (Boolean(targetAccount.is_primary)) {
        return apiError("To change your primary account, add the new account and make it primary.", 400);
      }
      const nextUsername = body.username.replace(/^@/, "").trim();
      if (!nextUsername || nextUsername.length > 100 || /\s/.test(nextUsername)) return apiError("Enter a valid username", 400);
      const [dupes]: any = await db.query(
        "SELECT id FROM social_accounts WHERE creator_id = ? AND platform = ? AND LOWER(username) = LOWER(?) AND id != ?",
        [creatorId, targetAccount.platform, nextUsername, accountId]
      );
      if (dupes && dupes.length > 0) return apiError("This account is already added.", 409);
      await db.query("UPDATE social_accounts SET username = ? WHERE id = ? AND creator_id = ?", [nextUsername, accountId, creatorId]);
      return apiSuccess({ id: accountId, username: nextUsername }, "Account updated");
    }

    return apiError("No valid update fields provided", 400);
  } catch (err: any) {
    console.error("PATCH /api/creator/socials/:id Error:", err);
    return apiError(err.message || "Failed to update social account", 500);
  }
}

// DELETE /api/creator/socials/:id
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const creatorId = auth.creator.id;

    const { id } = await props.params;
    const accountId = Number(id);
    if (!accountId || isNaN(accountId)) {
      return apiError("Invalid account id", 400);
    }

    await ensureSocialAccountsColumns();

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
    console.error("DELETE /api/creator/socials/:id Error:", err);
    return apiError(err.message || "Failed to remove social account", 500);
  }
}
