import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { themeTokensCss } from "@/themes/config";

const poppins = Poppins({
  subsets: ["latin", "devanagari"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Inflixo: Your Videos in Order, Your Creator World in One Link",
  description:
    "Turn your YouTube, Instagram & Facebook videos into bingeable series. Show your total fanbase, tour & ticket links, brand reviews and creator setup in one link in bio. Made in India for creators.",
  keywords: [
    "Inflixo",
    "link in bio",
    "Linktree alternative",
    "Linktree alternative India",
    "video series link in bio",
    "organise reels into series",
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
    title: "Inflixo: Your Videos in Order, Your Creator World in One Link",
    description: "Turn your YouTube, Instagram & Facebook videos into bingeable series. Show your total fanbase, tour & ticket links, brand reviews and creator setup in one link in bio. Made in India for creators.",
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
    title: "Inflixo: Your Videos in Order, Your Creator World in One Link",
    description: "Turn your YouTube, Instagram & Facebook videos into bingeable series. Show your total fanbase, tour & ticket links, brand reviews and creator setup in one link in bio. Made in India for creators.",
    images: ["https://inflixo.com/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#7A2253",
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
      "description": "Video-first link in bio platform built for Indian creators to organise video series, show their total fanbase, and share tour links, brand reviews and creator setup.",
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
        "lowPrice": "199",
        "highPrice": "399",
        "priceCurrency": "INR"
      },
      "description": "Turn your YouTube, Instagram & Facebook videos into bingeable series. Show your total fanbase, tour & ticket links, brand reviews and creator setup in one link in bio."
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
            "text": "No. You paste links to your existing YouTube, Instagram or Facebook videos. Inflixo organises them; your videos stay on your channels."
          }
        },
        {
          "@type": "Question",
          "name": "What is \"My Setup\"?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It's a list of the camera, mic, lights, apps and software you use, so fans stop asking in DMs. You can add affiliate links or digital products like presets and guides."
          }
        },
        {
          "@type": "Question",
          "name": "Do my fans need an app or account to watch?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Anyone can open your Inflixo link in any mobile or desktop browser, with no signup or app."
          }
        },
        {
          "@type": "Question",
          "name": "How is my total fanbase calculated?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inflixo reads the publicly visible follower or subscriber counts on the Instagram, YouTube and Facebook profiles you add, and shows them together as one number."
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
      className={`min-h-full antialiased ${poppins.variable}`}
    >
      <head>
        {/* Default theme tokens for shared profile widgets outside a profile root; lower priority than the dashboard vars. */}
        <style dangerouslySetInnerHTML={{ __html: themeTokensCss() }} />
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
      <body className="min-h-full bg-white font-sans">
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
