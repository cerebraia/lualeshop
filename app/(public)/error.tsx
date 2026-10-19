'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PublicError]', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-rose-200 mb-3">!</p>
      <h1 className="text-xl font-extrabold text-brown mb-2">No pudimos cargar esta página</h1>
      <p className="text-brown-light text-sm max-w-xs mb-6">
        Ocurrió un error al conectar con el servidor. Por favor intenta de nuevo.
        {error.digest && (
          <span className="block mt-1 text-xs text-brown-light/50 font-mono">
            Ref: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-rose text-white text-sm font-semibold rounded-2xl hover:bg-rose-dark transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/catalogo"
          className="px-5 py-2.5 border-2 border-rose/30 text-brown text-sm font-semibold rounded-2xl hover:border-rose transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
