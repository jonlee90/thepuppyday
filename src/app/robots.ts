import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/', '/profile/'],
    },
    sitemap: 'https://thepuppyday.com/sitemap.xml',
  };
}
