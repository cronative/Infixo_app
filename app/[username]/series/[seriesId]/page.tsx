import { Metadata } from "next";
import { getPublicSeriesData } from "@/lib/publicSeriesService";
import { SeriesDetailClient } from "./SeriesDetailClient";

interface PageProps {
  params: Promise<{
    username: string;
    seriesId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername, seriesId: rawSeriesId } = await params;
  const username = decodeURIComponent(rawUsername || "").trim();
  const seriesId = decodeURIComponent(rawSeriesId || "").trim();

  const { series, creator } = await getPublicSeriesData(username, seriesId);

  const creatorName = creator?.displayName || username || "Creator";
  const seriesTitle = series?.title || "Series";
  const episodeCount = series?.seasons?.flatMap((s) => s.episodes)?.length || 0;
  const description =
    series?.description?.trim() ||
    `Watch all ${episodeCount} episodes of ${seriesTitle} by ${creatorName} on Inflixo.`;

  const canonicalUrl = `https://inflixo.com/${username}/series/${seriesId}`;
  const ogImage = series?.posterDataUrl || creator?.photoDataUrl || "https://inflixo.com/og-image.png";

  return {
    title: `${seriesTitle} by ${creatorName} | Inflixo`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${seriesTitle} — Watch on Inflixo`,
      description,
      url: canonicalUrl,
      siteName: "Inflixo",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seriesTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${seriesTitle} by ${creatorName} | Inflixo`,
      description,
      images: [ogImage],
    },
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { username: rawUsername, seriesId: rawSeriesId } = await params;
  const username = decodeURIComponent(rawUsername || "").trim();
  const seriesId = decodeURIComponent(rawSeriesId || "").trim();

  const { series, creator } = await getPublicSeriesData(username, seriesId);

  const allEpisodes = series?.seasons?.flatMap((s) => s.episodes) || [];

  // JSON-LD Structured Data
  const jsonLdSeries = series
    ? {
        "@context": "https://schema.org",
        "@type": "VideoSeries",
        name: series.title,
        description: series.description,
        numberOfEpisodes: allEpisodes.length,
        author: {
          "@type": "Person",
          name: creator?.displayName || username,
          url: `https://inflixo.com/${username}`,
        },
        url: `https://inflixo.com/${username}/series/${series.id}`,
        image: series.posterDataUrl || creator?.photoDataUrl || "https://inflixo.com/og-image.png",
        hasPart: allEpisodes.map((ep, idx) => ({
          "@type": "Episode",
          episodeNumber: ep.episodeNumber || idx + 1,
          name: ep.title || `Episode ${ep.episodeNumber || idx + 1}`,
          url: ep.externalUrl || `https://inflixo.com/${username}/series/${series.id}`,
        })),
      }
    : null;

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://inflixo.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: creator?.displayName || `@${username}`,
        item: `https://inflixo.com/${username}`,
      },
      ...(series
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: series.title,
              item: `https://inflixo.com/${username}/series/${series.id}`,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      {jsonLdSeries && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSeries) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />
      <SeriesDetailClient
        username={username}
        seriesId={seriesId}
        initialSeries={series}
        initialCreator={creator}
      />
    </>
  );
}
