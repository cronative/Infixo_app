"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, X } from "lucide-react";
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

  const accountEmail = session?.email || profile?.email || "creator@inflixo.com";
  const rawUsername = profile?.username || "creator";

  // Search Engine Visibility state
  const initialSearchVisibility =
    typeof profile?.visibilitySettings?.showInSearchEngines === "boolean"
      ? profile.visibilitySettings.showInSearchEngines
      : true;

  const [searchIndexing, setSearchIndexing] = useState(initialSearchVisibility);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

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

  // Delete Account Handler
  async function handleConfirmDelete() {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/creator/profile?email=${encodeURIComponent(accountEmail)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Clear local storage and auth session
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
    <div className="space-y-6 w-full max-w-3xl pb-16 text-left">
      {/* 1. PAGE HEADER */}
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
          Manage your account and profile visibility.
        </p>
      </div>

      {/* 2. ACCOUNT SECTION */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#E7E3DC] pb-3">
          <h2 className="text-base font-bold text-[#181716]">Account</h2>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-[#797570]">Email</p>
          <p className="text-sm font-semibold text-[#181716] break-all">
            {accountEmail}
          </p>
        </div>
      </section>

      {/* 3. PROFILE VISIBILITY SECTION */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#E7E3DC] pb-3">
          <h2 className="text-base font-bold text-[#181716]">Profile visibility</h2>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-sm font-semibold text-[#181716]">
              Show profile in search engines
            </p>
            <p className="text-xs text-[#54514D] leading-relaxed">
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
      </section>

      {/* 4. DELETE ACCOUNT SECTION (Simple row, no massive red banner) */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#E7E3DC] pb-3">
          <h2 className="text-base font-bold text-[#181716]">Delete account</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-sm font-semibold text-[#181716]">
              Permanently delete your account
            </p>
            <p className="text-xs text-[#54514D] leading-relaxed">
              Permanently delete your Inflixo account and profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-2xl space-y-5 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#181716]">
                    Delete account
                  </h3>
                  <p className="text-xs text-[#797570]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                className="text-[#797570] hover:text-[#181716] p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#54514D] leading-relaxed">
              Are you sure you want to permanently delete your Inflixo account?
              All your series, episodes, links, and public profile data will be
              permanently removed.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DC]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#181716] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
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
   ACCESSIBLE SWITCH TOGGLE COMPONENT
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#151933]/20 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-[#151933]" : "bg-[#E7E3DC]"
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}
