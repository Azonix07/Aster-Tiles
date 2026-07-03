import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/cart", "/login", "/register", "/api"],
    },
    sitemap: "https://astertiles.ie/sitemap.xml",
  };
}
