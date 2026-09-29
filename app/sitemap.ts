import type { MetadataRoute } from 'next';
import { getAllModels, getCatalog } from '@/lib/data/models';

const BASE_URL = 'https://ollama-explorer.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const models = getAllModels();
  const generatedAt = new Date(getCatalog().generated_at);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: generatedAt,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/models`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: generatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/roadmap`,
      lastModified: generatedAt,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: generatedAt,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const modelRoutes: MetadataRoute.Sitemap = models.map((model) => ({
    url: `${BASE_URL}/models/${model.slug}`,
    lastModified: model.source_updated_at ? new Date(model.source_updated_at) : generatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...modelRoutes];
}
