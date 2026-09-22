'use client';

import { useRef, useState, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { makeFadeUp } from '@/components/ui/motion-variants';

// ── Layout constants ──────────────────────────────────────────────────────────
// Products per page = rows × columns at each breakpoint
// lg (≥1024): 2 rows × 4 cols = 8
// md (768–1023): 2 rows × 3 cols = 6
// sm (480–767): 2 rows × 2 cols = 4
// xs (<480): 2 rows × 1 col = 2
//
// Tailwind safelist (values used dynamically — scanner must see these literals):
// grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4

interface SlideGroupConfig {
  cols: number;
  rows: number;
  perPage: number;
}

function useBreakpointConfig(): SlideGroupConfig {
  function getConfig(): SlideGroupConfig {
    if (typeof window === 'undefined') return { cols: 4, rows: 2, perPage: 8 };
    const w = window.innerWidth;
    if (w >= 1024) return { cols: 4, rows: 2, perPage: 8 };
    if (w >= 768)  return { cols: 3, rows: 2, perPage: 6 };
    if (w >= 480)  return { cols: 2, rows: 2, perPage: 4 };
    return { cols: 1, rows: 2, perPage: 2 };
  }

  const [config, setConfig] = useState<SlideGroupConfig>(getConfig);

  useEffect(() => {
    let raf: number;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setConfig(getConfig()));
    }
    window.addEventListener('resize', onResize, { passive: true });
    // Set immediately on mount (SSR gives default)
    setConfig(getConfig());
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return config;
}

// Split products into page-groups based on perPage
function chunk<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    pages.push(arr.slice(i, i + size));
  }
  return pages;
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  const reduced = useReducedMotion();
  const { cols, perPage } = useBreakpointConfig();
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);
  const regionId = useId();
  const touchStart = useRef<number | null>(null);

  const pages = chunk(products, perPage);
  const total = pages.length;

  // Reset to page 0 when perPage changes to avoid being on a nonexistent page
  useEffect(() => {
    setPage(0);
  }, [perPage]);

  const canPrev = page > 0;
  const canNext = page < total - 1;

  const goTo = useCallback((idx: number, animate = true) => {
    const next = Math.max(0, Math.min(idx, total - 1));
    setPage(next);
    if (!animate || reduced) return;
    trackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [total, reduced]);

  const prev = useCallback(() => goTo(page - 1), [page, goTo]);
  const next = useCallback(() => goTo(page + 1), [page, goTo]);

  // Keyboard: arrow keys when focused inside the carousel region
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  }

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { next(); } else { prev(); }
  }

  function handleMouseEnter() { isPaused.current = true; }
  function handleMouseLeave() { isPaused.current = false; }
  function handleFocus()      { isPaused.current = true; }
  function handleBlur()       { isPaused.current = false; }

  if (products.length === 0) return null;

  // Hide nav when everything fits on one page
  const showNav = total > 1;

  // Grid column class mapping
  const colClass: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <section
      className="py-20 bg-white overflow-hidden"
      aria-label="Elegidos con amor"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Header ── */}
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

          {/* Nav arrows — desktop only */}
          {showNav && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={prev}
                disabled={!canPrev}
                aria-label="Página anterior de productos destacados"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                aria-label="Página siguiente de productos destacados"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Carousel ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          aria-roledescription="carousel"
          aria-label="Productos destacados"
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Accessible live region for page state */}
          <div
            id={regionId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            Página {page + 1} de {total}
          </div>

          {/* Pages */}
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
                  <div className={`grid ${colClass[cols] ?? 'grid-cols-2'} gap-4`}>
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

          {/* Mobile nav arrows */}
          {showNav && (
            <div className="flex sm:hidden items-center justify-between mt-5 gap-3">
              <button
                onClick={prev}
                disabled={!canPrev}
                aria-label="Página anterior"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Páginas">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === page}
                    aria-label={`Ir a página ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === page
                        ? 'w-5 h-2 bg-rose'
                        : 'w-2 h-2 bg-brown/20 hover:bg-rose/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={!canNext}
                aria-label="Página siguiente"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center text-brown hover:border-rose hover:text-rose transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Desktop dot indicators */}
          {showNav && (
            <div
              className="hidden sm:flex items-center justify-center gap-2 mt-8"
              role="tablist"
              aria-label="Páginas de productos destacados"
            >
              {pages.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === page}
                  aria-label={`Ir a página ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === page
                      ? 'w-6 h-2.5 bg-rose'
                      : 'w-2.5 h-2.5 bg-brown/20 hover:bg-rose/50'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── CTA ── */}
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
