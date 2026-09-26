'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { productRepo, inventoryRepo } from '@/lib/repos';
import type { Product, InventoryMovement } from '@/lib/types';
import { formatDate, generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [type, setType] = useState<'entry' | 'exit' | 'adjustment'>('entry');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [prods, movs] = await Promise.all([
        productRepo.findAll(),
        inventoryRepo.findAllMovements(),
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch {
      setError('Error al cargar datos.');
    }
  }

  useEffect(() => { load(); }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  const lowStock = products.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock');

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdjust() {
    if (!selectedProductId || !selectedVariantId || !reason.trim()) return;
    setSaving(true);
    const movement: InventoryMovement = {
      id: generateId('mov'),
      productId: selectedProductId,
      variantId: selectedVariantId,
      type,
      quantity: type === 'exit' ? -Math.abs(Number(qty)) : Math.abs(Number(qty)),
      reason: reason.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      await inventoryRepo.createMovement(movement);

      const product = await productRepo.findById(selectedProductId);
      if (product) {
        const variant = product.variants.find((v) => v.id === selectedVariantId);
        if (variant) {
          const delta = type === 'exit' ? -Number(qty) : Number(qty);
          const newStock = Math.max(0, variant.stock + delta);
          const newStatus: Product['status'] =
            newStock === 0 ? 'out_of_stock' : newStock <= 2 ? 'low_stock' : 'available';
          await productRepo.update({
            ...product,
            variants: product.variants.map((v) =>
              v.id === selectedVariantId ? { ...v, stock: newStock } : v
            ),
            status: newStatus,
          });
        }
      }

      await load();
      setModal(false);
      setSelectedProductId('');
      setSelectedVariantId('');
      setQty('1');
      setReason('');
    } catch {
      setError('Error al registrar ajuste.');
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
          <h1 className="text-2xl font-extrabold text-brown">Inventario</h1>
          <p className="text-brown-light text-sm">Stock por producto y variante</p>
        </div>
        <Button onClick={() => setModal(true)} size="sm"><Plus size={16} /> Ajuste manual</Button>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Productos con stock bajo</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              {lowStock.map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose/30 rounded-2xl text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose"
        />
      </div>

      {/* Products inventory table */}
      <div className="space-y-3 mb-10">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose/10">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-brown">{p.name}</p>
              <span className="font-mono text-xs text-brown-light">{p.sku}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <div
                  key={v.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    v.stock === 0
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : v.stock <= 2
                      ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                      : 'border-green-200 bg-green-50 text-green-700'
                  }`}
                >
                  {v.size}{v.color ? ` · ${v.color}` : ''} — {v.stock} uds
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Movement history */}
      <div>
        <h2 className="text-lg font-bold text-brown mb-4">Historial de movimientos</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-rose/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-xs text-brown-light font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Cantidad</th>
                  <th className="px-4 py-3 text-left">Razón</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const product = products.find((p) => p.id === m.productId);
                  const variant = product?.variants.find((v) => v.id === m.variantId);
                  return (
                    <tr key={m.id} className="border-t border-cream">
                      <td className="px-5 py-3 text-brown-light">{formatDate(m.date)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brown">{product?.name ?? m.productId}</p>
                        <p className="text-xs text-brown-light">{variant?.size}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.type === 'entry' ? 'bg-green-100 text-green-700' : m.type === 'exit' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-brown-light text-xs max-w-xs truncate">{m.reason}</td>
                    </tr>
                  );
                })}
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-brown-light text-sm">Sin movimientos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Adjustment modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajuste de inventario">
        <div className="space-y-4">
          <Select
            label="Producto"
            value={selectedProductId}
            onChange={(e) => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }}
            options={[{ value: '', label: 'Seleccionar producto...' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
          />
          {selectedProduct && (
            <Select
              label="Variante / Talla"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              options={[{ value: '', label: 'Seleccionar variante...' }, ...selectedProduct.variants.map((v) => ({ value: v.id, label: `${v.size}${v.color ? ` · ${v.color}` : ''} (stock: ${v.stock})` }))]}
            />
          )}
          {selectedVariant && (
            <p className="text-xs text-brown-light bg-cream rounded-xl px-3 py-2">
              Stock actual: <strong className="text-brown">{selectedVariant.stock} unidades</strong>
            </p>
          )}
          <Select
            label="Tipo de movimiento"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            options={[
              { value: 'entry', label: 'Entrada (+)' },
              { value: 'exit', label: 'Salida (-)' },
              { value: 'adjustment', label: 'Ajuste manual' },
            ]}
          />
          <Input label="Cantidad" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Textarea label="Razón / Observación" value={reason} onChange={(e) => setReason(e.target.value)} hint="Obligatorio" />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleAdjust} loading={saving} disabled={!selectedProductId || !selectedVariantId || !reason.trim()} fullWidth>
              Confirmar ajuste
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
