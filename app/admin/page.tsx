'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  ImageIcon,
  Settings,
  Info,
} from 'lucide-react';
import { orderRepository } from '@/lib/repositories/orderRepository';
import { expenseRepository } from '@/lib/repositories/expenseRepository';
import { productRepository } from '@/lib/repositories/productRepository';
import type { Order, Expense, Product } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

const ORDER_STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  confirmed: 'Confirmado',
  prepared: 'Preparado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-yellow-100 text-yellow-700',
  prepared: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  demo,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  demo?: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {demo && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            demo
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-brown">{value}</p>
      <p className="text-xs text-brown-light font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-brown-light/60 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setOrders(orderRepository.findAll());
    setExpenses(expenseRepository.findAll());
    setProducts(productRepository.findAll());
  }, []);

  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const lowStockProducts = products.filter(
    (p) => p.status === 'low_stock' || p.status === 'out_of_stock'
  );

  const recentOrders = orders.slice(0, 5);

  const inventoryValue = products.reduce(
    (sum, p) =>
      sum + p.variants.reduce((vSum, v) => vSum + v.stock * p.cost, 0),
    0
  );

  // New computed values
  const productsWithoutImage = products.filter((p) => p.images.length === 0);
  const inventoryPendingProducts = products.filter((p) => !p.inventoryConfigured);
  const bebesCount = products.filter((p) => p.categoryIds.includes('cat-bebes')).length;
  const ninasCount = products.filter((p) => p.categoryIds.includes('cat-ninas')).length;
  const ninosCount = products.filter((p) => p.categoryIds.includes('cat-ninos')).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brown">Resumen</h1>
        <p className="text-brown-light text-sm">Vista general del negocio</p>
      </div>

      {/* Demo banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 mb-6 text-sm">
        <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <span>
          <strong>Modo demostración.</strong> Los datos financieros provienen de pedidos de prueba y no reflejan ventas reales.
        </span>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Ingresos totales"
          value={formatPrice(totalRevenue)}
          icon={<TrendingUp size={18} className="text-green-600" />}
          color="bg-green-50"
          sub={`${paidOrders.length} pedidos pagados`}
          demo
        />
        <StatCard
          label="Gastos totales"
          value={formatPrice(totalExpenses)}
          icon={<TrendingDown size={18} className="text-red-500" />}
          color="bg-red-50"
          demo
        />
        <StatCard
          label="Utilidad estimada"
          value={formatPrice(profit)}
          icon={<DollarSign size={18} className="text-rose" />}
          color="bg-rose/10"
          demo
        />
        <StatCard
          label="Valor del inventario"
          value={formatPrice(inventoryValue)}
          icon={<Package size={18} className="text-blue-pastel" />}
          color="bg-blue-pastel/10"
          sub="Dato de demostración"
          demo
        />
      </div>

      {/* Catalog Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total de productos"
          value={String(products.length)}
          icon={<Package size={18} className="text-brown" />}
          color="bg-cream"
          sub={`Bebés: ${bebesCount} · Niñas: ${ninasCount} · Niños: ${ninosCount}`}
        />
        <StatCard
          label="Sin imagen"
          value={String(productsWithoutImage.length)}
          icon={<ImageIcon size={18} className="text-amber-500" />}
          color="bg-amber-50"
          sub="Productos sin foto cargada"
        />
        <StatCard
          label="Inventario pendiente"
          value={String(inventoryPendingProducts.length)}
          icon={<Settings size={18} className="text-purple-500" />}
          color="bg-purple-50"
          sub="Sin stock configurado"
        />
        <StatCard
          label="Pedidos recientes"
          value={String(orders.length)}
          icon={<ShoppingBag size={18} className="text-rose" />}
          color="bg-rose/10"
          sub={`${paidOrders.length} pagados`}
          demo
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brown">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-xs text-rose font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-brown-light text-center py-8">No hay pedidos aún</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 py-2 border-b border-cream last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brown text-sm truncate">{order.customerName}</p>
                    <p className="text-xs text-brown-light">{formatDate(order.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-brown text-sm">{formatPrice(order.total)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts + Quick actions */}
        <div className="space-y-4">
          {/* Low stock */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-yellow-500" />
              <h2 className="font-bold text-brown text-sm">Stock bajo</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-brown-light">Todo el inventario está bien ✓</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-brown truncate flex-1">{p.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${p.status === 'out_of_stock' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status === 'out_of_stock' ? 'Agotado' : 'Bajo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
            <h2 className="font-bold text-brown text-sm mb-3">Acciones rápidas</h2>
            <div className="space-y-2">
              {[
                { href: '/admin/productos', label: 'Nuevo producto', icon: Package },
                { href: '/admin/pedidos', label: 'Nuevo pedido', icon: ShoppingBag },
                { href: '/admin/mercancia', label: 'Entrada de mercancía', icon: Plus },
                { href: '/admin/gastos', label: 'Registrar gasto', icon: TrendingDown },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 text-sm text-brown hover:text-rose font-medium transition-colors py-1"
                >
                  <Icon size={15} className="text-brown-light" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
