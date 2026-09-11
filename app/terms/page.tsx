import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CookiePreferencesButton } from "@/components/shared/CookiePreferencesButton";

export const metadata = {
  title: "Terms of Service — Inflixo",
  description: "Read the Terms of Service governing creator profiles, content ownership, and platform usage on Inflixo.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-dvh bg-[#FAF9F6] text-[#181716] flex flex-col font-sans selection:bg-[#151933]/10 selection:text-[#151933]">
      {/* Navbar */}
      <header className="safe-top sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E7E3DC]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#E7E3DC] bg-white px-4 py-2 text-xs font-bold text-[#54514D] hover:text-brand-primary hover:border-brand-primary/30 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-16 flex-1 text-left space-y-10">
        {/* Header Banner */}
        <div className="space-y-3 border-b border-[#E7E3DC] pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#151933]/[0.09] border border-[#151933]/20 px-3 py-1 text-xs font-bold text-[#151933]">
            <FileText className="h-4 w-4" />
            <span>TERMS &amp; CONDITIONS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#181716] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm font-semibold text-[#797570]">
            Last Updated: August 19, 2026 • Inflixo
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[#54514D] font-normal">
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using the <strong>Inflixo</strong> platform (operated by TrustIQ Labs PVT LTD), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all terms, you may not use our creator page builder, social fanbase tools, or series portfolio features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              2. Creator Content Ownership
            </h2>
            <p>
              <strong>You retain 100% full ownership</strong> of all videos, series artwork, thumbnails, copy, and trademarks that you link or upload to your Inflixo profile. Inflixo does not claim any intellectual property rights over your content. You grant Inflixo a non-exclusive, worldwide license solely to host and display your content on your public creator page (`inflixo.com/yourname`).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
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
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              4. Subscriptions, Payments &amp; Free Trial
            </h2>
            <p>
              Inflixo may offer a <strong>7-day Free Trial</strong> where your public creator profile is live without payment. After the trial, your profile may become private until you upgrade to a paid plan.
            </p>
            <p>
              When paid subscriptions or services are activated, billing and payment processing are handled by our registered legal entity, <strong>TrustIQ Labs PVT LTD</strong>. Charges on your bank or credit card statement will appear under <strong>TrustIQ Labs PVT LTD</strong> or <strong>Inflixo</strong>. Advance notification and transparent pricing will always be provided before any billing occurs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              5. Service Availability &amp; Modifications
            </h2>
            <p>
              We strive for 99.9% uptime for all creator pages. However, TrustIQ Labs PVT LTD reserves the right to modify, update, or temporarily suspend aspects of the service for scheduled maintenance, performance optimizations, or platform upgrades.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              6. Account Termination
            </h2>
            <p>
              You may close your Inflixo account at any time from your settings panel. Inflixo reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E7E3DC] pt-6">
            <h2 className="font-display text-xl font-bold text-[#181716]">
              7. Contact Legal Team
            </h2>
            <p className="text-sm font-medium text-[#54514D]">
              For any legal inquiries, copyright notices (DMCA), or terms clarification, please contact:
            </p>
            <div className="rounded-2xl bg-white border border-[#E7E3DC] p-4 space-y-1 text-xs sm:text-sm font-semibold text-[#181716]">
              <p>TrustIQ Labs PVT LTD — Inflixo Terms &amp; Compliance</p>
              <p className="text-[#151933]">Email: legal@inflixo.com</p>
            </div>
          </section>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#E7E3DC] bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#54514D]">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link href="/#pricing" className="hover:text-brand-primary transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-brand-primary transition-colors">Cookie Policy</Link>
            <CookiePreferencesButton className="hover:text-brand-primary transition-colors cursor-pointer font-semibold" />
            <Link href="/terms" className="text-[#151933] font-bold">Terms of Service</Link>
          </div>
          <p className="text-[#797570]">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
