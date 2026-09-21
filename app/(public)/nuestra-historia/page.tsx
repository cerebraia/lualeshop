import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nuestra historia',
  description: 'La historia detrás de Luale Kids Shop: Luciano y Alessia.',
};

export default function NuestraHistoriaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Decorative header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose/10 rounded-full mb-5">
          <Heart size={28} className="text-rose fill-rose/40" />
        </div>
        <h1 className="text-4xl font-extrabold text-brown mb-3">Nuestra historia</h1>
        <p className="text-brown-light">El amor que dio origen a Luale</p>
      </div>

      {/* Story */}
      <div className="prose prose-lg text-brown-light leading-relaxed space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose/10">
          <p className="text-brown font-semibold text-lg mb-4 leading-relaxed">
            Luale nace de dos nombres que representan el amor más profundo de una familia.
          </p>

          <div className="flex gap-6 mb-8">
            <div className="flex-1 text-center bg-rose/5 rounded-2xl p-5">
              <div className="text-3xl mb-2">✿</div>
              <p className="font-bold text-brown text-xl">Alessia</p>
              <p className="text-xs text-brown-light mt-1">La primera hija</p>
            </div>
            <div className="flex items-center text-brown-light text-2xl font-light">+</div>
            <div className="flex-1 text-center bg-blue-pastel/10 rounded-2xl p-5">
              <div className="text-3xl mb-2">★</div>
              <p className="font-bold text-brown text-xl">Luciano</p>
              <p className="text-xs text-brown-light mt-1">El segundo hijo</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="inline-block bg-rose/10 text-rose font-bold text-2xl px-6 py-2 rounded-2xl tracking-wider">
              LUA + LE = LUALE
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <p>
            Alessia, su primera hija, estuvo con la familia por un tiempo muy breve, pero dejó
            una huella para siempre. Su presencia, aunque corta, transformó sus vidas de una forma
            que las palabras nunca podrán explicar del todo.
          </p>

          <p>
            Luciano, su segundo hijo, llegó para continuar llenando su historia de amor y nuevos
            momentos. En él encontraron la fuerza para seguir adelante, para sonreír, para soñar
            nuevamente.
          </p>

          <div className="bg-rose/5 border-l-4 border-rose rounded-r-2xl pl-5 py-4 italic text-brown">
            &ldquo;De la unión de sus nombres nace Luale, una marca pensada para acompañar con
            ternura una de las etapas más bonitas de la vida: la infancia.&rdquo;
          </div>

          <p>
            Cada prenda que sale de Luale lleva consigo esa historia de amor. Cuando vistes a tu
            pequeño con algo nuestro, no solo estás eligiendo ropa bonita; estás siendo parte de
            un proyecto que nació del corazón.
          </p>

          <p>
            Desde Caracas, Venezuela, llevamos ese amor hasta cada rincón del país. Porque los
            pequeños merecen grandes momentos, y nosotros queremos ser parte de ellos.
          </p>
        </div>

        <div className="text-center pt-4">
          <p className="text-2xl text-brown font-bold mb-1">
            &ldquo;Más que ropa, es amor en cada detalle.&rdquo;
          </p>
          <p className="text-brown-light text-sm">— Luale Kids Shop</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center space-y-4">
        <p className="text-brown-light">¿Quieres ser parte de nuestra historia?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 bg-rose hover:bg-rose-dark text-white font-semibold px-6 py-3 rounded-2xl transition-all"
          >
            Ver catálogo
          </Link>
          <a
            href="https://wa.me/584220162748"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
          >
            <MessageCircle size={16} />
            Contáctanos
          </a>
        </div>
      </div>
    </div>
  );
}
