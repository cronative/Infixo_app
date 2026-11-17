import { permanentRedirect } from "next/navigation";

/** The premium layout is the only profile layout now; old links go to the profile. */
export default async function UserPremiumProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  permanentRedirect(`/${encodeURIComponent(decodeURIComponent(username))}`);
}
