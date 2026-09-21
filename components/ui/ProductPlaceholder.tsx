import { cn } from '@/lib/utils';

interface ProductPlaceholderProps {
  name?: string;
  className?: string;
  index?: number;
}

const GRADIENTS = [
  'from-rose/30 to-rose/10',
  'from-blue-pastel/30 to-blue-pastel/10',
  'from-yellow-soft/40 to-yellow-soft/10',
  'from-rose/20 to-yellow-soft/20',
  'from-blue-pastel/20 to-rose/20',
  'from-yellow-soft/30 to-blue-pastel/20',
];

const ICONS = ['✿', '☁', '★', '♡', '✦', '◎'];

export function ProductPlaceholder({ name, className, index = 0 }: ProductPlaceholderProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const icon = ICONS[index % ICONS.length];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full h-full bg-gradient-to-br',
        gradient,
        className
      )}
      aria-label={name ?? 'Imagen del producto'}
    >
      <span className="text-4xl opacity-40 select-none">{icon}</span>
      {name && (
        <span className="mt-2 text-xs text-brown-light/70 font-medium text-center px-2 leading-tight">
          {name}
        </span>
      )}
    </div>
  );
}
