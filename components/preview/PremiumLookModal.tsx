"use client";

import Link from "next/link";
import { Crown, Sparkles, Check, ArrowRight, Film, Link2, ShoppingBag, Star, Layout } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { formatPlanPrice } from "@/lib/pricing";

interface PremiumLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProOrVip: boolean;
  currentLayout: "tabs" | "premium";
  onApplyLayout: (layout: "tabs" | "premium") => Promise<void> | void;
  onPreviewOnly?: () => void;
}

export function PremiumLookModal({
  isOpen,
  onClose,
  isProOrVip,
  currentLayout,
  onApplyLayout,
  onPreviewOnly,
}: PremiumLookModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      wrapHeader
      title="Public Profile: Premium Look"
      description="A high-converting, single vertical layout that showcases your best content without tab switching."
      icon={<Crown className="h-5 w-5 text-amber-500" />}
    >
      <ModalBody className="space-y-4 px-5 sm:px-6 py-2">
        {/* Layout Visual Comparison Preview */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Option A: Classic Tabs */}
          <div
            onClick={() => {
              if (isProOrVip) onApplyLayout("tabs");
              else if (onPreviewOnly) onPreviewOnly();
            }}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left space-y-2 ${
              currentLayout === "tabs"
                ? "border-[#7A2253] bg-[#7A2253]/5 shadow-xs"
                : "border-[#ECECF0] hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Classic Tabs</span>
              {currentLayout === "tabs" && (
                <span className="h-4 w-4 rounded-full bg-[#7A2253] text-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            {/* Miniature illustration of tabs */}
            <div className="rounded-lg bg-slate-100 p-2 space-y-1.5 border border-slate-200/60">
              <div className="h-2 w-12 rounded-full bg-slate-400/80" />
              <div className="flex gap-1 pt-1 border-b border-slate-200 pb-1">
                <span className="h-2 w-6 rounded-xs bg-[#7A2253]" />
                <span className="h-2 w-6 rounded-xs bg-slate-300" />
                <span className="h-2 w-6 rounded-xs bg-slate-300" />
              </div>
              <div className="h-6 rounded-sm bg-white border border-slate-200" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Standard horizontal tabs (Series, Links, Shop, Collab, Reviews).
            </p>
          </div>

          {/* Option B: Premium Look */}
          <div
            onClick={() => {
              if (isProOrVip) onApplyLayout("premium");
              else if (onPreviewOnly) onPreviewOnly();
            }}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left space-y-2 relative overflow-hidden ${
              currentLayout === "premium"
                ? "border-amber-400 bg-gradient-to-b from-amber-500/10 to-[#7A2253]/5 shadow-md"
                : "border-[#ECECF0] hover:border-amber-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-900">Premium Look</span>
              </div>
              {currentLayout === "premium" ? (
                <span className="h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Pro / VIP
                </span>
              )}
            </div>
            {/* Miniature illustration of single vertical scroll */}
            <div className="rounded-lg bg-gradient-to-b from-slate-100 to-amber-50/50 p-2 space-y-1.5 border border-amber-200/60">
              <div className="mx-auto h-3.5 w-3.5 rounded-full bg-[#7A2253]" />
              <div className="h-1.5 w-16 mx-auto rounded-full bg-slate-400" />
              <div className="space-y-1 pt-1">
                <div className="h-2.5 rounded-xs bg-white border border-slate-200" />
                <div className="h-2.5 rounded-xs bg-white border border-slate-200" />
                <div className="h-2.5 rounded-xs bg-white border border-slate-200" />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Single vertical flow: Centered header, top 3 series, 10 links, 3 products, collabs &amp; reviews.
            </p>
          </div>
        </div>

        {/* What's included in Premium Look */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Premium Look Highlights:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
              <span>Top 3 Featured Series + &ldquo;View all&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
              <span>Top 10 Custom Links + &ldquo;View all&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
              <span>Top 3 Shop Products + &ldquo;View all&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Worked with Brands &amp; Client Reviews</span>
            </div>
          </div>
        </div>

        {/* Plan Upgrade Notice for non-pro users */}
        {!isProOrVip && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <Crown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                Upgrade to Pro or VIP to activate on your live profile
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                You can freely preview the Premium Look in your dashboard canvas. To apply it to your live link (`inflixo.com/@yourname`), upgrade to the Pro or VIP plan.
              </p>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="flex-wrap px-5 sm:px-6 py-4 justify-between">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Close
        </button>

        <div className="flex items-center gap-2">
          {isProOrVip ? (
            currentLayout === "premium" ? (
              <button
                type="button"
                onClick={() => {
                  onApplyLayout("tabs");
                  onClose();
                }}
                className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Switch to Classic Tabs
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onApplyLayout("premium");
                  onClose();
                }}
                className="h-10 px-5 rounded-xl bg-[#7A2253] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#7A2253]/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Apply Premium Look</span>
              </button>
            )
          ) : (
            <>
              {onPreviewOnly && (
                <button
                  type="button"
                  onClick={() => {
                    onPreviewOnly();
                    onClose();
                  }}
                  className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Preview in Canvas</span>
                </button>
              )}
              <Link
                href="/dashboard/subscription"
                onClick={onClose}
                className="h-10 px-5 rounded-xl bg-[#7A2253] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#7A2253]/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span>Upgrade to Pro ({formatPlanPrice("pro", "monthly", "INR")}/mo)</span>
              </Link>
            </>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
