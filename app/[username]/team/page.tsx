import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import TeamPageClient from "./TeamPageClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface CreatorTeamSeoRow extends RowDataPacket {
  username: string;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
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

function parseVisibility(value?: string | null): { showInSearchEngines?: boolean } | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isTrialPrivate(creator?: CreatorTeamSeoRow | null) {
  if (!creator || creator.plan_key !== "early_access") return false;
  if (creator.sub_status && !["active", "trial"].includes(creator.sub_status)) return true;

  const explicitEndMs = toDateMs(creator.trial_ends_at);
  if (explicitEndMs) return Date.now() > explicitEndMs;

  const activatedMs = toDateMs(creator.activated_at);
  return activatedMs ? Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000 : false;
}

async function getCreatorTeamSeo(username: string) {
  if (!username || username === "demo_creator") return null;

  const [rows] = await db.query<CreatorTeamSeoRow[]>(
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
       sub.trial_ends_at
     FROM creators c
     LEFT JOIN creator_settings cs ON c.id = cs.creator_id
     LEFT JOIN subscriptions sub ON c.id = sub.creator_id
     WHERE LOWER(c.username) = ? OR c.username = ? OR LOWER(c.username) = ?
     LIMIT 1`,
    [username, username, `@${username}`]
  );

  return rows[0] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const canonicalUrl = `${SITE_URL}/${username}/team`;

  try {
    const creator = await getCreatorTeamSeo(username);
    const visibility = parseVisibility(creator?.settings_visibility || creator?.visibility_settings);
    const shouldIndex = Boolean(creator) && !isTrialPrivate(creator) && visibility?.showInSearchEngines !== false;

    if (!shouldIndex) {
      return {
        title: `@${username || "creator"} Team | Inflixo`,
        description: "This creator team page is not publicly available right now.",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: false },
      };
    }

    const displayName = creator?.display_name || creator?.username || username || "Creator";
    const description =
      creator?.bio?.trim() ||
      `Meet the creative production crew, editors, and team behind ${displayName} on Inflixo.`;
    const image = creator?.photo_url || `${SITE_URL}/logo-square.png`;

    return {
      title: `${displayName} — The Crew | Inflixo`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${displayName} — The Crew`,
        description,
        url: canonicalUrl,
        siteName: "Inflixo",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: `${displayName} team on Inflixo` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} — The Crew`,
        description,
        images: [image],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: `@${username || "creator"} Team | Inflixo`,
      description: "Meet the team behind this creator on Inflixo.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default function TeamPage() {
  return <TeamPageClient />;
}

