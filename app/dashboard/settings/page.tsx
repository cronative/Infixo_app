"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  Info,
  Loader2,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { storage } from "@/utils/storage";
import { DEFAULT_VISIBILITY_SETTINGS } from "@/types";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();
  const session = AuthService.getSession();

  const accountEmail = session?.email || profile?.email || "nikunj.appz@gmail.com";
  const rawUsername = profile?.username || "creator";

  // Search Engine Visibility state
  const initialSearchVisibility =
    typeof profile?.visibilitySettings?.showInSearchEngines === "boolean"
      ? profile.visibilitySettings.showInSearchEngines
      : true;

  const [searchIndexing, setSearchIndexing] = useState(initialSearchVisibility);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // Edit Email Modal state
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState(accountEmail);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Delete Account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Search Visibility
  async function handleToggleSearchVisibility(val: boolean) {
    setSearchIndexing(val);
    setIsSavingVisibility(true);

    const updatedVis = {
      ...(profile?.visibilitySettings || DEFAULT_VISIBILITY_SETTINGS),
      showInSearchEngines: val,
    };

    updateProfile({ visibilitySettings: updatedVis });

    try {
      const res = await fetch("/api/creator/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountEmail,
          username: rawUsername,
          visibilitySettings: updatedVis,
        }),
      });

      if (res.ok) {
        showToast(
          val
            ? "Search engine indexing enabled"
            : "Search engine indexing disabled"
        );
      } else {
        showToast("Failed to save setting", "error");
      }
    } catch (err) {
      console.error("Error saving search visibility:", err);
      showToast("Failed to save setting", "error");
    } finally {
      setIsSavingVisibility(false);
    }
  }

  // Update Email Handler
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    setIsUpdatingEmail(true);
    try {
      updateProfile({ email: newEmail });
      showToast("Email address updated successfully! ✨");
      setShowEditEmailModal(false);
    } catch {
      showToast("Failed to update email address", "error");
    } finally {
      setIsUpdatingEmail(false);
    }
  }

  // Delete Account Handler
  async function handleConfirmDelete() {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const httpResponse = await fetch(
        `/api/creator/profile?email=${encodeURIComponent(accountEmail)}`,
        {
          method: "DELETE",
        }
      );

      const apiResponse = await httpResponse.json();
      if (!httpResponse.ok || apiResponse.status !== 1) {
        throw new Error(apiResponse.message || "Failed to delete account");
      }

      AuthService.logout();
      storage.clearAll();

      showToast("Your account has been deleted.");
      router.push("/login");
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      showToast(err.message || "Failed to delete account", "error");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-4xl pb-12 text-left">
      {/* ── 1. Page Header ── */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
          Settings
        </h1>
        <p className="text-xs sm:text-[13px] text-[#64748b] font-medium mt-0.5">
          Manage your account and profile visibility.
        </p>
      </div>

      {/* ── 2. Card 1: Account ── */}
      <section className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-2xs">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shadow-2xs">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">Account</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Your account information and access details.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#f1f5f9] my-4" />

        {/* Details Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-[#64748b] block">Email address</span>
            <span className="text-xs sm:text-sm font-semibold text-[#0f172a] mt-0.5 block break-all">
              {accountEmail}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewEmail(accountEmail);
              setShowEditEmailModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0f172a] shadow-2xs hover:bg-[#f8fafc] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Pencil className="h-3.5 w-3.5 text-[#0f172a]" />
            <span>Edit</span>
          </button>
        </div>
      </section>

      {/* ── 3. Card 2: Profile Visibility ── */}
      <section className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-2xs">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shadow-2xs">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">Profile visibility</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Control how your Inflixo profile appears online.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#f1f5f9] my-4" />

        {/* Toggle Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">
              Show profile in search engines
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Allow Google and other search engines to show your Inflixo profile.
            </p>
          </div>

          <SwitchToggle
            checked={searchIndexing}
            disabled={isSavingVisibility}
            onChange={handleToggleSearchVisibility}
            label="Show profile in search engines"
          />
        </div>

        {/* Notice Info Box */}
        <div className="rounded-[5px] bg-[#FFF5F7]/70 border border-[#FCE7F3] p-3 flex items-center gap-2.5 mt-4 text-xs text-[#7A2253] font-medium leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-[#7A2253]" />
          <span>When enabled, your public profile can appear in Google and other search engine results.</span>
        </div>
      </section>

      {/* ── 4. Card 3: Delete Account ── */}
      <section className="rounded-[5px] border border-rose-200 bg-[#FFF5F7]/40 p-4 sm:p-5 shadow-2xs">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-rose-100/70 border border-rose-200 text-rose-600 shadow-2xs">
            <Trash2 className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">Delete account</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Permanently delete your Inflixo account and all associated data.
            </p>
          </div>
        </div>

        {/* Warning & Action Box */}
        <div className="rounded-[5px] bg-white/90 border border-rose-200 p-3.5 sm:p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-rose-600">
                This action cannot be undone.
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
                All your profile, content, links, products, and analytics data will be permanently removed.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* ── Edit Email Modal ── */}
      {showEditEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[5px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Update Email Address
              </h3>
              <button
                type="button"
                onClick={() => setShowEditEmailModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] p-1 rounded-[5px]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#64748b] block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm text-[#0f172a] focus:border-[#7A2253] focus:outline-none shadow-2xs"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowEditEmailModal(false)}
                  className="rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] px-3.5 py-2 text-xs font-semibold text-[#0f172a] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="rounded-[5px] bg-[#7A2253] hover:bg-[#661842] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingEmail ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[5px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                    Delete account
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] p-1 rounded-[5px] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#64748b] leading-relaxed">
              Are you sure you want to permanently delete your Inflixo account?
              All your series, episodes, links, and public profile data will be
              permanently removed.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#0f172a] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-[5px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SWITCH TOGGLE COMPONENT
   ========================================================================== */
interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

function SwitchToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#7A2253]" : "bg-[#e2e8f0]"
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
