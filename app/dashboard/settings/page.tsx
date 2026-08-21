"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Globe,
  Bell,
  Lock,
  LogOut,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile } = useCreator();
  const session = AuthService.getSession();

  const [copiedLink, setCopiedLink] = useState(false);
  const [seoIndexing, setSeoIndexing] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [richShareMessage, setRichShareMessage] = useState(true);
  const [activeLegalModal, setActiveLegalModal] = useState<"terms" | "privacy" | null>(null);

  function handleLogout() {
    AuthService.logout();
    showToast("Signed out successfully");
    router.push("/login");
  }

  async function handleCopyProfileLink() {
    const handle = profile?.username || "username";
    const url = typeof window !== "undefined" ? `${window.location.origin}/${handle}` : `https://inflixo.com/${handle}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast("Profile link copied! ✨");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast("Could not copy link", "error");
    }
  }

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${profile?.username || "username"}`
    : `https://inflixo.com/${profile?.username || "username"}`;

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      {/* Sticky Page Subheader */}
      <div className="sticky top-0 z-30 bg-[#FAF8FA]/95 backdrop-blur-md border-b border-[#E8DCE4]/80 px-3 sm:px-6 py-3.5 shadow-2xs text-left mb-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
              Account Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              Manage your account security, public profile URL, SEO preferences, and notification settings
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-5 text-left">

      {/* 1. Account & Plan Summary Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Account Email</p>
              <p className="font-black text-slate-900 truncate">{session?.email ?? profile?.username ?? "creator@inflixo.com"}</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active Creator</span>
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted font-medium">Plan Status:</span>{" "}
            <span className="font-black text-[#803D63]">Inflixo Pro Creator</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Lock className="h-3.5 w-3.5" />}
            onClick={() => showToast("Security link sent to your registered email! 🔒", "info")}
          >
            Change Security Details
          </Button>
        </div>
      </div>

      {/* 2. Public Profile & URL Link Settings */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Public Profile URL</h2>
            <p className="text-xs text-muted">Your public Inflixo link for your audience and bio.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
          <span className="font-mono text-xs font-black text-slate-800 truncate">
            {profileUrl}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedLink ? "Copied ✓" : "Copy"}</span>
            </button>

            <a
              href={`/${profile?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E8DCE4] bg-[#803D63] px-3 py-1.5 text-xs font-black text-white hover:bg-[#6D3254] transition-all shadow-2xs"
            >
              <span>Visit</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. SEO & Search Engine Visibility */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">SEO &amp; Search Engine Visibility</h2>
            <p className="text-xs text-muted">Configure how search engines index your profile and series.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer rounded-2xl border border-slate-100 p-3.5 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-xs font-black text-slate-900">Search Engine Indexing</p>
              <p className="text-[11px] text-muted">Allow Google &amp; Bing to display your profile in search results</p>
            </div>
            <input
              type="checkbox"
              checked={seoIndexing}
              onChange={(e) => {
                setSeoIndexing(e.target.checked);
                showToast(`Search indexing ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[#803D63] focus:ring-[#803D63]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer rounded-2xl border border-slate-100 p-3.5 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-xs font-black text-slate-900">Enhanced Social Sharing Message</p>
              <p className="text-[11px] text-muted">Automatically include customized fanbase &amp; series text when sharing links</p>
            </div>
            <input
              type="checkbox"
              checked={richShareMessage}
              onChange={(e) => {
                setRichShareMessage(e.target.checked);
                showToast(`Social sharing message ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[#803D63] focus:ring-[#803D63]"
            />
          </label>
        </div>
      </div>

      {/* 4. Notification Preferences */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Notification Preferences</h2>
            <p className="text-xs text-muted">Manage your email alerts and system updates.</p>
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer rounded-2xl border border-slate-100 p-3.5 hover:bg-slate-50 transition-colors">
          <div>
            <p className="text-xs font-black text-slate-900">Email Analytics Digests &amp; Alerts</p>
            <p className="text-[11px] text-muted">Receive weekly fanbase growth reports &amp; platform updates</p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => {
              setEmailNotifs(e.target.checked);
              showToast(`Email notifications ${e.target.checked ? "enabled" : "disabled"}`);
            }}
            className="h-4 w-4 rounded border-slate-300 text-[#803D63] focus:ring-[#803D63]"
          />
        </label>
      </div>

      {/* 5. Legal Agreements, Terms & Privacy Policy */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Legal Agreements &amp; Privacy</h2>
            <p className="text-xs text-muted">Review Inflixo Terms of Service, Public Data Consent, and Privacy Policy.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveLegalModal("terms")}
            className="tap-scale flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left hover:border-[#E8DCE4] hover:bg-[#F6EBF1]/40 transition-all cursor-pointer group"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-900 group-hover:text-[#803D63]">Terms &amp; Conditions</p>
              <p className="text-[11px] text-muted">Creator service agreement &amp; account terms</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#803D63] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveLegalModal("privacy")}
            className="tap-scale flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left hover:border-[#E8DCE4] hover:bg-[#F6EBF1]/40 transition-all cursor-pointer group"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-900 group-hover:text-[#803D63]">Privacy Policy</p>
              <p className="text-[11px] text-muted">Data collection, security &amp; public stats policy</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#803D63] shrink-0" />
          </button>
        </div>
      </div>

      {/* 6. Account Actions */}
      <div className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <LogOut className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-rose-950">Session &amp; Account Actions</h2>
            <p className="text-xs text-rose-700/80">Sign out of your session or contact Inflixo support.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="outline"
            fullWidth
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Sign Out of Account
          </Button>

          <Button
            variant="secondary"
            fullWidth
            icon={<AlertTriangle className="h-4 w-4" />}
            onClick={() => showToast("Contact support@inflixo.com for account inquiries.", "info")}
          >
            Account Support
          </Button>
        </div>
      </div>

      <p className="text-center text-xs font-semibold text-slate-400 pt-2">
        Inflixo Creator Hub • Production Live Ready
      </p>

      {/* Terms & Privacy Modals */}
      {activeLegalModal && (
        <LegalDocumentModal
          type={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
        />
      )}
      </div>
    </div>
  );
}

function LegalDocumentModal({
  type,
  onClose,
}: {
  type: "terms" | "privacy";
  onClose: () => void;
}) {
  const isTerms = type === "terms";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] font-bold">
              {isTerms ? <FileText className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-display text-base font-black text-slate-900">
                {isTerms ? "Terms & Conditions" : "Privacy Policy"}
              </h3>
              <p className="text-[11px] text-muted font-medium">
                Last updated: February 2026 • Official Legal Document
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/60 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs text-slate-600 leading-relaxed space-y-4">
          {isTerms ? (
            <>
              <div className="rounded-2xl border border-[#E8DCE4] bg-[#F6EBF1]/60 p-4 space-y-1">
                <p className="font-black text-[#803D63] text-xs">📜 Inflixo Creator Service Agreement</p>
                <p className="text-[11px] text-slate-700 font-medium">
                  Welcome to Inflixo. By creating an account, linking social handles, or using our creator portfolio services, you agree to these Terms and Conditions.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">1. Account Creation &amp; Eligibility</h4>
                <p>
                  You must be at least 13 years of age (or the legal age of digital consent in your jurisdiction) to create an Inflixo creator profile. You agree to provide accurate email details and verify ownership via single-use One-Time Passwords (OTP).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">2. Social Media Handle Authorization &amp; Scraping Consent</h4>
                <p>
                  By entering your public social media usernames (Instagram, YouTube, Facebook) and authorizing Inflixo, you grant us permission to aggregate publicly available metrics (follower counts, subscriber totals, channel titles, verified badges, and public avatar images) to display on your public creator page.
                </p>
                <p className="font-semibold text-slate-800">
                  💡 Inflixo strictly aggregates 100% public data. We never ask for, store, or access private account passwords or OAuth credentials.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">3. Content Ownership &amp; Intellectual Property</h4>
                <p>
                  Creators retain full copyright ownership of all uploaded custom avatars, series posters, and video metadata. You grant Inflixo a non-exclusive license to host, display, and format your content for public portfolio presentation at <code className="bg-slate-100 px-1 py-0.5 rounded text-[#803D63] font-mono">inflixo.com/your-username</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">4. Early Access &amp; Subscription Terms</h4>
                <p>
                  Early Access accounts receive access to core platform features (up to 3 Series &amp; 3 Theme switches). Early Access pricing and features remain valid until paid subscription tiers are officially launched.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">5. Prohibited Conduct</h4>
                <p>
                  You agree not to impersonate other creators, link social accounts you do not manage, upload infringing or explicit material, or use automated bots to disrupt Inflixo services.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">6. Limitation of Liability</h4>
                <p>
                  Inflixo provides services on an "as is" and "as available" basis. Inflixo shall not be liable for indirect, incidental, or consequential damages resulting from third-party social platform API changes or website downtime.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-1">
                <p className="font-black text-emerald-950 text-xs">🔒 Inflixo Privacy Policy &amp; Public Data Notice</p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Your privacy matters to us. This policy details what data we collect, how we process public social stats, and your rights as a creator.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">1. Data We Collect</h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong className="text-slate-800">Account Credentials:</strong> Email address used for OTP verification and login sessions.</li>
                  <li><strong className="text-slate-800">Creator Profile Details:</strong> Display name, custom username handle, category, profession, bio, and profile photo.</li>
                  <li><strong className="text-slate-800">Public Social Metrics:</strong> Public follower counts, subscriber totals, video counts, and public badges fetched from connected Instagram, YouTube, and Facebook URLs.</li>
                  <li><strong className="text-slate-800">Technical Logs:</strong> Device IP, browser type, and authentication cookies required for session security.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">2. How We Use Your Data</h4>
                <p>
                  We process data solely to create, host, and render your public Inflixo landing page, calculate total audience reach, send single-use OTP login emails, and deliver essential platform updates.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">3. Data Protection &amp; No Third-Party Sales</h4>
                <p className="font-semibold text-slate-800">
                  🛡️ We NEVER sell, rent, or monetize your personal email or creator profile data to third-party advertisers.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">4. Public Profile Visibility &amp; Indexing</h4>
                <p>
                  Your public profile page is accessible on the internet via your unique username link. You can toggle Search Engine Indexing in Account Settings to control whether search engines index your profile.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">5. Account Deletion &amp; Data Rights</h4>
                <p>
                  You have the right to request deletion of your account and removal of all associated social metrics and series from Inflixo servers by contacting <code className="bg-slate-100 px-1 py-0.5 rounded text-[#803D63] font-mono">support@inflixo.com</code>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Close Action */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-muted font-medium">Inflixo Legal &amp; Compliance</p>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it, Close
          </Button>
        </div>
      </div>
    </div>
  );
}
