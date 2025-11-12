import { type MetadataRoute } from 'next'

// Reuse the canonical origin so crawlers discover the sitemap URL in every environment (SEO best practice).
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetrashpanda.net'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block auth and dashboard routes to prevent low-quality pages from being indexed.
        disallow: ['/login', '/register', '/dash', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
