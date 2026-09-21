'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { makeFadeUp } from '@/components/ui/motion-variants';

export function NewArrivals({ products }: { products: Product[] }) {
  const reduced = useReducedMotion();

  if (products.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#E8F3F9] via-[#EEF6FA] to-cream relative overflow-hidden">
      {/* Subtle background texture */}
      <div aria-hidden className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-blue-pastel/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-rose/8 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
          {...makeFadeUp(!!reduced, 0)}
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.2em] mb-4 bg-rose/12 px-3 py-1.5 rounded-full">
              <Sparkles size={11} />
              Recién llegados
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-2">
              Nuevos ingresos
            </h2>
            <p className="text-brown-light">
              Nuevas prendas para seguir creando recuerdos.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="shrink-0 inline-flex items-center gap-2 text-rose font-bold hover:underline text-sm bg-rose/8 px-4 py-2.5 rounded-2xl hover:bg-rose/15 transition-colors"
          >
            Ver catálogo completo
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          {...makeFadeUp(!!reduced, 0.3)}
        >
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-brown hover:bg-brown/90 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Ver nuevos ingresos
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
