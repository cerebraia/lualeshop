'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
  DollarSign, Plus, Search, RefreshCw, X, ChevronDown, ChevronUp,
  CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { receivablesRepo, payablesRepo } from '@/lib/repos';
import type {
  Receivable, ReceivableStatus, ReceivablePayment,
  Payable, PayableStatus, PayablePayment,
  PaymentMethod,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

// ── Currency formatter ────────────────────────────────────────────────────────
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const fmt = (n: number) => eur.format(n);

// ── Status helpers ────────────────────────────────────────────────────────────
type AnyStatus = ReceivableStatus | PayableStatus;

const STATUS_LABEL: Record<AnyStatus, string> = {
  pending: 'Pendiente', partial: 'Pago parcial', paid: 'Pagado',
  overdue: 'Vencido', cancelled: 'Cancelado',
};
const STATUS_COLOR: Record<AnyStatus, string> = {
  pending:   'bg-amber-100 text-amber-700',
  partial:   'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};
const STATUS_ICON: Record<AnyStatus, React.ReactNode> = {
  pending:   <Clock size={11} />,
  partial:   <TrendingUp size={11} />,
  paid:      <CheckCircle size={11} />,
  overdue:   <AlertTriangle size={11} />,
  cancelled: <XCircle size={11} />,
};

function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
      {STATUS_ICON[status]}
      {STATUS_LABEL[status]}
    </span>
  );
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'mobile_payment', label: 'Pago móvil' },
  { value: 'other', label: 'Otro' },
];

// ── Summary card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon, color, urgent }: {
  label: string; value: number; icon: React.ReactNode; color: string; urgent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-sm border ${urgent && value > 0 ? 'border-red-200' : 'border-rose/10'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className={`text-2xl font-extrabold ${urgent && value > 0 ? 'text-red-600' : 'text-brown'}`}>
        {fmt(value)}
      </p>
      <p className="text-xs text-brown-light mt-0.5">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIVABLES TAB
// ─────────────────────────────────────────────────────────────────────────────

function ReceivablesTab() {
  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReceivableStatus | ''>('');
  const [sortCol, setSortCol] = useState<'dueDate' | 'balance' | 'customer' | 'total'>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Receivable | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState<ReceivablePayment | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'transfer' as PaymentMethod, date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [dueDate, setDueDate] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await receivablesRepo.findAll()); }
    catch { setError('No se pudo cargar las cuentas por cobrar.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items
    .filter((r) => {
      if (search && !r.customerName.toLowerCase().includes(search.toLowerCase()) &&
          !r.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'dueDate') cmp = (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1;
      if (sortCol === 'balance') cmp = a.balance - b.balance;
      if (sortCol === 'customer') cmp = a.customerName.localeCompare(b.customerName);
      if (sortCol === 'total') cmp = a.total - b.total;
      return sortAsc ? cmp : -cmp;
    });

  function sortBy(col: typeof sortCol) {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(true); }
  }

  function sortIcon(col: typeof sortCol) {
    return sortCol === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;
  }

  async function handlePay() {
    if (!selected) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await receivablesRepo.registerPayment(
        selected.orderId, amount, payForm.method,
        payForm.date, payForm.reference || undefined, payForm.notes || undefined
      );
      setShowPayModal(false);
      setPayForm({ amount: '', method: 'transfer', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar pago.');
    } finally { setSaving(false); }
  }

  async function handleSetDue() {
    if (!selected) return;
    setSaving(true);
    try {
      await receivablesRepo.setDueDate(selected.orderId, dueDate || null);
      setShowDueModal(false);
      await load();
    } catch { setError('Error al actualizar vencimiento.'); }
    finally { setSaving(false); }
  }

  async function handleVoid() {
    if (!showVoidModal || !voidReason.trim()) return;
    setSaving(true);
    try {
      await receivablesRepo.voidPayment(showVoidModal.id, voidReason);
      setShowVoidModal(null); setVoidReason('');
      await load();
    } catch { setError('Error al anular pago.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={load} className="flex items-center gap-2 text-sm text-rose font-semibold"><RefreshCw size={14} />Reintentar</button>
    </div>
  );

  const totalReceivable = items.filter((r) => r.balance > 0).reduce((s, r) => s + r.balance, 0);
  const overdueReceivable = items.filter((r) => r.status === 'overdue').reduce((s, r) => s + r.balance, 0);
  const today = new Date();
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
  const dueIn7 = items.filter((r) => r.dueDate && new Date(r.dueDate) >= today && new Date(r.dueDate) <= in7 && r.balance > 0).reduce((s, r) => s + r.balance, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total por cobrar" value={totalReceivable} icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-50" />
        <MetricCard label="Vencido" value={overdueReceivable} icon={<AlertTriangle size={18} className="text-red-500" />} color="bg-red-50" urgent />
        <MetricCard label="Vence en 7 días" value={dueIn7} icon={<Calendar size={18} className="text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o pedido…"
            className="w-full pl-9 pr-3 py-2.5 border border-rose/30 rounded-2xl text-sm text-brown focus:outline-none focus:border-rose bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ReceivableStatus | '')}
          className="border border-rose/30 rounded-2xl px-4 py-2.5 text-sm text-brown bg-white focus:outline-none focus:border-rose">
          <option value="">Todos los estados</option>
          {(['pending','partial','overdue','paid','cancelled'] as ReceivableStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brown-light text-sm">Sin cuentas por cobrar{filterStatus || search ? ' con esos filtros' : ''}</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-rose/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {[['customer','Cliente'],['total','Total'],['balance','Pendiente'],['dueDate','Vencimiento']].map(([col, label]) => (
                    <th key={col} onClick={() => sortBy(col as typeof sortCol)}
                      className="text-left px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide cursor-pointer select-none hover:text-brown">
                      <span className="flex items-center gap-1">{label}{sortIcon(col as typeof sortCol)}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <>
                    <tr key={r.orderId} className="border-b border-cream/60 hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => setExpanded((e) => e === r.orderId ? null : r.orderId)} className="text-left">
                          <p className="font-semibold text-brown">{r.customerName}</p>
                          <p className="text-xs text-brown-light">Pedido #{r.orderNumber.slice(-6)}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-brown">{fmt(r.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${r.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(r.balance)}</span>
                        {r.paidAmount > 0 && <p className="text-xs text-brown-light">Pagado: {fmt(r.paidAmount)}</p>}
                      </td>
                      <td className="px-4 py-3 text-brown-light text-xs">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {r.balance > 0 && r.status !== 'cancelled' && (
                            <button onClick={() => { setSelected(r); setPayForm((f) => ({ ...f, amount: String(r.balance) })); setShowPayModal(true); }}
                              className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                              Cobrar
                            </button>
                          )}
                          <button onClick={() => { setSelected(r); setDueDate(r.dueDate ?? ''); setShowDueModal(true); }}
                            className="text-xs border border-rose/30 text-brown px-2.5 py-1 rounded-xl font-semibold hover:border-rose hover:text-rose transition-colors">
                            Venc.
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === r.orderId && (
                      <tr key={`${r.orderId}-detail`}>
                        <td colSpan={6} className="px-4 pb-4 bg-cream/30">
                          <p className="text-xs font-bold text-brown-light uppercase tracking-wide mb-2 pt-2">Historial de pagos</p>
                          {r.payments.length === 0 ? (
                            <p className="text-xs text-brown-light">Sin pagos registrados</p>
                          ) : (
                            <div className="space-y-1.5">
                              {r.payments.map((p) => (
                                <div key={p.id} className={`flex items-center justify-between gap-3 text-xs p-2 rounded-xl ${p.voidedAt ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                                  <div className="flex-1">
                                    <span className="font-semibold text-brown">{fmt(p.amount)}</span>
                                    <span className="text-brown-light ml-2">{formatDate(p.date)}</span>
                                    {p.reference && <span className="text-brown-light ml-2">· {p.reference}</span>}
                                    {p.voidedAt && <span className="ml-2 text-red-500">(Anulado: {p.voidReason})</span>}
                                  </div>
                                  {!p.voidedAt && (
                                    <button onClick={() => { setShowVoidModal(p); setVoidReason(''); }}
                                      className="text-red-500 hover:underline shrink-0">Anular</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title={`Registrar cobro — ${selected?.customerName}`} size="sm">
        <div className="space-y-3">
          <p className="text-xs text-brown-light">Saldo pendiente: <strong className="text-brown">{fmt(selected?.balance ?? 0)}</strong></p>
          <Input label="Monto (€) *" type="number" min="0.01" step="0.01" max={selected?.balance} value={payForm.amount}
            onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
          <Select label="Método de pago *" value={payForm.method}
            onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
            options={PAYMENT_METHOD_OPTIONS} />
          <Input label="Fecha *" type="date" value={payForm.date}
            onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Referencia" value={payForm.reference}
            onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} />
          <Input label="Observaciones" value={payForm.notes}
            onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowPayModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handlePay} loading={saving} disabled={!payForm.amount || Number(payForm.amount) <= 0} fullWidth>
              Registrar cobro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Due date modal */}
      <Modal open={showDueModal} onClose={() => setShowDueModal(false)} title="Fecha de vencimiento" size="sm">
        <div className="space-y-3">
          <Input label="Fecha de vencimiento" type="date" value={dueDate}
            onChange={(e) => setDueDate(e.target.value)} />
          {dueDate && <button onClick={() => setDueDate('')} className="text-xs text-rose hover:underline flex items-center gap-1"><X size={12} />Quitar fecha</button>}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowDueModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleSetDue} loading={saving} fullWidth>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Void payment modal */}
      <Modal open={!!showVoidModal} onClose={() => setShowVoidModal(null)} title="Anular pago" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-brown-light">Indica el motivo de la anulación. Esta acción no se puede deshacer.</p>
          {showVoidModal && <p className="text-sm font-semibold text-brown">Pago de {fmt(showVoidModal.amount)} del {formatDate(showVoidModal.date)}</p>}
          <Textarea label="Motivo *" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowVoidModal(null)} fullWidth>Cancelar</Button>
            <Button variant="danger" onClick={handleVoid} loading={saving} disabled={!voidReason.trim()} fullWidth>Anular pago</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYABLES TAB
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  creditorName: '', description: '', originalAmount: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '', notes: '',
};

function PayablesTab() {
  const [items, setItems] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PayableStatus | ''>('');
  const [sortCol, setSortCol] = useState<'dueDate' | 'balance' | 'creditor'>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState<Payable | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState<PayablePayment | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'transfer' as PaymentMethod, date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await payablesRepo.findAll()); }
    catch { setError('No se pudo cargar las cuentas por pagar.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items
    .filter((p) => {
      if (search && !p.creditorName.toLowerCase().includes(search.toLowerCase()) &&
          !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'dueDate') cmp = (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1;
      if (sortCol === 'balance') cmp = a.balance - b.balance;
      if (sortCol === 'creditor') cmp = a.creditorName.localeCompare(b.creditorName);
      return sortAsc ? cmp : -cmp;
    });

  function sortBy(col: typeof sortCol) {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(true); }
  }

  function sortIcon(col: typeof sortCol) {
    return sortCol === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;
  }

  async function handleCreate() {
    const amount = parseFloat(createForm.originalAmount);
    if (!createForm.creditorName.trim() || !amount || amount <= 0) return;
    setSaving(true);
    try {
      await payablesRepo.create({
        creditorName:   createForm.creditorName.trim(),
        description:    createForm.description.trim(),
        originalAmount: amount,
        issueDate:      createForm.issueDate,
        dueDate:        createForm.dueDate || undefined,
        notes:          createForm.notes || undefined,
      });
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear deuda.');
    } finally { setSaving(false); }
  }

  async function handlePay() {
    if (!selected) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await payablesRepo.registerPayment(
        selected.id, amount, payForm.method,
        payForm.date, payForm.reference || undefined, payForm.notes || undefined
      );
      setShowPayModal(false);
      setPayForm({ amount: '', method: 'transfer', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar pago.');
    } finally { setSaving(false); }
  }

  async function handleCancel() {
    if (!selected) return;
    setSaving(true);
    try {
      await payablesRepo.cancel(selected.id, cancelReason || undefined);
      setShowCancelModal(false); setCancelReason('');
      await load();
    } catch { setError('Error al cancelar deuda.'); }
    finally { setSaving(false); }
  }

  async function handleVoid() {
    if (!showVoidModal || !voidReason.trim()) return;
    setSaving(true);
    try {
      await payablesRepo.voidPayment(showVoidModal.id, voidReason);
      setShowVoidModal(null); setVoidReason('');
      await load();
    } catch { setError('Error al anular pago.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={load} className="flex items-center gap-2 text-sm text-rose font-semibold"><RefreshCw size={14} />Reintentar</button>
    </div>
  );

  const totalPayable = items.filter((p) => p.balance > 0 && p.status !== 'cancelled').reduce((s, p) => s + p.balance, 0);
  const overduePayable = items.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.balance, 0);
  const today = new Date();
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
  const dueIn7 = items.filter((p) => p.dueDate && new Date(p.dueDate) >= today && new Date(p.dueDate) <= in7 && p.balance > 0).reduce((s, p) => s + p.balance, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total por pagar" value={totalPayable} icon={<TrendingDown size={18} className="text-red-500" />} color="bg-red-50" />
        <MetricCard label="Vencido" value={overduePayable} icon={<AlertTriangle size={18} className="text-red-500" />} color="bg-red-50" urgent />
        <MetricCard label="Vence en 7 días" value={dueIn7} icon={<Calendar size={18} className="text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar acreedor o concepto…"
            className="w-full pl-9 pr-3 py-2.5 border border-rose/30 rounded-2xl text-sm text-brown focus:outline-none focus:border-rose bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as PayableStatus | '')}
          className="border border-rose/30 rounded-2xl px-4 py-2.5 text-sm text-brown bg-white focus:outline-none focus:border-rose">
          <option value="">Todos los estados</option>
          {(['pending','partial','overdue','paid','cancelled'] as PayableStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus size={15} /> Nueva deuda
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brown-light text-sm">
          {filterStatus || search ? 'Sin deudas con esos filtros' : 'No hay deudas registradas'}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-rose/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream">
                  <th onClick={() => sortBy('creditor')} className="text-left px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide cursor-pointer hover:text-brown">
                    <span className="flex items-center gap-1">Acreedor{sortIcon("creditor")}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide">Total</th>
                  <th onClick={() => sortBy('balance')} className="text-left px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide cursor-pointer hover:text-brown">
                    <span className="flex items-center gap-1">Pendiente{sortIcon("balance")}</span>
                  </th>
                  <th onClick={() => sortBy('dueDate')} className="text-left px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide cursor-pointer hover:text-brown">
                    <span className="flex items-center gap-1">Vencimiento{sortIcon("dueDate")}</span>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-bold text-brown-light uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <>
                    <tr key={p.id} className="border-b border-cream/60 hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => setExpanded((e) => e === p.id ? null : p.id)} className="text-left">
                          <p className="font-semibold text-brown">{p.creditorName}</p>
                          <p className="text-xs text-brown-light truncate max-w-[200px]">{p.description}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-brown">{fmt(p.originalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${p.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(p.balance)}</span>
                        {p.paidAmount > 0 && <p className="text-xs text-brown-light">Pagado: {fmt(p.paidAmount)}</p>}
                      </td>
                      <td className="px-4 py-3 text-brown-light text-xs">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {p.balance > 0 && p.status !== 'cancelled' && (
                            <button onClick={() => { setSelected(p); setPayForm((f) => ({ ...f, amount: String(p.balance) })); setShowPayModal(true); }}
                              className="text-xs bg-rose text-white px-2.5 py-1 rounded-xl font-semibold hover:bg-rose-dark transition-colors">
                              Pagar
                            </button>
                          )}
                          {p.status !== 'cancelled' && p.status !== 'paid' && (
                            <button onClick={() => { setSelected(p); setCancelReason(''); setShowCancelModal(true); }}
                              className="text-xs border border-rose/30 text-brown px-2.5 py-1 rounded-xl font-semibold hover:border-red-300 hover:text-red-600 transition-colors">
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={6} className="px-4 pb-4 bg-cream/30">
                          <p className="text-xs font-bold text-brown-light uppercase tracking-wide mb-2 pt-2">Historial de pagos</p>
                          {p.payments.length === 0 ? (
                            <p className="text-xs text-brown-light">Sin pagos registrados</p>
                          ) : (
                            <div className="space-y-1.5">
                              {p.payments.map((pay) => (
                                <div key={pay.id} className={`flex items-center justify-between gap-3 text-xs p-2 rounded-xl ${pay.voidedAt ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                                  <div className="flex-1">
                                    <span className="font-semibold text-brown">{fmt(pay.amount)}</span>
                                    <span className="text-brown-light ml-2">{formatDate(pay.paymentDate)}</span>
                                    {pay.reference && <span className="text-brown-light ml-2">· {pay.reference}</span>}
                                    {pay.expenseId && <span className="text-brown-light ml-2">· Gasto registrado</span>}
                                    {pay.voidedAt && <span className="ml-2 text-red-500">(Anulado: {pay.voidReason})</span>}
                                  </div>
                                  {!pay.voidedAt && (
                                    <button onClick={() => { setShowVoidModal(pay); setVoidReason(''); }}
                                      className="text-red-500 hover:underline shrink-0">Anular</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {p.notes && <p className="text-xs text-brown-light mt-2"><strong>Nota:</strong> {p.notes}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create payable modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva cuenta por pagar" size="sm">
        <div className="space-y-3">
          <Input label="Acreedor *" placeholder="Proveedor, servicio, persona…" value={createForm.creditorName}
            onChange={(e) => setCreateForm((f) => ({ ...f, creditorName: e.target.value }))} />
          <Input label="Concepto *" value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Monto total (€) *" type="number" min="0.01" step="0.01" value={createForm.originalAmount}
            onChange={(e) => setCreateForm((f) => ({ ...f, originalAmount: e.target.value }))} />
          <Input label="Fecha de emisión *" type="date" value={createForm.issueDate}
            onChange={(e) => setCreateForm((f) => ({ ...f, issueDate: e.target.value }))} />
          <Input label="Fecha de vencimiento" type="date" value={createForm.dueDate}
            onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <Textarea label="Notas" value={createForm.notes}
            onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleCreate} loading={saving}
              disabled={!createForm.creditorName.trim() || !createForm.originalAmount} fullWidth>
              Crear deuda
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pay payable modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title={`Pagar — ${selected?.creditorName}`} size="sm">
        <div className="space-y-3">
          <p className="text-xs text-brown-light">Saldo pendiente: <strong className="text-brown">{fmt(selected?.balance ?? 0)}</strong></p>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">Se creará automáticamente un gasto por este monto.</p>
          <Input label="Monto (€) *" type="number" min="0.01" step="0.01" max={selected?.balance} value={payForm.amount}
            onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
          <Select label="Método de pago *" value={payForm.method}
            onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
            options={PAYMENT_METHOD_OPTIONS} />
          <Input label="Fecha *" type="date" value={payForm.date}
            onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Referencia" value={payForm.reference}
            onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} />
          <Input label="Observaciones" value={payForm.notes}
            onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowPayModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handlePay} loading={saving} disabled={!payForm.amount || Number(payForm.amount) <= 0} fullWidth>
              Registrar pago
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel payable modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar deuda" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-brown-light">Esta acción cancela la deuda sin eliminar el historial. No se puede deshacer.</p>
          {selected && <p className="text-sm font-semibold text-brown">{selected.creditorName} — {fmt(selected.balance)} pendiente</p>}
          <Textarea label="Motivo (opcional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)} fullWidth>Volver</Button>
            <Button variant="danger" onClick={handleCancel} loading={saving} fullWidth>Cancelar deuda</Button>
          </div>
        </div>
      </Modal>

      {/* Void payment modal */}
      <Modal open={!!showVoidModal} onClose={() => setShowVoidModal(null)} title="Anular pago" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-brown-light">El gasto vinculado también se archivará. Esta acción no se puede deshacer.</p>
          {showVoidModal && <p className="text-sm font-semibold text-brown">Pago de {fmt(showVoidModal.amount)}</p>}
          <Textarea label="Motivo *" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowVoidModal(null)} fullWidth>Cancelar</Button>
            <Button variant="danger" onClick={handleVoid} loading={saving} disabled={!voidReason.trim()} fullWidth>Anular pago</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DeudasPage() {
  const [tab, setTab] = useState<'cobrar' | 'pagar'>('cobrar');
  const [summary, setSummary] = useState({
    totalReceivable: 0, overdueReceivable: 0,
    totalPayable: 0, overduePayable: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([
          receivablesRepo.getSummary(),
          payablesRepo.getSummary(),
        ]);
        setSummary({
          totalReceivable: r.totalReceivable,
          overdueReceivable: r.overdueReceivable,
          totalPayable: p.totalPayable,
          overduePayable: p.overduePayable,
        });
      } catch { /* summary is non-critical */ }
    })();
  }, [tab]);

  const netPosition = summary.totalReceivable - summary.totalPayable;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brown">Deudas</h1>
        <p className="text-brown-light text-sm">Cuentas por cobrar y por pagar</p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Por cobrar" value={summary.totalReceivable} icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-50" />
        <MetricCard label="Por pagar" value={summary.totalPayable} icon={<TrendingDown size={18} className="text-red-500" />} color="bg-red-50" />
        <div className={`rounded-3xl p-5 shadow-sm border ${netPosition >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${netPosition >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <DollarSign size={18} className={netPosition >= 0 ? 'text-green-600' : 'text-red-500'} />
          </div>
          <p className={`text-2xl font-extrabold ${netPosition >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(netPosition)}</p>
          <p className="text-xs text-brown-light mt-0.5">Posición neta</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-2xl p-1 mb-6 w-fit">
        {(['cobrar', 'pagar'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-white text-brown shadow-sm' : 'text-brown-light hover:text-brown'}`}>
            Por {t}
          </button>
        ))}
      </div>

      {tab === 'cobrar' ? <ReceivablesTab /> : <PayablesTab />}
    </div>
  );
}
