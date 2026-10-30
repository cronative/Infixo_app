"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  Sparkles,
  Clapperboard,
  Users,
  BadgeCheck,
} from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { useToast } from "@/contexts/ToastContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InlineAlert } from "@/components/ui/InlineAlert";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimedUsername, setClaimedUsername] = useState<string | null>(null);

  // Route guard: if already logged in, redirect to dashboard or onboarding
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Sign in — Inflixo";
    }

    if (AuthService.isLoggedIn()) {
      if (OnboardingService.isComplete()) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    // Prefill email if returning from OTP screen via "Edit"
    const pending = AuthService.getPendingEmail();
    if (pending) {
      setEmail(pending);
    }

    // Handle claim handoff from landing page (e.g. /login?claim=devom)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const claim = params.get("claim");
      if (claim) {
        const clean = claim.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (clean) {
          setClaimedUsername(clean);
          try {
            localStorage.setItem("pending_claim_username", clean);
            sessionStorage.setItem("pending_claim_username", clean);
          } catch {}
          // Remove claim parameter from URL without page reload
          window.history.replaceState({}, "", "/login");
        }
      } else {
        const stored =
          sessionStorage.getItem("pending_claim_username") ||
          localStorage.getItem("pending_claim_username");
        if (stored) {
          setClaimedUsername(stored);
        }
      }
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setApiError("");
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setFieldError("Please enter your email.");
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!validEmail) {
      setFieldError("That doesn't look like a valid email.");
      return;
    }

    setFieldError("");
    setLoading(true);

    try {
      await AuthService.requestOtp(trimmed);
      setLoading(false);
      showToast("Verification code sent! 📩");
      // Privacy fix: navigate to /verify-otp WITHOUT email in query param
      router.push("/verify-otp");
    } catch (err: any) {
      setLoading(false);
      setApiError(
        err?.message ||
          "We couldn't send the code. Please try again in a moment."
      );
    }
  }

  return (
    <AuthLayout showBackToHome={true}>
      <AuthCard
        eyebrow="CREATOR STUDIO"
        title="Sign in or Sign up"
        subtitle="Enter your email. We'll send you a 4-digit code. New here? We'll set up your profile right after."
        footer={
          <p className="text-center text-xs font-medium text-[#71717A]">
            By continuing, you agree to Inflixo&apos;s{" "}
            <Link
              href="/terms"
              className="text-[#52525B] underline hover:text-[#7A2253]"
            >
              Terms
            </Link>
            ,{" "}
            <Link
              href="/creator-terms"
              className="text-[#52525B] underline hover:text-[#7A2253]"
            >
              Creator Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-[#52525B] underline hover:text-[#7A2253]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        }
      >
        <div className="space-y-4">
          {/* Claim handoff chip */}
          {claimedUsername && (
            <div className="flex justify-center">
              <Chip
                variant="soft"
                icon={<Sparkles className="h-3.5 w-3.5 text-[#7A2253]" />}
                className="font-bold text-[#7A2253]"
              >
                inflixo.com/{claimedUsername} is waiting for you
              </Chip>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <TextField
              id="creator-email-input"
              label="Email"
              type="email"
              name="email"
              placeholder="yourname@gmail.com"
              value={email}
              disabled={loading}
              autoFocus
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={fieldError}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError("");
                if (apiError) setApiError("");
              }}
            />

            {apiError && (
              <InlineAlert variant="error" className="text-left">
                {apiError}
              </InlineAlert>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? (
                "Sending code…"
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Send code <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Value props line-icon chips */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#52525B]">
            <Chip
              variant="pill"
              icon={<Clapperboard className="h-3.5 w-3.5 text-[#7A2253]" />}
            >
              Series
            </Chip>
            <Chip
              variant="pill"
              icon={<Users className="h-3.5 w-3.5 text-[#7A2253]" />}
            >
              Total fans
            </Chip>
            <Chip
              variant="pill"
              icon={<BadgeCheck className="h-3.5 w-3.5 text-[#7A2253]" />}
            >
              Brand reviews
            </Chip>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
