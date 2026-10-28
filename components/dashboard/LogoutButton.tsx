"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AuthService } from "@/services/AuthService";

/** Logout action for the top header. `compact` renders an icon-only button (mobile). */
export function LogoutButton({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const router = useRouter();

  const handleLogout = () => {
    AuthService.logout();
    router.push("/login");
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={className}
        aria-label="Logout"
        title="Logout"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-[#475569] transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 ${className}`}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Logout</span>
    </button>
  );
}
