'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { makeFadeUp } from '@/components/ui/motion-variants';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

const CATEGORY_THEMES: Record<string, {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  tagBg: string;
  icon: string;
  tagline: string;
  decorBig: string;
}> = {
  bebes: {
    bg: 'from-[#D8EEF7] to-[#EBF5FB]',
    border: 'border-blue-pastel/25',
    iconBg: 'bg-blue-pastel/25',
    iconColor: 'text-[#5A9BBF]',
    accentColor: 'text-[#4A8BAF]',
    tagBg: 'bg-blue-pastel/20 text-[#3A7B9F]',
    icon: '☁',
    tagline: 'Ternura para sus primeros momentos.',
    decorBig: 'text-blue-pastel/20',
  },
  ninas: {
    bg: 'from-[#F7DCDA] to-[#FBEAEA]',
    border: 'border-rose/25',
    iconBg: 'bg-rose/20',
    iconColor: 'text-rose-dark',
    accentColor: 'text-rose-dark',
    tagBg: 'bg-rose/15 text-rose-dark',
    icon: '✿',
    tagline: 'Looks llenos de dulzura y personalidad.',
    decorBig: 'text-rose/15',
  },
  ninos: {
    bg: 'from-[#FBF0CE] to-[#FDF6E3]',
    border: 'border-yellow-soft/35',
    iconBg: 'bg-yellow-soft/35',
    iconColor: 'text-[#9A7B2C]',
    accentColor: 'text-[#8A6B1C]',
    tagBg: 'bg-yellow-soft/30 text-[#7A5B0C]',
    icon: '★',
    tagline: 'Comodidad para cada nueva aventura.',
    decorBig: 'text-yellow-soft/25',
  },
};

export function CategoryShowcase({ categories }: { categories: CategoryItem[] }) {
  const reduced = useReducedMotion();
  const visible = categories.filter((c) => c.count > 0);

  if (visible.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-14"
          {...makeFadeUp(!!reduced, 0)}
        >
          <p className="inline-flex items-center gap-2 text-xs font-bold text-rose uppercase tracking-[0.18em] mb-4 bg-rose/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
            Colecciones
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brown mb-3">
            Encuentra su próximo look
          </h2>
          <p className="text-brown-light max-w-md mx-auto">
            Prendas especiales para cada etapa y cada aventura.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {visible.map((cat, i) => {
            const theme = CATEGORY_THEMES[cat.slug] ?? {
              bg: 'from-cream to-white',
              border: 'border-brown/10',
              iconBg: 'bg-cream',
              iconColor: 'text-brown',
              accentColor: 'text-brown',
              tagBg: 'bg-cream text-brown',
              icon: '✦',
              tagline: cat.description ?? '',
              decorBig: 'text-brown/10',
            };

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: reduced ? 0 : 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Link
                  href={`/categoria/${cat.slug}`}
                  className={`group block bg-gradient-to-br ${theme.bg} rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border ${theme.border} overflow-hidden relative min-h-[280px] flex flex-col`}
                >
                  {/* Decorative big icon */}
                  <span
                    aria-hidden
                    className={`absolute -bottom-4 -right-4 text-[9rem] select-none pointer-events-none ${theme.decorBig} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    {theme.icon}
                  </span>

                  {/* Icon badge */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${theme.iconBg} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`text-4xl select-none ${theme.iconColor}`}>{theme.icon}</span>
                  </div>

                  {/* Category tag */}
                  <span className={`inline-flex self-start text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mb-3 ${theme.tagBg}`}>
                    {cat.name}
                  </span>

                  <h3 className="text-2xl font-extrabold text-brown mb-3 leading-tight">
                    {cat.name}
                  </h3>

                  <p className="text-sm text-brown-light leading-relaxed mb-6 flex-1">
                    {theme.tagline}
                  </p>

                  <div className={`inline-flex items-center gap-2 text-sm font-bold ${theme.accentColor} group-hover:gap-3 transition-all duration-300`}>
                    Ver {cat.count} {cat.count === 1 ? 'prenda' : 'prendas'}
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/60 group-hover:bg-white transition-colors">
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
