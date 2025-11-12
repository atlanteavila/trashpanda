import { type MetadataRoute } from 'next'

// Use an environment-aware base URL so the sitemap stays canonical across deployments (SEO best practice).
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetrashpanda.net'

export default function sitemap(): MetadataRoute.Sitemap {
  // Hash fragments are intentionally omitted because search crawlers ignore them entirely.
  const lastModified = new Date()

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]
}
