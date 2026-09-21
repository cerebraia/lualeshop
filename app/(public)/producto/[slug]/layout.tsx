import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { mockProducts } from '@/lib/mock/products';
import { mockCategories } from '@/lib/mock/categories';
import { formatPrice } from '@/lib/utils';

const SITE = 'https://lualekids.shop';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug && p.visible);
  if (!product) return {};

  const categories = mockCategories
    .filter((c) => product.categoryIds.includes(c.id))
    .map((c) => c.name)
    .join(', ');

  const isMultiPrice =
    product.purchaseOptions && product.purchaseOptions.length > 1;
  const priceText = isMultiPrice
    ? `Desde ${formatPrice(product.price)}`
    : formatPrice(product.price);

  const title = product.name;
  const description = product.description
    ? product.description.slice(0, 155)
    : `${product.name} de Luale Kids Shop. ${categories}. ${priceText}.`;

  // Use real product image when available
  const productImageUrl = product.images[0]
    ? `${SITE}${product.images[0]}`
    : `${SITE}/og-image.jpg`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE}/producto/${slug}` },
    openGraph: {
      title: `${product.name} | Luale Kids Shop`,
      description,
      url: `${SITE}/producto/${slug}`,
      type: 'website',
      siteName: 'Luale Kids Shop',
      images: [
        {
          url: productImageUrl,
          alt: `${product.name} de Luale Kids Shop`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Luale Kids Shop`,
      description,
      images: [productImageUrl],
    },
  };
}

export default function ProductoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
