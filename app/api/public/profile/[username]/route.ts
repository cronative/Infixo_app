import { NextResponse } from "next/server";
import { GET as getProfile } from "@/app/api/creator/profile/route";
import { GET as getSocials } from "@/app/api/creator/socials/route";
import { GET as getSeries } from "@/app/api/series/route";
import { GET as getLinks } from "@/app/api/creator/custom-links/route";
import { GET as getMediaKit } from "@/app/api/creator/mediakit/route";
import { GET as getReviews } from "@/app/api/creator/reviews/route";
import { GET as getTeam } from "@/app/api/creator/team/route";
import { GET as getBrands } from "@/app/api/creator/brands/route";
import { GET as getCollaborations } from "@/app/api/creator/collaborations/route";
import { GET as getSetup } from "@/app/api/creator/setup/route";
import { GET as getOtherSocials } from "@/app/api/creator/other-socials/route";
import { GET as getSections } from "@/app/api/creator/sections/route";
import { GET as getProducts } from "@/app/api/public/products/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Reader = (req: Request) => Promise<Response>;

// Each section keeps the exact body its own endpoint returns, so the client parses it unchanged.
const SECTIONS: Record<string, [Reader, string]> = {
  profile: [getProfile, "/api/creator/profile"],
  socials: [getSocials, "/api/creator/socials"],
  series: [getSeries, "/api/series"],
  links: [getLinks, "/api/creator/custom-links"],
  mediakit: [getMediaKit, "/api/creator/mediakit"],
  reviews: [getReviews, "/api/creator/reviews"],
  team: [getTeam, "/api/creator/team"],
  brands: [getBrands, "/api/creator/brands"],
  collaborations: [getCollaborations, "/api/creator/collaborations"],
  setup: [getSetup, "/api/creator/setup"],
  otherSocials: [getOtherSocials, "/api/creator/other-socials"],
  sections: [getSections, "/api/creator/sections"],
  products: [getProducts, "/api/public/products"],
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; body: Record<string, unknown> }>();

async function readSection(reader: Reader, path: string, username: string, req: Request) {
  try {
    const url = new URL(path, req.url);
    url.searchParams.set("username", username);
    const response = await reader(new Request(url, { headers: req.headers }));
    return await response.json();
  } catch (error) {
    console.error("Public profile section unavailable", path, error);
    return { status: 0 };
  }
}

/** Everything the public profile page needs in one request. Anonymous responses are cached for 60s. */
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username || "").trim().replace(/^@/, "").toLowerCase();
  if (!username || username.length > 50 || !/^[\w.-]+$/.test(username)) {
    return NextResponse.json({ error: { code: "INVALID_USERNAME", message: "A valid creator username is required." } }, { status: 400 });
  }

  // Signed-in viewers (e.g. the owner) can see things anonymous visitors can't, so never share their response.
  const anonymous = !/(?:^|;\s*)inflixo_session=/.test(req.headers.get("cookie") || "");
  const hit = anonymous ? cache.get(username) : undefined;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.body, { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } });
  }

  const entries = await Promise.all(
    Object.entries(SECTIONS).map(async ([key, [reader, path]]) => [key, await readSection(reader, path, username, req)] as const),
  );
  const body = Object.fromEntries(entries);

  if (anonymous) {
    if (cache.size > 1000) cache.delete(cache.keys().next().value as string);
    cache.set(username, { at: Date.now(), body });
  }
  return NextResponse.json(body, {
    headers: { "Cache-Control": anonymous ? "public, max-age=0, s-maxage=60" : "private, no-store" },
  });
}
