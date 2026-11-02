import { apiSuccess, apiError } from "@/lib/apiResponse";
import { runNotificationLifecycleCleanup } from "@/lib/notificationsDb";

export const maxDuration = 60; // 1 minute max duration

export async function GET(req: Request) {
  return handleCleanupCron(req);
}

export async function POST(req: Request) {
  return handleCleanupCron(req);
}

async function handleCleanupCron(req: Request) {
  try {
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === "development";
    const authHeader = req.headers.get("authorization");
    const querySecret = url.searchParams.get("secret");

    const isAuthorized =
      (cronSecret && (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret)) ||
      isDev;

    if (!isAuthorized) {
      return apiError("Unauthorized - Valid Bearer CRON_SECRET or secret param required", 401);
    }

    const result = await runNotificationLifecycleCleanup();

    return apiSuccess({
      timestamp: new Date().toISOString(),
      policy: {
        deactivationWindow: "Older than 3 days (hidden from creator feed)",
        deletionWindow: "Older than 7 days (permanently purged from database)",
      },
      ...result,
    }, "Notification lifecycle cleanup executed successfully");
  } catch (error: any) {
    console.error("Cleanup notifications cron error:", error);
    return apiError(error?.message || "Notification cleanup cron failed", 500);
  }
}
