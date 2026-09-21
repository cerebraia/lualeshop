import { Truck, MapPin } from 'lucide-react';

export function InfoBar() {
  return (
    <div className="bg-brown text-white text-xs py-2.5">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 flex-wrap">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck size={12} />
          Envíos a toda Venezuela
        </span>
        <span className="text-white/30 hidden sm:inline">·</span>
        <span className="hidden sm:flex items-center gap-1.5 font-medium">
          <MapPin size={12} />
          Delivery en Caracas
        </span>
        <span className="text-white/30 hidden sm:inline">·</span>
        <a
          href="https://wa.me/584220162748"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white/80 hover:text-rose transition-colors font-medium"
        >
          Pedidos por WhatsApp · +58 422-0162748
        </a>
      </div>
    </div>
  );
}
