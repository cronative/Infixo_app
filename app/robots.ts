import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/onboarding/",
        "/verify-otp/",
        "/review/",
        "/admin/",
        "/creator_email_sender/",
      ],
    },
    sitemap: "https://inflixo.com/sitemap.xml",
  };
}
