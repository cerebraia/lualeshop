'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side digest logged in Next.js; client logs the reference only.
    console.error('[RootError] digest:', error.digest);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-rose/20 mb-3">!</p>
      <h1 className="text-xl font-extrabold text-brown mb-2">Algo salió mal</h1>
      <p className="text-brown-light text-sm max-w-xs mb-6">
        Ocurrió un error inesperado. Por favor intenta de nuevo.
        {error.digest && (
          <span className="block mt-1 text-xs text-brown-light/50 font-mono">
            Ref: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-rose hover:bg-rose-dark text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border-2 border-rose/30 hover:border-rose text-brown text-sm font-semibold rounded-2xl transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
