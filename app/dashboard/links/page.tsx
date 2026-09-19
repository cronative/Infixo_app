"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Link as LinkIcon, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
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
    <div className="space-y-4 sm:space-y-4.5 w-full pb-8 text-left">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Custom Links
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#043084]/10 px-2.5 py-0.5 text-xs font-bold text-[#043084]">
              <LinkIcon className="h-3 w-3" />
              <span>{linksCount} {linksCount === 1 ? "Link" : "Links"}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Add custom links, affiliate stores, brand deals &amp; social profiles to your Inflixo bio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/socials"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#043084] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <span>Social Accounts</span>
          </Link>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#043084] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <span>Live Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Quota & Plan Status Card */}
      <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#043084]/10 text-[#043084]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 sm:text-sm">
                {isUnlimited ? (
                  <span>Unlimited Custom Links Available</span>
                ) : (
                  <span>
                    {linksCount} of {maxLinks} custom links active
                  </span>
                )}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {isUnlimited
                  ? "Your current creator plan allows unlimited links and folders."
                  : linksCount >= maxLinks
                  ? "You have reached your current plan limit. Upgrade to add more."
                  : `${maxLinks - linksCount} link slots remaining on your plan.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-[#043084]" />
              <span>{subscription?.planName || "Pro Plan"}</span>
            </span>
            {linksCount >= maxLinks && !isUnlimited && (
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-1 rounded-lg bg-[#043084] px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-[#032363] transition-colors"
              >
                <span>Upgrade</span>
              </Link>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-300 ${
                percentage >= 100 ? "bg-rose-500" : percentage >= 80 ? "bg-amber-500" : "bg-[#043084]"
              }`}
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
