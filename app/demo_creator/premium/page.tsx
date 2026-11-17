import { permanentRedirect } from "next/navigation";

/** The premium layout is the only profile layout now; old links go to the demo profile. */
export default function DemoCreatorPremiumPage() {
  permanentRedirect("/demo_creator");
}
