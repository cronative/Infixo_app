"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

export const PDF_PREPARING_LABEL = "Preparing your media kit…";
const PDF_ERROR = "Couldn't generate PDF, please try again";

/** Downloads "{username}-media-kit.pdf"; `loading` drives the button's loader/disabled state. */
export function useMediaKitPdf(username: string | null | undefined) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    const handle = (username || "").replace(/^@/, "").trim();
    if (!handle || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/mediakit/pdf?username=${encodeURIComponent(handle)}`);
      if (!res.ok || !res.headers.get("content-type")?.includes("application/pdf")) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${handle.toLowerCase()}-media-kit.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      showToast(PDF_ERROR, "error");
    } finally {
      setLoading(false);
    }
  }, [username, loading, showToast]);

  return { download, loading };
}
