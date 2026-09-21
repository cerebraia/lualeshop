import type { ReactNode } from 'react';
import { InfoBar } from '@/components/layout/InfoBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MigrationRunner } from '@/components/MigrationRunner';

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'Luale Kids Shop',
  url: 'https://lualekids.shop',
  logo: 'https://lualekids.shop/logo.jpg',
  description: 'Tienda de ropa infantil en Caracas, Venezuela. Bebés, niñas y niños.',
  telephone: '+584220162748',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Caracas',
    addressCountry: 'VE',
  },
  sameAs: ['https://www.instagram.com/lualekids.shop/'],
  priceRange: '$',
  servesCuisine: undefined,
  hasMap: undefined,
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MigrationRunner />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <InfoBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
