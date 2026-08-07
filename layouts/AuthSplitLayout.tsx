import { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { CreatorCollage } from "@/components/shared/CreatorCollage";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Left / form column */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 sm:py-10 lg:w-[46%] lg:px-16 lg:py-12 xl:w-[42%]">
        <div className="mb-8 lg:mb-12">
          <Logo />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right / visual column */}
      <div
        className="relative hidden flex-1 overflow-hidden lg:block"
        style={{ backgroundImage: "var(--gradient-premium)" }}
      >
        <CreatorCollage />
      </div>
    </div>
  );
}
