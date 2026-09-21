'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { orderRepository } from '@/lib/repositories/orderRepository';
import { customerRepository } from '@/lib/repositories/customerRepository';
import { productRepository } from '@/lib/repositories/productRepository';
import type { Order, Customer, Product, OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from '@/lib/types';
import { formatPrice, formatDate, generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'prepared', label: 'Preparado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Pago parcial' },
  { value: 'paid', label: 'Pagado' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'mobile_payment', label: 'Pago móvil' },
  { value: 'other', label: 'Otro' },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-yellow-100 text-yellow-700',
  prepared: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Nuevo',
  confirmed: 'Confirmado',
  prepared: 'Preparado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAY_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
};

const PAY_STATUS_COLOR: Record<PaymentStatus, string> = {
  pending: 'text-red-500',
  partial: 'text-yellow-600',
  paid: 'text-green-600',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [_customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<OrderStatus>('new');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<(OrderItem & { tempId: string })[]>([]);

  function load() {
    setOrders(orderRepository.findAll());
    setCustomers(customerRepository.findAll());
    setProducts(productRepository.findVisible());
  }

  useEffect(load, []);

  const filtered = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setCustomerId('');
    setCustomerName('');
    setStatus('new');
    setPaymentStatus('pending');
    setPaymentMethod('transfer');
    setNotes('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setItems([{ tempId: generateId('item'), productId: '', variantId: '', productName: '', variantLabel: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  }

  function openCreate() {
    resetForm();
    setEditingId(null);
    setModal('create');
  }

  function openEdit(order: Order) {
    setCustomerId(order.customerId);
    setCustomerName(order.customerName);
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setPaymentMethod(order.paymentMethod);
    setNotes(order.notes ?? '');
    setOrderDate(order.date.split('T')[0]);
    setItems(order.items.map((i) => ({ ...i, tempId: generateId('item') })));
    setEditingId(order.id);
    setModal('edit');
  }

  function addItem() {
    setItems((prev) => [...prev, { tempId: generateId('item'), productId: '', variantId: '', productName: '', variantLabel: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  }

  function updateItem(tempId: string, field: string, value: string | number) {
    setItems((prev) => prev.map((item) => {
      if (item.tempId !== tempId) return item;
      if (field === 'productId') {
        const p = products.find((pr) => pr.id === value);
        return { ...item, productId: String(value), variantId: '', productName: p?.name ?? '', variantLabel: '', unitPrice: p?.price ?? 0, totalPrice: (p?.price ?? 0) * item.quantity };
      }
      if (field === 'variantId') {
        const p = products.find((pr) => pr.id === item.productId);
        const v = p?.variants.find((va) => va.id === value);
        return { ...item, variantId: String(value), variantLabel: v ? `${v.size}${v.color ? ` — ${v.color}` : ''}` : '' };
      }
      if (field === 'quantity') {
        const qty = Number(value);
        return { ...item, quantity: qty, totalPrice: qty * item.unitPrice };
      }
      if (field === 'unitPrice') {
        const price = Number(value);
        return { ...item, unitPrice: price, totalPrice: price * item.quantity };
      }
      return { ...item, [field]: value };
    }));
  }

  const orderTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  function handleSave() {
    if (!customerName.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();

    setTimeout(() => {
      if (modal === 'create') {
        const order: Order = {
          id: generateId('ord'),
          customerId,
          customerName: customerName.trim(),
          items: items.map(({ tempId: _tempId, ...rest }) => rest),
          total: orderTotal,
          paymentMethod,
          status,
          paymentStatus,
          notes: notes.trim() || undefined,
          date: orderDate,
          createdAt: now,
        };
        orderRepository.create(order);
      } else if (editingId) {
        const existing = orderRepository.findById(editingId);
        if (existing) {
          orderRepository.update({
            ...existing,
            customerId,
            customerName: customerName.trim(),
            items: items.map(({ tempId: _tempId, ...rest }) => rest),
            total: orderTotal,
            paymentMethod,
            status,
            paymentStatus,
            notes: notes.trim() || undefined,
            date: orderDate,
          });
        }
      }
      load();
      setModal(null);
      setSaving(false);
    }, 300);
  }

  function handleDelete() {
    if (!deleteId) return;
    orderRepository.delete(deleteId);
    setDeleteId(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Pedidos</h1>
          <p className="text-brown-light text-sm">{orders.length} pedidos registrados</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Nuevo pedido</Button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente o ID..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose/30 rounded-2xl text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose" />
      </div>

      <div className="space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-bold text-brown">{order.customerName}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  <span className={`text-xs font-semibold ${PAY_STATUS_COLOR[order.paymentStatus]}`}>
                    {PAY_STATUS_LABEL[order.paymentStatus]}
                  </span>
                </div>
                <p className="text-xs text-brown-light">{formatDate(order.date)} · {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-brown">{formatPrice(order.total)}</p>
                <div className="flex gap-1 mt-1 justify-end">
                  <button onClick={() => openEdit(order)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light hover:text-rose"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteId(order.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-brown-light hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-brown-light">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold text-brown">Sin pedidos</p>
            <p className="text-sm mt-1">Registra el primer pedido confirmado por WhatsApp</p>
          </div>
        )}
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo pedido' : 'Editar pedido'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del cliente *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input label="Fecha" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} options={ORDER_STATUS_OPTIONS} />
            <Select label="Pago" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} options={PAYMENT_STATUS_OPTIONS} />
            <Select label="Método de pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-brown">Productos</p>
              <button onClick={addItem} className="text-xs text-rose font-semibold hover:underline">+ Agregar</button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.map((item) => {
                const p = products.find((pr) => pr.id === item.productId);
                return (
                  <div key={item.tempId} className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Select value={item.productId} onChange={(e) => updateItem(item.tempId, 'productId', e.target.value)} options={[{ value: '', label: 'Seleccionar...' }, ...products.map((pr) => ({ value: pr.id, label: pr.name }))]} />
                      {p && (
                        <Select value={item.variantId} onChange={(e) => updateItem(item.tempId, 'variantId', e.target.value)} options={[{ value: '', label: 'Talla...' }, ...p.variants.map((v) => ({ value: v.id, label: `${v.size}${v.color ? ` · ${v.color}` : ''}` }))]} className="mt-1" />
                      )}
                    </div>
                    <Input placeholder="Cant." type="number" min="1" value={String(item.quantity)} onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)} />
                    <div className="flex gap-1">
                      <Input placeholder="$ Precio" type="number" min="0" step="0.01" value={String(item.unitPrice)} onChange={(e) => updateItem(item.tempId, 'unitPrice', e.target.value)} />
                      {items.length > 1 && (
                        <button onClick={() => setItems((prev) => prev.filter((i) => i.tempId !== item.tempId))} className="text-red-400 px-1"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-cream rounded-2xl px-4 py-3 flex justify-between">
            <span className="font-semibold text-brown text-sm">Total del pedido</span>
            <span className="font-extrabold text-brown text-xl">{formatPrice(orderTotal)}</span>
          </div>

          <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!customerName.trim()} fullWidth>
              {modal === 'create' ? 'Crear pedido' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar pedido" size="sm">
        <p className="text-sm text-brown-light mb-5">¿Confirmas eliminar este pedido?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
