import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'available' | 'low_stock' | 'out_of_stock' | 'coming_soon' | 'new' | 'featured' | 'neutral' | 'info';
  className?: string;
}

const variants = {
  available: 'bg-green-100 text-green-700',
  low_stock: 'bg-yellow-100 text-yellow-700',
  out_of_stock: 'bg-red-100 text-red-600',
  coming_soon: 'bg-blue-100 text-blue-600',
  new: 'bg-rose text-white',
  featured: 'bg-yellow-soft text-brown',
  neutral: 'bg-cream text-brown-light',
  info: 'bg-blue-pastel/20 text-blue-pastel',
};

const labels: Record<string, string> = {
  available: 'Disponible',
  low_stock: 'Últimas unidades',
  out_of_stock: 'Agotado',
  coming_soon: 'Próximamente',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const resolved = typeof children === 'string' && labels[children] ? labels[children] : children;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {resolved}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    available:    'available',
    low_stock:    'low_stock',
    out_of_stock: 'out_of_stock',
    coming_soon:  'coming_soon',
    consult:      'info',
  };
  const labelMap: Record<string, string> = {
    available:    'Disponible',
    low_stock:    'Últimas unidades',
    out_of_stock: 'Agotado',
    coming_soon:  'Próximamente',
    consult:      'Consultar',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{labelMap[status] ?? status}</Badge>;
}
