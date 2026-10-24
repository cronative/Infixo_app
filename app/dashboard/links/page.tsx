"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CustomLinksManager } from "@/components/socials/CustomLinksManager";
import { useCreator } from "@/contexts/CreatorContext";
import { customLinksRepository } from "@/repositories/localRepository";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { CustomLink } from "@/types";

export default function DashboardCustomLinksPage() {
  const { profile, subscription } = useCreator();
  const [linksCount, setLinksCount] = useState(0);

  const planKey = subscription?.planKey || "early_access";
  const planQuota = getPlanQuota(planKey);
  const maxLinks = planQuota.maxCustomLinks;
  const isUnlimited = maxLinks === Infinity;

  useEffect(() => {
    const local = customLinksRepository.get();
    if (Array.isArray(local)) {
      setLinksCount(local.length);
    }
  }, []);

  const handleLinksChange = (links: CustomLink[]) => {
    setLinksCount(links.length);
  };

  const handleStr = profile.username || "username";
  const percentage = isUnlimited ? 15 : Math.min(100, Math.round((linksCount / maxLinks) * 100));

  return (
    <div className="space-y-4 w-full pb-8 text-left">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0f172a]">
            Links
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#64748b]">
            Custom links, affiliate stores, brand deals and folders on your Inflixo bio.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/socials"
            className="text-xs font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            Social accounts
          </Link>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 text-xs font-semibold text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] shadow-2xs"
          >
            <span>Live profile</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
          </Link>
        </div>
      </div>

      {/* 2. Plan usage banner matching screenshot */}
      <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#64748b]">
            <span className="font-bold text-[#0f172a]">
              {isUnlimited ? "Unlimited links" : `${linksCount} / ${maxLinks} links`}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{subscription?.planName || "Starter Plan"}</span>
            <span aria-hidden="true"> · </span>
            <span>
              {isUnlimited
                ? "unlimited links and folders"
                : linksCount >= maxLinks
                  ? "plan limit reached"
                  : `${maxLinks - linksCount} ${maxLinks - linksCount === 1 ? "slot" : "slots"} left`}
            </span>
          </p>
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center justify-center rounded-[5px] border border-[#7A2253] bg-white px-3.5 py-1 text-xs font-semibold text-[#7A2253] hover:bg-[#FFF5F7] transition-colors"
          >
            Upgrade
          </Link>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage >= 100
                ? "bg-[#E11D48]"
                : percentage >= 80
                  ? "bg-amber-500"
                  : "bg-[#7A2253]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 3. Custom Links Manager Core Component */}
      <section className="w-full text-left">
        <CustomLinksManager onChange={handleLinksChange} />
      </section>
    </div>
  );
}
