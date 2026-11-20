import Link from "next/link";
import { ArrowRight, Briefcase, Clapperboard, IdCard, Link2, Palette, ShoppingBag, Star, Zap, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Add series & episode", href: "/dashboard/series?new=true", icon: Clapperboard },
  { label: "Add link", href: "/dashboard/links?new=true", icon: Link2 },
  { label: "Add product", href: "/dashboard/products?new=true", icon: ShoppingBag },
  { label: "Update media kit", href: "/dashboard/mediakit", icon: Briefcase },
  { label: "Share journey card", href: "/dashboard/creator-card", icon: IdCard },
  { label: "Update theme", href: "/dashboard/themes", icon: Palette },
  { label: "Send review request", href: "/dashboard/reviews?request=1", icon: Star },
];

/** Dashboard home shortcuts: icon · title · arrow. One per row on phones, two across from sm up. */
export function QuickLinksCard() {
  return (
    <section className="overflow-hidden rounded-[5px] border border-[#ECECF0] bg-white">
      <SectionHeading icon={Zap} title="Quick links" subtitle="Jump straight to what you do most." />
      <ul className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="tap-scale group flex min-h-[48px] items-center gap-3 rounded-[5px] border border-[#ECECF0] bg-white px-3 py-2 transition-colors hover:border-[#C21B5C]/40 hover:bg-[#FFF6F2]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#FFEDE6] text-[#C21B5C]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#18181B] group-hover:text-[#C21B5C]">{label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C21B5C]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
