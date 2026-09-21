import type { MetadataRoute } from 'next';
import { mockProducts } from '@/lib/mock/products';
import { mockCategories } from '@/lib/mock/categories';

const SITE = 'https://lualekids.shop';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/catalogo`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE}/nuestra-historia`,
      lastModified: new Date('2025-09-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE}/preguntas-frecuentes`,
      lastModified: new Date('2025-09-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Category pages (active only)
  const categoryPages: MetadataRoute.Sitemap = mockCategories
    .filter((c) => c.active)
    .map((c) => ({
      url: `${SITE}/categoria/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Product pages (visible and active only)
  const productPages: MetadataRoute.Sitemap = mockProducts
    .filter((p) => p.visible)
    .map((p) => ({
      url: `${SITE}/producto/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...productPages];
}
