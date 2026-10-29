import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, dependency-free content model for legal documents.
 * Content lives in content/legal/*.tsx; rendering lives in LegalDocument.tsx.
 */
export type Inline = string | { href: string; text: string } | { strong: string };

export type LegalBlock =
  | { type: "p"; content: Inline[] }
  | { type: "ul"; items: Inline[][] }
  | { type: "ol"; items: Inline[][] }
  | { type: "sub"; title: string; blocks: LegalBlock[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

/** Helpers to keep content files readable. */
export const p = (...content: Inline[]): LegalBlock => ({ type: "p", content });
export const ul = (...items: (Inline | Inline[])[]): LegalBlock => ({
  type: "ul",
  items: items.map((i) => (Array.isArray(i) ? i : [i])),
});
export const ol = (...items: (Inline | Inline[])[]): LegalBlock => ({
  type: "ol",
  items: items.map((i) => (Array.isArray(i) ? i : [i])),
});
export const sub = (title: string, ...blocks: LegalBlock[]): LegalBlock => ({ type: "sub", title, blocks });
export const a = (href: string, text: string): Inline => ({ href, text });
export const b = (text: string): Inline => ({ strong: text });
export const mail = (email: string): Inline => ({ href: `mailto:${email}`, text: email });
export const section = (id: string, title: string, ...blocks: LegalBlock[]): LegalSection => ({ id, title, blocks });

const LINK_CLASS =
  "font-medium text-[#7A2253] underline underline-offset-2 decoration-[#7A2253]/40 hover:decoration-[#7A2253] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A2253] rounded-[5px]";

export function renderInline(content: Inline[]): ReactNode[] {
  return content.map((part, i) => {
    if (typeof part === "string") return part;
    if ("strong" in part) return <strong key={i} className="font-semibold text-[#181716]">{part.strong}</strong>;
    const external = /^https?:\/\//.test(part.href);
    if (external || part.href.startsWith("mailto:")) {
      return (
        <a
          key={i}
          href={part.href}
          className={`${LINK_CLASS} break-words`}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {part.text}
        </a>
      );
    }
    return (
      <Link key={i} href={part.href} className={LINK_CLASS}>
        {part.text}
      </Link>
    );
  });
}
