'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  Boxes,
  ShoppingBag,
  ClipboardList,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Tag },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { href: '/admin/mercancia', label: 'Mercancía', icon: ShoppingBag },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/gastos', label: 'Gastos', icon: Receipt },
  { href: '/admin/finanzas', label: 'Finanzas', icon: BarChart3 },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/puesta-en-marcha', label: 'Puesta en marcha', icon: Rocket },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Luale Kids</p>
            <p className="text-white/40 text-xs">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Demo notice */}
      <div className="mx-3 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
        <p className="text-yellow-400 text-xs font-medium">Modo demostración</p>
        <p className="text-yellow-400/70 text-xs">Datos locales / sin autenticación</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-rose text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Ver tienda pública
        </Link>
      </div>
    </div>
  );
}
