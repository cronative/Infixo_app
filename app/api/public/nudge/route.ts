import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { insertNotification } from "@/lib/notificationsDb";
import { recordServerEvent } from "@/lib/analyticsDb";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // Global rate limit: max 10 nudges per IP per hour
    const rate = checkRateLimit(`nudge_global_${ip}`, 10, 60 * 60 * 1000);
    if (!rate.success) {
      return apiError(`Too many requests. Please wait a bit before sending another nudge.`, 429);
    }

    const body = await req.json().catch(() => ({}));
    const creatorIdOrUsername = (body.creatorId || body.username || body.cleanHandle || "").trim();

    if (!creatorIdOrUsername) {
      return apiError("creatorId or username is required", 400);
    }

    // Per-creator rate limit per IP: 1 nudge per creator per IP per 24 hours
    const perCreatorRate = checkRateLimit(`nudge_${ip}_${creatorIdOrUsername}`, 1, 24 * 60 * 60 * 1000);
    if (!perCreatorRate.success) {
      return apiSuccess({ alreadySent: true }, "You have already nudged this creator recently! ✨");
    }

    // Resolve creator from DB
    const [rows]: any = await db.query(
      `SELECT id, username, display_name FROM creators WHERE id = ? OR username = ? OR email = ? LIMIT 1`,
      [creatorIdOrUsername, creatorIdOrUsername, creatorIdOrUsername]
    );

    const creator = rows?.[0];
    if (!creator?.id) {
      return apiError("Creator not found", 404);
    }

    // Record server analytics event
    try {
      await recordServerEvent(req, creator.id, "fan_nudge", "public_profile");
    } catch {}

    // Insert creator notification
    const notification = await insertNotification({
      creatorId: creator.id,
      type: "fan_nudge",
      title: "A fan wants to connect with you!",
      message: "Someone stopped by your Inflixo profile and is excited to see your content! Add your bio and social accounts to welcome them.",
      linkUrl: "/dashboard/profile",
      metadata: {
        source: "public_profile_empty_state",
        timestamp: new Date().toISOString(),
      },
    });

    return apiSuccess({
      sent: true,
      notificationId: notification.id,
    }, "Nudge sent successfully! You made the creator's day ❤️");
  } catch (error: any) {
    console.error("Public nudge API error:", error);
    return apiError(error?.message || "Could not send nudge", 500);
  }
}
