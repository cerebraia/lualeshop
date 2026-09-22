import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-extrabold text-rose/30 mb-2">404</p>
      <h1 className="text-2xl font-extrabold text-brown mb-3">
        Página no encontrada
      </h1>
      <p className="text-brown-light text-sm max-w-xs mb-8">
        La página que buscas no existe o fue movida. Explora nuestro catálogo de ropa infantil.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-rose hover:bg-rose-dark text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm"
        >
          Ir al inicio
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center justify-center gap-2 border-2 border-rose/30 text-brown hover:border-rose hover:text-rose font-semibold px-6 py-3 rounded-2xl transition-colors text-sm"
        >
          Ver catálogo
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
