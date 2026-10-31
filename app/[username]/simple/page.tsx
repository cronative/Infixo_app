import { Suspense } from "react";
import PublicProfileClient from "../PublicProfileClient";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";

export default function UserSimpleProfilePage() {
  return (
    <Suspense fallback={<SkeletonProfileCard />}>
      <PublicProfileClient forcedLayout="tabs" />
    </Suspense>
  );
}
