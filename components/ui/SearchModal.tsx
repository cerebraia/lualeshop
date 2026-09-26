'use client';

import {
  useState, useEffect, useRef, useCallback, useId
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ArrowRight, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchPublicProducts, sanitizeQuery } from '@/lib/search';
import type { SearchResult } from '@/lib/search';
import { mockCategories } from '@/lib/mock/categories';

// ── Types ──────────────────────────────────────────────────────
type ModalState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──────────────────────────────────────────────────
const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;
const MAX_QUERY_LEN = 100;

const CATEGORY_LINKS = mockCategories
  .filter((c) => c.active)
  .map((c) => ({ label: c.name, href: `/categoria/${c.slug}` }));

// ── Helpers ────────────────────────────────────────────────────
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatPrice(price: number, isMulti: boolean) {
  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  return isMulti ? `Desde ${fmt}` : fmt;
}

const STATUS_LABEL: Record<string, string> = {
  available:    'Disponible',
  low_stock:    'Últimas',
  out_of_stock: 'Agotado',
  coming_soon:  'Pronto',
};

const STATUS_COLOR: Record<string, string> = {
  available:    'text-green-600',
  low_stock:    'text-amber-600',
  out_of_stock: 'text-red-500',
  coming_soon:  'text-blue-pastel',
};

// ── Focus trap ─────────────────────────────────────────────────
function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [active, ref]);
}

// ── Skeleton ───────────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-cream shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-cream rounded-full w-3/4" />
        <div className="h-3 bg-cream rounded-full w-1/2" />
        <div className="h-3 bg-cream rounded-full w-1/3" />
      </div>
    </div>
  );
}

// ── Result item ────────────────────────────────────────────────
interface ResultItemProps {
  result: SearchResult;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  id: string;
  reduced: boolean;
}

function ResultItem({ result, index, active, onSelect, onHover, id, reduced }: ResultItemProps) {
  const sizesText = result.sizes.slice(0, 3).join(', ');
  const hasMore   = result.sizes.length > 3;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
    >
      <button
        id={id}
        role="option"
        aria-selected={active}
        onClick={onSelect}
        onMouseEnter={onHover}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-2xl mx-2',
          active ? 'bg-rose/8' : 'hover:bg-cream'
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-cream shrink-0">
          {result.image ? (
            <Image
              src={result.image}
              alt={result.name}
              fill
              className={cn('object-cover transition-transform duration-300', active && !reduced && 'scale-[1.03]')}
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brown-light/30">
              <Search size={18} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brown text-sm leading-tight truncate">{result.name}</p>
          <p className="text-xs text-brown-light mt-0.5">
            {result.garmentType}
            {result.categoryNames[0] && ` · ${result.categoryNames[0]}`}
          </p>
          {sizesText && (
            <p className="text-xs text-brown-light/70 mt-0.5">
              Talla: {sizesText}{hasMore ? ` +${result.sizes.length - 3}` : ''}
            </p>
          )}
        </div>

        {/* Price + status */}
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-sm font-bold text-brown">
            {result.price > 0 ? formatPrice(result.price, result.isMultiPrice) : '—'}
          </p>
          {result.inventoryConfigured && (
            <p className={cn('text-xs font-medium', STATUS_COLOR[result.status])}>
              {STATUS_LABEL[result.status]}
            </p>
          )}
          {!result.inventoryConfigured && (
            <p className="text-xs text-brown-light/60">Consultar</p>
          )}
        </div>

        <ChevronRight size={14} className={cn('text-brown-light/50 shrink-0', active && 'text-rose')} />
      </button>
    </motion.div>
  );
}

// ── Main modal ─────────────────────────────────────────────────
export function SearchModal({ open, onClose }: Props) {
  const router  = useRouter();
  const titleId = useId();
  const descId  = useId();

  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [state,     setState]     = useState<ModalState>('idle');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [reduced,   setReduced]   = useState(false);

  const dialogRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const triggerRef  = useRef<HTMLElement | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');
  const listboxId   = useId();

  useFocusTrap(dialogRef, open);

  // Capture reduced motion pref
  useEffect(() => { setReduced(prefersReducedMotion()); }, []);

  // Remember trigger (the search button) to restore focus on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Short delay to allow the modal to mount before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      // Restore focus when closed
      const el = triggerRef.current;
      if (el && typeof el.focus === 'function') {
        requestAnimationFrame(() => el.focus());
      }
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      // Small delay to avoid visual flash during close animation
      const t = setTimeout(() => {
        setQuery('');
        setResults([]);
        setState('idle');
        setActiveIdx(-1);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Run search with debounce
  const runSearch = useCallback(async (raw: string) => {
    const q = sanitizeQuery(raw);

    if (q.length < MIN_QUERY_LEN) {
      setState('idle');
      setResults([]);
      setActiveIdx(-1);
      return;
    }

    if (q === lastQueryRef.current) return;
    lastQueryRef.current = q;

    // Cancel previous in-flight search
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setState('loading');
    setActiveIdx(-1);

    try {
      const data = await searchPublicProducts(q, 8, signal);
      if (signal.aborted) return;
      setResults(data);
      setState(data.length > 0 ? 'results' : 'empty');
    } catch (err) {
      if (signal.aborted) return;
      console.error('[Search]', err);
      setState('error');
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.slice(0, MAX_QUERY_LEN);
    setQuery(val);
    lastQueryRef.current = ''; // allow re-run if same text retyped after clear

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), DEBOUNCE_MS);
  }

  function clearQuery() {
    setQuery('');
    setResults([]);
    setState('idle');
    setActiveIdx(-1);
    lastQueryRef.current = '';
    abortRef.current?.abort();
    inputRef.current?.focus();
  }

  // Keyboard navigation inside the modal
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (state !== 'results') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) navigateTo(r.slug);
    }
  }

  function navigateTo(slug: string) {
    onClose();
    router.push(`/producto/${slug}`);
  }

  function handleSeeAll() {
    if (!query.trim()) return;
    onClose();
    router.push(`/catalogo?q=${encodeURIComponent(query.trim())}`);
  }

  function handleCategoryClick() {
    onClose();
  }

  const showShortcut = typeof navigator !== 'undefined' && !('ontouchstart' in window);
  const trimmedQuery = query.trim();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed inset-0 z-50 bg-brown/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.97, y: reduced ? 0 : -4 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 top-4 z-50 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl"
            style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onKeyDown={handleKeyDown}
            ref={dialogRef}
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-brown/20 flex flex-col overflow-hidden">

              {/* ── Header ───────────────────────────────── */}
              <div className="px-5 pt-5 pb-3 border-b border-cream">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    {/* Luale gradient wordmark */}
                    <p className="text-xs font-bold mb-0.5"
                      style={{
                        background: 'linear-gradient(90deg, #89B4C8, #C98B96, #D4A0A8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Luale
                    </p>
                    <h2 id={titleId} className="text-lg font-extrabold text-brown leading-tight">
                      ¿Qué estás buscando?
                    </h2>
                    <p id={descId} className="text-xs text-brown-light mt-0.5">
                      Encuentra prendas para bebés, niñas y niños.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 mt-0.5 w-8 h-8 rounded-xl hover:bg-cream flex items-center justify-center text-brown-light hover:text-brown transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose"
                    aria-label="Cerrar buscador"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <label htmlFor="search-input" className="sr-only">
                    Buscar productos
                  </label>
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-light pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    ref={inputRef}
                    id="search-input"
                    type="search"
                    role="combobox"
                    aria-expanded={state === 'results'}
                    aria-controls={listboxId}
                    aria-activedescendant={activeIdx >= 0 ? `result-${activeIdx}` : undefined}
                    aria-autocomplete="list"
                    value={query}
                    onChange={handleQueryChange}
                    maxLength={MAX_QUERY_LEN}
                    placeholder="Busca vestidos, pijamas, conjuntos..."
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(
                      'w-full pl-11 pr-20 py-3.5 bg-cream rounded-2xl text-sm text-brown placeholder:text-brown-light/60',
                      'focus:outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-rose/30 focus:bg-white'
                    )}
                  />

                  {/* Right side: loading spinner or clear button */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {state === 'loading' && (
                      <Loader2 size={16} className="text-rose animate-spin" />
                    )}
                    {query.length > 0 && state !== 'loading' && (
                      <button
                        onClick={clearQuery}
                        className="w-6 h-6 rounded-full bg-brown-light/20 flex items-center justify-center hover:bg-rose/20 transition-colors"
                        aria-label="Limpiar búsqueda"
                      >
                        <X size={11} className="text-brown" />
                      </button>
                    )}
                    {showShortcut && !query && (
                      <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-brown-light/50 border border-brown/10 rounded px-1 py-0.5 font-mono">
                        ⌘K
                      </kbd>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Body ─────────────────────────────────── */}
              <div
                className="overflow-y-auto overscroll-contain"
                style={{ maxHeight: 'calc(100dvh - 14rem)' }}
              >

                {/* Idle: show categories + hint */}
                {state === 'idle' && (
                  <div className="px-5 py-4">
                    {query.length > 0 && query.length < MIN_QUERY_LEN ? (
                      <p className="text-sm text-brown-light text-center py-3">
                        Escribe al menos 2 letras para buscar.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-brown-light uppercase tracking-wide mb-3">
                          Explorar por categoría
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_LINKS.map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={handleCategoryClick}
                              className="flex items-center gap-1.5 px-4 py-2 bg-cream hover:bg-rose/10 text-brown text-sm font-medium rounded-2xl transition-colors border border-rose/10 hover:border-rose/30"
                            >
                              {label}
                              <ArrowRight size={13} className="text-brown-light" />
                            </Link>
                          ))}
                        </div>
                        <p className="text-xs text-brown-light/60 mt-4 text-center">
                          También puedes explorar el{' '}
                          <Link href="/catalogo" onClick={handleCategoryClick} className="text-rose underline">
                            catálogo completo
                          </Link>
                          .
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Loading: skeletons */}
                {state === 'loading' && (
                  <div className="py-2" aria-busy="true" aria-label="Buscando productos">
                    {[...Array(3)].map((_, i) => <ResultSkeleton key={i} />)}
                  </div>
                )}

                {/* Results */}
                {state === 'results' && (
                  <div>
                    {/* Accessible live region */}
                    <div
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    >
                      {results.length} resultado{results.length !== 1 ? 's' : ''} para {trimmedQuery}
                    </div>

                    <ul
                      id={listboxId}
                      role="listbox"
                      aria-label="Resultados de búsqueda"
                      className="py-2"
                    >
                      {results.map((r, i) => (
                        <li key={r.id} role="presentation">
                          <ResultItem
                            result={r}
                            index={i}
                            active={activeIdx === i}
                            onSelect={() => navigateTo(r.slug)}
                            onHover={() => setActiveIdx(i)}
                            id={`result-${i}`}
                            reduced={reduced}
                          />
                        </li>
                      ))}
                    </ul>

                    {/* See all results */}
                    {trimmedQuery && (
                      <div className="px-4 pb-4 pt-2 border-t border-cream">
                        <button
                          onClick={handleSeeAll}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-rose hover:text-rose-dark py-2.5 hover:bg-rose/5 rounded-2xl transition-colors"
                        >
                          <Search size={14} />
                          Ver todos los resultados para &ldquo;{trimmedQuery}&rdquo;
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty */}
                {state === 'empty' && (
                  <div className="px-5 py-8 text-center">
                    <div
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    >
                      No se encontraron resultados para {trimmedQuery}
                    </div>
                    <p className="text-base font-bold text-brown mb-1">No encontramos esa prenda</p>
                    <p className="text-sm text-brown-light mb-5">
                      Prueba con otro nombre o explora nuestro catálogo completo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        href="/catalogo"
                        onClick={handleCategoryClick}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose text-white text-sm font-bold rounded-2xl hover:bg-rose-dark transition-colors"
                      >
                        Ver catálogo
                      </Link>
                      <a
                        href="https://wa.me/584220162748"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCategoryClick}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-rose/30 text-brown text-sm font-semibold rounded-2xl hover:bg-rose/8 transition-colors"
                      >
                        Escribir por WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* Error */}
                {state === 'error' && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-brown-light">
                      No pudimos realizar la búsqueda. Intenta nuevamente.
                    </p>
                    <button
                      onClick={() => runSearch(query)}
                      className="mt-3 text-sm text-rose font-semibold hover:underline"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Trigger button (exported for use in Header) ────────────────
interface SearchButtonProps {
  onClick: () => void;
  className?: string;
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Buscar productos"
      className={cn(
        'relative p-2.5 rounded-xl hover:bg-cream text-brown transition-all duration-200',
        'hover:scale-[1.05] active:scale-[0.97]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1',
        className
      )}
    >
      <Search size={19} strokeWidth={2.2} />
    </button>
  );
}

// ── Global keyboard shortcut hook ──────────────────────────────
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't trigger if focus is inside an editable element
      const tag = (e.target as HTMLElement).tagName;
      const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
        (e.target as HTMLElement).isContentEditable;
      if (editable) return;

      const isMac = navigator.platform.toLowerCase().includes('mac');
      const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isCtrlK = e.key === 'k' && e.ctrlKey && !e.metaKey;
      const isCmdK  = e.key === 'k' && e.metaKey && !e.ctrlKey && isMac;

      if (isSlash || isCtrlK || isCmdK) {
        e.preventDefault();
        onOpen();
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
