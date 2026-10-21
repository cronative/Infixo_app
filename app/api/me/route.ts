/**
 * GET /api/me
 *
 * Reads the session cookie and returns everything the dashboard / onboarding needs:
 * profile, subscription, socials, custom links, onboarding step.
 *
 * This is the single source of truth that replaces all localStorage reads on page load.
 */

import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return apiError("Unauthenticated session.", 401, { authenticated: false }, {
        headers: { "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate" },
      });
    }

    const { email } = session;

    // 1. Fetch creator + subscription in one query
    const [creatorRows]: any = await db.query(
      `SELECT c.*,
              s.id AS sub_id,
              s.plan_key, s.plan_name, s.billing_cycle,
              s.status AS sub_status,
              s.activated_at, s.trial_started_at, s.trial_ends_at,
              s.current_period_started_at, s.current_period_ends_at,
              s.renews_at, s.ends_at, s.cancelled_at,
              s.cancel_at_period_end, s.payment_mode, s.auto_renew
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       WHERE c.email = ?
       LIMIT 1`,
      [email]
    );

    if (!creatorRows || creatorRows.length === 0) {
      // New user — session is valid but profile not created yet
      return apiSuccess({
        authenticated: true,
        email,
        creatorId: session.creatorId,
        isNewUser: true,
        profile: null,
        subscription: null,
        socials: [],
        customLinks: [],
        onboardingStep: "username",
      }, "Session active (new creator).", {
        headers: { "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate" },
      });
    }

    const c = creatorRows[0];

    // 2. Fetch social accounts
    const [socialRows]: any = await db.query(
      `SELECT id, platform, account_name AS accountName, username,
              follower_count AS followerCount, media_count AS mediaCount,
              audience_count AS audienceCount, is_verified AS isVerified,
              last_synced_at AS lastSyncedAt
       FROM social_accounts WHERE creator_id = ?`,
      [c.id]
    );

    // 3. Fetch custom links
    let customLinks: any[] = [];
    try {
      const [linkRows]: any = await db.query(
        `SELECT id, parent_id AS parentId, link_type AS linkType,
                title, url, icon, is_enabled AS isEnabled, sort_order AS sortOrder
         FROM creator_custom_links
         WHERE creator_id = ? OR email = ?
         ORDER BY COALESCE(parent_id, id) ASC, parent_id IS NOT NULL ASC, sort_order ASC, created_at ASC`,
        [c.id, email]
      );
      customLinks = linkRows || [];
    } catch {}

    // 4. Fetch onboarding step
    let onboardingStep = "finish";
    try {
      const [stepRows]: any = await db.query(
        "SELECT step_name FROM creator_onboarding_steps WHERE email = ? ORDER BY id DESC LIMIT 1",
        [email]
      );
      if (stepRows?.[0]?.step_name) {
        onboardingStep = stepRows[0].step_name;
      }
    } catch {}

    // 5. Build visibility settings
    let visibilitySettings = null;
    try {
      const [settingsRows]: any = await db.query(
        "SELECT visibility_settings FROM creator_settings WHERE creator_id = ? LIMIT 1",
        [c.id]
      );
      if (settingsRows?.[0]?.visibility_settings) {
        visibilitySettings = JSON.parse(settingsRows[0].visibility_settings);
      }
    } catch {}

    const profile = {
      id: c.id,
      email: c.email,
      displayName: c.display_name || "",
      username: c.username || "",
      photoDataUrl: c.photo_url || null,
      category: c.category || null,
      customCategory: c.custom_category || "",
      profession: c.profession || "",
      bio: c.bio || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "",
      themeKey: (!c.theme_key || c.theme_key === "modern-purple") ? "minimal-white" : c.theme_key,
      themeChangesCount: c.theme_changes_count || 0,
      isVerified: Boolean(c.is_verified),
      visibilitySettings,
      updatedAt: c.updated_at,
    };

    const toIso = (value: unknown) => {
      if (!value) return null;
      const date = new Date(value as string | Date);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    const toMysqlDate = (value: unknown) => {
      if (!value) return null;
      const date = new Date(value as string | Date);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString().slice(0, 19).replace("T", " ");
    };

    const planKey = c.plan_key || "early_access";
    const planName = c.plan_name || (planKey === "early_access" ? "Free Trial" : "Starter");
    const billingCycle = c.billing_cycle || "monthly";
    const paymentMode = c.payment_mode || (planKey === "early_access" ? "free_trial" : "recurring");

    // Compute dates safely from existing subscription or creator creation date
    const activatedAt = toIso(c.activated_at) || toIso(c.created_at) || new Date().toISOString();
    const trialStartedAt = toIso(c.trial_started_at) || (planKey === "early_access" ? activatedAt : null);
    const trialEndsAt =
      toIso(c.trial_ends_at) ||
      (planKey === "early_access" && activatedAt
        ? new Date(new Date(activatedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null);
    const currentPeriodStartedAt = toIso(c.current_period_started_at) || activatedAt;
    const currentPeriodEndsAt = toIso(c.current_period_ends_at) || trialEndsAt;
    const endsAt = toIso(c.ends_at) || trialEndsAt;

    // Check expiration status
    let status = c.sub_status;
    const nowMs = Date.now();
    const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
    const isFreeTrial = planKey === "early_access" || planKey === "trial" || planKey === "free";

    if (!status || status === "trial") {
      if (isFreeTrial && trialEndMs && nowMs >= trialEndMs) {
        status = "expired";
      } else {
        status = status || "trial";
      }
    }

    // Auto-create missing subscription in MySQL
    if (!c.sub_id && c.id) {
      try {
        await db.query(
          `INSERT INTO subscriptions (
             creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
             trial_started_at, trial_ends_at, current_period_started_at,
             current_period_ends_at, ends_at, payment_mode, auto_renew
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE status = VALUES(status)`,
          [
            c.id,
            planKey,
            planName,
            billingCycle,
            status,
            toMysqlDate(activatedAt),
            toMysqlDate(trialStartedAt),
            toMysqlDate(trialEndsAt),
            toMysqlDate(currentPeriodStartedAt),
            toMysqlDate(currentPeriodEndsAt),
            toMysqlDate(endsAt),
            paymentMode,
          ]
        );
      } catch (err) {
        console.error("Auto-insert subscription failed in /api/me:", err);
      }
    } else if (c.sub_id && status === "expired" && c.sub_status === "trial") {
      // Sync expired status to DB
      try {
        await db.query(
          "UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE id = ?",
          [c.sub_id]
        );
      } catch (err) {
        console.error("Auto-update expired subscription failed in /api/me:", err);
      }
    }

    const subscription = {
      planKey,
      planName,
      billingCycle,
      status,
      activatedAt,
      trialStartedAt,
      trialEndsAt,
      currentPeriodStartedAt,
      currentPeriodEndsAt,
      renewsAt: toIso(c.renews_at),
      endsAt,
      cancelledAt: toIso(c.cancelled_at),
      cancelAtPeriodEnd: Boolean(c.cancel_at_period_end),
      paymentMode,
      autoRenew: Boolean(c.auto_renew),
      hasUsedTrial: Boolean(trialStartedAt || c.has_used_trial),
    };

    return apiSuccess({
      authenticated: true,
      email,
      creatorId: c.id,
      isNewUser: false,
      profile,
      subscription,
      socials: socialRows || [],
      customLinks,
      onboardingStep,
    }, "Session active.", {
      headers: { "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate" },
    });
  } catch (error: any) {
    console.error("GET /api/me error:", error);
    return apiError(error.message || "Failed to retrieve session", 500, {}, {
      headers: { "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate" },
    });
  }
}
