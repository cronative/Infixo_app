import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Inflixo",
  description: "Secure payment checkout powered by Razorpay.",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
