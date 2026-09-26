'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { customerRepo, orderRepo } from '@/lib/repos';
import type { Customer, Order } from '@/lib/types';
import { generateId, formatDate, formatPrice } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  async function load() {
    try {
      const [custs, ords] = await Promise.all([
        customerRepo.findAll(),
        orderRepo.findAll(),
      ]);
      setCustomers(custs);
      setOrders(ords);
    } catch {
      setError('Error al cargar datos.');
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  function resetForm() {
    setName('');
    setPhone('');
    setCity('');
    setAddress('');
    setNotes('');
  }

  function openCreate() {
    resetForm();
    setEditingId(null);
    setModal('create');
  }

  function openEdit(c: Customer) {
    setName(c.name);
    setPhone(c.phone);
    setCity(c.city);
    setAddress(c.address ?? '');
    setNotes(c.notes ?? '');
    setEditingId(c.id);
    setModal('edit');
  }

  function openDetail(c: Customer) {
    setEditingId(c.id);
    setModal('detail');
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (modal === 'create') {
        const customer: Customer = {
          id: generateId('cust'),
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          orderIds: [],
          createdAt: new Date().toISOString(),
        };
        await customerRepo.create(customer);
      } else if (editingId) {
        const existing = await customerRepo.findById(editingId);
        if (existing) {
          await customerRepo.update({
            ...existing,
            name: name.trim(),
            phone: phone.trim(),
            city: city.trim(),
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      }
      await load();
      setModal(null);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await customerRepo.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError('Error al eliminar cliente.');
    }
  }

  const detailCustomer = editingId ? customers.find((c) => c.id === editingId) ?? null : null;
  const customerOrders = detailCustomer
    ? orders.filter((o) => o.customerId === detailCustomer.id)
    : [];

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Clientes</h1>
          <p className="text-brown-light text-sm">{customers.length} clientes registrados</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Nuevo cliente</Button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose/30 rounded-2xl text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const custOrders = orders.filter((o) => o.customerId === c.id);
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose/10">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="font-bold text-brown">{c.name}</p>
                  <p className="text-xs text-brown-light">{c.phone}</p>
                  <p className="text-xs text-brown-light">{c.city}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openDetail(c)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light text-xs font-semibold text-rose">
                    {custOrders.length} pedidos
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-brown-light">
          <p className="text-3xl mb-2">👤</p>
          <p className="font-semibold text-brown">Sin clientes</p>
        </div>
      )}

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!name.trim()} fullWidth>
              {modal === 'create' ? 'Crear cliente' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      {detailCustomer && (
        <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={detailCustomer.name} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-brown-light text-xs">Teléfono</p><p className="font-medium text-brown">{detailCustomer.phone}</p></div>
              <div><p className="text-brown-light text-xs">Ciudad</p><p className="font-medium text-brown">{detailCustomer.city}</p></div>
              {detailCustomer.address && <div className="col-span-2"><p className="text-brown-light text-xs">Dirección</p><p className="font-medium text-brown">{detailCustomer.address}</p></div>}
              {detailCustomer.notes && <div className="col-span-2"><p className="text-brown-light text-xs">Notas</p><p className="font-medium text-brown">{detailCustomer.notes}</p></div>}
            </div>
            <div>
              <p className="font-bold text-brown mb-2">Historial de pedidos ({customerOrders.length})</p>
              {customerOrders.length === 0 ? (
                <p className="text-sm text-brown-light">Sin pedidos registrados</p>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((o) => (
                    <div key={o.id} className="flex justify-between items-center bg-cream rounded-xl px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-brown">{formatDate(o.date)}</p>
                        <p className="text-xs text-brown-light">{o.items.length} artículos</p>
                      </div>
                      <p className="font-bold text-brown">{formatPrice(o.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar cliente" size="sm">
        <p className="text-sm text-brown-light mb-5">¿Confirmas eliminar este cliente?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
