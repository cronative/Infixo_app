import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Terms of Service — Inflixo",
  description: "Read the Terms of Service governing creator profiles, content ownership, and platform usage on Inflixo.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-dvh bg-[#FAF8FF] text-[#0F172A] flex flex-col font-sans selection:bg-purple-100 selection:text-[#803D63]">
      {/* Navbar */}
      <header className="safe-top sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100/80">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#803D63] hover:border-purple-300 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-16 flex-1 text-left space-y-10">
        {/* Header Banner */}
        <div className="space-y-3 border-b border-purple-200/80 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-[#803D63]">
            <FileText className="h-4 w-4" />
            <span>TERMS &amp; CONDITIONS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-normal">
            Terms of Service
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            Last Updated: August 19, 2026 • TrustIQ Labs / Inflixo
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 font-normal">
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using the <strong>Inflixo</strong> platform (operated by TrustIQ Labs), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all terms, you may not use our creator page builder, social fanbase tools, or series portfolio features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              2. Creator Content Ownership
            </h2>
            <p>
              <strong>You retain 100% full ownership</strong> of all videos, series artwork, thumbnails, copy, and trademarks that you link or upload to your Inflixo profile. Inflixo does not claim any intellectual property rights over your content. You grant Inflixo a non-exclusive, worldwide license solely to host and display your content on your public creator page (`inflixo.com/yourname`).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              3. Creator Responsibilities &amp; Acceptable Use
            </h2>
            <p>When creating and maintaining an Inflixo profile, you agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Misrepresent your identity or claim social accounts that do not belong to you.</li>
              <li>Upload or link to unlawful, abusive, harassing, defamatory, or pornographic material.</li>
              <li>Infringe upon third-party copyrights, trademarks, or proprietary rights.</li>
              <li>Engage in malicious automated scraping, spamming, or server disruption.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              4. Subscriptions &amp; Free Early Access
            </h2>
            <p>
              During the <strong>Early Access Phase</strong>, Inflixo features (including profile creation, connected socials, and up to 3 Series) are provided <strong>100% Free</strong> of charge. Paid Creator Pro monthly and yearly subscriptions may be introduced in future phases with transparent pricing and advance notification to all registered creators.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              5. Service Availability &amp; Modifications
            </h2>
            <p>
              We strive for 99.9% uptime for all creator pages. However, TrustIQ Labs reserves the right to modify, update, or temporarily suspend aspects of the service for scheduled maintenance, performance optimizations, or platform upgrades.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              6. Account Termination
            </h2>
            <p>
              You may close your Inflixo account at any time from your settings panel. Inflixo reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          <section className="space-y-3 border-t border-purple-200/80 pt-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              7. Contact Legal Team
            </h2>
            <p className="text-sm font-medium text-slate-600">
              For any legal inquiries, copyright notices (DMCA), or terms clarification, please contact:
            </p>
            <div className="rounded-2xl bg-white border border-purple-200 p-4 space-y-1 text-xs sm:text-sm font-semibold text-slate-800">
              <p>TrustIQ Labs — Inflixo Terms &amp; Compliance</p>
              <p className="text-[#803D63]">Email: legal@inflixo.com</p>
            </div>
          </section>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-purple-100 bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[#803D63] transition-colors">Home</Link>
            <Link href="/#pricing" className="hover:text-[#803D63] transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-[#803D63] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[#803D63] font-bold">Terms of Service</Link>
          </div>
          <p className="text-slate-400">&copy; 2026 Inflixo · TrustIQ Labs</p>
        </div>
      </footer>
    </div>
  );
}
