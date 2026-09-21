import type { ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center text-rose">
        {icon ?? <PackageSearch size={28} />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-brown">{title}</h3>
        {description && <p className="text-sm text-brown-light max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}
