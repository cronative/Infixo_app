import { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { CreatorCollage } from "@/components/shared/CreatorCollage";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-white">
      {/* Left / form column */}
      <div className="flex w-full flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:w-[48%] lg:px-14 lg:py-12 xl:w-[45%] bg-white border-r border-slate-100 min-h-dvh">
        <div>
          <div className="mb-6 lg:mb-8">
            <Logo />
          </div>
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 font-semibold">
          &copy; {new Date().getFullYear()} Inflixo · A product by TrustIQ Labs
        </div>
      </div>

      {/* Right / visual column */}
      <div className="relative hidden flex-1 overflow-hidden lg:block bg-gradient-to-br from-[#651FFF] via-purple-700 to-[#500CD6]">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-blob" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none animate-blob" />

        <CreatorCollage />
      </div>
    </div>
  );
}
