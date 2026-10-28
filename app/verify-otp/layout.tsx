import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email — Inflixo",
  description: "Verify your email with the one-time code to sign in to your Inflixo creator account.",
};

export default function VerifyOtpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
