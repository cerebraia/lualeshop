'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { makeFadeUp } from '@/components/ui/motion-variants';

// ── Decorative floating shapes ──────────────────────────────────────────────

function FloatingShape({ className, delay = 0, reduced }: { className: string; delay?: number; reduced: boolean | null }) {
  return (
    <motion.div
      className={className}
      animate={reduced ? undefined : {
        y: [0, -12, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

function AnimatedBackground({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-pastel/15 via-cream to-rose/10" />

      {/* Animated gradient blob */}
      {!reduced && (
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-pastel/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {!reduced && (
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-rose/15 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      )}
      {!reduced && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-yellow-soft/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      )}

      {/* Static fallback for reduced motion */}
      {reduced && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-pastel/10 via-cream to-rose/8" />
      )}

      {/* Floating shapes */}
      <FloatingShape
        reduced={reduced}
        delay={0}
        className="absolute top-12 left-10 w-8 h-8 rounded-full bg-yellow-soft/60 shadow-sm"
      />
      <FloatingShape
        reduced={reduced}
        delay={1.5}
        className="absolute top-24 right-16 w-5 h-5 rounded-full bg-rose/50"
      />
      <FloatingShape
        reduced={reduced}
        delay={0.8}
        className="absolute bottom-20 left-20 w-6 h-6 rounded-xl bg-blue-pastel/50 rotate-12"
      />
      <FloatingShape
        reduced={reduced}
        delay={2.2}
        className="absolute bottom-12 right-24 w-4 h-4 rounded-full bg-yellow-soft/70"
      />
      <FloatingShape
        reduced={reduced}
        delay={1.1}
        className="absolute top-1/3 left-6 w-3 h-3 rounded-full bg-rose/40"
      />
      <FloatingShape
        reduced={reduced}
        delay={3}
        className="absolute top-1/2 right-8 w-7 h-7 rounded-2xl bg-blue-pastel/40 -rotate-12"
      />

      {/* Stars / sparkles */}
      {[
        { top: '15%', left: '25%', size: 'w-3 h-3', delay: 0.5 },
        { top: '60%', left: '80%', size: 'w-2 h-2', delay: 1.8 },
        { top: '80%', left: '35%', size: 'w-2.5 h-2.5', delay: 0.9 },
        { top: '30%', right: '12%', size: 'w-2 h-2', delay: 2.5 },
      ].map((star, i) => (
        <motion.div
          key={i}
          className={`absolute ${star.size} text-yellow-soft`}
          style={{ top: star.top, left: 'left' in star ? star.left : undefined, right: 'right' in star ? star.right : undefined }}
          animate={reduced ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ── Carousel ─────────────────────────────────────────────────────────────────

function usePerPage(): number {
  function get() {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w >= 1024) return 4;
    if (w >= 768)  return 3;
    if (w >= 480)  return 2;
    return 1;
  }
  const [perPage, setPerPage] = useState(get);
  useEffect(() => {
    let raf: number;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPerPage(get()));
    }
    window.addEventListener('resize', onResize, { passive: true });
    setPerPage(get());
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);
  return perPage;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ToysSection({ products }: { products: Product[] }) {
  const reduced   = useReducedMotion();
  const perPage   = usePerPage();
  const [page, setPage] = useState(0);
  const trackRef  = useRef<HTMLDivElement>(null);
  const regionId  = useId();
  const touchStart = useRef<number | null>(null);

  const pages = chunk(products, perPage);
  const total = pages.length;

  useEffect(() => { setPage(0); }, [perPage]);

  const canPrev = page > 0;
  const canNext = page < total - 1;

  const goTo = useCallback((idx: number) => {
    setPage(Math.max(0, Math.min(idx, total - 1)));
  }, [total]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(page - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(page + 1); }
  }
  function handleTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0 ? page + 1 : page - 1);
  }

  if (products.length === 0) return null;

  const showNav = total > 1;

  return (
    <section
      className="relative py-20 overflow-hidden"
      aria-label="Juguetes para imaginar"
    >
      <AnimatedBackground reduced={reduced} />

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          {...makeFadeUp(!!reduced, 0)}
        >
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold text-blue-pastel uppercase tracking-[0.18em] mb-4 bg-blue-pastel/15 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-pastel inline-block" />
              Juguetes educativos
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-2">
              Juguetes para imaginar
            </h2>
            <p className="text-brown-light/80 max-w-md">
              Diversión, aprendizaje y momentos para recordar.
            </p>
          </div>

          {showNav && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => goTo(page - 1)}
                disabled={!canPrev}
                aria-label="Juguetes anteriores"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-blue-pastel hover:text-blue-pastel transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => goTo(page + 1)}
                disabled={!canNext}
                aria-label="Más juguetes"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-blue-pastel hover:text-blue-pastel transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          ref={trackRef}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-roledescription="carousel"
          aria-label="Juguetes"
        >
          <div id={regionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            Página {page + 1} de {total}
          </div>

          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translateX(-${page * 100}%)`,
                transition: reduced ? 'none' : 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {pages.map((group, pi) => (
                <div
                  key={pi}
                  className="w-full shrink-0"
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`Diapositiva ${pi + 1} de ${total}`}
                  aria-hidden={pi !== page || undefined}
                  inert={pi !== page || undefined}
                >
                  <div className={`grid gap-4 ${
                    group.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                    group.length === 2 ? 'grid-cols-2' :
                    group.length === 3 ? 'grid-cols-3' :
                    'grid-cols-4'
                  }`}>
                    {group.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={pi * perPage + i}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile nav */}
          {showNav && (
            <div className="flex sm:hidden items-center justify-between mt-5 gap-3">
              <button
                onClick={() => goTo(page - 1)}
                disabled={!canPrev}
                aria-label="Anterior"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-blue-pastel hover:text-blue-pastel transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Páginas">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === page}
                    aria-label={`Ir a página ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === page ? 'w-5 h-2 bg-blue-pastel' : 'w-2 h-2 bg-brown/20 hover:bg-blue-pastel/50'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => goTo(page + 1)}
                disabled={!canNext}
                aria-label="Siguiente"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-blue-pastel hover:text-blue-pastel transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Desktop dots */}
          {showNav && (
            <div className="hidden sm:flex items-center justify-center gap-2 mt-8" role="tablist" aria-label="Páginas de juguetes">
              {pages.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === page}
                  aria-label={`Ir a página ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === page ? 'w-6 h-2.5 bg-blue-pastel' : 'w-2.5 h-2.5 bg-brown/20 hover:bg-blue-pastel/50'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/categoria/juguetes"
            className="inline-flex items-center justify-center gap-2 border-2 border-blue-pastel text-blue-pastel hover:bg-blue-pastel hover:text-white font-bold px-8 py-3.5 rounded-2xl transition-all text-base shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Ver todos los juguetes
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
