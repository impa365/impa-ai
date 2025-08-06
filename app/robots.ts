import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/landing',
        '/demo',
        '/auth/login',
      ],
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/_next/',
        '/private/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 