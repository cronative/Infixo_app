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

    // 1. Rule: Trial plan cannot remove social accounts (403 REMOVE_NOT_ALLOWED_IN_TRIAL)
    const planKey = await getCreatorPlanKey(creatorId);
    if (planKey === "trial") {
      return apiError(
        "Removing social accounts is not available on Trial. Upgrade to a paid plan.",
        403,
        { code: "REMOVE_NOT_ALLOWED_IN_TRIAL" }
      );
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

    // 3. Rule: Primary account cannot be removed while extra accounts of that platform exist
    if (Boolean(targetAccount.is_primary)) {
      const [extras]: any = await db.query(
        "SELECT COUNT(*) as count FROM social_accounts WHERE creator_id = ? AND platform = ? AND id != ?",
        [creatorId, targetAccount.platform, accountId]
      );
      const extraCount = Number(extras?.[0]?.count || 0);
      if (extraCount > 0) {
        return apiError(
          "Primary account cannot be removed while other accounts exist on this platform. Remove secondary accounts first.",
          400,
          { code: "PRIMARY_HAS_SECONDARY_ACCOUNTS" }
        );
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

    return apiSuccess({ id: accountId }, "Social account removed successfully");
  } catch (err: any) {
    console.error("DELETE /api/creator/socials/:id Error:", err);
    return apiError(err.message || "Failed to remove social account", 500);
  }
}
