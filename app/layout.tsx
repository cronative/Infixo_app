import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Inflixo — One Link for Your Content & Fanbase",
  description:
    "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series with Inflixo.",
  metadataBase: new URL("https://inflixo.com"),
  openGraph: {
    title: "Inflixo — One Link for Your Content & Fanbase",
    description: "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series.",
    url: "https://inflixo.com",
    siteName: "Inflixo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inflixo — One Link for Your Content & Fanbase",
    description: "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#651FFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${plusJakartaSans.variable} ${outfit.variable}`}
    >
      <body className="min-h-full bg-background font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
