'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { listExpenses, createExpense, archiveExpense } from './actions';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/lib/types';
import { formatPrice, formatDate, generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'merchandise', label: 'Mercancía' },
  { value: 'advertising', label: 'Publicidad' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'packaging', label: 'Empaques' },
  { value: 'other', label: 'Otros' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'mobile_payment', label: 'Pago móvil' },
  { value: 'other', label: 'Otro' },
];

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  merchandise: 'Mercancía',
  advertising: 'Publicidad',
  delivery: 'Delivery',
  packaging: 'Empaques',
  other: 'Otros',
};

const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  merchandise: 'bg-blue-100 text-blue-700',
  advertising: 'bg-purple-100 text-purple-700',
  delivery: 'bg-orange-100 text-orange-700',
  packaging: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
};

/** Accept both "12.50" and "12,50" → number */
function parseAmount(raw: string): number | null {
  const normalized = raw.replace(',', '.');
  const n = parseFloat(normalized);
  if (isNaN(n) || n <= 0) return null;
  return n;
}

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-modal error and success — rendered INSIDE the modal so it's always visible
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  async function load(): Promise<void> {
    try {
      const data = await listExpenses();
      setExpenses(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar datos.';
      setLoadError(msg);
      // Re-throw so callers know load failed
      throw e;
    }
  }

  useEffect(() => {
    load().catch(() => { /* already handled via setLoadError */ });
  }, []);

  function openModal() {
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('other');
    setDescription('');
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
    setModalError(null);
    setModalSuccess(false);
    setModal(true);
  }

  function closeModal() {
    if (saving) return;
    setModal(false);
    setModalError(null);
    setModalSuccess(false);
  }

  const totalByCategory = CATEGORY_OPTIONS.reduce((acc, o) => {
    acc[o.value] = expenses.filter((e) => e.category === o.value).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const parsedAmount = parseAmount(amount);
  const canSave = !!description.trim() && parsedAmount !== null && !saving;

  async function handleSave() {
    if (!canSave) return;

    setModalError(null);
    setModalSuccess(false);

    if (!parsedAmount || parsedAmount <= 0) {
      setModalError('El monto debe ser mayor que cero.');
      return;
    }
    if (!description.trim()) {
      setModalError('La descripción es obligatoria.');
      return;
    }

    setSaving(true);
    const expense: Expense = {
      id:            generateId(),
      date,
      category,
      description:   description.trim(),
      amount:        parsedAmount,
      paymentMethod,
      notes:         notes.trim() || undefined,
      createdAt:     new Date().toISOString(),
    };

    try {
      await createExpense(expense);

      // Reload list — if this fails, still close modal but report the issue
      try {
        await load();
      } catch {
        // Insert succeeded; list reload failed (e.g. session issue). Show expense locally.
        setExpenses((prev) => [expense, ...prev]);
      }

      setModalSuccess(true);
      // Auto-close after showing success feedback
      setTimeout(() => {
        setModal(false);
        setModalError(null);
        setModalSuccess(false);
      }, 900);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar gasto.';
      // Show error INSIDE the modal (visible to user while modal is still open)
      setModalError(msg);
      if (process.env.NODE_ENV === 'development') {
        console.error('[GastosPage] handleSave error:', e);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await archiveExpense(deleteId);
      setDeleteId(null);
      await load().catch(() => {});
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error al eliminar gasto.');
    }
  }

  return (
    <div>
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-5 text-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Gastos</h1>
          <p className="text-brown-light text-sm">{expenses.length} registros</p>
        </div>
        <Button onClick={openModal} size="sm"><Plus size={16} /> Registrar gasto</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {CATEGORY_OPTIONS.map((o) => (
          <div key={o.value} className="bg-white rounded-2xl p-4 shadow-sm border border-rose/10 text-center">
            <p className="text-xs text-brown-light mb-1">{o.label}</p>
            <p className="font-bold text-brown">{formatPrice(totalByCategory[o.value])}</p>
          </div>
        ))}
      </div>

      <div className="bg-rose/10 rounded-2xl px-5 py-3 mb-6 flex justify-between items-center">
        <span className="font-semibold text-brown">Total de gastos</span>
        <span className="text-2xl font-extrabold text-brown">{formatPrice(totalExpenses)}</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {expenses.map((exp) => (
          <div key={exp.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-rose/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_COLOR[exp.category]}`}>
                {CATEGORY_LABEL[exp.category]}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-brown text-sm truncate">{exp.description}</p>
                <p className="text-xs text-brown-light">{formatDate(exp.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className="font-bold text-brown">{formatPrice(exp.amount)}</p>
              <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-brown-light hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && !loadError && (
          <div className="text-center py-12 text-brown-light">
            <p className="text-3xl mb-2">💰</p>
            <p className="font-semibold text-brown">Sin gastos registrados</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modal} onClose={closeModal} title="Registrar gasto">
        <div className="space-y-4">
          {/* Error inside modal — always visible while modal is open */}
          {modalError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm">
              <CheckCircle size={15} className="shrink-0" />
              <span>Gasto guardado correctamente.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div>
              <label className="block text-xs font-bold text-brown-light uppercase tracking-wide mb-1.5">
                Monto (€) *
              </label>
              {/* type="text" accepts both 12.50 and 12,50 */}
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setModalError(null); }}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-rose/20 rounded-2xl text-sm text-brown focus:outline-none focus:border-rose"
              />
              {amount && parsedAmount === null && (
                <p className="text-xs text-red-500 mt-1">Ingresa un monto válido mayor que cero</p>
              )}
            </div>
          </div>
          <Select
            label="Categoría *"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={CATEGORY_OPTIONS}
          />
          <Input
            label="Descripción *"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setModalError(null); }}
            placeholder="Ej. Compra de empaques, publicidad Meta…"
          />
          <Select
            label="Método de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHODS}
          />
          <Textarea
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={closeModal}
              disabled={saving}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!canSave}
              fullWidth
            >
              {saving ? 'Guardando…' : 'Registrar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar gasto" size="sm">
        <p className="text-sm text-brown-light mb-5">¿Eliminar este gasto? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
