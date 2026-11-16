import type { Metadata } from "next";
import { profileDescription, profileTitle } from "@/lib/brand";
import { EXPERT_DEMO_PROFILE } from "@/data/expertDemoCreator";

const SITE_URL = "https://inflixo.com";

/**
 * Server metadata for the /demo_creator pages (their page.tsx files are client
 * components, so it lives in a layout). Mirrors the real /[username] profile
 * metadata, so share previews show the creator instead of the Inflixo homepage.
 */
export function demoCreatorMetadata(sub?: { path: string; label: string }): Metadata {
  const username = (EXPERT_DEMO_PROFILE.username || "demo_creator").replace(/^@/, "");
  const name = EXPERT_DEMO_PROFILE.displayName || username;
  const canonical = `${SITE_URL}/${username}${sub ? `/${sub.path}` : ""}`;
  const title = sub ? `${sub.label} · ${name} (@${username}) — Inflixo` : profileTitle(name, username);
  const description = profileDescription(name);
  const image = `${SITE_URL}/api/og/${encodeURIComponent(username)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Inflixo",
      type: "profile",
      images: [{ url: image, width: 1200, height: 630, alt: `${name} on Inflixo` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index: true, follow: true },
  };
}
