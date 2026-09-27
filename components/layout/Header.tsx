'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { SearchButton, useSearchShortcut } from '@/components/ui/SearchModal';

// Lazy-load the modal itself to keep the header bundle small
const SearchModal = dynamic(
  () => import('@/components/ui/SearchModal').then((m) => ({ default: m.SearchModal })),
  { ssr: false }
);

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/categoria/bebes', label: 'Bebés' },
  { href: '/categoria/ninas', label: 'Niñas' },
  { href: '/categoria/ninos', label: 'Niños' },
  { href: '/categoria/juguetes', label: 'Juguetes' },
  { href: '/nuestra-historia', label: 'Nuestra historia' },
  { href: '/preguntas-frecuentes', label: 'Preguntas' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useSearchShortcut(openSearch);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(() => { close(); }, [pathname, close]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose/8 transition-all duration-300',
        scrolled ? 'shadow-lg shadow-brown/5 h-14' : 'shadow-none h-16'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group" onClick={close}>
          <div className={cn(
            'overflow-hidden rounded-xl transition-all duration-300',
            scrolled ? 'w-8 h-8' : 'w-10 h-10'
          )}>
            <Image
              src="/logo.jpg"
              alt="Luale Kids Shop"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-brown text-base hidden sm:block group-hover:text-rose transition-colors">
            Luale Kids
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navegación principal">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  active ? 'text-rose' : 'text-brown hover:bg-cream hover:text-rose'
                )}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-rose rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Search button — desktop: after nav, mobile: always visible */}
          <SearchButton onClick={openSearch} />

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/584220162748"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-bold px-4 py-2 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <WhatsAppIcon size={17} />
            <span className="hidden md:inline">WhatsApp</span>
          </a>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-cream transition-colors text-brown"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search modal — lazy loaded */}
      <SearchModal open={searchOpen} onClose={closeSearch} />

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-14 bg-brown/20 backdrop-blur-[2px] z-30 lg:hidden"
              aria-hidden="true"
              onClick={close}
            />
            <motion.div
              key="menu"
              id="mobile-menu"
              role="dialog"
              aria-label="Menú de navegación"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-40 lg:hidden border-t border-rose/10 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 flex flex-col gap-0.5 shadow-xl"
            >
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-rose/12 text-rose font-semibold'
                      : 'text-brown hover:bg-cream hover:text-rose'
                  )}
                >
                  {label}
                </Link>
              ))}
              <a
                href="https://wa.me/584220162748"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="mt-3 flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-sm"
              >
                <WhatsAppIcon size={18} />
                Escríbenos por WhatsApp
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
