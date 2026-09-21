'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HeartHandshake, MessageCircle, MapPin, Truck } from 'lucide-react';
import { makeFadeUp } from '@/components/ui/motion-variants';

const BENEFITS = [
  {
    icon: HeartHandshake,
    iconColor: 'text-rose-dark',
    circleBg: 'bg-rose/15',
    title: 'Atención personalizada',
    desc: 'Te ayudamos a elegir la talla y el estilo ideal para cada pequeño.',
  },
  {
    icon: MessageCircle,
    iconColor: 'text-[#1a9e4d]',
    circleBg: 'bg-green-100',
    title: 'Pedidos por WhatsApp',
    desc: 'Proceso simple y directo. Sin complicaciones, sin aplicaciones adicionales.',
  },
  {
    icon: MapPin,
    iconColor: 'text-[#3A8BB5]',
    circleBg: 'bg-blue-pastel/20',
    title: 'Delivery en Caracas',
    desc: 'Llevamos tu pedido hasta la puerta de tu casa en toda Caracas.',
  },
  {
    icon: Truck,
    iconColor: 'text-[#9A7B2C]',
    circleBg: 'bg-yellow-soft/30',
    title: 'Envíos a toda Venezuela',
    desc: 'Llegamos a cualquier rincón del país con empresas de mensajería.',
  },
];

export function BenefitsStrip() {
  const reduced = useReducedMotion();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-14"
          {...makeFadeUp(!!reduced, 0)}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-3">
            ¿Por qué elegir Luale?
          </h2>
          <p className="text-brown-light/80">Comprometidos con cada prenda y cada familia.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              className="group relative bg-cream hover:bg-white rounded-3xl p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 cursor-default overflow-hidden"
              initial={{ opacity: 0, y: reduced ? 0 : 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.09 }}
            >
              {/* Animated border on hover */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-rose/20 transition-colors duration-300" />

              <div className={`inline-flex items-center justify-center w-14 h-14 ${b.circleBg} rounded-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <b.icon size={24} className={b.iconColor} />
              </div>
              <h3 className="font-extrabold text-brown mb-2.5 text-base">{b.title}</h3>
              <p className="text-sm text-brown-light/80 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
