import type { ReactNode } from "react";
import { demoCreatorMetadata } from "@/lib/demoCreatorMetadata";

export const metadata = demoCreatorMetadata({ path: "products", label: "Shop" });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
