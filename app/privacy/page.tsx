import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2, ExternalLink, HelpCircle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CookiePreferencesButton } from "@/components/shared/CookiePreferencesButton";

export const metadata = {
  title: "Privacy Policy — Inflixo",
  description: "Learn how Inflixo protects creator data, social connection privacy, YouTube API compliance, and account security.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-[#FAF9F6] text-[#181716] flex flex-col font-sans selection:bg-[#043084]/10 selection:text-[#043084]">
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#043084]/[0.09] border border-[#043084]/20 px-3 py-1 text-xs font-bold text-[#043084]">
            <ShieldCheck className="h-4 w-4" />
            <span>LEGAL &amp; PRIVACY COMPLIANCE</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#181716] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm font-semibold text-[#797570]">
            Last Updated: September 19, 2026 • Inflixo (TrustIQ Labs PVT LTD)
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-9 text-sm sm:text-base leading-relaxed text-[#54514D] font-normal">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              1. Overview &amp; Commitment
            </h2>
            <p>
              At <strong>Inflixo</strong> (operated by <strong>TrustIQ Labs PVT LTD</strong>, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are deeply committed to safeguarding the personal and platform data of content creators and their audiences. This Privacy Policy outlines how we collect, store, use, process, and protect your information when you visit our website, build public creator profiles (`inflixo.com/yourname`), connect social accounts, or interact with our services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              2. Information We Collect
            </h2>
            <div className="space-y-2">
              <p className="font-bold text-[#181716]">A. Creator Account Information:</p>
              <p>
                When you sign up or build a profile on Inflixo, we collect your email address, unique username (handle), display name, category, biography, profile photo URL, and contact details for business collaborations.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-bold text-[#181716]">B. Connected Social Platform Metrics:</p>
              <p>
                When you connect your YouTube, Instagram, or Facebook channels via authorized OAuth authorization APIs, we fetch publicly available platform metrics such as follower and subscriber counts, channel names, and verified status solely to calculate and display your <strong>Total Fanbase</strong> on your public profile.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-bold text-[#181716]">C. Content, Series &amp; Episode Metadata:</p>
              <p>
                Titles, descriptions, episode numbers, thumbnail/poster image URLs, and external video URLs that creators organize into <strong>Series and Playlists</strong> for their viewers.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-bold text-[#181716]">D. Technical &amp; Usage Information:</p>
              <p>
                Standard server logs, browser type, device operating system, referring URLs, and aggregated page engagement metrics to ensure platform security, prevent malicious scraping, and diagnose system performance.
              </p>
            </div>
          </section>

          {/* Section 3 - CRITICAL GOOGLE / YOUTUBE MANDATORY DISCLOSURE */}
          <section className="space-y-3 rounded-2xl border border-[#043084]/25 bg-[#043084]/[0.03] p-5 sm:p-6 text-[#181716]">
            <div className="flex items-center gap-2 text-[#043084]">
              <Lock className="h-5 w-5 shrink-0" />
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                3. YouTube API Services Compliance &amp; Google User Data
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#334155]">
              Inflixo uses <strong>YouTube API Services</strong> to allow creators to link their YouTube channels, display up-to-date public subscriber counts, and curate their YouTube videos into sequential series for fans.
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-[#334155]">
              <p className="font-semibold text-[#181716]">By using Inflixo YouTube integrations, you acknowledge and agree to the following:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#54514D]">
                <li>
                  Your use of connected YouTube features is bound by the{" "}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#043084] underline hover:text-brand-hover inline-flex items-center gap-0.5"
                  >
                    YouTube Terms of Service
                    <ExternalLink className="h-3 w-3" />
                  </a>.
                </li>
                <li>
                  Google&apos;s privacy practices regarding data collected via YouTube API Services are governed by the{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#043084] underline hover:text-brand-hover inline-flex items-center gap-0.5"
                  >
                    Google Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </a>.
                </li>
                <li>
                  <strong>Revoking Access:</strong> You can disconnect your YouTube channel at any time from your Inflixo Dashboard settings. In addition, you can review or revoke Inflixo&apos;s access to your Google/YouTube data at any time via the official{" "}
                  <a
                    href="https://security.google.com/settings/security/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#043084] underline hover:text-brand-hover inline-flex items-center gap-0.5"
                  >
                    Google Security Settings Page
                    <ExternalLink className="h-3 w-3" />
                  </a>.
                </li>
                <li>
                  <strong>Storage &amp; Data Refresh:</strong> Inflixo only accesses and temporarily caches public channel metadata and video links. We cache this data for a maximum of 30 days to optimize page loading. We do not access or store private videos, Google Drive files, or account passwords.
                </li>
                <li>
                  <strong>No Sale or Sharing of API Data:</strong> Inflixo does not sell, rent, or transfer YouTube API data to external parties, data brokers, or advertising networks.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              4. Meta Platforms (Instagram &amp; Facebook) Integration
            </h2>
            <p>
              When creators connect Instagram or Facebook, we interact through official Meta Graph APIs governed by the{" "}
              <a
                href="https://www.facebook.com/privacy/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#043084] underline hover:text-brand-hover inline-flex items-center gap-0.5"
              >
                Meta Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </a>. We solely query public follower numbers and profile identifiers. We never publish posts to your social feeds without explicit consent, and we never access private messages or payment information.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              5. How We Use Your Information
            </h2>
            <p>We use collected data solely for the following legitimate purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To host, personalize, and publish your custom creator landing page (`inflixo.com/yourname`).</li>
              <li>To compute your aggregate Total Fanbase count across authorized platforms.</li>
              <li>To organize your video content into bingeable series, playlists, and episodes.</li>
              <li>To dispatch authentication one-time-passwords (OTP) and account security notifications.</li>
              <li>To provide customer support and resolve technical or billing inquiries.</li>
            </ul>
            <p className="font-semibold text-[#181716] pt-1">
              We never sell, rent, or trade your personal or creator information to third-party advertisers or data brokers.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              6. Data Security &amp; Storage
            </h2>
            <p>
              We implement industry-grade security measures including SSL/TLS 256-bit encryption for all data in transit, encrypted storage protocols, and strict access controls. OAuth access tokens are secured in private databases and refreshed according to platform guidelines. We never collect or store your social media passwords.
            </p>
          </section>

          {/* Section 7 - USER DATA DELETION INSTRUCTIONS */}
          <section className="space-y-3 rounded-xl border border-[#E7E3DC] bg-white p-5 text-[#181716]">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#181716]">
              7. User Data Deletion Instructions (Meta, Google &amp; Account Erasure)
            </h2>
            <p className="text-sm text-[#54514D]">
              Inflixo provides simple, immediate methods for creators to remove their data or delete their accounts:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#54514D]">
              <li>
                <strong>Self-Service Social Disconnection:</strong> You can disconnect any connected YouTube, Instagram, or Facebook account at any time directly in your <strong>Creator Dashboard &gt; Socials</strong> tab. When disconnected, cached tokens and platform data are purged immediately.
              </li>
              <li>
                <strong>Complete Account Erasure Request:</strong> To delete your entire Inflixo account, profile data, series links, and database records, submit a deletion request by emailing{" "}
                <strong className="text-[#043084]">privacy@inflixo.com</strong> with the subject line <em>&quot;Data Deletion Request&quot;</em> from your registered account email. All personal data will be permanently wiped from our active databases within 30 days.
              </li>
            </ol>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Inflixo is intended for content creators and viewers who are at least 13 years of age (or 18+ for paid subscriptions and commercial services). We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information without parental consent, please contact us at <strong className="text-[#043084]">privacy@inflixo.com</strong>, and we will promptly delete such records.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              9. Statutory Compliance &amp; Grievance Redressal (IT Act 2000 &amp; DPDP Act 2023)
            </h2>
            <p>
              In compliance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Digital Personal Data Protection Act, 2023</strong> (India), the contact details of our designated Grievance Officer are published below:
            </p>
            <div className="rounded-2xl bg-white border border-[#E7E3DC] p-5 space-y-2 text-xs sm:text-sm font-semibold text-[#181716]">
              <p className="font-bold text-base text-[#043084]">Grievance Officer</p>
              <p>TrustIQ Labs PVT LTD — Legal &amp; Compliance Division</p>
              <p className="text-[#54514D]">Email: <a href="mailto:grievance@inflixo.com" className="text-[#043084] underline">grievance@inflixo.com</a> (copy to <a href="mailto:privacy@inflixo.com" className="text-[#043084] underline">privacy@inflixo.com</a>)</p>
              <p className="text-[#797570] font-normal text-xs pt-1">
                Response Timelines: All legitimate privacy grievances will be acknowledged within twenty-four (24) hours and resolved within fifteen (15) days of receipt.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              10. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              This Privacy Policy and any disputes related to personal data handling shall be governed by and construed in accordance with the laws of the Republic of India. Subject to applicable consumer rights, you agree to submit to the exclusive jurisdiction of the competent courts located in Ahmedabad, Gujarat, India.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3 border-t border-[#E7E3DC] pt-6">
            <h2 className="font-display text-xl font-bold text-[#181716]">
              11. Contact Privacy Team
            </h2>
            <p className="text-sm font-medium text-[#54514D]">
              If you have any questions, suggestions, or compliance inquiries, please feel free to reach out to our team at:
            </p>
            <div className="rounded-2xl bg-white border border-[#E7E3DC] p-4 space-y-1 text-xs sm:text-sm font-semibold text-[#181716]">
              <p>TrustIQ Labs PVT LTD — Inflixo</p>
              <p className="text-[#043084]">Email: privacy@inflixo.com</p>
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
            <Link href="/privacy" className="text-[#043084] font-bold">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-brand-primary transition-colors">Cookie Policy</Link>
            <CookiePreferencesButton className="hover:text-brand-primary transition-colors cursor-pointer font-semibold" />
            <Link href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[#797570]">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
