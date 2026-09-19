import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CookiePreferencesButton } from "@/components/shared/CookiePreferencesButton";

export const metadata = {
  title: "Terms of Service — Inflixo",
  description: "Read the Terms of Service governing creator profiles, content ownership, subscriptions, refunds, and platform usage on Inflixo.",
};

export default function TermsOfServicePage() {
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
            <FileText className="h-4 w-4" />
            <span>TERMS &amp; CONDITIONS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#181716] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm font-semibold text-[#797570]">
            Last Updated: September 19, 2026 • Inflixo (TrustIQ Labs PVT LTD)
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-9 text-sm sm:text-base leading-relaxed text-[#54514D] font-normal">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              1. Acceptance of Terms &amp; Eligibility
            </h2>
            <p>
              By accessing, browsing, registering for, or using the <strong>Inflixo</strong> platform (operated by <strong>TrustIQ Labs PVT LTD</strong>, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to all provisions of these Terms, you may not access or use our creator profile tools, series organization features, or fanbase calculators.
            </p>
            <p>
              You represent and warrant that you are at least thirteen (13) years of age (or eighteen (18) years of age for commercial monetization or subscription billing) and have the full legal capacity to enter into these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              2. Creator Content Ownership (100% Full Rights)
            </h2>
            <p>
              <strong>You retain 100% full intellectual property ownership</strong> of all videos, series titles, thumbnails, episode media, trademarks, logos, and custom links that you post or link to your Inflixo profile. Inflixo does not claim any ownership rights over your creative work.
            </p>
            <p>
              You grant Inflixo a non-exclusive, worldwide, royalty-free license solely for the technical purpose of hosting, caching, displaying, and formatting your content on your public profile (`inflixo.com/yourname`) and generating your public link previews.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              3. Creator Responsibilities &amp; Acceptable Use
            </h2>
            <p>You agree that you will NOT use Inflixo to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Impersonate another person, content creator, celebrity, or organization.</li>
              <li>Connect social channels or claim handles that you do not legitimately own or control.</li>
              <li>Upload or link to illegal, hateful, harassing, defamatory, fraudulent, or sexually explicit material.</li>
              <li>Infringe upon any third-party copyrights, trademarks, privacy rights, or publicity rights.</li>
              <li>Engage in automated scraping, server disruption, denial-of-service, or distribute malicious code.</li>
              <li>Use the platform for spamming, pyramid schemes, or unauthorized affiliate redirects.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              4. Third-Party Platforms &amp; YouTube API Terms
            </h2>
            <p>
              Inflixo connects with third-party platforms to display public follower metrics and embed video series. When you link or display YouTube videos on Inflixo, you acknowledge that your use is also subject to the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#043084] underline hover:text-brand-hover inline-flex items-center gap-0.5"
              >
                YouTube Terms of Service
                <ExternalLink className="h-3 w-3" />
              </a>.
            </p>
            <p className="text-xs sm:text-sm text-[#797570]">
              Inflixo is an independent creator portfolio tool and is not endorsed by, sponsored by, or affiliated with Google LLC, YouTube, Meta Platforms Inc., Instagram, or Facebook.
            </p>
          </section>

          {/* Section 5 - BILLING, FREE TRIAL, CANCELLATION & REFUNDS */}
          <section className="space-y-3 rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 text-[#181716]">
            <h2 className="font-display text-xl font-bold text-[#181716]">
              5. Free Trial, Subscriptions, Cancellation &amp; Refund Policy
            </h2>
            <div className="space-y-3 text-sm text-[#54514D]">
              <div>
                <p className="font-bold text-[#181716]">A. 7-Day Free Trial Policy:</p>
                <p className="pt-0.5">
                  Inflixo offers a <strong>7-day Free Trial</strong> to new creators at <strong>₹0</strong> with no credit card required. During the trial period, your public creator profile (`inflixo.com/yourname`) is fully public. <strong>After the 7-day trial ends, your profile automatically becomes private (fans and visitors cannot view it)</strong> until you choose a paid subscription plan. There are no automatic billing charges upon trial expiration.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E7E3DC]">
                <p className="font-bold text-[#181716]">B. Subscription Billing:</p>
                <p className="pt-0.5">
                  Paid plans (such as Starter or Pro) are billed in advance on a recurring monthly or annual basis. Billing is processed securely through authorized payment gateways by <strong>TrustIQ Labs PVT LTD</strong>. Charges will appear on your card or bank statement as <em>&quot;Inflixo&quot;</em> or <em>&quot;TrustIQ Labs PVT LTD&quot;</em>.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E7E3DC]">
                <p className="font-bold text-[#181716]">C. Cancellation Terms:</p>
                <p className="pt-0.5">
                  You can cancel your subscription at any time directly through your <strong>Creator Dashboard &gt; Subscription</strong> settings. When you cancel, your account remains active with full paid features until the end of your current billing period. No further renewals will be charged.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E7E3DC]">
                <p className="font-bold text-[#181716]">D. Refund Policy:</p>
                <p className="pt-0.5">
                  Due to the immediate provisioning of digital profile hosting, creator tools, and cloud storage, subscription payments are non-refundable once the billing period has commenced. If you believe you were charged in error due to a technical duplicate transaction, please contact us at <strong className="text-[#043084]">billing@inflixo.com</strong> within seven (7) days of the transaction. Legitimate duplicate or erroneous charges will be refunded in full to the original payment method within 7–10 business days.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 - COPYRIGHT & DMCA TAKEDOWN */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              6. Intellectual Property &amp; Copyright Takedown (DMCA / Indian Copyright Act)
            </h2>
            <p>
              Inflixo complies with the <strong>Indian Copyright Act, 1957</strong> and the safe harbor notice provisions of the <strong>Digital Millennium Copyright Act (DMCA)</strong>. We respect intellectual property rights and will promptly remove content that infringes upon verified copyrights.
            </p>
            <div className="rounded-xl border border-[#E7E3DC] bg-white p-4 space-y-2 text-xs sm:text-sm text-[#54514D]">
              <p className="font-semibold text-[#181716]">To file a copyright infringement notice, email our designated Copyright Agent at <strong className="text-[#043084]">legal@inflixo.com</strong> with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The exact Inflixo URL (`inflixo.com/...`) where the infringing material appears.</li>
                <li>Your contact information (name, address, telephone number, and email).</li>
                <li>A statement of good faith belief that the disputed use is not authorized by the copyright owner.</li>
                <li>A physical or electronic signature of the authorized copyright holder.</li>
              </ul>
              <p className="text-[#797570] text-xs pt-1">
                <strong>Repeat Infringer Policy:</strong> Inflixo reserves the right to terminate accounts that repeatedly infringe upon third-party copyrights.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              7. Disclaimer of Warranties (&quot;AS IS&quot;)
            </h2>
            <p>
              The Inflixo service is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis, without warranties of any kind, whether express, statutory, or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, non-infringement, or that the service will be error-free or uninterrupted.
            </p>
            <p className="text-xs sm:text-sm text-[#797570]">
              Inflixo does not guarantee any specific follower growth, sponsorship revenue, or audience viewership through the use of the platform.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall <strong>TrustIQ Labs PVT LTD</strong>, its founders, officers, directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, audience, revenue, data, or reputation, resulting from your access to or use of (or inability to access or use) the service.
            </p>
            <p>
              In no event shall Inflixo&apos;s total aggregate liability for all claims related to the service exceed the actual amount paid by you to Inflixo in the twelve (12) months preceding the event giving rise to liability, or ₹1,000 INR (whichever is greater).
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              9. Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless TrustIQ Labs PVT LTD and its affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with your creator content, your violation of these Terms, or your violation of any third-party right.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              10. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms and any action related thereto shall be governed by and interpreted under the laws of the Republic of India. You agree that any legal dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Ahmedabad, Gujarat, India</strong>.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3 border-t border-[#E7E3DC] pt-6">
            <h2 className="font-display text-xl font-bold text-[#181716]">
              11. Contact &amp; Legal Notices
            </h2>
            <p className="text-sm font-medium text-[#54514D]">
              For all formal legal notices, terms clarifications, or compliance matters, please reach out to:
            </p>
            <div className="rounded-2xl bg-white border border-[#E7E3DC] p-4 space-y-1 text-xs sm:text-sm font-semibold text-[#181716]">
              <p>TrustIQ Labs PVT LTD — Inflixo Legal Division</p>
              <p className="text-[#043084]">Email: legal@inflixo.com (Support: support@inflixo.com)</p>
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
            <Link href="/terms" className="text-[#043084] font-bold">Terms of Service</Link>
          </div>
          <p className="text-[#797570]">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
