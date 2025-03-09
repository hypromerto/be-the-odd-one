import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betheone.game'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/room/', // Prevent indexing of game rooms
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
} 