import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCUMENTS, LEGAL_ENTITY } from "@/lib/legalVersions";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/content/legal/termsOfService";

const DOC = LEGAL_DOCUMENTS.terms;

export const metadata: Metadata = {
  title: "Terms of Service | Inflixo",
  description:
    "The Terms of Service for Inflixo: accounts, creator content, series links, social audience information, subscriptions, refunds, acceptable use and your rights.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | Inflixo",
    description: "The terms that govern your use of Inflixo, operated by TrustIQ Labs Private Limited.",
    url: "/terms",
    type: "website",
  },
};

// Static legal content: rendered on the server at build time.
export const dynamic = "force-static";

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title={DOC.title}
      href={DOC.href}
      lastUpdated={DOC.lastUpdated}
      version={DOC.version}
      operator={LEGAL_ENTITY.companyName}
      intro={TERMS_INTRO}
      relatedNotice={
        <>
          Are you a creator? The{" "}
          <Link href="/creator-terms" className="font-medium text-[#7A2253] underline underline-offset-2">
            Creator Terms &amp; Conditions
          </Link>{" "}
          add creator-specific rules to these Terms.
        </>
      }
      sections={TERMS_SECTIONS}
    />
  );
}
