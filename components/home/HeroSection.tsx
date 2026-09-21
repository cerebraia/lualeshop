'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, MapPin, Truck } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { ProductImage } from '@/components/ui/ProductImage';
import { AnimatedLualeWordmark } from '@/components/ui/AnimatedLualeWordmark';

interface HeroProduct {
  name: string;
  price: number;
  garmentType: string;
  image?: string | null;
  index: number;
}

interface HeroSectionProps {
  products: HeroProduct[];
}

function FloatingCloud({ className, delay = 0, size = 1 }: { className?: string; delay?: number; size?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduced ? {} : { y: [0, -9, 0], opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ fontSize: `${size}rem` }}
      aria-hidden
    >
      ☁
    </motion.div>
  );
}

function TwinklingStar({ className, delay = 0, size = 1 }: { className?: string; delay?: number; size?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduced ? {} : { scale: [1, 1.35, 1], opacity: [0.4, 1, 0.4], rotate: [0, 18, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ fontSize: `${size}rem` }}
      aria-hidden
    >
      ★
    </motion.div>
  );
}

function HeartFloat({ className, delay = 0, size = 1 }: { className?: string; delay?: number; size?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduced ? {} : { y: [0, -6, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ fontSize: `${size}rem` }}
      aria-hidden
    >
      ♡
    </motion.div>
  );
}

export function HeroSection({ products }: HeroSectionProps) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -12]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gradient-to-br from-cream via-white to-rose/5 pt-10 pb-20 lg:pt-14 lg:pb-28"
    >
      {/* Ambient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-pastel/10 blur-3xl" />
        <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-rose/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-yellow-soft/8 blur-3xl" />
      </div>

      {/* Decorative elements */}
      <FloatingCloud className="absolute top-6 left-8 text-blue-pastel/40 pointer-events-none select-none" size={2.8} delay={0} />
      <FloatingCloud className="absolute top-14 right-12 text-rose/25 pointer-events-none select-none" size={1.8} delay={1.3} />
      <TwinklingStar className="absolute top-10 left-1/4 text-yellow-soft/60 pointer-events-none select-none" size={1.2} delay={0.4} />
      <TwinklingStar className="absolute top-20 right-1/3 text-rose/35 pointer-events-none select-none" size={0.9} delay={1.2} />
      <HeartFloat className="absolute bottom-14 left-1/4 text-rose/25 pointer-events-none select-none" size={1.1} delay={0.8} />
      <FloatingCloud className="absolute bottom-8 right-8 text-yellow-soft/25 pointer-events-none select-none" size={2} delay={2.1} />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-16 items-center">

          {/* ── Left: Texto ── */}
          <div>
            {/* Wordmark animado */}
            <motion.div
              initial={{ opacity: 0, filter: reduced ? 'blur(0px)' : 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="mb-3"
            >
              <AnimatedLualeWordmark size="2xl" />
            </motion.div>

            <motion.p
              className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.2em] mb-5 bg-rose/10 px-3 py-1.5 rounded-full"
              {...fadeUp(0.08)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
              Ropa infantil seleccionada con amor
            </motion.p>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] font-extrabold text-brown leading-[1.1] tracking-tight mb-6"
              {...fadeUp(0.14)}
            >
              Más que ropa,<br />
              <span className="text-rose">es amor</span>{' '}
              en cada detalle.
            </motion.h1>

            <motion.p
              className="text-brown-light text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              {...fadeUp(0.22)}
            >
              Prendas especiales para acompañar con ternura sus primeros pasos, aventuras y pequeños grandes momentos.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-3 mb-8" {...fadeUp(0.3)}>
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 bg-rose hover:bg-rose-dark text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-base"
              >
                Ver catálogo
                <ChevronRight size={16} />
              </Link>
              <Link
                href="/nuestra-historia"
                className="inline-flex items-center justify-center gap-2 border-2 border-brown/20 text-brown hover:border-rose hover:text-rose font-semibold px-8 py-3.5 rounded-2xl transition-all text-base"
              >
                Conocer nuestra historia
              </Link>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-3 text-sm"
              {...fadeUp(0.38)}
            >
              <a
                href="https://wa.me/584220162748"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-[#25D366] hover:text-[#1ebe5d] transition-colors bg-green-50 px-3 py-1.5 rounded-xl"
              >
                <WhatsAppIcon size={15} />
                Pedidos por WhatsApp
              </a>
              <span className="text-brown/25">·</span>
              <span className="inline-flex items-center gap-1.5 text-brown-light font-medium">
                <MapPin size={12} className="text-rose/70" />
                Delivery en Caracas
              </span>
              <span className="text-brown/25">·</span>
              <span className="inline-flex items-center gap-1.5 text-brown-light font-medium">
                <Truck size={12} className="text-blue-pastel/80" />
                Envíos nacionales
              </span>
            </motion.div>
          </div>

          {/* ── Right: Composición visual — Desktop ── */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center h-[510px]"
            style={{ y: parallaxY }}
            initial={{ opacity: 0, x: reduced ? 0 : 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Fondo orgánico */}
            <div className="absolute inset-4 bg-gradient-to-br from-rose/15 via-cream to-blue-pastel/12 rounded-[3rem]" />
            <div className="absolute inset-8 bg-gradient-to-tl from-yellow-soft/8 to-transparent rounded-[3rem]" />

            {/* Nubes dentro de la composición */}
            <FloatingCloud className="absolute top-8 left-1/2 -translate-x-1/2 text-blue-pastel/50 text-5xl" delay={0.6} />
            <TwinklingStar className="absolute top-14 left-10 text-yellow-soft text-2xl" delay={0.3} />
            <TwinklingStar className="absolute top-12 right-10 text-rose text-base" delay={1} />
            <HeartFloat className="absolute bottom-12 left-1/3 text-rose/40 text-2xl" delay={1.5} />

            {/* Tarjeta izquierda */}
            <motion.div
              className="absolute top-20 left-4 w-44 bg-white rounded-2xl shadow-lg overflow-hidden z-20 border border-brown/5"
              animate={reduced ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
            >
              <div className="aspect-square">
                <ProductImage src={products[0]?.image ?? undefined} alt={products[0]?.name ?? ''} name={products[0]?.name} index={0} className="w-full h-full" sizes="200px" />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-brown-light font-medium">{products[0]?.garmentType}</p>
                <p className="text-xs font-bold text-brown truncate">{products[0]?.name}</p>
                <p className="text-sm font-extrabold text-rose mt-0.5">${products[0]?.price}</p>
              </div>
            </motion.div>

            {/* Tarjeta derecha-abajo */}
            <motion.div
              className="absolute bottom-18 right-4 w-48 bg-white rounded-2xl shadow-lg overflow-hidden z-20 border border-brown/5"
              animate={reduced ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
            >
              <div className="aspect-square">
                <ProductImage src={products[1]?.image ?? undefined} alt={products[1]?.name ?? ''} name={products[1]?.name} index={1} className="w-full h-full" sizes="200px" />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-brown-light font-medium">{products[1]?.garmentType}</p>
                <p className="text-xs font-bold text-brown truncate">{products[1]?.name}</p>
                <p className="text-sm font-extrabold text-rose mt-0.5">${products[1]?.price}</p>
              </div>
            </motion.div>

            {/* Tarjeta central — destacada */}
            <motion.div
              className="relative w-52 bg-white rounded-3xl shadow-xl overflow-hidden z-30 border border-brown/5"
              animate={reduced ? {} : { y: [0, -5, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <div className="aspect-[4/5]">
                <ProductImage src={products[2]?.image ?? undefined} alt={products[2]?.name ?? ''} name={products[2]?.name} index={2} className="w-full h-full" sizes="220px" priority />
              </div>
              <div className="p-3.5">
                <p className="text-[10px] text-brown-light font-medium">{products[2]?.garmentType}</p>
                <p className="text-xs font-bold text-brown truncate">{products[2]?.name}</p>
                <p className="text-base font-extrabold text-rose mt-0.5">${products[2]?.price}</p>
              </div>
            </motion.div>

            {/* Píldoras */}
            <div className="absolute top-5 right-5 bg-yellow-soft text-brown text-[10px] font-bold px-3 py-1.5 rounded-full z-30 rotate-3 shadow-sm">
              ✦ Caracas, Venezuela
            </div>
            <div className="absolute bottom-5 left-5 bg-rose text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-30 -rotate-2 shadow-sm">
              46 prendas disponibles
            </div>
          </motion.div>

          {/* ── Mobile: fila de tarjetas ── */}
          <motion.div
            className="lg:hidden flex justify-center gap-3"
            initial={{ opacity: 0, y: reduced ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {products.slice(0, 3).map((p, i) => (
              <div key={p.name} className="w-28 sm:w-32 bg-white rounded-2xl shadow-md overflow-hidden border border-brown/5">
                <div className="aspect-square">
                  <ProductImage src={p.image ?? undefined} alt={p.name} name={p.name} index={i} className="w-full h-full" sizes="120px" />
                </div>
                <div className="p-2">
                  <p className="text-[9px] text-brown-light truncate">{p.garmentType}</p>
                  <p className="text-xs font-extrabold text-rose">${p.price}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Wave bottom transition */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none h-14 pointer-events-none" aria-hidden>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,56 C360,10 1080,50 1440,8 L1440,56 Z" fill="#FBF3E8" fillOpacity="0.6" />
          <path d="M0,56 C400,20 1000,48 1440,20 L1440,56 Z" fill="#FBF3E8" />
        </svg>
      </div>
    </section>
  );
}
