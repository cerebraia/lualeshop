import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Truck } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export function Footer() {
  return (
    <footer className="bg-brown text-white mt-0">
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Luale Kids Shop"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-white text-lg">Luale Kids Shop</span>
              </div>
            </div>
            <p className="text-rose/80 text-sm font-medium italic leading-relaxed">
              &ldquo;Pequeños grandes momentos.&rdquo;
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Más que ropa, es amor en cada detalle.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <MapPin size={11} />
                Caracas, Venezuela
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <Truck size={11} />
                Envíos nacionales
              </div>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="font-semibold mb-4 text-white/90 text-sm uppercase tracking-widest">Tienda</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              {[
                ['/catalogo', 'Catálogo completo'],
                ['/categoria/bebes', 'Bebés'],
                ['/categoria/ninas', 'Niñas'],
                ['/categoria/ninos', 'Niños'],
                ['/categoria/juguetes', 'Juguetes'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-rose transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4 text-white/90 text-sm uppercase tracking-widest">Información</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              {[
                ['/nuestra-historia', 'Nuestra historia'],
                ['/preguntas-frecuentes', 'Preguntas frecuentes'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-rose transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold mb-4 text-white/90 text-sm uppercase tracking-widest">Contacto</h3>
            <div className="space-y-3">
              <a
                href="https://wa.me/584220162748?text=Hola%2C%20vi%20el%20cat%C3%A1logo%20de%20Luale%20Kids%20Shop%20y%20quisiera%20recibir%20ayuda%20para%20elegir%20una%20prenda."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-white/70 hover:text-green-400 transition-colors"
              >
                <WhatsAppIcon size={16} />
                +58 422-0162748
              </a>
              <a
                href="https://instagram.com/lualekids.shop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-white/70 hover:text-rose transition-colors"
              >
                <InstagramIcon size={16} />
                @lualekids.shop
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Luale Kids Shop · Caracas, Venezuela</span>
          <div className="flex items-center gap-4">
            <span>Todos los derechos reservados</span>
            <Link href="/admin" className="hover:text-white/50 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
