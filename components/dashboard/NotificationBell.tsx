"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  Sparkles,
  Film,
  Users,
  Briefcase,
  Star,
  Check,
  CheckCheck,
  ArrowRight,
  X,
} from "lucide-react";
import type { CreatorNotification } from "@/lib/notificationsDb";

function formatRelativeTime(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/creator/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch (e) {
      // Non-fatal fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 3 minutes for fresh notifications
    const interval = setInterval(fetchNotifications, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/creator/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/creator/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setUnreadCount(0);
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "fan_nudge":
        return <Heart className="h-3.5 w-3.5 text-[#7A2253] fill-[#7A2253]" />;
      case "series_follow":
        return <Film className="h-3.5 w-3.5 text-indigo-600" />;
      case "creator_follow":
        return <Users className="h-3.5 w-3.5 text-emerald-600" />;
      case "collab_inquiry":
        return <Briefcase className="h-3.5 w-3.5 text-amber-600" />;
      case "review_received":
        return <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-[#7A2253]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Creator Notifications"
        title="Notifications"
        className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#3F3F46] transition-colors hover:bg-[#FAFAFB] hover:text-[#7A2253]"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#7A2253] px-1 text-[9.5px] font-bold text-white shadow-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 sm:w-92 origin-top-right rounded-[5px] border border-[#ECECF0] bg-white shadow-lg z-50 animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ECECF0] px-3.5 py-2.5 bg-[#FAFAFB]">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#18181B]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-[3px] bg-[#F7EEF2] px-1.5 py-0.2 text-[10.5px] font-bold text-[#7A2253]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-[#7A2253] hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#6B6B76] hover:text-[#18181B] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#ECECF0]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#6B6B76]">
                <Bell className="h-6 w-6 mx-auto mb-2 text-[#CBD5E1]" />
                <p className="text-xs font-semibold text-[#18181B]">No new notifications</p>
                <p className="text-[11px] text-[#6B6B76] mt-0.5">
                  When fans interact with your profile, updates will appear here!
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = notif.status === "unread";
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) handleMarkAsRead(notif.id);
                    }}
                    className={`p-3 transition-colors cursor-pointer ${
                      isUnread ? "bg-[#FAF5F7] hover:bg-[#F7EEF2]" : "hover:bg-[#FAFAFB]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#ECECF0] bg-white">
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#18181B] truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-[#8C8C96] shrink-0 font-medium">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-[#52525B] mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {notif.linkUrl && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <Link
                              href={notif.linkUrl}
                              onClick={() => {
                                if (isUnread) handleMarkAsRead(notif.id);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A2253] hover:underline"
                            >
                              <span>Take action</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {isUnread && (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#7A2253] shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-[#ECECF0] px-3 py-1.5 bg-[#FAFAFB] text-center text-[10px] text-[#8C8C96]">
            Updates are visible for 3 days and automatically cleaned weekly.
          </div>
        </div>
      )}
    </div>
  );
}
