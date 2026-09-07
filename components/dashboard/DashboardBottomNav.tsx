"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/components/dashboard/navConfig";

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-[#E4DAD5] bg-white/95 backdrop-blur-xl lg:hidden shadow-[0_-4px_20px_rgba(36,22,24,0.08)]">
      {BOTTOM_NAV.map((item) => {
        const active = pathname === item.href;
        const isSeries = item.href === "/dashboard/series";
        const Icon = item.icon;

        if (isSeries) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center -mt-4 pb-1 group"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors ${active
                  ? "bg-[#600a0f]"
                  : "bg-[#600a0f] hover:bg-[#600a0f]"
                  }`}
              >
                <Icon className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span
                className={`text-[10px] font-bold mt-1 ${active ? "text-[#600a0f]" : "text-[#6B5A5D]"
                  }`}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 pt-3 pb-2 text-[10px] font-bold transition-colors ${active ? "text-[#600a0f]" : "text-[#6B5A5D] hover:text-[#241618]"
              }`}
          >
            <Icon className={`h-5 w-5 transition-colors ${active ? "text-[#600a0f]" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
