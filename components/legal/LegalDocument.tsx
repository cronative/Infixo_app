import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { renderInline, type LegalBlock, type LegalSection } from "@/components/legal/legalContent";

interface LegalDocumentProps {
  title: string;
  href: string;
  lastUpdated: string;
  version: string;
  operator: string;
  intro: LegalBlock[];
  /** Small notice under the title, e.g. how this document relates to another one. */
  relatedNotice?: ReactNode;
  sections: LegalSection[];
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return <p key={i}>{renderInline(block.content)}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-[#A8A29E]">
                {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-[lower-alpha] space-y-1.5 pl-6 marker:text-[#797570]">
                {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
              </ol>
            );
          case "sub":
            return (
              <div key={i} className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#181716] sm:text-base">{block.title}</h3>
                <Blocks blocks={block.blocks} />
              </div>
            );
        }
      })}
    </>
  );
}

/**
 * Server-rendered legal document layout: flat, minimal, readable.
 * Numbered sections, sticky table of contents on desktop, collapsible one on mobile (no JS).
 */
export function LegalDocument({
  title,
  href,
  lastUpdated,
  version,
  operator,
  intro,
  relatedNotice,
  sections,
}: LegalDocumentProps) {
  const toc = (
    <ol className="space-y-1.5 text-[13px] leading-snug">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex gap-2 rounded-[5px] py-0.5 text-[#54514D] hover:text-[#7A2253] focus-visible:outline-2 focus-visible:outline-[#7A2253]"
          >
            <span className="w-5 shrink-0 tabular-nums text-[#A8A29E]">{i + 1}.</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-[#181716]">
      <a
        href="#legal-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[5px] focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#7A2253] focus:outline-2 focus:outline-[#7A2253]"
      >
        Skip to content
      </a>

      <header className="safe-top sticky top-0 z-50 border-b border-[#E7E3DC] bg-white">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-3 sm:px-6">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E7E3DC] px-3 text-xs font-semibold text-[#54514D] hover:border-[#7A2253]/30 hover:text-[#7A2253]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
        </div>
      </header>

      <main id="legal-content" className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="border-b border-[#E7E3DC] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A2253]">Legal</p>
          <h1 className="mt-2 font-display text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[#797570]">
            <span className="whitespace-nowrap">Last updated: {lastUpdated}</span>
            {" · "}
            <span className="whitespace-nowrap">Version {version}</span>
            {" · "}
            <span className="whitespace-nowrap">{operator}</span>
          </p>
          {relatedNotice ? (
            <div className="mt-4 rounded-[5px] border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-3 text-sm leading-relaxed text-[#54514D]">
              {relatedNotice}
            </div>
          ) : null}
        </div>

        <div className="mt-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          {/* Desktop: sticky table of contents */}
          <aside className="hidden lg:block">
            <nav aria-label={`${title} sections`} className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#797570]">Contents</p>
              {toc}
            </nav>
          </aside>

          <article className="min-w-0">
            {/* Mobile/tablet: collapsible table of contents (no JavaScript) */}
            <details className="mb-8 rounded-[5px] border border-[#E7E3DC] lg:hidden">
              <summary className="cursor-pointer select-none rounded-[5px] px-4 py-3 text-sm font-semibold text-[#181716]">
                Contents ({sections.length} sections)
              </summary>
              <nav aria-label={`${title} sections`} className="border-t border-[#E7E3DC] px-4 py-3">
                {toc}
              </nav>
            </details>

            <div className="space-y-4 text-[15px] leading-[1.7] text-[#44403C] sm:text-base">
              <Blocks blocks={intro} />
            </div>

            <div className="mt-10 space-y-10">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
                  <h2 id={`${s.id}-title`} className="text-lg font-bold leading-snug text-[#181716] sm:text-xl">
                    <span className="mr-1.5 tabular-nums text-[#7A2253]">{i + 1}.</span>
                    {s.title}
                  </h2>
                  <div className="mt-3 space-y-4 break-words text-[15px] leading-[1.7] text-[#44403C] sm:text-base">
                    <Blocks blocks={s.blocks} />
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <LegalFooter current={href} />
    </div>
  );
}
