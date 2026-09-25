import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ShopAliasPage({ params }: PageProps) {
  const { username } = await params;
  const cleanHandle = decodeURIComponent(username || "").replace(/^@/, "");
  redirect(`/${cleanHandle}/products`);
}
