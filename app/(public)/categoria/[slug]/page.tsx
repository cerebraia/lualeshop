import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategoryBySlug, getProductsByCategory } from '@/lib/data/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';

const categoryEmoji: Record<string, string> = {
  bebes: '☁',
  ninas: '✿',
  ninos: '★',
};

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return notFound();

  const products = await getProductsByCategory(category.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-1 text-sm text-brown-light mb-8">
        <Link href="/" className="hover:text-rose transition-colors">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/catalogo" className="hover:text-rose transition-colors">Catálogo</Link>
        <ChevronRight size={14} />
        <span className="text-brown font-semibold">{category.name}</span>
      </nav>

      <div className="text-center mb-10">
        <div className="text-5xl mb-3">{categoryEmoji[slug] ?? '✦'}</div>
        <h1 className="text-4xl font-extrabold text-brown mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-brown-light max-w-md mx-auto">{category.description}</p>
        )}
        <p className="text-sm text-brown-light mt-2">{products.length} productos</p>
      </div>

      <ProductGrid
        products={products}
        emptyTitle={`Sin productos en ${category.name}`}
        emptyDescription="Pronto tendremos novedades para esta categoría."
      />
    </div>
  );
}
