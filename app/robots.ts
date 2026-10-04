import type { MetadataRoute } from "next";

/**
 * Nothing here should be indexed. The staff routes are code-gated, but the ticket
 * pages carry a token in the URL and a search engine has no business holding one.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
