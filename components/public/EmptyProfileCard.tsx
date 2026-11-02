"use client";

import { useState, useEffect } from "react";
import { Sparkles, Heart, CheckCircle2, Clock } from "lucide-react";

export interface EmptyProfileCardProps {
  creatorName: string;
  creatorId?: string;
  creatorUsername?: string;
  isDashboardPreview?: boolean;
}

export function EmptyProfileCard({
  creatorName,
  creatorId,
  creatorUsername,
  isDashboardPreview = false,
}: EmptyProfileCardProps) {
  const [isNudged, setIsNudged] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const cleanHandle = (creatorUsername || "").replace(/^@/, "");
  const storageKey = `inflixo_nudged_${cleanHandle || creatorId || "creator"}`;

  // Check if visitor has already nudged this creator in this browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        // 24 hours cooldown
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setIsNudged(true);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {}
  }, [storageKey]);

  const handleNudge = async () => {
    if (isNudged || isSubmitting) return;

    if (isDashboardPreview) {
      // In preview mode, just toggle micro-interaction without calling API
      setIsNudged(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creatorId || cleanHandle,
          username: cleanHandle,
        }),
      });

      if (res.ok) {
        setIsNudged(true);
        try {
          localStorage.setItem(storageKey, Date.now().toString());
        } catch {}
      } else {
        // Fallback optimistic display
        setIsNudged(true);
      }
    } catch (err) {
      setIsNudged(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "transparent",
        borderColor: "var(--surface-border)",
      }}
      className="relative z-10 w-full rounded-[5px] border overflow-hidden text-center shadow-none animate-fade-in my-3 sm:my-4"
    >
      {/* Studio creator guidance banner if in dashboard preview */}
      {isDashboardPreview && (
        <div
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
            borderColor: "var(--surface-border)",
          }}
          className="px-3 py-1.5 border-b text-[11px] font-semibold text-(--accent-text) flex items-center justify-center gap-1.5"
        >
          <Clock className="h-3 w-3 shrink-0" />
          <span>Creator Preview: Visitors see this card until you add your bio, socials, or series.</span>
        </div>
      )}

      {/* Card Header area with theme accent tint */}
      <div
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
          borderColor: "var(--surface-border)",
        }}
        className="px-4 py-5 sm:px-6 sm:py-6 border-b flex flex-col items-center"
      >
        <div
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
            color: "var(--accent-text)",
            borderColor: "var(--surface-border)",
          }}
          className="h-10 w-10 rounded-[5px] border flex items-center justify-center mb-3 shadow-none"
        >
          <Sparkles className="h-5 w-5" />
        </div>

        <h3 className="text-base sm:text-lg font-bold tracking-tight text-(--text) leading-tight">
          Setting up something special
        </h3>

        <p className="text-xs sm:text-[13px] text-(--text-muted) font-normal mt-2 max-w-md leading-relaxed">
          Hey there! I&apos;m currently setting up my official space here on Inflixo. My links, socials, and creative content are coming very soon.
        </p>

        <p className="text-[11.5px] sm:text-xs font-medium text-(--text-muted) opacity-80 mt-1">
          Thanks for stopping by early! ✨
        </p>
      </div>

      {/* Fan Engagement Action Area */}
      <div className="p-4 sm:p-5 bg-(--card-bg) flex flex-col items-center">
        {isNudged ? (
          <div
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
              borderColor: "var(--surface-border)",
            }}
            className="w-full max-w-sm py-2.5 px-3 rounded-[5px] border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-semibold text-(--accent-text)"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Nudge Sent! You made {creatorName}&apos;s day ❤️</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNudge}
            disabled={isSubmitting}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--on-accent)",
            }}
            className="w-full max-w-sm min-h-[42px] py-2 px-4 rounded-[5px] font-medium text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer shadow-none select-none"
          >
            <Heart className="h-4 w-4 shrink-0 fill-current" />
            <span>
              {isSubmitting
                ? "Sending nudge..."
                : `Let ${creatorName} know you're waiting`}
            </span>
          </button>
        )}

        <p className="text-[11px] text-(--text-muted) font-normal mt-2">
          {isNudged
            ? "We let the creator know you visited their profile!"
            : "Tap to send a quick nudge & motivate the creator to add updates."}
        </p>
      </div>
    </div>
  );
}
