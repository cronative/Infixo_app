"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorProvider } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";

export default function OnboardingRootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!AuthService.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auth gate after mount
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-inflixo-purple-light border-t-inflixo-purple" />
      </div>
    );
  }

  return <CreatorProvider>{children}</CreatorProvider>;
}
