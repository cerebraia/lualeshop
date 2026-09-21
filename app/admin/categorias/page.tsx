'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { categoryRepository } from '@/lib/repositories/categoryRepository';
import type { Category } from '@/lib/types';
import { generateId, slugify } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface FormData {
  name: string;
  description: string;
  active: boolean;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ name: '', description: '', active: true });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setCategories(categoryRepository.findAll());
  }

  useEffect(load, []);

  function openCreate() {
    setForm({ name: '', description: '', active: true });
    setErrors({});
    setEditingId(null);
    setModal('create');
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, description: cat.description ?? '', active: cat.active });
    setErrors({});
    setEditingId(cat.id);
    setModal('edit');
  }

  function validate(): boolean {
    const errs: { name?: string } = {};
    if (!form.name.trim()) errs.name = 'El nombre es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (modal === 'create') {
        const allCats = categoryRepository.findAll();
        const cat: Category = {
          id: generateId('cat'),
          name: form.name.trim(),
          slug: slugify(form.name.trim()),
          description: form.description.trim() || undefined,
          order: allCats.length + 1,
          active: form.active,
          createdAt: new Date().toISOString(),
        };
        categoryRepository.create(cat);
      } else if (editingId) {
        const existing = categoryRepository.findById(editingId);
        if (existing) {
          categoryRepository.update({
            ...existing,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            active: form.active,
          });
        }
      }
      load();
      setModal(null);
      setSaving(false);
    }, 300);
  }

  function toggleActive(cat: Category) {
    categoryRepository.update({ ...cat, active: !cat.active });
    load();
  }

  function handleDelete() {
    if (!deleteId) return;
    categoryRepository.delete(deleteId);
    setDeleteId(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Categorías</h1>
          <p className="text-brown-light text-sm">{categories.length} categorías</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Nueva categoría</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Crea las categorías para organizar tus productos."
          action={<Button onClick={openCreate}><Plus size={16} /> Nueva categoría</Button>}
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-rose/10 flex items-center gap-4">
              <GripVertical size={16} className="text-brown-light shrink-0 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brown">{cat.name}</p>
                {cat.description && <p className="text-xs text-brown-light mt-0.5 truncate">{cat.description}</p>}
                <p className="text-xs text-brown-light font-mono mt-0.5">/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${cat.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {cat.active ? 'Activa' : 'Inactiva'}
                </button>
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light hover:text-rose transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-brown-light hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? 'Nueva categoría' : 'Editar categoría'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="accent-rose" />
            <span className="text-sm text-brown font-medium">Categoría activa (visible en tienda)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} fullWidth>{modal === 'create' ? 'Crear' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar categoría" size="sm">
        <p className="text-sm text-brown-light mb-5">¿Confirmas que deseas eliminar esta categoría?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
