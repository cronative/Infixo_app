import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { creatorExists } from "@/lib/creatorExists";

/** Unknown usernames (and therefore every unknown top-level route) get a real 404 for all /[username]/* pages. */
export default async function CreatorLayout({ children, params }: { children: ReactNode; params: Promise<{ username: string }> }) {
  const { username } = await params;
  if ((await creatorExists(username)) === false) notFound();
  return children;
}
