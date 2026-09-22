'use client';

import { useState, useEffect } from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';

const WA_HREF =
  'https://wa.me/584220162748?text=Hola%2C%20vi%20el%20cat%C3%A1logo%20de%20Luale%20Kids%20Shop%20y%20quisiera%20m%C3%A1s%20informaci%C3%B3n.';

export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      /*
       * z-20: above scrolling page content, but BELOW
       *   - header (z-40)
       *   - mobile menu overlay (z-30) and panel (z-40)
       *   - modals and search (z-50)
       * This prevents the FAB from covering menus or dialogs.
       */
      className="fixed z-20 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366]"
      style={{
        // safe-area insets for notched/dynamic-island devices
        right:   'max(20px, env(safe-area-inset-right, 20px))',
        bottom:  'max(20px, env(safe-area-inset-bottom, 20px))',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        transition: reduced
          ? 'none'
          : 'opacity 0.35s ease, transform 0.35s ease',
      }}
      onMouseEnter={(e) => {
        if (!reduced) (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1.1)';
      }}
      onMouseLeave={(e) => {
        if (!reduced) (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
      }}
      onMouseDown={(e) => {
        if (!reduced) (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(0.96)';
      }}
      onMouseUp={(e) => {
        if (!reduced) (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1.1)';
      }}
    >
      <WhatsAppIcon size={27} />
    </a>
  );
}
