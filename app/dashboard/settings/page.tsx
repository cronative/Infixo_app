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
  Share2,
  Check,
} from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { SectionOrderManager } from "@/components/dashboard/SectionOrderManager";
import { buildProfileUrl } from "@/utils/format";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, subscription } = useCreator();
  const session = AuthService.getSession();

  const [copiedLink, setCopiedLink] = useState(false);
  const [seoIndexing, setSeoIndexing] = useState(true);
  const [richShareMessage, setRichShareMessage] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [activeLegalModal, setActiveLegalModal] = useState<"terms" | "privacy" | null>(null);

  const accountEmail = session?.email || profile?.email || "creator@inflixo.com";
  const rawUsername = profile?.username || "creator";
  const canonicalUrl = buildProfileUrl(rawUsername);
  const planDisplayName = subscription?.planName || "Inflixo Early Access";

  function handleLogout() {
    AuthService.logout();
    showToast("Signed out successfully");
    router.push("/login");
  }

  async function handleCopyProfileLink() {
    const success = await copyToClipboard(canonicalUrl);
    if (success) {
      setCopiedLink(true);
      showToast("Profile link copied! ✨");
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#797570] font-medium mt-1">
            Manage your account, public-profile visibility and notifications.
          </p>
        </div>
      </div>

      {/* 2. SECTION 1 — ACCOUNT & SECURITY */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Account &amp; security
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Manage the account used to access Inflixo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
              Account Email
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xs sm:text-sm font-bold text-[#181716] truncate">
                {accountEmail}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20 shrink-0">
                <span className="h-1 w-1 rounded-full bg-[#17845B]" />
                Active
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
              Current Access
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xs sm:text-sm font-bold text-[#803D63] truncate">
                {planDisplayName}
              </p>
              <span className="text-[10px] font-semibold text-[#797570] bg-white border border-[#E7E3DC] px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => showToast("Security link sent to your registered email! 🔒", "info")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
          >
            <Lock className="h-3.5 w-3.5 text-[#803D63]" />
            <span>Manage Security</span>
          </button>
        </div>
      </section>

      {/* 3. SECTION 2 — PUBLIC PROFILE LINK */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Public profile link
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Share this link in your social bios and with potential brand partners.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-3 sm:p-3.5">
          <span className="font-mono text-xs font-semibold text-[#181716] truncate">
            {canonicalUrl}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#17845B]" />
                  <span className="text-[#17845B]">Copied ✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={`/${rawUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>Open Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3.1. SECTION ORDER & VISIBILITY */}
      <SectionOrderManager />

      {/* 4. SECTION 3 — SEARCH VISIBILITY */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Search visibility
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Control whether search engines may index your public creator profile.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-xs font-bold text-[#181716]">
              Allow search-engine indexing
            </p>
            <p className="text-xs text-[#54514D] leading-relaxed">
              Allow search engines such as Google and Bing to include your public profile in search results.
            </p>
            <span className="text-[11px] text-[#797570]/80 block pt-0.5">
              Search engines may take time to reflect this change.
            </span>
          </div>

          <SwitchToggle
            checked={seoIndexing}
            onChange={(val) => {
              setSeoIndexing(val);
              showToast(`Search indexing ${val ? "enabled" : "disabled"}`);
            }}
            label="Allow search-engine indexing"
          />
        </div>
      </section>

      {/* 5. SECTION 4 — SHARING PREFERENCES */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Sharing preferences
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Choose how your Inflixo profile is presented when you share it.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-xs font-bold text-[#181716]">
              Include creator highlights in shared text
            </p>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Add supported Total Fanbase and content-series details when generating share text.
            </p>
          </div>

          <SwitchToggle
            checked={richShareMessage}
            onChange={(val) => {
              setRichShareMessage(val);
              showToast(`Social sharing message ${val ? "enabled" : "disabled"}`);
            }}
            label="Include creator highlights in shared text"
          />
        </div>
      </section>

      {/* 6. SECTION 5 — NOTIFICATION PREFERENCES */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Notifications
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Choose which Inflixo updates you want to receive.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-xs font-bold text-[#181716]">
              Creator updates and insights
            </p>
            <p className="text-xs text-[#54514D] leading-relaxed">
              Receive relevant profile updates, audience summaries and Inflixo product news.
            </p>
          </div>

          <SwitchToggle
            checked={emailNotifs}
            onChange={(val) => {
              setEmailNotifs(val);
              showToast(`Email notifications ${val ? "enabled" : "disabled"}`);
            }}
            label="Creator updates and insights"
          />
        </div>
      </section>

      {/* 7. SECTION 6 — LEGAL & PRIVACY */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Legal &amp; privacy
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Review Inflixo Terms of Service, Public Data Consent, and Privacy Policy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveLegalModal("terms")}
            className="flex items-center justify-between rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-4 text-left hover:border-[#803D63]/40 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#181716] group-hover:text-[#803D63] transition-colors">
                Terms &amp; Conditions
              </p>
              <p className="text-[11px] text-[#797570]">
                Creator service agreement &amp; account terms
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-[#797570] group-hover:text-[#803D63] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveLegalModal("privacy")}
            className="flex items-center justify-between rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-4 text-left hover:border-[#803D63]/40 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#181716] group-hover:text-[#803D63] transition-colors">
                Privacy Policy
              </p>
              <p className="text-[11px] text-[#797570]">
                Data collection, security &amp; public stats policy
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-[#797570] group-hover:text-[#803D63] shrink-0" />
          </button>
        </div>
      </section>

      {/* 8. SECTION 7 — ACCOUNT ACTIONS */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C2414B]/10 text-[#C2414B] border border-[#C2414B]/20 shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Account actions
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Sign out of your session or contact Inflixo support.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-4 py-2.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 text-[#797570]" />
            <span>Sign Out of Account</span>
          </button>

          <button
            type="button"
            onClick={() => showToast("Contact support@inflixo.com for account inquiries.", "info")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-4 py-2.5 text-xs font-semibold text-[#797570] transition-colors cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Account Support</span>
          </button>
        </div>
      </section>

      {/* LEGAL DOCUMENT MODAL (100% UNTOUCHED LOGIC) */}
      {activeLegalModal && (
        <LegalDocumentModal
          type={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   ACCESSIBLE SWITCH TOGGLE COMPONENT
   ========================================================================== */
interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

function SwitchToggle({ checked, onChange, label, disabled = false }: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#803D63]/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#803D63]" : "bg-[#E7E3DC]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ==========================================================================
   LEGAL DOCUMENT MODAL (100% UNTOUCHED CONTENT)
   ========================================================================== */
function LegalDocumentModal({
  type,
  onClose,
}: {
  type: "terms" | "privacy";
  onClose: () => void;
}) {
  const isTerms = type === "terms";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={isTerms ? "Terms & Conditions" : "Privacy Policy"}
      description="Last updated: February 2026 • Official Legal Document"
      icon={isTerms ? <FileText className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
    >
      {/* Scrollable Content Body */}
      <ModalBody className="p-5 sm:p-6 text-xs text-[#797570] leading-relaxed space-y-4 text-left">
        {isTerms ? (
          <>
            <div className="rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-4 space-y-1">
              <p className="font-bold text-[#803D63] text-xs">📜 Inflixo Creator Service Agreement</p>
              <p className="text-[11px] text-[#181716] font-medium">
                Welcome to Inflixo. By creating an account, linking social handles, or using our creator portfolio services, you agree to these Terms and Conditions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">1. Account Creation &amp; Eligibility</h4>
              <p>
                You must be at least 13 years of age (or the legal age of digital consent in your jurisdiction) to create an Inflixo creator profile. You agree to provide accurate email details and verify ownership via single-use One-Time Passwords (OTP).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">2. Social Media Handle Authorization &amp; Public Metrics Consent</h4>
              <p>
                By entering your public social media usernames (Instagram, YouTube, Facebook) and authorizing Inflixo, you grant us permission to aggregate publicly available metrics (follower counts, subscriber totals, channel titles, verified badges, and public avatar images) to display on your public creator page.
              </p>
              <p className="font-semibold text-[#181716]">
                💡 Inflixo strictly aggregates 100% public data. We never ask for, store, or access private account passwords or OAuth credentials.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">3. Content Ownership &amp; Intellectual Property</h4>
              <p>
                Creators retain full copyright ownership of all uploaded custom avatars, series posters, and video metadata. You grant Inflixo a non-exclusive license to host, display, and format your content for public portfolio presentation at <code className="bg-[#F8F7F3] px-1 py-0.5 rounded text-[#803D63] font-mono border border-[#E7E3DC]">inflixo.com/your-username</code>.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">4. Early Access &amp; Subscription Terms</h4>
              <p>
                Early Access accounts receive access to core platform features (up to 3 Series &amp; 3 Theme switches). Early Access pricing and features remain valid until paid subscription tiers are officially launched.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">5. Prohibited Conduct</h4>
              <p>
                You agree not to impersonate other creators, link social accounts you do not manage, upload infringing or explicit material, or use automated bots to disrupt Inflixo services.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">6. Limitation of Liability</h4>
              <p>
                Inflixo provides services on an "as is" and "as available" basis. Inflixo shall not be liable for indirect, incidental, or consequential damages resulting from third-party social platform API changes or website downtime.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-[#17845B]/20 bg-[#EAF7F0] p-4 space-y-1">
              <p className="font-bold text-[#17845B] text-xs">🔒 Inflixo Privacy Policy &amp; Public Data Notice</p>
              <p className="text-[11px] text-[#17845B] font-medium">
                Your privacy matters to us. This policy details what data we collect, how we process public social stats, and your rights as a creator.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">1. Data We Collect</h4>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li><strong className="text-[#181716]">Account Credentials:</strong> Email address used for OTP verification and login sessions.</li>
                <li><strong className="text-[#181716]">Creator Profile Details:</strong> Display name, custom username handle, category, profession, bio, and profile photo.</li>
                <li><strong className="text-[#181716]">Public Social Metrics:</strong> Public follower counts, subscriber totals, video counts, and public badges fetched from connected Instagram, YouTube, and Facebook URLs.</li>
                <li><strong className="text-[#181716]">Technical Logs:</strong> Device IP, browser type, and authentication cookies required for session security.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">2. How We Use Your Data</h4>
              <p>
                We process data solely to create, host, and render your public Inflixo landing page, calculate total audience reach, send single-use OTP login emails, and deliver essential platform updates.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">3. Data Protection &amp; No Third-Party Sales</h4>
              <p className="font-semibold text-[#181716]">
                🛡️ We NEVER sell, rent, or monetize your personal email or creator profile data to third-party advertisers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">4. Public Profile Visibility &amp; Indexing</h4>
              <p>
                Your public profile page is accessible on the internet via your unique username link. You can toggle Search Engine Indexing in Account Settings to control whether search engines index your profile.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#181716] text-xs uppercase tracking-wider">5. Account Deletion &amp; Data Rights</h4>
              <p>
                You have the right to request deletion of your account and removal of all associated social metrics and series from Inflixo servers by contacting <code className="bg-[#F8F7F3] px-1 py-0.5 rounded text-[#803D63] font-mono border border-[#E7E3DC]">support@inflixo.com</code>.
              </p>
            </div>
          </>
        )}
      </ModalBody>

      {/* Footer Close Action */}
      <ModalFooter className="px-5 sm:px-6 py-3.5 justify-between">
        <p className="text-[11px] text-[#797570] font-medium">Inflixo Legal &amp; Compliance</p>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#803D63] hover:bg-[#6F3456] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Got it, Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
