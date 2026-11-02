import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export interface CreatorNotification {
  id: string;
  creatorId: string;
  type: "fan_nudge" | "series_follow" | "creator_follow" | "collab_inquiry" | "review_received" | "general";
  title: string;
  message: string;
  linkUrl?: string | null;
  status: "unread" | "read" | "inactive";
  isActive: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationRow extends RowDataPacket {
  id: string;
  creator_id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  status: "unread" | "read" | "inactive";
  is_active: number;
  metadata: any;
  created_at: string;
}

let isNotificationTableEnsured = false;

export async function ensureNotificationsTable(): Promise<void> {
  if (isNotificationTableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_notifications (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link_url VARCHAR(255) DEFAULT NULL,
        status ENUM('unread', 'read', 'inactive') NOT NULL DEFAULT 'unread',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_creator_active (creator_id, is_active, created_at),
        INDEX idx_notif_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isNotificationTableEnsured = true;
  } catch (err: any) {
    console.warn("ensureNotificationsTable warning:", err?.message || err);
  }
}

export async function insertNotification(data: {
  creatorId: string;
  type: "fan_nudge" | "series_follow" | "creator_follow" | "collab_inquiry" | "review_received" | "general";
  title: string;
  message: string;
  linkUrl?: string | null;
  metadata?: any;
}): Promise<CreatorNotification> {
  await ensureNotificationsTable();

  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const metaJson = data.metadata ? JSON.stringify(data.metadata) : null;

  await db.query(
    `INSERT INTO creator_notifications 
      (id, creator_id, type, title, message, link_url, status, is_active, metadata)
     VALUES (?, ?, ?, ?, ?, ?, 'unread', 1, ?)`,
    [id, data.creatorId, data.type, data.title, data.message, data.linkUrl || null, metaJson]
  );

  return {
    id,
    creatorId: data.creatorId,
    type: data.type,
    title: data.title,
    message: data.message,
    linkUrl: data.linkUrl || null,
    status: "unread",
    isActive: true,
    metadata: data.metadata || null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Returns active notifications for a creator from the last 3 days.
 */
export async function getCreatorNotifications(
  creatorId: string,
  limit: number = 20
): Promise<{ notifications: CreatorNotification[]; unreadCount: number }> {
  await ensureNotificationsTable();

  // Active window: created within last 3 days and is_active = 1
  const [rows] = await db.query<NotificationRow[]>(
    `SELECT id, creator_id, type, title, message, link_url, status, is_active, metadata, created_at
     FROM creator_notifications
     WHERE creator_id = ? AND is_active = 1 AND created_at >= NOW() - INTERVAL 3 DAY
     ORDER BY created_at DESC
     LIMIT ?`,
    [creatorId, limit]
  );

  const notifications: CreatorNotification[] = (rows || []).map((r) => ({
    id: r.id,
    creatorId: r.creator_id,
    type: r.type as any,
    title: r.title,
    message: r.message,
    linkUrl: r.link_url,
    status: r.status,
    isActive: Boolean(r.is_active),
    metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
    createdAt: r.created_at,
  }));

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: string, creatorId: string): Promise<boolean> {
  await ensureNotificationsTable();
  const [result]: any = await db.query(
    `UPDATE creator_notifications SET status = 'read' WHERE id = ? AND creator_id = ?`,
    [id, creatorId]
  );
  return Boolean(result?.affectedRows);
}

export async function markAllNotificationsAsRead(creatorId: string): Promise<number> {
  await ensureNotificationsTable();
  const [result]: any = await db.query(
    `UPDATE creator_notifications SET status = 'read' WHERE creator_id = ? AND status = 'unread'`,
    [creatorId]
  );
  return result?.affectedRows || 0;
}

/**
 * Notification lifecycle cleanup:
 * 1. Notifications older than 3 days become inactive / hidden from creator feed.
 * 2. Notifications older than 7 days are permanently purged from DB.
 */
export async function runNotificationLifecycleCleanup(): Promise<{
  deactivatedCount: number;
  deletedCount: number;
}> {
  await ensureNotificationsTable();

  // Step 1: Hide notifications older than 3 days
  const [deactResult]: any = await db.query(
    `UPDATE creator_notifications 
     SET is_active = 0, status = 'inactive' 
     WHERE is_active = 1 AND created_at < NOW() - INTERVAL 3 DAY`
  );

  // Step 2: Delete notifications older than 7 days
  const [delResult]: any = await db.query(
    `DELETE FROM creator_notifications 
     WHERE created_at < NOW() - INTERVAL 7 DAY`
  );

  return {
    deactivatedCount: deactResult?.affectedRows || 0,
    deletedCount: delResult?.affectedRows || 0,
  };
}
