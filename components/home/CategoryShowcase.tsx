'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { makeFadeUp } from '@/components/ui/motion-variants';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

// ── Per-category visual themes ────────────────────────────────────────────────

const THEMES: Record<string, {
  bg: string; border: string; iconBg: string; iconColor: string;
  accentColor: string; tagBg: string; icon: string; tagline: string;
  decorBig: string;
}> = {
  bebes: {
    bg:          'from-[#D8EEF7] to-[#EBF5FB]',
    border:      'border-blue-pastel/25',
    iconBg:      'bg-blue-pastel/25',
    iconColor:   'text-[#5A9BBF]',
    accentColor: 'text-[#4A8BAF]',
    tagBg:       'bg-blue-pastel/20 text-[#3A7B9F]',
    icon:        '☁',
    tagline:     'Ternura para sus primeros momentos.',
    decorBig:    'text-blue-pastel/20',
  },
  ninas: {
    bg:          'from-[#F7DCDA] to-[#FBEAEA]',
    border:      'border-rose/25',
    iconBg:      'bg-rose/20',
    iconColor:   'text-rose-dark',
    accentColor: 'text-rose-dark',
    tagBg:       'bg-rose/15 text-rose-dark',
    icon:        '✿',
    tagline:     'Looks llenos de dulzura y personalidad.',
    decorBig:    'text-rose/15',
  },
  ninos: {
    bg:          'from-[#FBF0CE] to-[#FDF6E3]',
    border:      'border-yellow-soft/35',
    iconBg:      'bg-yellow-soft/35',
    iconColor:   'text-[#9A7B2C]',
    accentColor: 'text-[#8A6B1C]',
    tagBg:       'bg-yellow-soft/30 text-[#7A5B0C]',
    icon:        '★',
    tagline:     'Comodidad para cada nueva aventura.',
    decorBig:    'text-yellow-soft/25',
  },
  juguetes: {
    bg:          'from-[#E8F4FD] via-[#FEF9EC] to-[#FDF0EE]',
    border:      'border-blue-pastel/20',
    iconBg:      'bg-yellow-soft/30',
    iconColor:   'text-[#9A7B2C]',
    accentColor: 'text-[#4A8BAF]',
    tagBg:       'bg-blue-pastel/20 text-[#3A7B9F]',
    icon:        '✦',
    tagline:     'Diversión y aprendizaje en cada momento.',
    decorBig:    'text-yellow-soft/30',
  },
};

const DEFAULT_THEME = {
  bg: 'from-cream to-white', border: 'border-brown/10', iconBg: 'bg-cream',
  iconColor: 'text-brown', accentColor: 'text-brown', tagBg: 'bg-cream text-brown',
  icon: '✦', tagline: '', decorBig: 'text-brown/10',
};

// ── Breakpoint config ─────────────────────────────────────────────────────────

interface SlideConfig { visible: number; cardPct: number; stepPct: number }

function getConfig(): SlideConfig {
  if (typeof window === 'undefined') return { visible: 3, cardPct: 33.33, stepPct: 33.33 };
  const w = window.innerWidth;
  if (w >= 1024) return { visible: 3, cardPct: 33.33, stepPct: 33.33 };
  if (w >= 768)  return { visible: 2, cardPct: 50,    stepPct: 50    };
  return                { visible: 1, cardPct: 87,    stepPct: 87    };
}

function useSlideConfig(): SlideConfig {
  const [cfg, setCfg] = useState<SlideConfig>(getConfig);
  useEffect(() => {
    let raf: number;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCfg(getConfig()));
    }
    window.addEventListener('resize', onResize, { passive: true });
    setCfg(getConfig());
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);
  return cfg;
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: CategoryItem }) {
  const theme = THEMES[cat.slug] ?? DEFAULT_THEME;
  const label = cat.count === 1
    ? `1 ${cat.slug === 'juguetes' ? 'juguete' : 'prenda'}`
    : `${cat.count} ${cat.slug === 'juguetes' ? 'juguetes' : 'prendas'}`;

  return (
    <Link
      href={`/categoria/${cat.slug}`}
      aria-label={`${cat.name} — ${label}`}
      className={`group flex flex-col bg-gradient-to-br ${theme.bg} rounded-3xl p-8 hover:shadow-xl
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/50
        transition-all duration-300 hover:-translate-y-1.5 border ${theme.border}
        overflow-hidden relative min-h-[280px] h-full`}
    >
      {/* Decorative big icon */}
      <span
        aria-hidden
        className={`absolute -bottom-4 -right-4 text-[9rem] select-none pointer-events-none
          ${theme.decorBig} transition-transform duration-500
          group-hover:scale-110 group-hover:rotate-6`}
      >
        {theme.icon}
      </span>

      {/* Icon badge */}
      <div className={`inline-flex items-center justify-center w-16 h-16 ${theme.iconBg}
        rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shrink-0`}
      >
        <span className={`text-4xl select-none ${theme.iconColor}`}>{theme.icon}</span>
      </div>

      {/* Category tag */}
      <span className={`inline-flex self-start text-xs font-bold uppercase tracking-widest
        px-2.5 py-1 rounded-lg mb-3 ${theme.tagBg}`}
      >
        {cat.name}
      </span>

      <h3 className="text-2xl font-extrabold text-brown mb-3 leading-tight">{cat.name}</h3>

      <p className="text-sm text-brown-light leading-relaxed mb-6 flex-1">
        {theme.tagline || cat.description || ''}
      </p>

      <div className={`inline-flex items-center gap-2 text-sm font-bold ${theme.accentColor}
        group-hover:gap-3 transition-all duration-300`}
      >
        Ver {label}
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full
          bg-white/60 group-hover:bg-white transition-colors"
        >
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryShowcase({ categories }: { categories: CategoryItem[] }) {
  const reduced    = useReducedMotion();
  const cfg        = useSlideConfig();
  const [idx, setIdx]     = useState(0);
  const regionId   = useId();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isPaused   = useRef(false);
  const touchStart = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef<number | null>(null);

  const visible = categories.filter((c) => c.count > 0);
  const maxIdx  = Math.max(0, visible.length - cfg.visible);

  // Reset index when breakpoint changes to avoid out-of-range
  useEffect(() => { setIdx((i) => Math.min(i, Math.max(0, visible.length - cfg.visible))); }, [cfg.visible, visible.length]);

  const goTo = useCallback((next: number) => {
    setIdx(Math.max(0, Math.min(next, maxIdx)));
  }, [maxIdx]);

  // Autoplay
  useEffect(() => {
    if (reduced || visible.length <= cfg.visible) return;
    const iv = setInterval(() => {
      if (isPaused.current) return;
      setIdx((i) => (i >= maxIdx ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(iv);
  }, [reduced, visible.length, cfg.visible, maxIdx]);

  // Keyboard navigation (inside the carousel region)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); isPaused.current = true; goTo(idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); isPaused.current = true; goTo(idx + 1); }
  }

  // Touch
  function onTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    isPaused.current = true;
    goTo(dx < 0 ? idx + 1 : idx - 1);
  }

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    dragStartX.current = e.clientX;
    isDragging.current = false;
    isPaused.current = true;
  }
  function onMouseMove(e: React.MouseEvent) {
    if (dragStartX.current === null) return;
    if (Math.abs(e.clientX - dragStartX.current) > 5) isDragging.current = true;
  }
  function onMouseUp(e: React.MouseEvent) {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (!isDragging.current) return;
    if (Math.abs(dx) >= 40) goTo(dx < 0 ? idx + 1 : idx - 1);
    isDragging.current = false;
  }

  const showNav = visible.length > cfg.visible;

  if (visible.length === 0) return null;

  return (
    <section
      className="py-20 px-4 bg-cream overflow-hidden"
      ref={sectionRef}
      onMouseEnter={() => { isPaused.current = true;  }}
      onMouseLeave={() => { isPaused.current = false; }}
      onFocus={() =>    { isPaused.current = true;  }}
      onBlur={() =>     { isPaused.current = false; }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10" {...makeFadeUp(!!reduced, 0)}>
          <div className="text-center sm:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.18em] mb-4 bg-rose/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
              Colecciones
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-3">
              Encuentra su próximo look
            </h2>
            <p className="text-brown-light max-w-md mx-auto sm:mx-0">
              Prendas especiales para cada etapa y cada aventura.
            </p>
          </div>

          {/* Desktop arrows */}
          {showNav && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => { isPaused.current = true; goTo(idx - 1); }}
                disabled={idx === 0}
                aria-label="Categoría anterior"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center
                  text-brown hover:border-rose hover:text-rose transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { isPaused.current = true; goTo(idx + 1); }}
                disabled={idx >= maxIdx}
                aria-label="Categoría siguiente"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center
                  text-brown hover:border-rose hover:text-rose transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Accessible live region */}
        <div id={regionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Categoría {idx + 1} de {visible.length}
        </div>

        {/* Track */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          aria-roledescription="carousel"
          aria-label="Categorías"
          className="select-none"
        >
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform:  `translateX(-${idx * cfg.stepPct}%)`,
                transition: reduced ? 'none' : 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {visible.map((cat, i) => (
                <div
                  key={cat.id}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} de ${visible.length}: ${cat.name}`}
                  style={{ flexShrink: 0, width: `${cfg.cardPct}%`, paddingRight: i < visible.length - 1 ? '16px' : '0' }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: reduced ? 0 : 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="h-full"
                  >
                    <CategoryCard cat={cat} />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile nav */}
          {showNav && (
            <div className="flex sm:hidden items-center justify-between mt-6 gap-3">
              <button
                onClick={() => { isPaused.current = true; goTo(idx - 1); }}
                disabled={idx === 0}
                aria-label="Categoría anterior"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center
                  text-brown hover:border-rose hover:text-rose transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1.5" role="tablist" aria-label="Indicadores de categoría">
                {visible.map((cat, i) => (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={i === idx}
                    aria-label={`Ir a ${cat.name}`}
                    onClick={() => { isPaused.current = true; goTo(i); }}
                    className={`rounded-full transition-all duration-300 ${
                      i === idx
                        ? 'w-5 h-2 bg-rose'
                        : 'w-2 h-2 bg-brown/20 hover:bg-rose/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => { isPaused.current = true; goTo(idx + 1); }}
                disabled={idx >= maxIdx}
                aria-label="Categoría siguiente"
                className="w-10 h-10 rounded-2xl border-2 border-brown/15 flex items-center justify-center
                  text-brown hover:border-rose hover:text-rose transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Desktop dots */}
          {showNav && (
            <div className="hidden sm:flex items-center justify-center gap-2 mt-8"
              role="tablist" aria-label="Indicadores de categoría"
            >
              {visible.map((cat, i) => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Ir a ${cat.name}`}
                  onClick={() => { isPaused.current = true; goTo(i); }}
                  className={`rounded-full transition-all duration-300 ${
                    i === idx
                      ? 'w-6 h-2.5 bg-rose'
                      : 'w-2.5 h-2.5 bg-brown/20 hover:bg-rose/50'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
