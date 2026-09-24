"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, isNavActive } from "@/components/dashboard/navConfig";

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e2e8f0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      {BOTTOM_NAV.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 w-full flex-col items-center justify-center gap-1 text-[10.5px] transition-colors ${
              active ? "font-semibold text-[#043084]" : "font-medium text-[#64748b] active:text-[#0f172a]"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                active ? "bg-[#043084]/[0.09]" : ""
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? "stroke-[2.2]" : ""}`} />
            </span>
            <span className="truncate leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
