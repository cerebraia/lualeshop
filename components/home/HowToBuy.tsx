'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { makeFadeUp } from '@/components/ui/motion-variants';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Explora',
    desc: 'Encuentra la prenda ideal en nuestro catálogo. Filtra por categoría, talla y precio.',
  },
  {
    number: '02',
    icon: CheckCircle,
    title: 'Elige',
    desc: 'Selecciona talla, opción de compra y cantidad en la ficha de cada producto.',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Escríbenos',
    desc: 'Completa tu pedido directamente por WhatsApp. Te ayudamos en todo el proceso.',
  },
];

export function HowToBuy() {
  const reduced = useReducedMotion();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-brown to-[#4E3A2F] text-white overflow-hidden relative">
      {/* Decorative bg */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-0 left-0 text-white/4 text-[220px] font-black leading-none">L</span>
        <span className="absolute bottom-0 right-4 text-white/4 text-[160px] leading-none">♡</span>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          {...makeFadeUp(!!reduced, 0)}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">¿Cómo realizar tu pedido?</h2>
          <p className="text-white/65 max-w-md mx-auto">
            Simple, rápido y completamente por WhatsApp. Sin cuentas, sin carrito de compras.
          </p>
        </motion.div>

        {/* Desktop: horizontal progress line */}
        <div className="hidden md:flex items-start gap-0 mb-16 relative">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex-1 flex flex-col items-center relative">
              {/* Connector line between dots */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-white/10 z-0">
                  <motion.div
                    className="h-full bg-rose rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={reduced ? { duration: 0 } : { duration: 0.7, delay: i * 0.35 + 0.3, ease: 'easeInOut' }}
                  />
                </div>
              )}

              {/* Step circle */}
              <motion.div
                className="relative z-10 w-11 h-11 rounded-full bg-rose flex items-center justify-center mb-6 shadow-lg shadow-rose/20"
                initial={{ scale: reduced ? 1 : 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={reduced ? { duration: 0.2 } : { duration: 0.4, delay: i * 0.2, type: 'spring', stiffness: 300 }}
              >
                <step.icon size={18} className="text-white" />
              </motion.div>

              {/* Step card */}
              <motion.div
                className="bg-white/6 hover:bg-white/10 rounded-3xl p-6 border border-white/10 text-center transition-colors w-full"
                initial={{ opacity: 0, y: reduced ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 + 0.1 }}
              >
                <span className="text-4xl font-black text-white/8 leading-none block mb-3">{step.number}</span>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Mobile: vertical layout */}
        <div className="md:hidden space-y-0 mb-14">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-4">
              {/* Left: number + vertical line */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-10 h-10 rounded-full bg-rose flex items-center justify-center shrink-0 shadow-lg shadow-rose/20 z-10"
                  initial={{ scale: reduced ? 1 : 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={reduced ? { duration: 0.2 } : { duration: 0.4, delay: i * 0.15, type: 'spring', stiffness: 300 }}
                >
                  <step.icon size={16} className="text-white" />
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 my-1 bg-white/10 rounded-full relative overflow-hidden min-h-[40px]">
                    <motion.div
                      className="absolute inset-x-0 top-0 bg-rose rounded-full origin-top"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={reduced ? { duration: 0 } : { duration: 0.5, delay: i * 0.2 + 0.2 }}
                      style={{ height: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Right: content */}
              <motion.div
                className="pb-8 flex-1"
                initial={{ opacity: 0, x: reduced ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="bg-white/6 rounded-2xl p-5 border border-white/10">
                  <span className="text-3xl font-black text-white/8 leading-none block mb-2">{step.number}</span>
                  <h3 className="text-lg font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        <motion.div
          className="text-center"
          {...makeFadeUp(!!reduced, 0.4)}
        >
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-rose hover:bg-rose-dark text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-lg active:scale-[0.98]"
          >
            Explorar el catálogo
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
