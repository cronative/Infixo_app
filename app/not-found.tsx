import Link from "next/link";
import { ArrowLeft, Sparkles, Compass } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between bg-[#f8fafc] text-[#043084] selection:bg-[#04308414] selection:text-[#043084]">
      {/* Header */}
      <header className="w-full border-b border-[#e2e8f0] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo size="sm" />
          <Link
            href="/login"
            className="rounded-lg bg-[#043084] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#032569] shadow-xs"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-[#e2e8f0] bg-white p-8 sm:p-12 shadow-sm space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#04308412] px-3.5 py-1 text-xs font-black text-[#043084] border border-[#043084]/15">
            <Compass className="h-3.5 w-3.5 text-[#043084]" />
            <span>404 — PAGE NOT FOUND</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#043084]">
              Lost in the Link Universe?
            </h1>
            <p className="text-sm font-medium text-[#64748b] max-w-md mx-auto leading-relaxed">
              This page or creator profile does not exist yet. If you are a creator, you can claim this username and launch your own Inflixo bio link today!
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#043084] px-6 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#032569] hover:-translate-y-0.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Homepage</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#043084] bg-white px-6 py-3 text-xs font-extrabold text-[#043084] transition-all hover:bg-[#04308412] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#043084]" />
              <span>Claim Your Username</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#e2e8f0] bg-white py-4 text-center text-xs text-[#94a3b8]">
        © {new Date().getFullYear()} Inflixo. One Link for Creators & Fanbase.
      </footer>
    </div>
  );
}
