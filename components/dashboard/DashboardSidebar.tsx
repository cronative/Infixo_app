"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { SIDEBAR_NAV, LOGOUT_ITEM } from "@/components/dashboard/navConfig";
import { AuthService } from "@/services/AuthService";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-inflixo-border bg-white px-4 py-6 lg:flex h-full overflow-y-auto">
      <div className="px-2">
        <Logo size="sm" />
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {SIDEBAR_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={active ? { backgroundImage: "linear-gradient(135deg, var(--inflixo-purple-light), #ffffff)" } : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "text-inflixo-purple-dark shadow-[var(--shadow-soft)] ring-1 ring-inflixo-purple/10"
                  : "text-inflixo-navy/70 hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => {
          AuthService.logout();
          router.push("/login");
        }}
        className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <LOGOUT_ITEM.icon className="h-[18px] w-[18px]" />
        {LOGOUT_ITEM.label}
      </button>
    </aside>
  );
}
