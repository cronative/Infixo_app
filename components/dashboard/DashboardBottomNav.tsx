"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/components/dashboard/navConfig";

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e2e8f0] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] lg:hidden h-14">
      {BOTTOM_NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
              active
                ? "bg-[#043084] text-white"
                : "text-[#64748b] hover:bg-slate-50 hover:text-[#043084]"
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 transition-colors ${
                active ? "text-white stroke-[2.2]" : "text-[#64748b]"
              }`}
            />
            <span className="truncate leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
