'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Landmark } from 'lucide-react';
import { orderRepo, expenseRepo, receivablesRepo, payablesRepo } from '@/lib/repos';
import type { Order, Expense } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const fmt = (n: number) => eur.format(n);

export default function FinanzasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receivableSummary, setReceivableSummary] = useState({ totalReceivable: 0, overdueReceivable: 0 });
  const [payableSummary, setPayableSummary] = useState({ totalPayable: 0, overduePayable: 0 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [paidOrds, exps, rSum, pSum] = await Promise.all([
          orderRepo.findPaid(),
          expenseRepo.findAll(),
          receivablesRepo.getSummary(),
          payablesRepo.getSummary(),
        ]);
        setOrders(paidOrds);
        setExpenses(exps);
        setReceivableSummary(rSum);
        setPayableSummary(pSum);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al cargar datos.');
      }
    })();
  }, []);

  function inRange(dateStr: string): boolean {
    const d = new Date(dateStr).getTime();
    const f = from ? new Date(from).getTime() : -Infinity;
    const t = to ? new Date(to).getTime() + 86400000 : Infinity;
    return d >= f && d <= t;
  }

  const filteredOrders = orders.filter((o) => inRange(o.date));
  const filteredExpenses = expenses.filter((e) => inRange(e.date));

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const netPosition = receivableSummary.totalReceivable - payableSummary.totalPayable;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brown">Finanzas</h1>
        <p className="text-brown-light text-sm">Ingresos cobrados, gastos pagados y posición pendiente</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      {/* Pending position — no date filter, always current */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <p className="text-xl font-extrabold text-brown">{fmt(receivableSummary.totalReceivable)}</p>
          <p className="text-xs text-brown-light mt-0.5">Por cobrar pendiente</p>
          {receivableSummary.overdueReceivable > 0 && (
            <p className="text-xs text-red-600 mt-1">Vencido: {fmt(receivableSummary.overdueReceivable)}</p>
          )}
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <p className="text-xl font-extrabold text-brown">{fmt(payableSummary.totalPayable)}</p>
          <p className="text-xs text-brown-light mt-0.5">Por pagar pendiente</p>
          {payableSummary.overduePayable > 0 && (
            <p className="text-xs text-red-600 mt-1">Vencido: {fmt(payableSummary.overduePayable)}</p>
          )}
        </div>
        <div className={`rounded-3xl p-5 shadow-sm border ${netPosition >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${netPosition >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <DollarSign size={18} className={netPosition >= 0 ? 'text-green-600' : 'text-red-500'} />
          </div>
          <p className={`text-xl font-extrabold ${netPosition >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(netPosition)}</p>
          <p className="text-xs text-brown-light mt-0.5">Posición neta</p>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10 flex flex-col justify-between">
          <div className="w-10 h-10 bg-rose/10 rounded-2xl flex items-center justify-center mb-3">
            <Landmark size={18} className="text-rose" />
          </div>
          <p className="text-xs text-brown-light">Gestiona vencimientos y pagos pendientes</p>
          <Link href="/admin/deudas" className="text-xs text-rose font-semibold hover:underline mt-2">
            Ver deudas →
          </Link>
        </div>
      </div>

      {/* Date filter for cash flow */}
      <div className="flex flex-wrap gap-3 mb-6">
        <p className="text-sm font-bold text-brown self-center">Flujo de caja cobrado/pagado:</p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-brown-light">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white border border-rose/30 rounded-2xl px-3 py-2 text-sm text-brown focus:outline-none focus:border-rose" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-brown-light">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-white border border-rose/30 rounded-2xl px-3 py-2 text-sm text-brown focus:outline-none focus:border-rose" />
        </div>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); }} className="text-sm text-rose font-semibold hover:underline">Limpiar</button>
        )}
      </div>

      {/* Cash flow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center mb-3"><TrendingUp size={18} className="text-green-600" /></div>
          <p className="text-2xl font-extrabold text-brown">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-brown-light mt-0.5">Ingresos cobrados ({filteredOrders.length} pedidos pagados)</p>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-3"><TrendingDown size={18} className="text-red-500" /></div>
          <p className="text-2xl font-extrabold text-brown">{formatPrice(totalExpenses)}</p>
          <p className="text-xs text-brown-light mt-0.5">Gastos pagados ({filteredExpenses.length} registros)</p>
        </div>
        <div className={`rounded-3xl p-5 shadow-sm border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <DollarSign size={18} className={profit >= 0 ? 'text-green-600' : 'text-red-500'} />
          </div>
          <p className={`text-2xl font-extrabold ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatPrice(profit)}</p>
          <p className="text-xs text-brown-light mt-0.5">Utilidad bruta (cobrado − pagado)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-green-600" /><h2 className="font-bold text-brown">Pedidos pagados</h2></div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <p className="text-sm text-brown-light text-center py-6">Sin ingresos en el período</p>
            ) : filteredOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-cream last:border-0">
                <div><p className="font-medium text-brown text-sm">{o.customerName}</p><p className="text-xs text-brown-light">{formatDate(o.date)}</p></div>
                <p className="font-bold text-green-600 shrink-0">+{formatPrice(o.total)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={16} className="text-red-500" /><h2 className="font-bold text-brown">Gastos del período</h2></div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-brown-light text-center py-6">Sin gastos en el período</p>
            ) : filteredExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-cream last:border-0">
                <div><p className="font-medium text-brown text-sm truncate">{e.description}</p><p className="text-xs text-brown-light">{formatDate(e.date)}</p></div>
                <p className="font-bold text-red-500 shrink-0">-{formatPrice(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
