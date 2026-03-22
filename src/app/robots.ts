import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/login/', '/api/'],
      },
      ...['GPTBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot', 'Amazonbot', 'anthropic-ai'].map(
        (bot) => ({
          userAgent: bot,
          allow: '/',
          disallow: ['/admin/', '/login/', '/api/'],
        })
      ),
    ],
    sitemap: 'https://thepuppyday.com/sitemap.xml',
  };
}
