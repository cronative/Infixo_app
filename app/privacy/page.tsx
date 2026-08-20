import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Privacy Policy — Inflixo",
  description: "Learn how Inflixo protects creator data, social connection privacy, and account security.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="h-4 w-4" />
            <span>LEGAL &amp; PRIVACY</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-normal">
            Privacy Policy
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            Last Updated: August 19, 2026 • TrustIQ Labs / Inflixo
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 font-normal">
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              1. Overview &amp; Commitment
            </h2>
            <p>
              At <strong>Inflixo</strong> (operated by TrustIQ Labs), we respect your privacy and are committed to protecting the personal and social account data of content creators and their audiences. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use our website, creator profile services, and platform integrations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              2. Information We Collect
            </h2>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">A. Account Information:</p>
              <p>
                When you create an account, we collect your email address, creator handle (username), display name, profile photo URL, and bio information.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-semibold text-slate-900">B. Connected Social Platform Data:</p>
              <p>
                When you connect your Instagram, YouTube, or Facebook accounts via authorized OAuth APIs, we fetch publicly available metrics such as follower/subscriber counts, channel titles, and post counts solely to calculate and display your <strong>Total Fanbase</strong> on your public profile.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-semibold text-slate-900">C. Content &amp; Series Metadata:</p>
              <p>
                Titles, descriptions, poster thumbnails, and external video URLs added to your organized content <strong>Series</strong>.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To construct and host your official public creator profile (`inflixo.com/yourname`).</li>
              <li>To aggregate your combined audience metrics across connected social platforms.</li>
              <li>To organize your part-wise videos into binge-worthy Series for your audience.</li>
              <li>To provide account security, authentication OTP dispatches, and transactional updates.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              4. Data Protection &amp; Security
            </h2>
            <p>
              We implement industry-standard encryption protocols (TLS/SSL) for all data in transit and at rest. We never request or store your private social media passwords. All platform connections are performed via official, scoped OAuth authorization tokens. We do <strong>NOT</strong> sell or rent your personal data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              5. Third-Party API Services
            </h2>
            <p>
              Inflixo integrates with official APIs provided by Meta (Instagram &amp; Facebook Graph API) and Google (YouTube Data API v3). Your use of these connected features is also governed by the respective privacy policies of Meta Platforms Inc. and Google LLC. You can disconnect connected social accounts from your Inflixo settings at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              6. Your Rights &amp; Account Erasure
            </h2>
            <p>
              You maintain full ownership of your profile data. You have the right to inspect, edit, or request complete deletion of your Inflixo creator profile, series listings, and connected social tokens. To request complete account erasure, email us at <strong className="text-[#803D63]">privacy@inflixo.com</strong>.
            </p>
          </section>

          <section className="space-y-3 border-t border-purple-200/80 pt-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              7. Contact Privacy Team
            </h2>
            <p className="text-sm font-medium text-slate-600">
              If you have any questions or concerns regarding this Privacy Policy, please reach out to our privacy compliance office at:
            </p>
            <div className="rounded-2xl bg-white border border-purple-200 p-4 space-y-1 text-xs sm:text-sm font-semibold text-slate-800">
              <p>TrustIQ Labs — Inflixo Legal Division</p>
              <p className="text-[#803D63]">Email: privacy@inflixo.com</p>
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
            <Link href="/privacy" className="text-[#803D63] font-bold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#803D63] transition-colors">Terms of Service</Link>
          </div>
          <p className="text-slate-400">&copy; 2026 Inflixo · TrustIQ Labs</p>
        </div>
      </footer>
    </div>
  );
}
