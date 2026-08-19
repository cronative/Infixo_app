"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminService } from "@/services/AdminService";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (AdminService.isLoggedIn()) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0B0F19]">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
    </div>
  );
}
