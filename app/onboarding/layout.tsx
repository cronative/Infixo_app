"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorProvider } from "@/contexts/CreatorContext";
import { useSession } from "@/contexts/SessionContext";
import { AuthService } from "@/services/AuthService";
import { forceLogout } from "@/lib/authClient";

export default function OnboardingRootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  // Server-verified source of truth — if the httpOnly session cookie has
  // expired or been revoked, this catches it even when the local
  // (localStorage) check above still says "logged in". SessionContext may
  // have last fetched before this login happened (e.g. mounted on /login
  // pre-auth), so we explicitly re-fetch here and wait for THAT fetch
  // before ever deciding to force a logout — never trust a stale snapshot.
  const { isLoggedIn: sessionLoggedIn, refresh } = useSession();
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    if (!AuthService.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    let cancelled = false;
    setSessionVerified(false);
    refresh().finally(() => {
      if (!cancelled) setSessionVerified(true);
    });
    return () => {
      cancelled = true;
    };
  }, [checked, refresh]);

  useEffect(() => {
    if (checked && sessionVerified && !sessionLoggedIn) {
      forceLogout();
    }
  }, [checked, sessionVerified, sessionLoggedIn]);

  if (!checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-inflixo-purple-light border-t-inflixo-purple" />
      </div>
    );
  }

  return <CreatorProvider>{children}</CreatorProvider>;
}
