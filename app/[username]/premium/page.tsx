import { Suspense } from "react";
import PublicProfileClient from "../PublicProfileClient";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";

export default function UserPremiumProfilePage() {
  return (
    <Suspense fallback={<SkeletonProfileCard />}>
      <PublicProfileClient forcedLayout="premium" />
    </Suspense>
  );
}
