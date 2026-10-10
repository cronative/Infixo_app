import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { GET as getSocials } from "@/app/api/creator/socials/route";
import { GET as getSeries } from "@/app/api/series/route";
import { GET as getProducts } from "@/app/api/creator/products/route";
import { GET as getLinks } from "@/app/api/creator/custom-links/route";
import { GET as getMediaKit } from "@/app/api/creator/mediakit/route";
import { GET as getReviews } from "@/app/api/creator/reviews/route";
import { GET as getAnalytics } from "@/app/api/creator/analytics/route";
import { GET as getSetup } from "@/app/api/creator/setup/route";
import { GET as getTeam } from "@/app/api/creator/team/route";
import { mapSocialAccounts, calculateTotalAudience, type SocialAccountRecord } from "@/lib/socialAccounts";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import type { DashboardSummary } from "@/lib/dashboardSummary";
import type { Series } from "@/types";

type Reader = (req: Request) => Promise<Response>;

// Invoke the pages' existing readers in-process: no extra SQL or internal HTTP calls.
async function readSection<T, R>(reader: Reader, request: Request, select: (data: T) => R): Promise<R | null> {
  try {
    const response = await reader(request);
    const body = await response.json();
    if (!response.ok || body.status !== 1 || !body.data) return null;
    return select(body.data as T);
  } catch (error) {
    console.error("Dashboard section unavailable", new URL(request.url).pathname, error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { id, email } = auth.creator;
    const request = (path: string) => {
      const url = new URL(path, req.url);
      url.searchParams.set("creatorId", id);
      url.searchParams.set("email", email);
      url.searchParams.set("period", "30d");
      return new Request(url, { headers: req.headers });
    };
    const [socials, series, products, links, mediakit, reviews, analytics, setup, team] = await Promise.all([
      readSection(getSocials, request("/api/creator/socials"), (data: { socials: SocialAccountRecord[] }) => {
        const accounts = mapSocialAccounts(data.socials);
        return { accounts, total: calculateTotalAudience(accounts) };
      }),
      readSection(getSeries, request("/api/series"), (data: { series: Series[] }) => ({ count: data.series.length, episodes: data.series.reduce((total, item) => total + getSeriesEpisodes(item).length, 0) })),
      readSection(getProducts, request("/api/creator/products"), (data: { products: unknown[] }) => data.products.length),
      readSection(getLinks, request("/api/creator/custom-links"), (data: { links: unknown[] }) => data.links.length),
      readSection(getMediaKit, request("/api/creator/mediakit"), (data: { packages: unknown[] }) => data.packages.length),
      readSection(getReviews, request("/api/creator/reviews"), (data: { reviews: unknown[] }) => data.reviews.length),
      readSection(getAnalytics, request("/api/creator/analytics"), (data: { metrics: { profileViews: number; socialClicks: number; linkClicks: number } }) => ({ views: data.metrics.profileViews, clicks: data.metrics.socialClicks + data.metrics.linkClicks })),
      readSection(getSetup, request("/api/creator/setup"), (data: { items: unknown[] }) => data.items.length),
      readSection(getTeam, request("/api/creator/team"), (data: { members: unknown[] }) => data.members.length),
    ]);
    return apiSuccess({ socials, series, products, links, mediakit, reviews, analytics, setup, team } satisfies DashboardSummary, "Dashboard summary loaded", { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Dashboard summary unavailable", error);
    return apiError("Could not load dashboard", 500);
  }
}
