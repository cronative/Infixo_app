import { permanentRedirect } from "next/navigation";

/** The tabbed ("simple") layout was removed; old links go to the demo profile. */
export default function DemoCreatorSimplePage() {
  permanentRedirect("/demo_creator");
}
