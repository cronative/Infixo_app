import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { getCreatorPlanKey } from "@/lib/planServer";
import { calculateTotalFanbase } from "@/lib/creatorEra";
import { syncCreatorPeakFanbase } from "@/lib/creatorEraDb";
import { ensureSocialAccountsColumns } from "@/lib/socialsDb";

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
