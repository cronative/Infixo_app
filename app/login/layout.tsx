import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Login — Inflixo",
  description: "Sign in to your Inflixo creator dashboard to manage your video series, fan links, collaboration packages, and audience analytics.",
  alternates: {
    canonical: "https://inflixo.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
