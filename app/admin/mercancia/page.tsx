'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { inventoryRepo, productRepo } from '@/lib/repos';
import type { MerchandiseEntry, MerchandiseEntryItem, Product } from '@/lib/types';
import { formatPrice, formatDate, generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function MercanciaPage() {
  const [entries, setEntries] = useState<MerchandiseEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [supplier, setSupplier] = useState('');
  const [additionalCosts, setAdditionalCosts] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<(MerchandiseEntryItem & { tempId: string })[]>([]);

  async function load() {
    try {
      const [ents, prods] = await Promise.all([
        inventoryRepo.findAllEntries(),
        productRepo.findAll(),
      ]);
      setEntries(ents);
      setProducts(prods);
    } catch {
      setError('Error al cargar datos.');
    }
  }

  useEffect(() => { load(); }, []);

  function openModal() {
    setDate(new Date().toISOString().split('T')[0]);
    setReference(`ENT-${Date.now()}`);
    setSupplier('');
    setAdditionalCosts('0');
    setNotes('');
    setItems([{ tempId: generateId('item'), productId: '', variantId: '', quantity: 1, unitCost: 0 }]);
    setModal(true);
  }

  function addItem() {
    setItems((prev) => [...prev, { tempId: generateId('item'), productId: '', variantId: '', quantity: 1, unitCost: 0 }]);
  }

  function removeItem(tempId: string) {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  function updateItem(tempId: string, field: string, value: string | number) {
    setItems((prev) => prev.map((i) => {
      if (i.tempId !== tempId) return i;
      if (field === 'productId') return { ...i, productId: String(value), variantId: '' };
      return { ...i, [field]: value };
    }));
  }

  const itemTotal = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  const totalCost = itemTotal + Number(additionalCosts);

  async function handleSave() {
    if (!reference.trim() || items.some((i) => !i.productId || !i.variantId)) return;
    setSaving(true);

    const entry: MerchandiseEntry = {
      id: generateId('ent'),
      date,
      reference: reference.trim(),
      supplier: supplier.trim() || undefined,
      items: items.map(({ tempId: _tempId, ...rest }) => rest),
      additionalCosts: Number(additionalCosts),
      totalCost,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await inventoryRepo.createEntry(entry);

      await Promise.all(items.map(async (item) => {
        const product = await productRepo.findById(item.productId);
        if (!product) return;
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) return;
        const newStock = variant.stock + item.quantity;
        const newStatus: Product['status'] =
          newStock === 0 ? 'out_of_stock' : newStock <= 2 ? 'low_stock' : 'available';
        await productRepo.update({
          ...product,
          variants: product.variants.map((v) =>
            v.id === item.variantId ? { ...v, stock: newStock } : v
          ),
          status: newStatus,
          cost: item.unitCost || product.cost,
        });

        await inventoryRepo.createMovement({
          id: generateId('mov'),
          productId: item.productId,
          variantId: item.variantId,
          type: 'entry',
          quantity: item.quantity,
          reason: `Entrada de mercancía — ${reference}`,
          reference,
          date,
          createdAt: new Date().toISOString(),
        });
      }));

      await load();
      setModal(false);
    } catch {
      setError('Error al guardar entrada.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Entrada de mercancía</h1>
          <p className="text-brown-light text-sm">{entries.length} entradas registradas</p>
        </div>
        <Button onClick={openModal} size="sm"><Plus size={16} /> Nueva entrada</Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-brown-light">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-brown">Sin entradas registradas</p>
          <p className="text-sm mt-1">Registra la primera entrada de mercancía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl p-5 shadow-sm border border-rose/10">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-brown">{entry.reference}</p>
                  <p className="text-xs text-brown-light">{formatDate(entry.date)}</p>
                  {entry.supplier && <p className="text-xs text-brown-light">Proveedor: {entry.supplier}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-brown text-lg">{formatPrice(entry.totalCost)}</p>
                  <p className="text-xs text-brown-light">{entry.items.length} referencias</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.items.map((item, i) => {
                  const product = products.find((p) => p.id === item.productId);
                  const variant = product?.variants.find((v) => v.id === item.variantId);
                  return (
                    <span key={i} className="text-xs bg-cream text-brown px-2.5 py-1 rounded-xl">
                      {product?.name ?? '—'} {variant?.size ?? ''} × {item.quantity}
                    </span>
                  );
                })}
              </div>
              {entry.notes && <p className="text-xs text-brown-light mt-2 italic">{entry.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva entrada de mercancía" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Referencia" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <Input label="Proveedor (opcional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-brown">Productos</p>
              <button onClick={addItem} className="text-xs text-rose font-semibold hover:underline">+ Agregar</button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.tempId} className="grid grid-cols-4 gap-2 items-start">
                    <div className="col-span-2">
                      <Select
                        value={item.productId}
                        onChange={(e) => updateItem(item.tempId, 'productId', e.target.value)}
                        options={[{ value: '', label: 'Seleccionar...' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
                      />
                      {product && (
                        <Select
                          value={item.variantId}
                          onChange={(e) => updateItem(item.tempId, 'variantId', e.target.value)}
                          options={[{ value: '', label: 'Talla...' }, ...product.variants.map((v) => ({ value: v.id, label: `${v.size}${v.color ? ` · ${v.color}` : ''}` }))]}
                          className="mt-1"
                        />
                      )}
                    </div>
                    <Input placeholder="Cant." type="number" min="1" value={String(item.quantity)} onChange={(e) => updateItem(item.tempId, 'quantity', Number(e.target.value))} />
                    <div className="flex gap-1">
                      <Input placeholder="€ Costo" type="number" min="0" step="0.01" value={String(item.unitCost)} onChange={(e) => updateItem(item.tempId, 'unitCost', Number(e.target.value))} />
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.tempId)} className="text-red-400 px-1"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Input label="Gastos adicionales (€)" type="number" min="0" step="0.01" value={additionalCosts} onChange={(e) => setAdditionalCosts(e.target.value)} hint="Transporte, comisiones, etc." />
          <Textarea label="Observaciones" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="bg-cream rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-brown">Costo total</span>
            <span className="text-xl font-extrabold text-brown">{formatPrice(totalCost)}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!reference.trim() || items.some((i) => !i.productId || !i.variantId)} fullWidth>
              Confirmar entrada
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
