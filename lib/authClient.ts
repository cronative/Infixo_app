"use client";

import { storage } from "@/utils/storage";

let loggingOut = false;

/**
 * Ends the session everywhere: clears local app state, tells the server to
 * drop the httpOnly session cookie, and sends the user to /login.
 *
 * Call this whenever an API response makes clear the session is no longer
 * valid (401 / `authenticated: false`) — e.g. from SessionContext or a
 * protected layout — instead of leaving the UI silently stuck pretending
 * the user is still signed in. Guarded so concurrent 401s only redirect once.
 */
export function forceLogout(): void {
  if (loggingOut) return;
  loggingOut = true;

  try {
    storage.clearAll();
  } catch {}

  // Best-effort: clear the httpOnly session cookie server-side too.
  fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}
