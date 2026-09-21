'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-brown/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto',
          sizes[size]
        )}
      >
        {(title || true) && (
          <div className="flex items-center justify-between mb-5">
            {title && <h2 className="text-lg font-bold text-brown">{title}</h2>}
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-full hover:bg-cream transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} className="text-brown-light" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
