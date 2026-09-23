"use client";

/**
 * SessionContext — replaces ALL localStorage reads.
 *
 * Usage in any client component:
 *   const { email, profile, subscription, socials, isLoading, isLoggedIn, refresh } = useSession();
 *
 * Data is fetched once on mount from GET /api/me (reads the httpOnly session cookie).
 * Call `refresh()` to re-fetch after mutations.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CreatorProfile, SocialAccounts, Subscription, CustomLink, EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { forceLogout } from "@/lib/authClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionState {
  /** Whether /api/me has completed its first fetch */
  isLoading: boolean;
  /** True if session cookie is valid */
  isLoggedIn: boolean;
  /** Whether the creator has never set a username yet */
  isNewUser: boolean;
  email: string;
  creatorId: string;
  profile: CreatorProfile | null;
  subscription: Subscription | null;
  /** Raw social rows from social_accounts table */
  socials: any[];
  customLinks: CustomLink[];
  onboardingStep: string;
  /** Refresh all session data from /api/me */
  refresh: () => Promise<void>;
  /** Locally update profile without re-fetching (optimistic) */
  setProfile: (profile: CreatorProfile) => void;
  /** Locally update subscription without re-fetching (optimistic) */
  setSubscription: (sub: Subscription) => void;
}

const defaultState: SessionState = {
  isLoading: true,
  isLoggedIn: false,
  isNewUser: false,
  email: "",
  creatorId: "",
  profile: null,
  subscription: null,
  socials: [],
  customLinks: [],
  onboardingStep: "username",
  refresh: async () => {},
  setProfile: () => {},
  setSubscription: () => {},
};

const SessionContext = createContext<SessionState>(defaultState);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<SessionState, "refresh" | "setProfile" | "setSubscription">>(
    {
      isLoading: true,
      isLoggedIn: false,
      isNewUser: false,
      email: "",
      creatorId: "",
      profile: null,
      subscription: null,
      socials: [],
      customLinks: [],
      onboardingStep: "username",
    }
  );

  // Tracks whether this browser tab has already confirmed a valid session.
  // Only THEN do we treat a later "not authenticated" response as the
  // session having expired/been revoked — an anonymous first visit to a
  // public page should never trigger a forced logout/redirect.
  const wasLoggedIn = useRef(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) {
        if (wasLoggedIn.current) {
          forceLogout();
          return;
        }
        setState((s) => ({ ...s, isLoading: false, isLoggedIn: false }));
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        if (wasLoggedIn.current) {
          forceLogout();
          return;
        }
        setState((s) => ({ ...s, isLoading: false, isLoggedIn: false }));
        return;
      }
      wasLoggedIn.current = true;
      setState({
        isLoading: false,
        isLoggedIn: true,
        isNewUser: Boolean(data.isNewUser),
        email: data.email || "",
        creatorId: data.creatorId || "",
        profile: data.profile || null,
        subscription: data.subscription || null,
        socials: data.socials || [],
        customLinks: data.customLinks || [],
        onboardingStep: data.onboardingStep || "username",
      });
    } catch {
      setState((s) => ({ ...s, isLoading: false, isLoggedIn: false }));
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const setProfile = useCallback((profile: CreatorProfile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const setSubscription = useCallback((subscription: Subscription) => {
    setState((s) => ({ ...s, subscription }));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        refresh: fetchSession,
        setProfile,
        setSubscription,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionState {
  return useContext(SessionContext);
}

// ─── Utility: build SocialAccounts shape from raw DB rows ─────────────────────

export function buildSocialAccounts(socials: any[]): SocialAccounts {
  const accounts: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
  for (const s of socials || []) {
    const platform = (s.platform || "").toLowerCase();
    const handle = (s.username || s.accountName || "").replace(/^@/, "").trim();
    if (!handle) continue;
    if (platform === "instagram") {
      accounts.instagram = {
        ...accounts.instagram,
        username: handle,
        name: s.accountName || handle,
        followers: s.followerCount ?? 0,
        posts: s.mediaCount ?? 0,
        isVerified: Boolean(s.isVerified),
        url: `https://instagram.com/${handle}`,
        lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
      };
    } else if (platform === "youtube") {
      accounts.youtube = {
        ...accounts.youtube,
        username: handle,
        channelTitle: s.accountName || handle,
        subscribers: s.followerCount ?? 0,
        videos: s.mediaCount ?? 0,
        isVerified: Boolean(s.isVerified),
        url: `https://youtube.com/@${handle}`,
        lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
      };
    } else if (platform === "facebook") {
      accounts.facebook = {
        ...accounts.facebook,
        username: handle,
        name: s.accountName || handle,
        followers: s.followerCount ?? 0,
        posts: s.mediaCount ?? 0,
        isVerified: Boolean(s.isVerified),
        url: `https://facebook.com/${handle}`,
        lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
      };
    }
  }
  return accounts;
}
