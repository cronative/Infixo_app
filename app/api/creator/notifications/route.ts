import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import {
  getCreatorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notificationsDb";

// GET /api/creator/notifications - fetch active notifications (last 3 days)
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    let creatorId: string | undefined;

    if (!auth.error && auth.creator) {
      creatorId = auth.creator.id;
    } else {
      const url = new URL(req.url);
      const email = url.searchParams.get("email");
      const username = url.searchParams.get("username");

      if (email || username) {
        const [cRows]: any = await db.query(
          "SELECT id FROM creators WHERE email = ? OR username = ? LIMIT 1",
          [email || username, username || email]
        );
        if (cRows && cRows.length > 0) {
          creatorId = cRows[0].id;
        }
      }
    }

    if (!creatorId) {
      return apiError("Unauthorized - valid session required", 401);
    }

    const { notifications, unreadCount } = await getCreatorNotifications(creatorId);

    return apiSuccess({
      notifications,
      unreadCount,
    }, "Notifications fetched successfully");
  } catch (error: any) {
    console.error("GET /api/creator/notifications error:", error);
    return apiError(error?.message || "Failed to fetch notifications", 500);
  }
}

// PATCH /api/creator/notifications - mark one or all as read
export async function PATCH(req: Request) {
  try {
    const auth = await requireCreator(req);
    const body = await req.json().catch(() => ({}));
    let creatorId: string | undefined;

    if (!auth.error && auth.creator) {
      creatorId = auth.creator.id;
    } else {
      const email = body.email;
      const username = body.username;

      if (email || username) {
        const [cRows]: any = await db.query(
          "SELECT id FROM creators WHERE email = ? OR username = ? LIMIT 1",
          [email || username, username || email]
        );
        if (cRows && cRows.length > 0) {
          creatorId = cRows[0].id;
        }
      }
    }

    if (!creatorId) {
      return apiError("Unauthorized - valid session required", 401);
    }

    const { notificationId, markAll } = body;

    if (markAll) {
      const count = await markAllNotificationsAsRead(creatorId);
      return apiSuccess({ updatedCount: count }, "All notifications marked as read");
    }

    if (notificationId) {
      const success = await markNotificationAsRead(notificationId, creatorId);
      return apiSuccess({ success }, "Notification marked as read");
    }

    return apiError("notificationId or markAll required", 400);
  } catch (error: any) {
    console.error("PATCH /api/creator/notifications error:", error);
    return apiError(error?.message || "Failed to update notification", 500);
  }
}
