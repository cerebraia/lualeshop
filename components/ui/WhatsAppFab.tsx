'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';

const WA_HREF =
  'https://wa.me/584220162748?text=Hola%2C%20vi%20el%20cat%C3%A1logo%20de%20Luale%20Kids%20Shop%20y%20quisiera%20m%C3%A1s%20informaci%C3%B3n.';

export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  // Fade in after a short delay so it doesn't flash on load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={cn(
        'fixed bottom-6 right-5 z-40',
        'flex items-center justify-center',
        'w-14 h-14 rounded-full',
        'bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a84e]',
        'shadow-lg shadow-[#25D366]/40 hover:shadow-xl hover:shadow-[#25D366]/50',
        'transition-all duration-200 hover:scale-110 active:scale-[0.97]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease, background-color 0.15s, box-shadow 0.15s, scale 0.15s' }}
    >
      <WhatsAppIcon size={28} className="text-white" />
    </a>
  );
}
