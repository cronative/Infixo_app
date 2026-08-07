"use client";

import { useRouter } from "next/navigation";
import { LogOut, Trash2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refresh } = useCreator();
  const session = AuthService.getSession();

  function handleLogout() {
    AuthService.logout();
    router.push("/login");
  }

  function handleLoadDemo() {
    OnboardingService.seedDemoData();
    refresh();
    showToast("Demo creator loaded — Tony Stark");
    router.push("/dashboard");
  }

  function handleReset() {
    OnboardingService.reset();
    refresh();
    showToast("All prototype data reset", "info");
    router.push("/onboarding/profile");
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="font-display text-xl font-medium text-inflixo-navy sm:text-2xl">Settings</h1>

      <div className="mt-6 rounded-3xl border border-inflixo-border bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-inflixo-purple-light text-inflixo-purple">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Signed in as</p>
            <p className="font-bold text-inflixo-navy">{session?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Button variant="secondary" fullWidth icon={<Sparkles className="h-4 w-4" />} onClick={handleLoadDemo}>
          Load Demo Creator
        </Button>
        <Button variant="outline" fullWidth icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
          Logout
        </Button>
        <Button variant="danger" fullWidth icon={<Trash2 className="h-4 w-4" />} onClick={handleReset}>
          Reset Prototype Data
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Inflixo frontend prototype · all data stored locally in your browser
      </p>
    </div>
  );
}
