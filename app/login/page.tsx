"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthSplitLayout } from "@/layouts/AuthSplitLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.62l4.01 3.1c.95-2.85 3.6-4.97 6.73-4.97z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.462 2.19-1.222 2.98-.822.86-2.171 1.53-3.264 1.44-.13-1.11.44-2.28 1.16-3.02.79-.83 2.19-1.46 3.326-1.4zM20.6 17.11c-.552 1.28-.816 1.85-1.53 2.98-.998 1.58-2.406 3.55-4.15 3.57-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1-1.74-.02-3.07-1.79-4.07-3.37C.28 16.71-.42 12.51 1.1 9.79c1.07-1.93 2.85-3.06 4.51-3.06 1.7 0 2.77 1.03 4.18 1.03 1.36 0 2.19-1.03 4.15-1.03 1.48 0 3.05.81 4.17 2.2-3.67 2.01-3.07 7.24 2.49 8.18z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!validEmail) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    await AuthService.requestOtp(trimmed);
    setLoading(false);
    showToast("OTP sent to your email (Demo OTP: 1234)");
    router.push("/verify-otp");
  }

  function handleProvider(provider: "google" | "apple") {
    AuthService.loginWithProvider(provider);
    showToast(`Signed in with ${provider === "google" ? "Google" : "Apple"}`);
    router.push("/onboarding/profile");
  }

  return (
    <AuthSplitLayout>
      <h1 className="font-display text-3xl font-medium tracking-tight text-inflixo-navy sm:text-[36px]">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] text-muted">Log in to your Inflixo account</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          type="email"
          name="email"
          placeholder="Email address"
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Continue
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-inflixo-border" />
        <span className="text-xs font-semibold text-muted">OR</span>
        <div className="h-px flex-1 bg-inflixo-border" />
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          className="shadow-[var(--shadow-soft)]"
          icon={<GoogleIcon />}
          onClick={() => handleProvider("google")}
        >
          Continue with Google
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          className="shadow-[var(--shadow-soft)]"
          icon={<AppleIcon />}
          onClick={() => handleProvider("apple")}
        >
          Continue with Apple
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => document.getElementById("email")?.focus()}
          className="font-semibold text-inflixo-purple hover:text-inflixo-purple-dark"
        >
          Sign up
        </button>
      </p>
    </AuthSplitLayout>
  );
}
