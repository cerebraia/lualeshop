import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { mockCategories } from '@/lib/mock/categories';
import { mockProducts } from '@/lib/mock/products';

const SITE = 'https://lualekids.shop';

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  bebes: {
    title: 'Ropa para bebés',
    description:
      'Prendas tiernas y cómodas para bebés. Bodies, conjuntos, pijamas y más. Seleccionadas con amor para los más pequeños.',
  },
  ninas: {
    title: 'Ropa para niñas',
    description:
      'Sets, vestidos, conjuntos y más para niñas. Looks llenos de dulzura y personalidad de Luale Kids Shop.',
  },
  ninos: {
    title: 'Ropa para niños',
    description:
      'Conjuntos, joggers, hoodies y más para niños. Ropa cómoda y resistente para cada aventura.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = mockCategories.find((c) => c.slug === slug && c.active);
  if (!cat) return {};

  const productCount = mockProducts.filter(
    (p) => p.categoryIds.includes(cat.id) && p.visible
  ).length;

  const meta = CATEGORY_META[slug] ?? {
    title: cat.name,
    description: cat.description ?? `Ropa infantil ${cat.name} de Luale Kids Shop.`,
  };

  return {
    title: meta.title,
    description: `${meta.description} ${productCount} prendas disponibles.`,
    alternates: { canonical: `${SITE}/categoria/${slug}` },
    openGraph: {
      title: `${meta.title} | Luale Kids Shop`,
      description: meta.description,
      url: `${SITE}/categoria/${slug}`,
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export default function CategoriaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
