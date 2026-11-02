"use client";

import { Sparkles, Check, Film, Link2, ShoppingBag, Star, Layout, Layers } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface PremiumLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProOrVip?: boolean;
  currentLayout: "tabs" | "premium";
  onApplyLayout: (layout: "tabs" | "premium") => Promise<void> | void;
  onPreviewOnly?: () => void;
}

export function PremiumLookModal({
  isOpen,
  onClose,
  currentLayout,
  onApplyLayout,
}: PremiumLookModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      wrapHeader
      title="Public Profile Layout"
      description="Choose how your public profile presents your creative work to fans and brands."
      icon={<Layout className="h-5 w-5 text-[#7A2253]" />}
    >
      <ModalBody className="space-y-4 px-5 sm:px-6 py-2">
        {/* Layout Visual Comparison Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Option A: Tabular Layout */}
          <div
            onClick={() => onApplyLayout("tabs")}
            className={`p-3.5 rounded-[5px] border-2 transition-all cursor-pointer text-left space-y-2.5 ${
              currentLayout === "tabs"
                ? "border-[#7A2253] bg-[#7A2253]/5 shadow-none"
                : "border-[#ECECF0] hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#7A2253]" />
                <span className="text-xs font-bold text-slate-900">Tabular Layout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800">
                  Free
                </span>
                {currentLayout === "tabs" && (
                  <span className="h-4 w-4 rounded-full bg-[#7A2253] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Miniature illustration of tabs */}
            <div className="rounded-[5px] bg-slate-100 p-2 space-y-1.5 border border-slate-200/60">
              <div className="h-2 w-12 rounded-full bg-slate-400/80" />
              <div className="flex gap-1 pt-1 border-b border-slate-200 pb-1">
                <span className="h-1.5 w-6 rounded-none bg-[#7A2253]" />
                <span className="h-1.5 w-6 rounded-none bg-slate-300" />
                <span className="h-1.5 w-6 rounded-none bg-slate-300" />
              </div>
              <div className="h-6 rounded-[3px] bg-white border border-slate-200" />
            </div>

            <p className="text-[11px] text-slate-600 leading-tight">
              Explore my content through organized tabs.
            </p>
          </div>

          {/* Option B: Premium Layout */}
          <div
            onClick={() => onApplyLayout("premium")}
            className={`p-3.5 rounded-[5px] border-2 transition-all cursor-pointer text-left space-y-2.5 relative overflow-hidden ${
              currentLayout === "premium"
                ? "border-[#7A2253] bg-[#7A2253]/5 shadow-none"
                : "border-[#ECECF0] hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#7A2253]" />
                <span className="text-xs font-bold text-slate-900">Premium Layout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800">
                  Free
                </span>
                {currentLayout === "premium" && (
                  <span className="h-4 w-4 rounded-full bg-[#7A2253] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Miniature illustration of single vertical scroll */}
            <div className="rounded-[5px] bg-slate-100 p-2 space-y-1.5 border border-slate-200/60">
              <div className="mx-auto h-3 w-3 rounded-full bg-[#7A2253]" />
              <div className="h-1.5 w-16 mx-auto rounded-full bg-slate-400" />
              <div className="space-y-1 pt-1">
                <div className="h-2 rounded-[3px] bg-white border border-slate-200" />
                <div className="h-2 rounded-[3px] bg-white border border-slate-200" />
                <div className="h-2 rounded-[3px] bg-white border border-slate-200" />
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-tight">
              Show my content together in one vertical page.
            </p>
          </div>
        </div>

        {/* Premium Layout Highlights */}
        <div className="rounded-[5px] border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Premium Layout Highlights:
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
              <span>Top 3 Creator Products + &ldquo;View all&rdquo;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Collab Packages, Reviews &amp; Team Credits</span>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="flex-wrap px-5 sm:px-6 py-4 justify-between">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded-[5px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Close
        </button>

        <div className="flex items-center gap-2">
          {currentLayout === "premium" ? (
            <button
              type="button"
              onClick={() => {
                onApplyLayout("tabs");
                onClose();
              }}
              className="h-9 px-4 rounded-[5px] border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Switch to Tabular Layout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onApplyLayout("premium");
                onClose();
              }}
              className="h-9 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Activate Premium Layout</span>
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
