import { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { CreatorCollage } from "@/components/shared/CreatorCollage";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-white">
      {/* Left / form column */}
      <div className="flex w-full flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:w-[48%] lg:px-14 lg:py-12 xl:w-[45%] bg-white border-r border-slate-100 min-h-dvh">
        <div>
          <Logo />
        </div>

        {/* Vertically Centered Form Container */}
        <div className="mx-auto w-full max-w-sm my-auto py-6 sm:py-8">
          {children}
        </div>

        {/* Minimal Understated Footer */}
        <div className="text-center text-xs text-gray-400 font-medium pt-4">
          &copy; 2026 Inflixo · TrustIQ Labs
        </div>
      </div>

      {/* Right / visual column */}
      <div className="relative hidden flex-1 overflow-hidden lg:block bg-[#803D63]">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-blob" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none animate-blob" />

        <CreatorCollage />
      </div>
    </div>
  );
}
