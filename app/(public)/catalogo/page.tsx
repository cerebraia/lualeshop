import { getVisibleProducts, getCategories } from '@/lib/data/catalog';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export default async function CatalogoPage() {
  const [products, categories] = await Promise.all([
    getVisibleProducts(),
    getCategories(),
  ]);

  return <CatalogClient products={products} categories={categories} />;
}
