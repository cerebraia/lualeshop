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

// Gradient extracted from the real Luale logo:
//   "L" → muted dusty blue  #89B4C8
//   "a" / "e" → dusty rose  #C98B96
// The animation cycles through blue → rose → blue
const GRADIENT = 'linear-gradient(90deg, #89B4C8, #C98B96, #D4A0A8, #89B4C8)';

export function AnimatedLualeWordmark({ className, size = 'lg' }: AnimatedLualeWordmarkProps) {
  const reduced = useReducedMotion();

  return (
    <span
      className={cn('font-script inline-block leading-none', SIZES[size], className)}
      style={{
        background: GRADIENT,
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
