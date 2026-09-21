'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { makeFadeUp } from '@/components/ui/motion-variants';

export function FeaturedProducts({ products }: { products: Product[] }) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.firstElementChild?.clientWidth ?? 280;
    el.scrollBy({ left: dir === 'left' ? -(cardW * 2) : cardW * 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          {...makeFadeUp(!!reduced, 0)}
        >
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.18em] mb-4 bg-rose/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
              Selección especial
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-2">
              Elegidos con amor
            </h2>
            <p className="text-brown-light/80 max-w-md">
              Una selección de prendas para crear pequeños grandes momentos.
            </p>
          </div>

          {/* Nav arrows — hidden on mobile (swipe instead) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior"
              className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Siguiente"
              className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          {/* Edge fade gradients */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-3 w-6 z-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-200"
            style={{ opacity: canScrollLeft ? 1 : 0 }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 z-10 bg-gradient-to-l from-white to-transparent"
            aria-hidden
          />

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className="shrink-0 w-[calc(100%-2rem)] sm:w-60 md:w-56 lg:w-[calc(25%-12px)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={product} index={i} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Swipe hint on mobile */}
        <p className="sm:hidden text-center text-xs text-brown-light/60 mt-2 select-none" aria-hidden>
          ← Desliza para ver más →
        </p>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 border-2 border-rose text-rose hover:bg-rose hover:text-white font-bold px-8 py-3.5 rounded-2xl transition-all text-base shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Ver todo el catálogo
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
