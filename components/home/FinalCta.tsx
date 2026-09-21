'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

const WA_MESSAGE = encodeURIComponent(
  'Hola, vi el catálogo de Luale Kids Shop y quisiera recibir ayuda para elegir una prenda.'
);

export function FinalCta() {
  const reduced = useReducedMotion();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, #F7E3E0, #FBF3E8, #E8F3F9, #FBF3E8, #F7F0DC)',
          backgroundSize: '300% 300%',
          animation: reduced ? 'none' : 'luale-gradient 16s ease infinite',
        }}
      />

      {/* Organic blob shapes */}
      <div aria-hidden className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-rose/14 blur-3xl"
          style={{ animation: reduced ? 'none' : 'ambient-float 20s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-24 -right-16 w-[28rem] h-[28rem] rounded-full bg-blue-pastel/10 blur-3xl"
          style={{ animation: reduced ? 'none' : 'ambient-float 26s ease-in-out infinite 6s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-yellow-soft/8 blur-3xl"
          style={{ animation: reduced ? 'none' : 'ambient-float 18s ease-in-out infinite 12s' }}
        />
      </div>

      {/* Decorative sparkles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-12 left-12 text-rose/25 text-3xl">✦</span>
        <span className="absolute top-8 right-20 text-yellow-soft/35 text-2xl">★</span>
        <span className="absolute bottom-12 left-1/4 text-blue-pastel/25 text-2xl">☁</span>
        <span className="absolute bottom-10 right-14 text-rose/20 text-xl">♡</span>
      </div>

      <motion.div
        className="relative max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: reduced ? 0 : 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          aria-hidden
          className="block text-5xl mb-6 select-none"
          initial={{ scale: reduced ? 1 : 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          ✦
        </motion.span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brown mb-5 leading-tight">
          ¿Encontraste<br className="hidden sm:inline" /> su próximo look?
        </h2>

        <p className="text-brown-light/80 text-lg leading-relaxed mb-10 max-w-md mx-auto">
          Escríbenos y te ayudaremos a confirmar disponibilidad, talla y entrega.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`https://wa.me/584220162748?text=${WA_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-md hover:shadow-xl active:scale-[0.98] text-base"
          >
            <WhatsAppIcon size={22} />
            Escribir por WhatsApp
          </a>
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 border-2 border-brown/20 text-brown hover:border-rose hover:text-rose font-semibold px-8 py-4 rounded-2xl transition-all text-base hover:bg-rose/5"
          >
            Seguir explorando
            <ChevronRight size={16} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
