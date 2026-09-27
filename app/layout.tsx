import type { Metadata, Viewport } from 'next';
import type React from 'react';
import { Nunito } from 'next/font/google';
import './globals.css';

const SITE = 'https://lualekids.shop';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});


export const viewport: Viewport = {
  themeColor: '#624B3F',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Luale Kids Shop | Ropa infantil en Caracas',
    template: '%s | Luale Kids Shop',
  },
  description:
    'Ropa para bebés, niñas y niños, seleccionada con amor. Realiza tu pedido por WhatsApp. Delivery en Caracas y envíos a toda Venezuela.',
  keywords: ['ropa infantil', 'bebés', 'niños', 'niñas', 'Caracas', 'Venezuela', 'Luale Kids Shop', 'ropa bebé Venezuela'],
  authors: [{ name: 'Luale Kids Shop', url: SITE }],
  creator: 'Luale Kids Shop',
  publisher: 'Luale Kids Shop',
  robots: {
    index: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
    follow: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
    googleBot: {
      index: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
      follow: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
    },
  },
  openGraph: {
    title: 'Luale Kids Shop | Ropa infantil en Caracas',
    description: 'Ropa para bebés, niñas y niños. Pedidos por WhatsApp. Delivery en Caracas.',
    url: SITE,
    siteName: 'Luale Kids Shop',
    locale: 'es_VE',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Luale Kids Shop — Más que ropa, es amor en cada detalle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luale Kids Shop | Ropa infantil en Caracas',
    description: 'Ropa para bebés, niñas y niños. Pedidos por WhatsApp. Delivery en Caracas.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: SITE,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
