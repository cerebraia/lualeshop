import { notFound } from 'next/navigation';
import { getProductBySlug, getVisibleProducts, getCategories } from '@/lib/data/catalog';
import { ProductoPageClient } from './ProductoPageClient';

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, allProducts, allCategories] = await Promise.all([
    getProductBySlug(slug),
    getVisibleProducts(),
    getCategories(),
  ]);

  if (!product) return notFound();

  const categories = allCategories.filter((c) => product.categoryIds.includes(c.id));

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categoryIds.some((id) => product.categoryIds.includes(id))
    )
    .slice(0, 4);

  return (
    <ProductoPageClient
      product={product}
      categories={categories}
      relatedProducts={relatedProducts}
    />
  );
}
