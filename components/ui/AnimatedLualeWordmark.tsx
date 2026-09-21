'use client';

import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedLualeWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const SIZES = {
  sm:  'text-3xl',
  md:  'text-4xl',
  lg:  'text-5xl',
  xl:  'text-6xl',
  '2xl': 'text-7xl sm:text-8xl',
};

export function AnimatedLualeWordmark({ className, size = 'lg' }: AnimatedLualeWordmarkProps) {
  const reduced = useReducedMotion();

  return (
    <span
      className={cn('font-script font-bold inline-block leading-none', SIZES[size], className)}
      style={{
        background: 'linear-gradient(90deg, #82B5D3, #E7A7AD, #E9A47E, #F2C568, #82B5D3)',
        backgroundSize: '250% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        animation: reduced ? 'none' : 'luale-gradient 8s linear infinite',
      }}
      aria-label="Luale"
    >
      Luale
    </span>
  );
}
