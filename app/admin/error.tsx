'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError] digest:', error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-cream border border-rose/20 rounded-3xl p-8 max-w-md w-full">
        <p className="text-4xl font-extrabold text-rose/30 mb-3">!</p>
        <h1 className="text-lg font-extrabold text-brown mb-2">Error al cargar</h1>
        <p className="text-brown-light text-sm mb-4">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs text-brown-light/50 font-mono mb-4">Ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-rose hover:bg-rose-dark text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
