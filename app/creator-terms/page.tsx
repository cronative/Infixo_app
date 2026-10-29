import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCUMENTS, LEGAL_ENTITY } from "@/lib/legalVersions";
import { CREATOR_TERMS_INTRO, CREATOR_TERMS_SECTIONS } from "@/content/legal/creatorTerms";

const DOC = LEGAL_DOCUMENTS.creatorTerms;

export const metadata: Metadata = {
  title: "Creator Terms & Conditions | Inflixo",
  description:
    "Creator Terms & Conditions for Inflixo: public profiles, series links, social accounts, fanbase metrics, media kits, shops, reviews, plans and account deletion.",
  alternates: { canonical: "/creator-terms" },
  openGraph: {
    title: "Creator Terms & Conditions | Inflixo",
    description: "The creator-specific terms that supplement the Inflixo Terms of Service.",
    url: "/creator-terms",
    type: "website",
  },
};

export const dynamic = "force-static";

export default function CreatorTermsPage() {
  return (
    <LegalDocument
      title={DOC.title}
      href={DOC.href}
      lastUpdated={DOC.lastUpdated}
      version={DOC.version}
      operator={LEGAL_ENTITY.companyName}
      intro={CREATOR_TERMS_INTRO}
      relatedNotice={
        <>
          These Creator Terms supplement the{" "}
          <Link href="/terms" className="font-medium text-[#7A2253] underline underline-offset-2">
            Terms of Service
          </Link>
          , which also apply to you.
        </>
      }
      sections={CREATOR_TERMS_SECTIONS}
    />
  );
}
