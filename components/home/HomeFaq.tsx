'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { makeFadeUp } from '@/components/ui/motion-variants';

const FAQS = [
  {
    q: '¿Cómo realizo un pedido?',
    a: 'Selecciona la prenda que te gusta, elige la talla y presiona "Pedir por WhatsApp". Se abrirá una conversación con el detalle de tu pedido listo. Nosotros coordinamos contigo el pago y la entrega.',
  },
  {
    q: '¿Hacen delivery en Caracas?',
    a: 'Sí, realizamos delivery en toda Caracas. El costo varía según la zona de entrega. Consúltanos al momento de hacer tu pedido para cotizar.',
  },
  {
    q: '¿Realizan envíos nacionales?',
    a: 'Sí, enviamos a todo el país a través de empresas de mensajería. El costo del envío corre por cuenta del comprador.',
  },
  {
    q: '¿Cómo consulto la disponibilidad?',
    a: 'Escríbenos directamente por WhatsApp con el nombre del producto y la talla que necesitas. Con gusto te confirmamos si está disponible.',
  },
  {
    q: '¿Puedo solicitar ayuda con una talla?',
    a: 'Por supuesto. Nuestro equipo te orienta para elegir la talla correcta según la edad y medidas de tu pequeño. Solo escríbenos.',
  },
];

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-14"
          {...makeFadeUp(!!reduced, 0)}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-3">
            Preguntas frecuentes
          </h2>
          <p className="text-brown-light/80">Lo que más nos preguntan antes de hacer el pedido.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={faq.q}
                className={cn(
                  'rounded-2xl border overflow-hidden transition-colors duration-200',
                  isOpen ? 'border-rose/35 bg-rose/4' : 'border-brown/10 bg-cream hover:border-rose/25 hover:bg-rose/3'
                )}
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.38, delay: i * 0.07 }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-brown text-sm leading-snug">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.22, ease: 'easeInOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown size={17} className="text-rose" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduced ? { duration: 0 } : { duration: 0.24, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-brown-light/80 leading-relaxed border-t border-rose/12">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/preguntas-frecuentes"
            className="inline-flex items-center gap-1.5 text-rose font-semibold hover:underline text-sm"
          >
            Ver todas las preguntas →
          </Link>
        </div>
      </div>
    </section>
  );
}
