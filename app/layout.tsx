import type { Metadata, Viewport } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Outfit,
  Sora,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Noto_Sans_Kannada,
  Noto_Sans_Bengali,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { SessionProvider } from "@/contexts/SessionContext";
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

// Indian-language fonts (Hindi/Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Punjabi).
// Only the script subset is requested and nothing is preloaded, so a browser downloads a
// file only when that script actually appears on the page (unicode-range).
const notoDevanagari = Noto_Sans_Devanagari({ display: "swap", preload: false, subsets: ["devanagari"], variable: "--font-noto-devanagari" });
const notoGujarati = Noto_Sans_Gujarati({ display: "swap", preload: false, subsets: ["gujarati"], variable: "--font-noto-gujarati" });
const notoTamil = Noto_Sans_Tamil({ display: "swap", preload: false, subsets: ["tamil"], variable: "--font-noto-tamil" });
const notoTelugu = Noto_Sans_Telugu({ display: "swap", preload: false, subsets: ["telugu"], variable: "--font-noto-telugu" });
const notoKannada = Noto_Sans_Kannada({ display: "swap", preload: false, subsets: ["kannada"], variable: "--font-noto-kannada" });
const notoBengali = Noto_Sans_Bengali({ display: "swap", preload: false, subsets: ["bengali"], variable: "--font-noto-bengali" });
const notoGurmukhi = Noto_Sans_Gurmukhi({ display: "swap", preload: false, subsets: ["gurmukhi"], variable: "--font-noto-gurmukhi" });
const indicFontVariables = [notoDevanagari, notoGujarati, notoTamil, notoTelugu, notoKannada, notoBengali, notoGurmukhi]
  .map((font) => font.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Inflixo — The Video-First Link in Bio & Creator Hub",
  description:
    "Organize your YouTube & Instagram videos into bingeable series, sell digital products & affiliate gear, and showcase your verified fanbase in one bio link.",
  keywords: [
    "Inflixo",
    "link in bio",
    "Linktree alternative",
    "Linktree alternative India",
    "video series link in bio",
    "organize reels into series",
    "YouTube playlist link in bio",
    "creator store India",
    "sell presets in bio",
    "affiliate products link in bio",
    "creator media kit builder",
    "Instagram follower counter",
    "YouTube subscriber count",
    "creator rate card",
    "Indian content creators",
    "Atmanirbhar Bharat creator tool",
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
    title: "Inflixo — The Video-First Link in Bio & Creator Hub",
    description: "Organize your YouTube & Instagram videos into bingeable series, sell digital products & affiliate gear, and showcase your verified fanbase in one bio link.",
    url: "https://inflixo.com",
    siteName: "Inflixo",
    type: "website",
    images: [
      {
        url: "https://inflixo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inflixo — One Link for Your Content, Series & Fanbase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inflixo — The Video-First Link in Bio & Creator Hub",
    description: "Organize your YouTube & Instagram videos into bingeable series, sell digital products & affiliate gear, and showcase your verified fanbase in one bio link.",
    images: ["https://inflixo.com/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#043084",
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
      "description": "Video-first link in bio platform built for Indian creators to organize video series, run digital & affiliate shops, and showcase brand media kits.",
      "sameAs": [
        "https://twitter.com/inflixo",
        "https://instagram.com/inflixo",
        "https://youtube.com/@inflixo"
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://inflixo.com/#website",
      "url": "https://inflixo.com",
      "name": "Inflixo",
      "publisher": { "@id": "https://inflixo.com/#organization" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://inflixo.com/#app",
      "name": "Inflixo",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All",
      "url": "https://inflixo.com",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "799",
        "priceCurrency": "INR"
      },
      "description": "Create a stunning video-first portfolio. Group reels & videos into playlists, add your affiliate recommendations, and land brand deals with your media kit."
    },
    {
      "@type": "FAQPage",
      "@id": "https://inflixo.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does Inflixo host or re-upload my videos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Your videos stay on YouTube, Instagram, or Facebook. Inflixo only organizes your video links into a clean playlist format, and views count directly on your original channel."
          }
        },
        {
          "@type": "Question",
          "name": "Can I sell digital products or add affiliate links?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Inflixo has a built-in Creator Store. You can sell digital downloads (presets, guides, templates, courses) or add affiliate links for your camera gear and setup with 0% platform commission."
          }
        },
        {
          "@type": "Question",
          "name": "Do my fans need an app or account to watch?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Anyone can open your Inflixo link directly in any mobile or desktop browser without signing up."
          }
        },
        {
          "@type": "Question",
          "name": "What is Total Fanbase?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It is the sum of your public audience across Instagram, Facebook, and YouTube, displayed as one combined reach metric for fans and brands."
          }
        }
      ]
    }
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
      className={`min-h-full antialiased ${inter.variable} ${sora.variable} ${plusJakartaSans.variable} ${outfit.variable} ${indicFontVariables}`}
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
        <SessionProvider>
          <ToastProvider>
            {children}
            <PwaInstallPrompt />
            <CookieConsentBanner />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
