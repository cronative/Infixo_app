/**
 * Current versions of Inflixo's legal documents.
 *
 * Bump a version whenever the wording of that document changes. The value is stored
 * with each creator's acceptance record (see lib/legalAcceptanceDb.ts), so it must
 * stay short and stable (ISO date of the revision).
 */
export const LEGAL_DOCUMENTS = {
  terms: {
    key: "terms",
    title: "Terms of Service",
    href: "/terms",
    version: "2026-10-29",
    lastUpdated: "October 29, 2026",
  },
  creatorTerms: {
    key: "creator_terms",
    title: "Creator Terms & Conditions",
    href: "/creator-terms",
    version: "2026-10-29",
    lastUpdated: "October 29, 2026",
  },
  privacy: {
    key: "privacy",
    title: "Privacy Policy",
    href: "/privacy",
    version: "2026-09-19",
    lastUpdated: "September 19, 2026",
  },
} as const;

export type LegalDocumentId = keyof typeof LEGAL_DOCUMENTS;

/** Documents a creator must accept to register. */
export const REGISTRATION_LEGAL_DOCUMENTS: LegalDocumentId[] = ["terms", "creatorTerms", "privacy"];

/** Legal operator details used across legal pages. */
export const LEGAL_ENTITY = {
  companyName: "TrustIQ Labs Private Limited",
  productName: "Inflixo",
  website: "https://inflixo.com",
  jurisdictionCity: "Ahmedabad, Gujarat, India",
  emails: {
    legal: "legal@inflixo.com",
    support: "support@inflixo.com",
    billing: "billing@inflixo.com",
    privacy: "privacy@inflixo.com",
    grievance: "grievance@inflixo.com",
  },
} as const;
