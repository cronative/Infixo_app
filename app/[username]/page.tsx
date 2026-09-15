import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import PublicProfileClient from "./PublicProfileClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface CreatorSeoRow extends RowDataPacket {
  username: string;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
  category: string | null;
  profession: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  updated_at: string | Date | null;
  visibility_settings: string | null;
  settings_visibility: string | null;
  plan_key: string | null;
  sub_status: string | null;
  activated_at: string | Date | null;
  trial_ends_at: string | Date | null;
}

interface SocialSeoRow extends RowDataPacket {
  platform: string;
  username: string | null;
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

function isTrialPrivate(creator?: CreatorSeoRow | null) {
  if (!creator || creator.plan_key !== "early_access") return false;
  if (creator.sub_status && !["active", "trial"].includes(creator.sub_status)) return true;

  const explicitEndMs = toDateMs(creator.trial_ends_at);

  if (explicitEndMs) return Date.now() > explicitEndMs;

  const activatedMs = toDateMs(creator.activated_at);
  return activatedMs ? Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000 : false;
}

function parseVisibility(value?: string | null): { showInSearchEngines?: boolean } | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function getCreatorSeo(username: string) {
  if (!username || username === "demo_creator") return null;

  const [rows] = await db.query<CreatorSeoRow[]>(
    `SELECT
       c.username, c.display_name, c.bio, c.photo_url, c.category, c.profession,
       c.city, c.state, c.country, c.updated_at,
       c.visibility_settings,
       cs.visibility_settings AS settings_visibility,
       s.plan_key, s.status AS sub_status, s.activated_at, s.trial_ends_at
     FROM creators c
     LEFT JOIN creator_settings cs ON c.id = cs.creator_id
     LEFT JOIN subscriptions s ON c.id = s.creator_id
     WHERE LOWER(c.username) = ? OR c.username = ? OR LOWER(c.username) = ?
     LIMIT 1`,
    [username, username, `@${username}`]
  );

  return rows[0] || null;
}

async function getCreatorSocialUrls(username: string) {
  const [rows] = await db.query<SocialSeoRow[]>(
    `SELECT sa.platform, sa.username
     FROM social_accounts sa
     JOIN creators c ON c.id = sa.creator_id
     WHERE LOWER(c.username) = ? AND sa.username IS NOT NULL AND sa.username != ''`,
    [username]
  );

  return rows
    .map((social) => {
      const handle = (social.username || "").replace(/^@/, "");
      if (!handle) return null;
      if (social.platform === "instagram") return `https://instagram.com/${handle}`;
      if (social.platform === "youtube") return `https://youtube.com/@${handle}`;
      if (social.platform === "facebook") return `https://facebook.com/${handle}`;
      return null;
    })
    .filter(Boolean) as string[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const canonicalUrl = `${SITE_URL}/${username}`;
  const fallbackTitle = `@${username || "creator"} on Inflixo`;

  try {
    const creator = await getCreatorSeo(username);
    const visibility = parseVisibility(creator?.settings_visibility || creator?.visibility_settings);
    if (!creator || isTrialPrivate(creator) || visibility?.showInSearchEngines === false) {
      return {
        title: fallbackTitle,
        description: "This Inflixo creator profile is not publicly available right now.",
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: false },
      };
    }

    const displayName = creator.display_name || creator.username || username;
    const categoryText = [creator.profession, creator.category].filter(Boolean).join(" • ");
    const locationText = [creator.city, creator.state, creator.country].filter(Boolean).join(", ");
    const description =
      creator.bio?.trim() ||
      [categoryText, locationText, `Explore ${displayName}'s social fanbase, video series, links and collaboration profile on Inflixo.`]
        .filter(Boolean)
        .join(" — ");
    const image = creator.photo_url || `${SITE_URL}/logo-square.png`;

    return {
      title: `${displayName} (@${creator.username || username}) — Inflixo Creator Profile`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${displayName} on Inflixo`,
        description,
        url: canonicalUrl,
        siteName: "Inflixo",
        type: "profile",
        images: [{ url: image, width: 1200, height: 630, alt: `${displayName} Inflixo profile` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} on Inflixo`,
        description,
        images: [image],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: "Explore this creator profile on Inflixo.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const creator = await getCreatorSeo(username).catch(() => null);
  const sameAs = await getCreatorSocialUrls(username).catch(() => []);

  const displayName = creator?.display_name || creator?.username || username || "Creator";
  const canonicalUrl = `${SITE_URL}/${username}`;
  const jsonLd = creator && !isTrialPrivate(creator)
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: `${displayName} on Inflixo`,
        url: canonicalUrl,
        mainEntity: {
          "@type": "Person",
          name: displayName,
          alternateName: `@${creator.username || username}`,
          description: creator.bio || undefined,
          image: creator.photo_url || undefined,
          url: canonicalUrl,
          sameAs,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PublicProfileClient />
    </>
  );
}
