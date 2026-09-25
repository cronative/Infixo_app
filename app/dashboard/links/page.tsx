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
    <div className="space-y-3.5 w-full pb-8 text-left">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
            Links
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#64748b]">
            Custom links, affiliate stores, brand deals and folders on your Inflixo bio.
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/socials"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          >
            <span>Social accounts</span>
          </Link>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            <span>Live profile</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
          </Link>
        </div>
      </div>

      {/* 2. Plan usage — one compact row */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white px-3 sm:px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#64748b]">
            <span className="font-semibold text-[#0f172a]">
              {isUnlimited ? "Unlimited links" : `${linksCount} / ${maxLinks} links`}
            </span>
            <span aria-hidden="true"> · </span>
            {subscription?.planName || "Pro Plan"}
            <span aria-hidden="true"> · </span>
            {isUnlimited
              ? "unlimited links and folders"
              : linksCount >= maxLinks
                ? "plan limit reached"
                : `${maxLinks - linksCount} ${maxLinks - linksCount === 1 ? "slot" : "slots"} left`}
          </p>
          {linksCount >= maxLinks && !isUnlimited && (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 rounded-lg border border-[#043084]/30 px-2.5 py-1 text-xs font-semibold text-[#043084] hover:bg-[#043084]/[0.06] transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
        {!isUnlimited && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#eef2f7]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? "bg-rose-500" : percentage >= 80 ? "bg-amber-500" : "bg-[#043084]"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* 3. Custom Links Manager Core Component */}
      <section className="w-full text-left">
        <CustomLinksManager onChange={handleLinksChange} />
      </section>
    </div>
  );
}
