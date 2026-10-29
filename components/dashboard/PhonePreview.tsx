"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getPublicTheme } from "@/components/public/publicTheme";
import { getThemeDefinition, themeTokenStyle } from "@/themes/config";
import { resolveThemeKey } from "@/services/ThemeService";
import { ThemeBackgroundAnim } from "@/components/theme/ThemeBackgroundAnim";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { ProductService } from "@/services/ProductService";
import { type LinkDto } from "@/services/LinkService";
import { customLinksRepository } from "@/repositories/localRepository";
import type { CreatorProduct, CustomLink, Series, ShopProduct, ThemeKey } from "@/types";

interface PhonePreviewProps {
  username?: string;
  subpath?: string;
  refreshTrigger?: unknown;
  series?: Series[];
  products?: (ShopProduct | CreatorProduct)[];
  links?: (LinkDto | CustomLink)[];
  themeKey?: ThemeKey;
  className?: string;
}

function normalizeProduct(p: ShopProduct | CreatorProduct): CreatorProduct {
  if ("pricePaise" in p) return p;
  return {
    id: p.id,
    name: p.name,
    imageUrl: p.image || "",
    pricePaise: typeof p.price === "number" ? Math.round(p.price * 100) : null,
    productUrl: p.url,
    note: p.note,
    isAffiliate: p.isAffiliate,
  };
}

function normalizeLink(link: LinkDto | CustomLink): CustomLink {
  if (link.kind === "group") {
    return {
      id: link.id,
      title: link.title,
      url: "",
      kind: "collection",
      isEnabled: true,
      items: (link.children || []).map((child) => ({
        id: child.id,
        title: child.title,
        url: child.url,
        iconUrl: child.iconUrl || undefined,
        isEnabled: true,
      })),
    };
  }
  if (link.kind === "link" && "children" in link) {
    const l = link as LinkDto;
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      kind: "link",
      isEnabled: true,
      isPinned: l.pinned,
      iconUrl: l.iconUrl || undefined,
    };
  }
  return link as CustomLink;
}

export function PhonePreview({
  username,
  subpath,
  refreshTrigger,
  series: seriesProp,
  products: productsProp,
  links: linksProp,
  themeKey: themeKeyProp,
  className = "",
}: PhonePreviewProps) {
  const { profile, socials, theme: creatorTheme, series: creatorSeries, totalAudience } = useCreator();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  // Full-screen sticky height matching Themes page
  useLayoutEffect(() => {
    const measure = () => {
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      setPanelHeight(Math.max(820, vh - 32));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Theme resolution
  const resolvedThemeKey = useMemo(() => {
    return resolveThemeKey(themeKeyProp || creatorTheme);
  }, [themeKeyProp, creatorTheme]);

  const t = useMemo(() => getPublicTheme(resolvedThemeKey), [resolvedThemeKey]);
  const meta = t.meta;

  // Username and subpath
  const rawProp = (username || profile?.username || "").replace(/^@/, "").trim();
  const handle = rawProp || "demo_creator";
  const cleanSubpath = subpath ? subpath.replace(/^\//, "").replace(/\/$/, "") : "";

  // Products state (if not passed as prop)
  const [internalProducts, setInternalProducts] = useState<CreatorProduct[]>([]);
  useEffect(() => {
    if (productsProp && productsProp.length > 0) return;
    let cancelled = false;
    ProductService.list()
      .then((items) => {
        if (!cancelled && Array.isArray(items)) {
          setInternalProducts(items);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productsProp, refreshTrigger]);

  // Links state (if not passed as prop)
  const [internalLinks, setInternalLinks] = useState<CustomLink[]>([]);
  useEffect(() => {
    if (linksProp && linksProp.length > 0) return;
    try {
      const items = customLinksRepository.get();
      if (Array.isArray(items)) {
        setInternalLinks(items);
      }
    } catch {}
  }, [linksProp, refreshTrigger]);

  const seriesData = useMemo(() => {
    if (seriesProp) return seriesProp;
    return creatorSeries || [];
  }, [seriesProp, creatorSeries]);

  const productsData = useMemo(() => {
    if (productsProp && productsProp.length > 0) {
      return productsProp.map(normalizeProduct);
    }
    return internalProducts;
  }, [productsProp, internalProducts]);

  const linksData = useMemo(() => {
    if (linksProp && linksProp.length > 0) return linksProp.map(normalizeLink);
    return internalLinks;
  }, [linksProp, internalLinks]);

  const pageTitle = useMemo(() => {
    if (cleanSubpath === "series") return "Shows & Series";
    if (cleanSubpath === "products" || cleanSubpath === "shop") return "Shop & Products";
    if (cleanSubpath === "links") return "Links & Socials";
    return "Live Preview";
  }, [cleanSubpath]);

  const publicHref = `/${handle}${cleanSubpath ? `/${cleanSubpath}` : ""}`;

  const handleCopyLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullUrl = `${origin}/${handle}${cleanSubpath ? `/${cleanSubpath}` : ""}`;
    const ok = await copyToClipboard(fullUrl);
    if (ok) {
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Failed to copy link", "error");
    }
  };

  return (
    <aside
      aria-label="Profile preview"
      style={{ height: panelHeight ? `${panelHeight}px` : "calc(100dvh - 2rem)" }}
      className={`hidden lg:flex flex-col gap-2 w-[380px] xl:w-[440px] shrink-0 sticky top-6 min-h-[820px] max-h-[1080px] ${className}`}
    >
      {/* Top Header Bar: Page title badge, copy link button & open in new tab */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#F4F4F5] border border-[#E4E4E7]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11.5px] font-semibold text-[#18181B] truncate">
              {pageTitle}
            </span>
          </div>
          {cleanSubpath && (
            <span className="text-[11px] text-[#A1A1AA] truncate font-mono">
              /{cleanSubpath}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy public page link"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border border-[#E4E4E7] bg-white text-[11.5px] font-medium text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#D4D4D8] active:scale-[0.98] transition-all cursor-pointer shadow-none"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#10B981]" />
                <span className="text-[#10B981] font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-[#71717A]" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <a
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Open public page in new tab"
            className="p-1.5 rounded-[5px] border border-[#E4E4E7] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#D4D4D8] active:scale-[0.98] transition-all cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Preview Box: Edge-to-edge Theme background without mobile bezel/frames */}
      <div
        style={{
          ...themeTokenStyle(resolvedThemeKey),
          background: "var(--page-bg)",
          transform: "translateZ(0)",
        }}
        className="relative flex-1 w-full min-h-0 overflow-hidden rounded-[5px] border border-[#E4E4E7] transition-colors duration-300"
      >
        <div
          aria-hidden="true"
          style={{ background: "var(--page-bg)" }}
          className={`absolute inset-0 pointer-events-none bg-cover bg-center ${
            t.hasPhotoBackdrop ? "theme-photo-backdrop" : ""
          }`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--page-overlay)" }}
        />
        <ThemeBackgroundAnim
          name={getThemeDefinition(resolvedThemeKey).tokens["--page-anim"]}
        />
        {meta.animation?.type !== "none" && (
          <AmbientAnimation
            type={meta.animation?.type || meta.animationType}
            colors={meta.animation?.colors || meta.particleColors}
            themeKey={resolvedThemeKey}
            contained={true}
          />
        )}
        {!t.hasPhotoBackdrop && (
          <FocusOverlay overlay={meta.focusOverlay} contained={true} />
        )}

        {/* Live profile card (without back button inside dashboard preview) */}
        <div className="relative z-10 h-full flex flex-col px-4 py-4 min-h-0">
          <LivePreviewCard
            profile={profile}
            socials={socials}
            series={seriesData}
            products={productsData}
            customLinks={linksData}
            totalAudience={totalAudience}
            themeKey={resolvedThemeKey}
            variant="full"
            layoutMode="tabs"
            seriesOnlyMode={cleanSubpath === "series"}
            productsOnlyMode={cleanSubpath === "products" || cleanSubpath === "shop"}
            linksOnlyMode={cleanSubpath === "links"}
            pageHeader={undefined}
            hideFooter={true}
            isInformational={true}
          />
        </div>
      </div>
    </aside>
  );
}
