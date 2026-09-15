import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Inflixo",
  description: "Learn how Inflixo uses cookies to provide a personalized creator experience, enhance security, and remember your preferences.",
  alternates: {
    canonical: "https://inflixo.com/cookies",
  },
};

export default function CookieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
