import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import AllLinksClient from "./AllLinksClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface CreatorLinksSeoRow extends RowDataPacket {
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

function isTrialPrivate(creator?: CreatorLinksSeoRow | null) {
  if (!creator || creator.plan_key !== "early_access") return false;
  if (creator.sub_status && !["active", "trial"].includes(creator.sub_status)) return true;

  const explicitEndMs = toDateMs(creator.trial_ends_at);
  if (explicitEndMs) return Date.now() > explicitEndMs;

  const activatedMs = toDateMs(creator.activated_at);
  return activatedMs ? Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000 : false;
}

async function getCreatorLinksSeo(username: string) {
  if (!username || username === "demo_creator") return null;

  const [rows] = await db.query<CreatorLinksSeoRow[]>(
    `SELECT
       c.username,
       c.display_name,
       c.bio,
       c.photo_url,
       c.visibility_settings,
       cs.visibility as settings_visibility,
       s.plan_key,
       s.status as sub_status,
       s.activated_at,
       s.trial_ends_at
     FROM creators c
     LEFT JOIN creator_settings cs ON cs.creator_id = c.id
     LEFT JOIN subscriptions s ON s.creator_id = c.id
     WHERE LOWER(c.username) IN (?, ?)
     LIMIT 1`,
    [username, `@${username}`]
  );

  return rows[0] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const canonicalUrl = `${SITE_URL}/${username}/links`;

  if (!username) {
    return {
      title: "Links | Inflixo",
      description: "Official creator links on Inflixo.",
      alternates: { canonical: canonicalUrl },
    };
  }

  if (username === "demo_creator") {
    return {
      title: "Inflixo Creator's Links | Inflixo",
      description: "Explore all recommended links and profiles on Inflixo.",
      alternates: { canonical: canonicalUrl },
      robots: { index: true, follow: true },
    };
  }

  try {
    const creator = await getCreatorLinksSeo(username);
    const vis = parseVisibility(creator?.settings_visibility) || parseVisibility(creator?.visibility_settings);
    const shouldIndex = creator && !isTrialPrivate(creator) && vis?.showInSearchEngines !== false;

    if (!shouldIndex) {
      return {
        title: `@${username || "creator"} Links | Inflixo`,
        description: "This creator links page is not publicly available right now.",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: false },
      };
    }

    const displayName = creator?.display_name || creator?.username || username || "Creator";
    const description =
      creator?.bio?.trim() ||
      `Explore official links, websites, and accounts by ${displayName} on Inflixo.`;
    const image = creator?.photo_url || `${SITE_URL}/logo-square.png`;

    return {
      title: `${displayName}'s Links | Inflixo`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${displayName}'s Links`,
        description,
        url: canonicalUrl,
        siteName: "Inflixo",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: `${displayName} links on Inflixo` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName}'s Links`,
        description,
        images: [image],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: `@${username || "creator"} Links | Inflixo`,
      description: "Explore this creator's official links on Inflixo.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default function AllLinksPage() {
  return <AllLinksClient />;
}
