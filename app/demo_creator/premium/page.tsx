"use client";

import { Suspense } from "react";
import { DemoCreatorContent } from "../page";

export default function DemoCreatorPremiumPage() {
  return (
    <Suspense fallback={null}>
      <DemoCreatorContent forcedLayout="premium" />
    </Suspense>
  );
}
