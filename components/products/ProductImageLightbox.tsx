"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import type { CreatorProduct } from "@/types";
import { formatProductPrice } from "@/components/products/ProductImage";

interface ProductImageLightboxProps {
  product: CreatorProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isInformationalMode?: boolean;
  onExternalClick?: (productName: string) => void;
}

const ZOOM_STEPS = [1, 1.5, 2, 2.5];

export function ProductImageLightbox({
  product,
  isOpen,
  onClose,
  isInformationalMode = false,
  onExternalClick,
}: ProductImageLightboxProps) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset zoom and error state whenever product changes or opens
  useEffect(() => {
    if (isOpen) {
      setZoomIndex(0);
      setImageError(false);
    }
  }, [isOpen, product?.id]);

  // Lock body scroll and handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
      } else if (e.key === "-" || e.key === "_") {
        setZoomIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "0") {
        setZoomIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleResetZoom = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex(0);
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomIndex((prev) => (prev === 0 ? 2 : 0));
  }, []);

  if (!mounted || !isOpen || !product) return null;

  const currentZoom = ZOOM_STEPS[zoomIndex];
  const zoomPercentage = Math.round(currentZoom * 100);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} image zoom preview`}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/92 backdrop-blur-xl animate-fade-in select-none text-white overflow-hidden"
    >
      {/* 1. TOP HEADER BAR */}
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 sm:px-6 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3 pr-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15">
            <ShoppingBag className="h-4.5 w-4.5 text-white/90" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm sm:text-base font-bold text-white tracking-tight" title={product.name}>
              {product.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {product.pricePaise !== null && (
                <span className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums">
                  {formatProductPrice(product.pricePaise)}
                </span>
              )}
              <span className="text-[11px] text-white/50 hidden sm:inline">
                Tap image or use controls to zoom
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => {
                if (isInformationalMode) {
                  e.preventDefault();
                  onExternalClick?.(product.name);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A2253] hover:bg-[#03256c] border border-blue-400/30 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>View Product</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close zoom preview"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:rotate-90 cursor-pointer active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN IMAGE VIEWPORT AREA */}
      <main
        ref={containerRef}
        onClick={onClose}
        className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 overscroll-contain"
        style={{
          cursor: currentZoom > 1 ? "zoom-out" : "default",
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
          className={`relative max-w-full transition-transform duration-300 ease-out ${
            currentZoom === 1 ? "cursor-zoom-in" : "cursor-zoom-out"
          }`}
          style={{
            transform: `scale(${currentZoom})`,
            transformOrigin: "center center",
          }}
        >
          {product.imageUrl && !imageError ? (
            <div className="relative max-h-[70vh] sm:max-h-[76vh] max-w-[85vw] sm:max-w-[70vw] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/15 bg-slate-900/60 flex items-center justify-center">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={800}
                height={800}
                unoptimized
                priority
                className="max-h-[70vh] sm:max-h-[76vh] w-auto h-auto object-contain rounded-2xl"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/60 p-6 text-center">
              <ShoppingBag className="h-12 w-12 text-white/40 mb-3" />
              <p className="text-sm font-semibold">{product.name}</p>
              <p className="text-xs text-white/40 mt-1">Image preview not available</p>
            </div>
          )}
        </div>
      </main>

      {/* 3. BOTTOM FLOATING ZOOM CONTROL TOOLBAR */}
      <footer className="relative z-20 flex shrink-0 items-center justify-center pb-5 pt-2 px-4 safe-bottom pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-slate-900/90 border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-white transition-all disabled:opacity-40 disabled:hover:bg-white/5 cursor-pointer active:scale-95"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            title="Reset to 100% (0)"
            className="flex h-9 min-w-[58px] items-center justify-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 text-xs font-black tabular-nums tracking-wide text-white transition-all cursor-pointer active:scale-95"
          >
            <span>{zoomPercentage}%</span>
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-white transition-all disabled:opacity-40 disabled:hover:bg-white/5 cursor-pointer active:scale-95"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-white/15 mx-0.5" />

          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            title="Reset"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
