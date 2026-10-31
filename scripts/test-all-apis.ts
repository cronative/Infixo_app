/**
 * INFLIXO - COMPREHENSIVE END-TO-END API TEST SUITE
 * Tests all Dashboard, Public Profile, Onboarding, and Auth APIs (CRUD operations).
 */

import { db } from "../lib/db";
import { createSessionToken } from "../lib/session";

// Import all route handlers directly
import * as checkUsernameRoute from "../app/api/creator/check-username/route";
import * as creatorProfileRoute from "../app/api/creator/profile/route";
import * as creatorSocialsRoute from "../app/api/creator/socials/route";
import * as creatorSocialsIdRoute from "../app/api/creator/socials/[id]/route";
import * as creatorOtherSocialsRoute from "../app/api/creator/other-socials/route";
import * as seriesRoute from "../app/api/series/route";
import * as seriesIdRoute from "../app/api/series/[id]/route";
import * as seriesOrderRoute from "../app/api/series/order/route";
import * as episodesRoute from "../app/api/series/[id]/episodes/route";
import * as episodesIdRoute from "../app/api/episodes/[id]/route";
import * as episodesOrderRoute from "../app/api/series/[id]/episodes/order/route";
import * as subscriptionRoute from "../app/api/subscription/route";
import * as productsRoute from "../app/api/products/route";
import * as productsIdRoute from "../app/api/products/[id]/route";
import * as productsRestoreRoute from "../app/api/products/[id]/restore/route";
import * as linksRoute from "../app/api/links/route";
import * as linksIdRoute from "../app/api/links/[id]/route";
import * as linksOrderRoute from "../app/api/links/order/route";
import * as settingsRoute from "../app/api/creator/settings/route";
import * as sectionsRoute from "../app/api/creator/sections/route";
import * as setupRoute from "../app/api/creator/setup/route";
import * as mediakitRoute from "../app/api/creator/mediakit/route";
import * as brandsRoute from "../app/api/creator/brands/route";
import * as collabsRoute from "../app/api/creator/collaborations/route";
import * as reviewsRoute from "../app/api/creator/reviews/route";
import * as reviewTokenRoute from "../app/api/review/route";
import * as teamRoute from "../app/api/creator/team/route";
import * as summaryRoute from "../app/api/dashboard/summary/route";
import * as publicProfileRoute from "../app/api/public/profile/[username]/route";
import * as publicProductsRoute from "../app/api/public/products/route";
import * as submitCollabRoute from "../app/api/collaborations/submit/route";
import * as publicReportRoute from "../app/api/public/report/route";
import * as meRoute from "../app/api/me/route";
import * as logoutRoute from "../app/api/auth/logout/route";

const TEST_EMAIL = "audit_runner_test@inflixo.com";
const TEST_CREATOR_ID = "cr_audit_test_runner_888";
const TEST_USERNAME = "audit_runner_user";

// 1x1 transparent pixel in base64
const TINY_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

let authToken = "";

interface TestResult {
  name: string;
  category: string;
  method: string;
  endpoint: string;
  status: "PASSED" | "FAILED";
  httpCode?: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function makeReq(url: string, method: string, body?: any, withAuth = true): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-forwarded-for": `10.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
  };
  if (withAuth && authToken) {
    headers["Cookie"] = `inflixo_session=${authToken}`;
  }
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runTest(
  category: string,
  name: string,
  method: string,
  endpoint: string,
  fn: () => Promise<Response>
) {
  try {
    const res = await fn();
    let body: any = null;
    try {
      body = await res.json();
    } catch {}

    const isOk = res.status >= 200 && res.status < 300;
    if (isOk) {
      results.push({ category, name, method, endpoint, status: "PASSED", httpCode: res.status });
      console.log(`  ✅ [${category}] ${method} ${endpoint} - ${name} (${res.status})`);
      return body;
    } else {
      const err = body?.message || body?.error?.message || JSON.stringify(body) || res.statusText;
      results.push({ category, name, method, endpoint, status: "FAILED", httpCode: res.status, error: err });
      console.error(`  ❌ [${category}] ${method} ${endpoint} - ${name} (${res.status}): ${err}`);
      return body;
    }
  } catch (err: any) {
    results.push({ category, name, method, endpoint, status: "FAILED", error: err.message });
    console.error(`  ❌ [${category}] ${method} ${endpoint} - ${name} Exception: ${err.message}`);
    return null;
  }
}

async function cleanupDb() {
  try {
    await db.query("DELETE FROM creator_products WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_custom_links WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM episodes WHERE series_id IN (SELECT id FROM series WHERE creator_id = ?)", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM series WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM social_accounts WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM subscriptions WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_onboarding_steps WHERE email = ?", [TEST_EMAIL]);
    await db.query("DELETE FROM creator_settings WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_profile_sections WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_setup_items WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_brands WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_reviews WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM mediakit_gigs WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creator_teams WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM team_members WHERE creator_id = ?", [TEST_CREATOR_ID]);
    await db.query("DELETE FROM creators WHERE id = ? OR email = ?", [TEST_CREATOR_ID, TEST_EMAIL]);
  } catch (e: any) {
    console.warn("Cleanup warning:", e.message);
  }
}

async function setupTestUser() {
  await cleanupDb();
  await db.query(
    `INSERT INTO creators (id, email, display_name, username, theme_key, status)
     VALUES (?, ?, 'Audit Test User', ?, 'inflixo-maroon', 'active')`,
    [TEST_CREATOR_ID, TEST_EMAIL, TEST_USERNAME]
  );
  authToken = createSessionToken(TEST_EMAIL, TEST_CREATOR_ID);
}

async function main() {
  console.log("\n=======================================================");
  console.log("   INFLIXO COMPLETE API AUDIT & CRUD TEST SUITE");
  console.log("=======================================================\n");

  await setupTestUser();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ONBOARDING APIS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [1/8] Testing Onboarding APIs...");

  await runTest("Onboarding", "Check username availability", "GET", "/api/creator/check-username", async () => {
    const req = makeReq(`/api/creator/check-username?username=brand_new_unique_name&email=${TEST_EMAIL}`, "GET", undefined, false);
    return checkUsernameRoute.GET(req);
  });

  await runTest("Onboarding", "Save profile Step 1", "POST", "/api/creator/profile", async () => {
    const req = makeReq("/api/creator/profile", "POST", {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      displayName: "Audit Test User",
      category: "Technology, Vlogging",
      onboardingStep: "socials",
      acceptedLegalTerms: true,
    });
    return creatorProfileRoute.POST(req);
  });

  await runTest("Onboarding", "Save social Step 2", "POST", "/api/creator/socials", async () => {
    const req = makeReq("/api/creator/socials", "POST", {
      platform: "instagram",
      username: "audit_tester_ig",
    });
    return creatorSocialsRoute.POST(req);
  });

  let createdSeriesId = "";
  const seriesRes = await runTest("Onboarding", "Save first series Step 3", "POST", "/api/series", async () => {
    const req = makeReq("/api/series", "POST", {
      title: "My Audit Series",
      description: "Testing API series creation",
      genre: "Technology",
      language: "Hindi",
      platform: "YouTube",
      episodes: [
        { title: "Ep 1", externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", episodeNumber: 1 },
        { title: "Ep 2", externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", episodeNumber: 2 },
      ],
    });
    return seriesRoute.POST(req as any);
  });
  createdSeriesId = seriesRes?.data?.seriesId || seriesRes?.data?.series?.id || seriesRes?.data?.id || "";

  await runTest("Onboarding", "Activate Plan Step 4", "POST", "/api/subscription", async () => {
    const req = makeReq("/api/subscription", "POST", {
      action: "start_trial",
      planKey: "starter",
      billingCycle: "yearly",
      email: TEST_EMAIL,
    });
    return subscriptionRoute.POST(req as any);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DASHBOARD SERIES & EPISODES APIS (CRUD)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [2/8] Testing Dashboard Series & Episodes (CRUD)...");

  await runTest("Series", "List all series", "GET", "/api/series", async () => {
    const req = makeReq(`/api/series?email=${TEST_EMAIL}`, "GET");
    return seriesRoute.GET(req as any);
  });

  if (createdSeriesId) {
    await runTest("Series", "Fetch single series details", "GET", `/api/series/${createdSeriesId}`, async () => {
      const req = makeReq(`/api/series/${createdSeriesId}`, "GET");
      return seriesIdRoute.GET(req as any, { params: Promise.resolve({ id: createdSeriesId }) });
    });

    await runTest("Series", "Update series (PATCH)", "PATCH", `/api/series/${createdSeriesId}`, async () => {
      const req = makeReq(`/api/series/${createdSeriesId}`, "PATCH", {
        title: "Updated Audit Series Title",
        description: "Updated description for test series",
      });
      return seriesIdRoute.PATCH(req as any, { params: Promise.resolve({ id: createdSeriesId }) });
    });

    let newEpId = "";
    const epRes = await runTest("Episodes", "Add new episode to series", "POST", `/api/series/${createdSeriesId}/episodes`, async () => {
      const req = makeReq(`/api/series/${createdSeriesId}/episodes`, "POST", {
        title: "Ep 3 - Newly Added",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });
      return episodesRoute.POST(req as any, { params: Promise.resolve({ id: createdSeriesId }) });
    });
    newEpId = epRes?.data?.episodes?.[0]?.id || epRes?.data?.episode?.id || epRes?.data?.id || "";

    if (newEpId) {
      await runTest("Episodes", "Update episode (PATCH)", "PATCH", `/api/episodes/${newEpId}`, async () => {
        const req = makeReq(`/api/episodes/${newEpId}`, "PATCH", {
          title: "Ep 3 - Updated Title",
        });
        return episodesIdRoute.PATCH(req as any, { params: Promise.resolve({ id: newEpId }) });
      });

      await runTest("Episodes", "Reorder episodes", "POST", `/api/series/${createdSeriesId}/episodes/order`, async () => {
        const req = makeReq(`/api/series/${createdSeriesId}/episodes/order`, "POST", {
          episodeIds: [newEpId],
        });
        return episodesOrderRoute.POST(req as any, { params: Promise.resolve({ id: createdSeriesId }) });
      });

      await runTest("Episodes", "Delete episode (DELETE)", "DELETE", `/api/episodes/${newEpId}`, async () => {
        const req = makeReq(`/api/episodes/${newEpId}`, "DELETE");
        return episodesIdRoute.DELETE(req as any, { params: Promise.resolve({ id: newEpId }) });
      });
    }

    await runTest("Series", "Reorder series", "POST", "/api/series/order", async () => {
      const req = makeReq("/api/series/order", "POST", {
        seriesIds: [createdSeriesId],
      });
      return seriesOrderRoute.POST(req as any);
    });

    await runTest("Series", "Delete series (DELETE)", "DELETE", `/api/series/${createdSeriesId}`, async () => {
      const req = makeReq(`/api/series/${createdSeriesId}`, "DELETE");
      return seriesIdRoute.DELETE(req as any, { params: Promise.resolve({ id: createdSeriesId }) });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DASHBOARD PRODUCTS (SHOP) APIS (CRUD)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [3/8] Testing Dashboard Products (CRUD)...");

  let createdProductId = "";
  const prodRes = await runTest("Products", "Create product (POST)", "POST", "/api/products", async () => {
    const req = makeReq("/api/products", "POST", {
      name: "Audit Camera Lens 50mm",
      price: 4999,
      url: "https://amazon.in/test-lens",
      note: "Best prime lens for vlogging",
      isAffiliate: true,
      image: TINY_PNG_DATA_URL,
    });
    return productsRoute.POST(req);
  });
  createdProductId = prodRes?.id || prodRes?.data?.id || "";

  await runTest("Products", "List products (GET)", "GET", "/api/products", async () => {
    const req = makeReq("/api/products", "GET");
    return productsRoute.GET(req);
  });

  if (createdProductId) {
    await runTest("Products", "Update product (PATCH)", "PATCH", `/api/products/${createdProductId}`, async () => {
      const req = makeReq(`/api/products/${createdProductId}`, "PATCH", {
        name: "Audit Camera Lens 50mm f/1.8 Updated",
        price: 5499,
        url: "https://amazon.in/test-lens",
        note: "Updated note",
        isAffiliate: true,
        image: TINY_PNG_DATA_URL,
      });
      return productsIdRoute.PATCH(req, { params: Promise.resolve({ id: createdProductId }) });
    });

    await runTest("Products", "Delete product (DELETE)", "DELETE", `/api/products/${createdProductId}`, async () => {
      const req = makeReq(`/api/products/${createdProductId}`, "DELETE");
      return productsIdRoute.DELETE(req, { params: Promise.resolve({ id: createdProductId }) });
    });

    await runTest("Products", "Restore product (POST restore)", "POST", `/api/products/${createdProductId}/restore`, async () => {
      const req = makeReq(`/api/products/${createdProductId}/restore`, "POST");
      return productsRestoreRoute.POST(req, { params: Promise.resolve({ id: createdProductId }) });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. DASHBOARD CUSTOM LINKS APIS (CRUD)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [4/8] Testing Dashboard Custom Links (CRUD)...");

  let createdLinkId = "";
  const linkRes = await runTest("Links", "Create custom link (POST)", "POST", "/api/links", async () => {
    const req = makeReq("/api/links", "POST", {
      kind: "link",
      title: "My Portfolio Website",
      url: "https://example.com/portfolio",
      pinned: true,
    });
    return linksRoute.POST(req);
  });
  createdLinkId = linkRes?.id || linkRes?.data?.id || "";

  await runTest("Links", "List custom links (GET)", "GET", "/api/links", async () => {
    const req = makeReq("/api/links", "GET");
    return linksRoute.GET(req);
  });

  if (createdLinkId) {
    await runTest("Links", "Update custom link (PATCH)", "PATCH", `/api/links/${createdLinkId}`, async () => {
      const req = makeReq(`/api/links/${createdLinkId}`, "PATCH", {
        kind: "link",
        title: "My Updated Portfolio",
        url: "https://example.com/portfolio-v2",
        pinned: false,
      });
      return linksIdRoute.PATCH(req, { params: Promise.resolve({ id: createdLinkId }) });
    });

    await runTest("Links", "Reorder custom links", "PUT", "/api/links/order", async () => {
      const req = makeReq("/api/links/order", "PUT", {
        ids: [createdLinkId],
      });
      return linksOrderRoute.PUT(req);
    });

    await runTest("Links", "Delete custom link (DELETE)", "DELETE", `/api/links/${createdLinkId}`, async () => {
      const req = makeReq(`/api/links/${createdLinkId}`, "DELETE");
      return linksIdRoute.DELETE(req, { params: Promise.resolve({ id: createdLinkId }) });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DASHBOARD SOCIALS APIS (CRUD)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [5/8] Testing Dashboard Socials (CRUD)...");

  // Upgrade test user plan to 'starter' to allow social modifications
  await db.query("UPDATE subscriptions SET plan_key = 'starter', status = 'active' WHERE creator_id = ?", [TEST_CREATOR_ID]);

  let secondarySocialId = 0;
  const socRes = await runTest("Socials", "Add secondary YouTube social (POST)", "POST", "/api/creator/socials", async () => {
    const req = makeReq("/api/creator/socials", "POST", {
      platform: "youtube",
      username: "audit_tester_secondary_yt",
    });
    return creatorSocialsRoute.POST(req);
  });
  secondarySocialId = socRes?.data?.id || socRes?.id || 0;

  await runTest("Socials", "List socials (GET)", "GET", "/api/creator/socials", async () => {
    const req = makeReq("/api/creator/socials", "GET");
    return creatorSocialsRoute.GET(req);
  });

  await runTest("Socials", "Get other socials (GET)", "GET", "/api/creator/other-socials", async () => {
    const req = makeReq("/api/creator/other-socials", "GET");
    return creatorOtherSocialsRoute.GET(req);
  });

  if (secondarySocialId) {
    await runTest("Socials", "Delete secondary social (DELETE)", "DELETE", `/api/creator/socials/${secondarySocialId}`, async () => {
      const req = makeReq(`/api/creator/socials/${secondarySocialId}`, "DELETE");
      return creatorSocialsIdRoute.DELETE(req, { params: Promise.resolve({ id: String(secondarySocialId) }) });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. DASHBOARD SETTINGS, SECTIONS, MEDIAKIT, SETUP, BRANDS, REVIEWS, TEAM
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [6/8] Testing Dashboard Extras (Settings, Setup, MediaKit, Team)...");

  await runTest("Settings", "Get creator settings", "GET", "/api/creator/settings", async () => {
    const req = makeReq("/api/creator/settings", "GET");
    return settingsRoute.GET(req);
  });

  await runTest("Settings", "Update creator settings", "PUT", "/api/creator/settings", async () => {
    const req = makeReq("/api/creator/settings", "PUT", {
      visibilitySettings: { showFanbase: true, showSeries: true },
      publicProfileLayout: "default",
    });
    return settingsRoute.PUT(req);
  });

  await runTest("Sections", "Get creator sections", "GET", "/api/creator/sections", async () => {
    const req = makeReq("/api/creator/sections", "GET");
    return sectionsRoute.GET(req);
  });

  await runTest("Sections", "Update creator sections", "PUT", "/api/creator/sections", async () => {
    const req = makeReq("/api/creator/sections", "PUT", {
      sections: [{ sectionKey: "series", isVisible: true }],
    });
    return sectionsRoute.PUT(req);
  });

  await runTest("Setup", "Save creator setup (POST)", "POST", "/api/creator/setup", async () => {
    const req = makeReq("/api/creator/setup", "POST", {
      category: "Camera",
      name: "Sony A7 IV",
      brand: "Sony",
      usedFor: "Main Vlog Camera",
    });
    return setupRoute.POST(req);
  });

  await runTest("Setup", "Get creator setup (GET)", "GET", "/api/creator/setup", async () => {
    const req = makeReq("/api/creator/setup", "GET");
    return setupRoute.GET(req);
  });

  await runTest("MediaKit", "Save MediaKit (POST)", "POST", "/api/creator/mediakit", async () => {
    const req = makeReq("/api/creator/mediakit", "POST", {
      bio: "Top tech creator media kit",
      minBudget: "₹25,000",
      packages: [{ title: "Dedicated Video", price: "₹50,000", turnaroundDays: 3 }],
    });
    return mediakitRoute.POST(req);
  });

  await runTest("MediaKit", "Get MediaKit (GET)", "GET", "/api/creator/mediakit", async () => {
    const req = makeReq("/api/creator/mediakit", "GET");
    return mediakitRoute.GET(req);
  });

  await runTest("Brands", "Save brand collabs (POST)", "POST", "/api/creator/brands", async () => {
    const req = makeReq("/api/creator/brands", "POST", {
      brandName: "TechCorp",
      websiteUrl: "https://example.com",
    });
    return brandsRoute.POST(req);
  });

  await runTest("Brands", "Get brand collabs (GET)", "GET", "/api/creator/brands", async () => {
    const req = makeReq("/api/creator/brands", "GET");
    return brandsRoute.GET(req);
  });

  await runTest("Collaborations", "Get creator collaborations (GET)", "GET", "/api/creator/collaborations", async () => {
    const req = makeReq("/api/creator/collaborations", "GET");
    return collabsRoute.GET(req);
  });

  let reviewInvitationToken = "";
  const inviteRes = await runTest("Reviews", "Invite client review (POST)", "POST", "/api/creator/reviews", async () => {
    const req = makeReq("/api/creator/reviews", "POST", {
      clientName: "Brand Client",
      clientEmail: "client@brand.com",
      clientDesignation: "Marketing VP",
      projectTitle: "Summer Campaign Collab",
    });
    return reviewsRoute.POST(req);
  });
  reviewInvitationToken = inviteRes?.data?.review?.token || inviteRes?.data?.token || inviteRes?.token || "";

  await runTest("Reviews", "Get creator reviews (GET)", "GET", "/api/creator/reviews", async () => {
    const req = makeReq("/api/creator/reviews", "GET");
    return reviewsRoute.GET(req);
  });

  await runTest("Team", "Get creator team (GET)", "GET", "/api/creator/team", async () => {
    const req = makeReq(`/api/creator/team?creatorId=${TEST_CREATOR_ID}`, "GET");
    return teamRoute.GET(req);
  });

  await runTest("Summary", "Get dashboard summary (GET)", "GET", "/api/dashboard/summary", async () => {
    const req = makeReq("/api/dashboard/summary", "GET");
    return summaryRoute.GET(req);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PUBLIC PROFILE APIS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [7/8] Testing Public Profile APIs...");

  await runTest("Public", "Fetch public profile by username", "GET", `/api/public/profile/${TEST_USERNAME}`, async () => {
    const req = makeReq(`/api/public/profile/${TEST_USERNAME}`, "GET", undefined, false);
    return publicProfileRoute.GET(req, { params: Promise.resolve({ username: TEST_USERNAME }) });
  });

  await runTest("Public", "Fetch public products by username", "GET", `/api/public/products?username=${TEST_USERNAME}`, async () => {
    const req = makeReq(`/api/public/products?username=${TEST_USERNAME}`, "GET", undefined, false);
    return publicProductsRoute.GET(req);
  });

  await runTest("Public", "Submit public collab inquiry", "POST", "/api/collaborations/submit", async () => {
    const req = makeReq("/api/collaborations/submit", "POST", {
      creatorUsername: TEST_USERNAME,
      name: "Marketing Lead",
      brandName: "BrandX",
      email: "collab@brandx.com",
      approxBudget: "₹50,000",
      message: "We would like to partner on your next video.",
    }, false);
    return submitCollabRoute.POST(req);
  });

  if (reviewInvitationToken) {
    await runTest("Public", "Fetch review invitation by token", "GET", `/api/review?token=${reviewInvitationToken}`, async () => {
      const req = makeReq(`/api/review?token=${reviewInvitationToken}`, "GET", undefined, false);
      return reviewTokenRoute.GET(req);
    });

    await runTest("Public", "Submit review by token", "POST", "/api/review", async () => {
      const req = makeReq("/api/review", "POST", {
        token: reviewInvitationToken,
        rating: 5,
        ratingContentQuality: 5,
        ratingProfessionalism: 5,
        ratingTimelyDelivery: 5,
        comment: "Excellent partnership! Prompt delivery and great engagement.",
        clientName: "Brand Client",
      }, false);
      return reviewTokenRoute.POST(req);
    });
  }

  await runTest("Public", "Submit public report", "POST", "/api/public/report", async () => {
    const req = makeReq("/api/public/report", "POST", {
      creatorUsername: TEST_USERNAME,
      reason: "spam",
      details: "Automated test report submission",
    }, false);
    return publicReportRoute.POST(req);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. AUTH & SESSION APIS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📌 [8/8] Testing Auth & Session APIs...");

  await runTest("Auth", "Verify active session (GET /api/me)", "GET", "/api/me", async () => {
    const req = makeReq("/api/me", "GET");
    return meRoute.GET(req);
  });

  await runTest("Auth", "Logout session (POST /api/auth/logout)", "POST", "/api/auth/logout", async () => {
    const req = makeReq("/api/auth/logout", "POST");
    return logoutRoute.POST(req);
  });

  // Clean up test data
  console.log("\n🧹 Cleaning up test creator data...");
  await cleanupDb();

  // ─────────────────────────────────────────────────────────────────────────────
  // FINAL SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  console.log("\n=======================================================");
  console.log(`   API AUDIT COMPLETE: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log("=======================================================\n");

  if (failed > 0) {
    console.error("Failed Endpoints:");
    results.filter((r) => r.status === "FAILED").forEach((r) => {
      console.error(` - [${r.category}] ${r.method} ${r.endpoint}: ${r.error} (Status: ${r.httpCode})`);
    });
    process.exit(1);
  } else {
    console.log("🎉 ALL API ENDPOINTS ARE WORKING PERFECTLY! 100% PASS RATE\n");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("FATAL AUDIT ERROR:", e);
  process.exit(1);
});
