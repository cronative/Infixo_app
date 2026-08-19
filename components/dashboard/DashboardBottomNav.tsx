"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/components/dashboard/navConfig";

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-purple-100 bg-white/95 backdrop-blur-xl lg:hidden shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
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
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md shadow-purple-600/20 transition-all group-hover:scale-105 ${
                  active
                    ? "bg-[#651FFF] ring-4 ring-purple-100"
                    : "bg-[#651FFF] hover:bg-[#500CD6]"
                }`}
              >
                <Icon className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span
                className={`text-[10px] font-black mt-1 ${
                  active ? "text-[#651FFF]" : "text-slate-700"
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
            className={`flex flex-1 flex-col items-center justify-center gap-1 pt-3 pb-2 text-[10px] font-bold transition-all ${
              active ? "text-[#651FFF] font-black" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110 text-[#651FFF]" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
