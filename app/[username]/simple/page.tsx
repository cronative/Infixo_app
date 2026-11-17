import { permanentRedirect } from "next/navigation";

/** The tabbed ("simple") layout was removed; old links go to the profile. */
export default async function UserSimpleProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  permanentRedirect(`/${encodeURIComponent(decodeURIComponent(username))}`);
}
