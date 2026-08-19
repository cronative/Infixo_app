import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://inflixo.com";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic public creator profile routes from database
  let dynamicProfiles: MetadataRoute.Sitemap = [];
  try {
    const [rows]: any = await db.query(
      `SELECT username, updated_at FROM creators WHERE username IS NOT NULL AND username != ''`
    );

    if (rows && rows.length > 0) {
      dynamicProfiles = rows.map((c: any) => ({
        url: `${baseUrl}/${c.username}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.warn("Sitemap DB fetch fallback:", err);
  }

  return [...staticRoutes, ...dynamicProfiles];
}
