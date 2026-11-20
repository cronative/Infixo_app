"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Did the visitor reach this page by navigating inside Inflixo (e.g. "View all"
 * on a profile), or did they open it directly from a shared link?
 *
 * The page a visit starts on is remembered per full page load (module memory
 * resets on reload / new tab). A page is "in-app" once the path differs from
 * that entry page, or once the visitor has already moved between pages.
 */
let entryPath: string | null = typeof window !== "undefined" ? window.location.pathname : null;
let movedInApp = false;

function note(path: string) {
  if (entryPath === null) entryPath = path;
  if (path !== entryPath) movedInApp = true;
}

/** true → show a back button; false → the page was opened directly (show the logo / no back). */
export function useArrivedInApp(): boolean {
  const pathname = usePathname() || "";
  useEffect(() => {
    note(pathname);
  }, [pathname]);
  if (typeof window === "undefined" || entryPath === null) return false;
  return movedInApp || pathname !== entryPath;
}
