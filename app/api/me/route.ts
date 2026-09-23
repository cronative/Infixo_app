/**
 * GET /api/me
 *
 * Reads the session cookie and returns everything the dashboard / onboarding needs:
 * profile, subscription, socials, custom links, onboarding step.
 *
 * This is the single source of truth that replaces all localStorage reads on page load.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { email } = session;

    // 1. Fetch creator + subscription in one query
    const [creatorRows]: any = await db.query(
      `SELECT c.*,
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
      return NextResponse.json({
        authenticated: true,
        email,
        creatorId: session.creatorId,
        isNewUser: true,
        profile: null,
        subscription: null,
        socials: [],
        customLinks: [],
        onboardingStep: "username",
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

    const subscription = {
      planKey: c.plan_key || "early_access",
      planName: c.plan_name || "Free Trial",
      billingCycle: c.billing_cycle || "yearly",
      status: c.sub_status || "trial",
      activatedAt: c.activated_at || new Date().toISOString(),
      trialStartedAt: c.trial_started_at || null,
      trialEndsAt: c.trial_ends_at || null,
      currentPeriodStartedAt: c.current_period_started_at || null,
      currentPeriodEndsAt: c.current_period_ends_at || null,
      renewsAt: c.renews_at || null,
      endsAt: c.ends_at || null,
      cancelledAt: c.cancelled_at || null,
      cancelAtPeriodEnd: Boolean(c.cancel_at_period_end),
      paymentMode: c.payment_mode || "free_trial",
      autoRenew: Boolean(c.auto_renew),
      hasUsedTrial: Boolean(c.trial_started_at),
    };

    return NextResponse.json({
      authenticated: true,
      email,
      creatorId: c.id,
      isNewUser: false,
      profile,
      subscription,
      socials: socialRows || [],
      customLinks,
      onboardingStep,
    });
  } catch (error: any) {
    console.error("GET /api/me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
