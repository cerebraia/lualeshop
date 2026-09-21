'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AnimatedLualeWordmark } from '@/components/ui/AnimatedLualeWordmark';

function AnimatedConnector({ delay = 0, colors }: { delay?: number; colors: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`w-0.5 h-10 ${colors} rounded-full mx-auto`}
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: 'top' }}
    />
  );
}

export function BrandStory() {
  const reduced = useReducedMotion();

  const fade = {
    initial: { opacity: 0, y: reduced ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-cream via-white to-blue-pastel/8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* ── Text column ── */}
          <motion.div {...fade} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.18em] mb-6 bg-rose/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose" />
              Una marca nacida del amor
            </p>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-brown leading-tight mb-8">
              La historia detrás<br />de Luale
            </h2>

            <div className="space-y-5 text-brown-light leading-relaxed">
              <p>
                Luale nace de la unión de dos nombres que representan el amor más profundo de nuestra familia:{' '}
                <strong className="text-brown">Luciano</strong> y{' '}
                <strong className="text-brown">Alessia</strong>.
              </p>
              <p>
                Alessia, nuestra primera hija, estuvo con nosotros por un tiempo muy breve, pero dejó una huella
                que vivirá para siempre. Luciano, nuestro segundo hijo, llegó para continuar llenando nuestra historia
                de amor, alegría y nuevos momentos.
              </p>
              <p>
                De la unión de sus nombres nace Luale, una marca pensada para acompañar con ternura una de las etapas
                más bonitas de la vida: la infancia.
              </p>
            </div>

            <blockquote className="mt-8 border-l-4 border-rose pl-5 py-1">
              <p className="text-brown font-semibold text-lg leading-snug italic">
                &ldquo;Porque no se trata solamente de ropa. Es amor presente en cada detalle.&rdquo;
              </p>
            </blockquote>

            <Link
              href="/nuestra-historia"
              className="mt-8 inline-flex items-center gap-2 text-rose font-bold hover:underline"
            >
              Conoce nuestra historia
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          {/* ── Visual column: animated name composition ── */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, x: reduced ? 0 : 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="relative w-full max-w-sm">
              {/* Background circle glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose/8 to-blue-pastel/8 blur-2xl" />

              <div className="relative flex flex-col items-center gap-0 py-10">
                {/* Luciano */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: reduced ? 0 : -16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="inline-block bg-gradient-to-br from-blue-pastel/30 to-blue-pastel/10 rounded-3xl px-8 py-4 border border-blue-pastel/25 shadow-sm">
                    <p className="text-2xl font-extrabold text-brown tracking-wide">Luciano</p>
                    <p className="text-xs text-[#4A8BAF] font-semibold mt-1 uppercase tracking-widest">Nuestro hijo</p>
                  </div>
                </motion.div>

                {/* Connector: blue to rose */}
                <AnimatedConnector delay={0.45} colors="bg-gradient-to-b from-blue-pastel to-rose" />

                {/* Alessia */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <div className="inline-block bg-gradient-to-br from-rose/25 to-rose/8 rounded-3xl px-8 py-4 border border-rose/20 shadow-sm">
                    <p className="text-2xl font-extrabold text-brown tracking-wide">Alessia</p>
                    <p className="text-xs text-rose-dark font-semibold mt-1 uppercase tracking-widest">Nuestra hija</p>
                  </div>
                </motion.div>

                {/* Connector: rose to yellow */}
                <AnimatedConnector delay={0.8} colors="bg-gradient-to-b from-rose to-yellow-soft" />

                {/* Luale wordmark */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="inline-block bg-gradient-to-br from-yellow-soft/30 to-cream rounded-3xl px-10 py-5 border border-yellow-soft/35 shadow-md">
                    <AnimatedLualeWordmark size="xl" className="block mb-1" />
                    <p className="text-xs text-brown-light font-bold uppercase tracking-[0.3em]">Kids Shop</p>
                  </div>
                </motion.div>
              </div>

              {/* Decorative */}
              <span aria-hidden className="absolute top-4 right-4 text-2xl text-rose/20 select-none">✦</span>
              <span aria-hidden className="absolute bottom-4 left-6 text-xl text-blue-pastel/25 select-none">☁</span>
              <span aria-hidden className="absolute top-1/2 right-2 text-lg text-yellow-soft/30 select-none">★</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
