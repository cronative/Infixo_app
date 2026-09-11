"use client";

import Link from "next/link";
import { ArrowLeft, Cookie, Shield, Sliders, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { openCookiePreferences } from "@/lib/cookieConsent";

export default function CookiePolicyPage() {
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
            <Cookie className="h-4 w-4" />
            <span>PRIVACY &amp; TRANSPARENCY</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#181716] tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm font-semibold text-[#797570]">
            Last Updated: August 19, 2026 • Inflixo
          </p>
        </div>

        {/* Quick Preference Callout Card */}
        <div className="rounded-2xl bg-white border border-[#E7E3DC] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-[#111110]">
              Manage Your Cookie Preferences
            </h2>
            <p className="text-xs sm:text-sm text-[#54514D]">
              You can review or change your cookie consent preferences at any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCookiePreferences()}
            className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-[#151933] hover:bg-brand-hover text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer tap-scale"
          >
            <Sliders className="h-4 w-4" />
            <span>Cookie Preferences</span>
          </button>
        </div>

        {/* Cookie Policy Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[#54514D] font-normal">
          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device (computer, tablet, or smartphone) when you visit our website. They help us ensure the platform operates smoothly, enhance security, remember your preferences, and understand how visitors interact with our pages so we can make continuous improvements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              2. Cookie Categories We Use
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Category 1: Essential */}
              <div className="p-5 rounded-2xl bg-white border border-[#E7E3DC] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#181716]">
                    Essential Cookies
                  </h3>
                  <span className="text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full border border-[#17845B]/25">
                    Always On
                  </span>
                </div>
                <p className="text-xs text-[#54514D]">
                  Strictly necessary for user authentication, security, rate limiting, and core platform operation. These cannot be switched off.
                </p>
              </div>

              {/* Category 2: Analytics */}
              <div className="p-5 rounded-2xl bg-white border border-[#E7E3DC] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#181716]">
                    Analytics Cookies
                  </h3>
                  <span className="text-[10px] font-bold text-[#797570] bg-[#F4F2EB] px-2.5 py-0.5 rounded-full border border-[#E2DDD5]">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#54514D]">
                  Help us measure aggregated metrics like page views, bounce rates, and user paths (via Google Analytics 4) to improve website speed and features.
                </p>
              </div>

              {/* Category 3: Marketing */}
              <div className="p-5 rounded-2xl bg-white border border-[#E7E3DC] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#181716]">
                    Marketing Cookies
                  </h3>
                  <span className="text-[10px] font-bold text-[#797570] bg-[#F4F2EB] px-2.5 py-0.5 rounded-full border border-[#E2DDD5]">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#54514D]">
                  Used only if Inflixo activates campaign performance attribution or advertising conversion tracking. We do not sell creator data to advertisers.
                </p>
              </div>

              {/* Category 4: Functional */}
              <div className="p-5 rounded-2xl bg-white border border-[#E7E3DC] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#181716]">
                    Functional Cookies
                  </h3>
                  <span className="text-[10px] font-bold text-[#797570] bg-[#F4F2EB] px-2.5 py-0.5 rounded-full border border-[#E2DDD5]">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#54514D]">
                  Remember your UI preferences, such as selected pricing intervals or preview states, across sessions.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
              3. How to Manage or Revoke Consent
            </h2>
            <p>
              You can change your consent choices at any time by clicking the &quot;Cookie Preferences&quot; link in our website footer or by using the button above. When you modify your preferences, non-essential cookies are immediately updated to match your selection.
            </p>
            <p>
              Additionally, you can configure your web browser settings to block or delete cookies entirely. Note that disabling essential cookies may impact the proper functioning of your Inflixo account and dashboard.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E7E3DC] pt-6">
            <h2 className="font-display text-xl font-bold text-[#181716]">
              4. Contact Us
            </h2>
            <p className="text-sm font-medium text-[#54514D]">
              If you have any questions regarding our cookie practices, please contact our compliance team:
            </p>
            <div className="rounded-2xl bg-white border border-[#E7E3DC] p-4 space-y-1 text-xs sm:text-sm font-semibold text-[#181716]">
              <p>TrustIQ Labs PVT LTD — Inflixo Compliance Division</p>
              <p className="text-[#151933]">Email: privacy@inflixo.com</p>
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
            <Link href="/cookies" className="text-[#151933] font-bold">Cookie Policy</Link>
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="hover:text-brand-primary transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
            <Link href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[#797570]">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
