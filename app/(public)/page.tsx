import type { Metadata } from 'next';
import { mockProducts } from '@/lib/mock/products';
import { mockCategories } from '@/lib/mock/categories';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
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

// ─── Data preparation (server-side) ──────────────────────────────────────────

const visibleProducts = mockProducts.filter((p) => p.visible);

// Up to 16 featured products for the grid carousel, sorted by featuredOrder
const featuredProducts = visibleProducts
  .filter((p) => p.featured)
  .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
  .slice(0, 16);

// Up to 4 new arrivals (isNew flag), deterministic order by catalogNumber
const newArrivals = visibleProducts
  .filter((p) => p.isNew)
  .sort((a, b) => (a.catalogNumber ?? 0) - (b.catalogNumber ?? 0))
  .slice(0, 4);

// Categories with real product counts, sorted by order
const categoriesWithCount = mockCategories
  .filter((c) => c.active)
  .sort((a, b) => a.order - b.order)
  .map((c) => ({
    ...c,
    count: visibleProducts.filter((p) => p.categoryIds.includes(c.id)).length,
  }));

// Hero product previews (first 3 featured or first 3 visible)
const heroProducts = (featuredProducts.length >= 3 ? featuredProducts : visibleProducts)
  .slice(0, 3)
  .map((p) => ({
    name: p.name,
    price: p.price,
    garmentType: p.garmentType,
    image: p.images[0] ?? null,
    index: mockProducts.indexOf(p),
  }));

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeroSection products={heroProducts} />
      <CategoryShowcase categories={categoriesWithCount} />
      <FeaturedProducts products={featuredProducts} />
      <BrandStory />
      <NewArrivals products={newArrivals} />
      <BenefitsStrip />
      <HowToBuy />
      <HomeFaq />
      <FinalCta />
    </>
  );
}
