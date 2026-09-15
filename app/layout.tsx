import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Outfit, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
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
  keywords: [
    "Inflixo",
    "creator profile",
    "link in bio",
    "Linktree alternative",
    "video series links",
    "creator media kit",
    "Instagram follower count",
    "YouTube subscriber count",
    "Facebook followers",
    "creator collaboration profile",
    "Indian content creators",
  ],
  applicationName: "Inflixo",
  creator: "Inflixo",
  publisher: "Inflixo",
  alternates: {
    canonical: "https://inflixo.com",
  },
  metadataBase: new URL("https://inflixo.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inflixo",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/logo-square.png",
  },
  openGraph: {
    title: "Inflixo — One Link for Your Content & Fanbase",
    description: "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series.",
    url: "https://inflixo.com",
    siteName: "Inflixo",
    type: "website",
    images: [
      {
        url: "https://inflixo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inflixo — One Link for Your Content & Fanbase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inflixo — One Link for Your Content & Fanbase",
    description: "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series.",
    images: ["https://inflixo.com/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#151933",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://inflixo.com/#organization",
      "name": "Inflixo",
      "url": "https://inflixo.com",
      "logo": "https://inflixo.com/logo-square.png",
      "description": "Build your creator page, bring your social fanbase together, and organize your content into binge-worthy series.",
    },
    {
      "@type": "WebSite",
      "@id": "https://inflixo.com/#website",
      "url": "https://inflixo.com",
      "name": "Inflixo",
      "publisher": { "@id": "https://inflixo.com/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`min-h-full antialiased ${inter.variable} ${sora.variable} ${plusJakartaSans.variable} ${outfit.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-square.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics 4 (GA4) with Consent Mode */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'functionality_storage': 'denied',
              'personalization_storage': 'denied'
            });
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className="min-h-full bg-background font-sans">
        <ToastProvider>
          {children}
          <PwaInstallPrompt />
          <CookieConsentBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
