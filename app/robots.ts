import type { MetadataRoute } from 'next'

const BASE_URL = 'https://ai-traffic.kr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/landing1', '/landing2', '/blog', '/s/'],
        disallow: ['/admin/', '/api/', '/researcher/', '/supplier/', '/auth/', '/p/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
