import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { CookiePreferencesButton } from "@/components/shared/CookiePreferencesButton";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/creator-terms", label: "Creator Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

/** Shared footer for legal pages (Terms, Creator Terms, Privacy, Cookies). */
export function LegalFooter({ current }: { current?: string }) {
  return (
    <footer className="border-t border-[#E7E3DC] bg-white">
      <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-8 text-[13px] text-[#54514D] sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Logo size="sm" />
          <p className="text-[#797570]">&copy; 2026 Inflixo · TrustIQ Labs Private Limited</p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="rounded-[5px] hover:text-[#7A2253]">Home</Link>
          <Link href="/#pricing" className="rounded-[5px] hover:text-[#7A2253]">Pricing</Link>
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? "page" : undefined}
              className={`rounded-[5px] hover:text-[#7A2253] ${current === l.href ? "font-semibold text-[#7A2253]" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <CookiePreferencesButton className="cursor-pointer rounded-[5px] text-left hover:text-[#7A2253]" />
        </nav>
      </div>
    </footer>
  );
}
