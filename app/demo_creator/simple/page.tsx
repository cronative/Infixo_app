"use client";

import { Suspense } from "react";
import { DemoCreatorContent } from "../page";

export default function DemoCreatorSimplePage() {
  return (
    <Suspense fallback={null}>
      <DemoCreatorContent forcedLayout="tabs" />
    </Suspense>
  );
}
