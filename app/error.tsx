'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-5xl font-extrabold text-gray-300 mb-3">500</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ocurrió un error inesperado. Intenta recargar la página.
            {error.digest && (
              <span className="block mt-1 text-xs text-gray-400 font-mono">
                Ref: {error.digest}
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
