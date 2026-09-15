import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import AllReviewsClient from "./AllReviewsClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface CreatorReviewsSeoRow extends RowDataPacket {
  username: string;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
  review_count: number;
  visibility_settings: string | null;
  settings_visibility: string | null;
  plan_key: string | null;
  sub_status: string | null;
  activated_at: string | Date | null;
  trial_ends_at: string | Date | null;
}

const SITE_URL = "https://inflixo.com";

function normalizeUsername(value?: string | null) {
  return decodeURIComponent(value || "").trim().replace(/^@/, "").toLowerCase();
}

function toDateMs(value?: string | Date | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function parseVisibility(value?: string | null): { showReviews?: boolean; showInSearchEngines?: boolean } | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isTrialPrivate(creator?: CreatorReviewsSeoRow | null) {
  if (!creator || creator.plan_key !== "early_access") return false;
  if (creator.sub_status && !["active", "trial"].includes(creator.sub_status)) return true;

  const explicitEndMs = toDateMs(creator.trial_ends_at);
  if (explicitEndMs) return Date.now() > explicitEndMs;

  const activatedMs = toDateMs(creator.activated_at);
  return activatedMs ? Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000 : false;
}

async function getCreatorReviewsSeo(username: string) {
  if (!username || username === "demo_creator") return null;

  const [rows] = await db.query<CreatorReviewsSeoRow[]>(
    `SELECT
       c.username,
       c.display_name,
       c.bio,
       c.photo_url,
       c.visibility_settings,
       cs.visibility_settings AS settings_visibility,
       sub.plan_key,
       sub.status AS sub_status,
       sub.activated_at,
       sub.trial_ends_at,
       COUNT(r.id) AS review_count
     FROM creators c
     LEFT JOIN creator_settings cs ON c.id = cs.creator_id
     LEFT JOIN subscriptions sub ON c.id = sub.creator_id
     LEFT JOIN creator_reviews r ON r.creator_id = c.id AND r.status = 'approved'
     WHERE LOWER(c.username) = ? OR c.username = ? OR LOWER(c.username) = ?
     GROUP BY c.id, c.username, c.display_name, c.bio, c.photo_url, c.visibility_settings,
       cs.visibility_settings, sub.plan_key, sub.status, sub.activated_at, sub.trial_ends_at
     LIMIT 1`,
    [username, username, `@${username}`]
  );

  return rows[0] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const canonicalUrl = `${SITE_URL}/${username}/reviews`;

  try {
    const creator = await getCreatorReviewsSeo(username);
    const visibility = parseVisibility(creator?.settings_visibility || creator?.visibility_settings);
    const shouldIndex = Boolean(creator) && !isTrialPrivate(creator) && visibility?.showReviews !== false && visibility?.showInSearchEngines !== false;

    if (!shouldIndex) {
      return {
        title: `@${username || "creator"} Reviews | Inflixo`,
        description: "This creator reviews page is not publicly available right now.",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: false },
      };
    }

    const displayName = creator?.display_name || creator?.username || username || "Creator";
    const reviewCount = Number(creator?.review_count || 0);
    const description =
      creator?.bio?.trim() ||
      `Read ${reviewCount || ""} verified review${reviewCount === 1 ? "" : "s"} for ${displayName} on Inflixo.`.replace("  ", " ");
    const image = creator?.photo_url || `${SITE_URL}/logo-square.png`;

    return {
      title: `${displayName}'s Reviews | Inflixo`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${displayName}'s Reviews`,
        description,
        url: canonicalUrl,
        siteName: "Inflixo",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: `${displayName} reviews on Inflixo` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName}'s Reviews`,
        description,
        images: [image],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: `@${username || "creator"} Reviews | Inflixo`,
      description: "Read this creator's verified reviews on Inflixo.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default function AllReviewsPage() {
  return <AllReviewsClient />;
}
