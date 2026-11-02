import { db } from "@/lib/db";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { listLinks } from "@/lib/linksDb";
import { sanitizeUrl } from "@/lib/urlSanitizer";
import { getCreatorPlanKey } from "@/lib/planServer";
import { getPlanLimit } from "@/config/plans";

// GET /api/creator/custom-links?username=... (public profile). Writes live in /api/links.
// Uses the same `position` order as the dashboard (listLinks).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const creatorId = searchParams.get("creatorId");

    const lookupVal = email || username || creatorId;
    if (!lookupVal) {
      return apiSuccess({ links: [] }, "No lookup param provided");
    }

    const [creators]: any = await db.query(
      "SELECT id FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal]
    );
    const targetCreatorId = creators?.[0]?.id;
    if (!targetCreatorId) return apiSuccess({ links: [] }, "Creator not found");

    const accessError = await authorizeCreatorRead(req, targetCreatorId, Boolean(username));
    if (accessError) return accessError;

    // Public profile: links beyond the plan limit are hidden (a group counts as 1; kept in the dashboard).
    // Expired items still count toward plan limit, but are excluded on the public view.
    const linkLimit = getPlanLimit(await getCreatorPlanKey(targetCreatorId), "links");
    const rawLinks = await listLinks(targetCreatorId);
    const now = Date.now();

    const linksWithinLimit = rawLinks.slice(0, linkLimit);
    const activeLinks = linksWithinLimit.filter((link) => {
      if (link.expiresAt) {
        return new Date(link.expiresAt).getTime() > now;
      }
      return true;
    });

    const links = activeLinks.map((link) =>
      link.kind === "group"
        ? {
            id: link.id,
            title: link.title,
            description: link.description || undefined,
            url: "",
            kind: "collection" as const,
            isEnabled: true,
            items: link.children.map((child) => ({
              id: child.id,
              title: child.title,
              url: sanitizeUrl(child.url, { allowEmpty: true }) || "",
              iconUrl: child.iconUrl || undefined,
              isEnabled: true,
            })),
          }
        : {
            id: link.id,
            title: link.title,
            description: link.description || undefined,
            url: sanitizeUrl(link.url, { allowEmpty: true }) || "",
            kind: "link" as const,
            isEnabled: true,
            isPinned: link.pinned,
            iconUrl: link.iconUrl || undefined,
          }
    );

    return apiSuccess({ links }, "Custom links retrieved successfully");
  } catch (err: any) {
    console.error("GET Custom Links Error:", err);
    return apiError("Failed to retrieve custom links", 500);
  }
}
