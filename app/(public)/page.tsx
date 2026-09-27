import type { Metadata } from 'next';
import { getFeaturedProducts, getNewArrivals, getCategories, getVisibleProducts, getProductsByCategorySlug } from '@/lib/data/catalog';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ToysSection } from '@/components/home/ToysSection';
import { BrandStory } from '@/components/home/BrandStory';
import { NewArrivals } from '@/components/home/NewArrivals';
import { BenefitsStrip } from '@/components/home/BenefitsStrip';
import { HowToBuy } from '@/components/home/HowToBuy';
import { HomeFaq } from '@/components/home/HomeFaq';
import { FinalCta } from '@/components/home/FinalCta';

export const metadata: Metadata = {
  title: { absolute: 'Luale Kids Shop | Ropa infantil en Caracas' },
  description:
    'Ropa para bebés, niñas y niños, seleccionada con amor. Realiza tu pedido por WhatsApp. Delivery en Caracas y envíos a toda Venezuela.',
  alternates: { canonical: 'https://lualekids.shop' },
  openGraph: {
    title: 'Luale Kids Shop | Ropa infantil en Caracas',
    description: 'Ropa para bebés, niñas y niños. Pedidos por WhatsApp. Delivery en Caracas.',
    url: 'https://lualekids.shop',
    siteName: 'Luale Kids Shop',
    locale: 'es_VE',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Luale Kids Shop' }],
  },
};

export default async function HomePage() {
  const [featuredProducts, newArrivals, categories, visibleProducts, toyProducts] = await Promise.all([
    getFeaturedProducts(16),
    getNewArrivals(4),
    getCategories(),
    getVisibleProducts(),
    getProductsByCategorySlug('juguetes', 8).catch(() => []),
  ]);

  const categoriesWithCount = categories.map((c) => ({
    ...c,
    count: visibleProducts.filter((p) => p.categoryIds.includes(c.id)).length,
  }));

  const heroProducts = (featuredProducts.length >= 3 ? featuredProducts : visibleProducts)
    .slice(0, 3)
    .map((p, index) => ({
      name: p.name,
      price: p.price,
      garmentType: p.garmentType,
      image: p.images[0] ?? null,
      index,
    }));

  return (
    <>
      <HeroSection products={heroProducts} />
      <CategoryShowcase categories={categoriesWithCount} />
      <FeaturedProducts products={featuredProducts} />
      {toyProducts.length > 0 && <ToysSection products={toyProducts} />}
      <BrandStory />
      <NewArrivals products={newArrivals} />
      <BenefitsStrip />
      <HowToBuy />
      <HomeFaq />
      <FinalCta />
    </>
  );
}
