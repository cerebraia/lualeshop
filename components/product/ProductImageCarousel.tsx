'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductPlaceholder } from '@/components/ui/ProductPlaceholder';

export interface CarouselImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface Props {
  images: CarouselImage[];
  productName: string;
  index?: number;        // for ProductPlaceholder color
  priority?: boolean;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function ProductImageCarousel({ images, productName, index = 0, priority = false }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const reducedMotion = useReducedMotion();

  // Touch/swipe
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    if (images.length === 0) return;
    setActive(Math.max(0, Math.min(images.length - 1, next)));
  }, [images.length]);

  const prev = useCallback(() => go(active - 1), [active, go]);
  const next = useCallback(() => go(active + 1), [active, go]);

  // Keyboard
  useEffect(() => {
    if (!lightbox) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     setLightbox(false);
    }
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightbox, prev, next]);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-3xl overflow-hidden bg-cream">
        <ProductPlaceholder name={productName} index={index} className="w-full h-full" />
      </div>
    );
  }

  const current = images[active];

  return (
    <>
      {/* Main image */}
      <div className="space-y-3">
        <div
          className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-sm border border-brown/5 cursor-zoom-in group"
          onClick={() => setLightbox(true)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 40) {
              if (dx < 0) { next(); } else { prev(); }
            }
            touchStartX.current = null;
          }}
          role="button"
          aria-label={`${current.alt} — ampliar`}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority={priority && active === 0}
            className={cn(
              'object-contain',
              !reducedMotion && 'transition-opacity duration-300'
            )}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-1.5 shadow">
              <ZoomIn size={16} className="text-brown" />
            </div>
          </div>

          {/* Nav arrows — desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                disabled={active === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white disabled:opacity-0 transition-all z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={18} className="text-brown" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={active === images.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white disabled:opacity-0 transition-all z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={18} className="text-brown" />
              </button>
            </>
          )}

          {/* Dot indicator (mobile) */}
          {images.length > 1 && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden"
              aria-hidden="true"
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); go(i); }}
                  className={cn(
                    'rounded-full transition-all',
                    i === active ? 'w-5 h-2 bg-rose' : 'w-2 h-2 bg-white/70'
                  )}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails — desktop */}
        {images.length > 1 && (
          <div
            className="hidden lg:flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Miniaturas del producto"
          >
            {images.map((img, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                onClick={() => go(i)}
                className={cn(
                  'relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose',
                  i === active ? 'border-rose' : 'border-transparent hover:border-rose/40'
                )}
                aria-label={`Miniatura ${i + 1}: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Counter — mobile */}
        {images.length > 1 && (
          <p className="text-xs text-brown-light text-center lg:hidden">
            {active + 1} / {images.length}
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-brown/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada: ${current.alt}`}
          onClick={() => setLightbox(false)}
        >
          {/* Focus trap: close button first */}
          <button
            autoFocus
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar imagen ampliada (Escape)"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                disabled={active === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={active === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl max-h-[88vh] w-full"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 40) { if (dx < 0) { next(); } else { prev(); } }
              touchStartX.current = null;
            }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              width={current.width ?? 1600}
              height={current.height ?? 1600}
              className="object-contain max-h-[88vh] w-full rounded-2xl"
              sizes="90vw"
              priority
            />
          </div>

          {/* Counter & alt */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            {images.length > 1 && (
              <div className="flex gap-1.5 justify-center mb-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); go(i); }}
                    className={cn(
                      'rounded-full transition-all',
                      i === active ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                    )}
                    aria-label={`Ir a imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <p className="text-white/50 text-xs px-4">{current.alt}</p>
          </div>
        </div>
      )}
    </>
  );
}
