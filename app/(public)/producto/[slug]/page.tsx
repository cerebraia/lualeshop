import { notFound } from 'next/navigation';
import { getProductBySlug, getVisibleProducts, getCategories } from '@/lib/data/catalog';
import { ProductoPageClient } from './ProductoPageClient';

/**
 * Fetches secondary data (related products, category list) with a logged
 * fallback so the product detail page renders even if one of those queries
 * fails. The main product fetch is critical — any failure there is
 * propagated and caught by error.tsx.
 */
async function fetchSecondary(context: string, fn: () => Promise<unknown[]>): Promise<unknown[]> {
  try {
    return await fn();
  } catch (err) {
    // Log server-side only; never exposed to the browser.
    console.error(`[producto/${context}] secondary data fetch failed:`, err);
    return [];
  }
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Critical — notFound() if the product doesn't exist or is inactive.
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  // Secondary — degrade gracefully: related products and category labels
  // are non-essential. Log failures server-side; the page still renders.
  const [allProducts, allCategories] = await Promise.all([
    fetchSecondary('allProducts', getVisibleProducts),
    fetchSecondary('allCategories', getCategories),
  ]) as [Awaited<ReturnType<typeof getVisibleProducts>>, Awaited<ReturnType<typeof getCategories>>];

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
