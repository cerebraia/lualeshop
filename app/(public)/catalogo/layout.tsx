import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Catálogo de ropa infantil',
  description:
    'Explora nuestra colección de ropa para bebés, niñas y niños. Prendas seleccionadas con amor. Filtra por talla, categoría y precio.',
  alternates: { canonical: 'https://lualekids.shop/catalogo' },
  openGraph: {
    title: 'Catálogo de ropa infantil | Luale Kids Shop',
    description: 'Ropa para bebés, niñas y niños. Prendas seleccionadas con amor.',
    url: 'https://lualekids.shop/catalogo',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function CatalogoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
