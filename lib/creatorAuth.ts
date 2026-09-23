import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, type SessionPayload } from "@/lib/session";

export interface AuthenticatedCreator {
  id: string;
  email: string;
  username: string;
}

type CreatorAuthResult =
  | { session: SessionPayload; creator: AuthenticatedCreator; error: null }
  | { session: null; creator: null; error: NextResponse };

export async function requireCreator(req: Request): Promise<CreatorAuthResult> {
  const auth = requireSession(req);
  if (auth.error) return { session: null, creator: null, error: auth.error };

  const [rows]: any = await db.query(
    "SELECT id, email, username FROM creators WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [auth.session.email]
  );
  const creator = rows?.[0];
  if (!creator) {
    return {
      session: null,
      creator: null,
      error: NextResponse.json({ error: "Creator profile not found" }, { status: 404 }),
    };
  }

  return {
    session: auth.session,
    creator: { id: creator.id, email: creator.email, username: creator.username || "" },
    error: null,
  };
}

export function requireOwnedEmail(req: Request, email: string | null | undefined) {
  const auth = requireSession(req);
  if (auth.error) return auth;
  if (email && auth.session.email !== email.trim().toLowerCase()) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return auth;
}
