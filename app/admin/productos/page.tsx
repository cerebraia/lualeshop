'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Search, Edit2, Trash2, Copy, Eye, EyeOff, ImageIcon, Settings, ExternalLink, Link2, Check } from 'lucide-react';
import { productRepo, categoryRepo } from '@/lib/repos';
import type { Product, Category, ProductVariant, ProductPurchaseOption, InventoryStatus } from '@/lib/types';
import { formatPrice, generateId, slugify } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductImageManager } from '@/components/admin/ProductImageManager';
import type { ManagedImage } from '@/components/admin/ProductImageManager';

const STATUS_OPTIONS = [
  { value: 'consult',      label: 'Consultar disponibilidad' },
  { value: 'available',    label: 'Disponible' },
  { value: 'out_of_stock', label: 'Agotado' },
  { value: 'low_stock',    label: 'Últimas unidades' },
  { value: 'coming_soon',  label: 'Próximamente' },
];

const GARMENT_TYPES = [
  'Bodybody', 'Camiseta', 'Camisa', 'Chaqueta', 'Conjunto', 'Conjunto deportivo',
  'Hoodie', 'Leggings', 'Medias', 'Overol', 'Pantalón', 'Pijama',
  'Romper', 'Set', 'Sudadera', 'Vestido', 'Otro',
];

const MAX_FEATURED = 16;

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  cost: string;
  categoryIds: string[];
  status: InventoryStatus;
  featured: boolean;
  featuredOrder: string;
  isNew: boolean;
  visible: boolean;
  garmentType: string;
  variants: ProductVariant[];
  inventoryConfigured: boolean;
  purchaseOptions: Array<{ id: string; label: string; price: string }>;
}

const emptyForm = (): ProductFormData => ({
  name: '',
  sku: '',
  description: '',
  price: '',
  cost: '',
  categoryIds: [],
  status: 'consult',
  featured: false,
  featuredOrder: '',
  isNew: false,
  visible: true,
  garmentType: 'Set',
  variants: [{ id: generateId('var'), size: '', color: '', stock: 0 }],
  inventoryConfigured: false,
  purchaseOptions: [],
});

// ── Product thumbnail ─────────────────────────────────────────────────────────

function ProductThumbnail({
  product, size, className = '',
}: {
  product: Product;
  size: 48 | 56 | 64 | 72;
  className?: string;
}) {
  const src = product.productImages?.find((img) => img.isPrimary)?.publicUrl
    ?? product.images[0]
    ?? null;

  const px = size;
  const sizeClass: Record<number, string> = {
    48: 'w-12 h-12',
    56: 'w-14 h-14',
    64: 'w-16 h-16',
    72: 'w-[72px] h-[72px]',
  };

  const inner = src ? (
    <Image
      src={src}
      alt={product.name}
      width={px}
      height={px}
      className="object-cover w-full h-full"
      sizes={`${px}px`}
      loading="lazy"
    />
  ) : (
    <>
      <ImageIcon size={px >= 64 ? 18 : 14} className="text-brown-light/40" />
      <span className="sr-only">Sin imagen</span>
    </>
  );

  const base = `${sizeClass[px]} rounded-xl overflow-hidden bg-cream border border-rose/10 shrink-0 flex items-center justify-center ${className}`;

  if (product.slug && src) {
    return (
      <a
        href={`/producto/${product.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ${product.name} en la tienda`}
        className={`${base} hover:ring-2 hover:ring-rose/30 transition-all`}
      >
        {inner}
      </a>
    );
  }
  return <div className={base}>{inner}</div>;
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterNoImage, setFilterNoImage] = useState(false);
  const [filterInvPending, setFilterInvPending] = useState(false);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  function copyLink(slug: string) {
    const url = `${window.location.origin}/producto/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  }

  async function load() {
    try {
      const [prods, cats] = await Promise.all([
        productRepo.findAll(),
        categoryRepo.findActive(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setError('Error al cargar datos.');
    }
  }

  useEffect(() => { load(); }, []);

  const featuredCount = products.filter((p) => p.featured).length;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || p.categoryIds.includes(filterCategory);
    const matchesNoImage = !filterNoImage || p.images.length === 0;
    const matchesInvPending = !filterInvPending || !p.inventoryConfigured;
    const matchesFeatured = !filterFeatured || p.featured;
    return matchesSearch && matchesCategory && matchesNoImage && matchesInvPending && matchesFeatured;
  });

  function openCreate() {
    setForm(emptyForm());
    setErrors({});
    setEditingId(null);
    setModal('create');
  }

  function openEdit(product: Product) {
    // purchaseOptions: use real DB options if available, else synthesize from price
    const opts: Array<{ id: string; label: string; price: string }> =
      product.purchaseOptions && product.purchaseOptions.length > 0
        ? product.purchaseOptions.map((o) => ({ id: o.id, label: o.label, price: String(o.price) }))
        : [{ id: '', label: 'Unidad', price: String(product.price) }];

    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: String(product.price),
      cost: String(product.cost),
      categoryIds: product.categoryIds,
      status: product.status,
      featured: product.featured,
      featuredOrder: product.featuredOrder != null ? String(product.featuredOrder) : '',
      isNew: product.isNew,
      visible: product.visible,
      garmentType: product.garmentType,
      variants: product.variants,
      inventoryConfigured: product.inventoryConfigured,
      purchaseOptions: opts,
    });
    setErrors({});
    setEditingId(product.id);
    setModal('edit');
  }

  async function duplicate(product: Product) {
    const now = new Date().toISOString();
    const newProd: Product = {
      ...product,
      id: generateId('prod'),
      name: `${product.name} (copia)`,
      slug: slugify(`${product.name} copia ${Date.now()}`),
      sku: `${product.sku}-C`,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await productRepo.create(newProd);
      await load();
    } catch {
      setError('Error al duplicar producto.');
    }
  }

  async function toggleVisible(product: Product) {
    try {
      await productRepo.update({ ...product, visible: !product.visible });
      await load();
    } catch {
      setError('Error al actualizar producto.');
    }
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Requerido';
    if (!form.sku.trim()) errs.sku = 'Requerido';
    if (!form.cost || isNaN(Number(form.cost))) errs.cost = 'Costo inválido';
    // Price validation: either via options or single price field
    if (form.purchaseOptions.length > 0) {
      const invalid = form.purchaseOptions.some(
        (o) => !o.label.trim() || !o.price || isNaN(Number(o.price)) || Number(o.price) <= 0
      );
      if (invalid) errs.price = 'Todas las opciones deben tener nombre y precio mayor a cero';
    } else {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
        errs.price = 'Precio inválido (debe ser mayor que cero)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const now = new Date().toISOString();

    try {
      const featuredOrderVal = form.featured && form.featuredOrder.trim()
        ? Number(form.featuredOrder)
        : null;

      // Validate purchase options: must have label and price > 0
      const validatedOpts: ProductPurchaseOption[] | undefined = form.purchaseOptions.length > 0
        ? form.purchaseOptions.map((o, i) => ({
            id:        o.id || generateId('opt'),
            label:     o.label.trim(),
            price:     Number(o.price),
            sortOrder: i,
          }))
        : undefined;

      // Derived price = first option's price (for mapper compatibility)
      const derivedPrice = validatedOpts
        ? Math.min(...validatedOpts.map((o) => o.price))
        : Number(form.price);

      if (modal === 'create') {
        const prod: Product = {
          id: generateId('prod'),
          name: form.name.trim(),
          slug: slugify(form.name.trim()),
          sku: form.sku.trim(),
          description: form.description.trim(),
          price: derivedPrice,
          cost: Number(form.cost),
          categoryIds: form.categoryIds,
          variants: form.variants,
          images: [],
          status: form.status,
          featured: form.featured,
          featuredOrder: featuredOrderVal,
          isNew: form.isNew,
          visible: form.visible,
          garmentType: form.garmentType,
          tags: [],
          inventoryConfigured: form.inventoryConfigured,
          purchaseOptions: validatedOpts,
          createdAt: now,
          updatedAt: now,
        };
        await productRepo.create(prod);
      } else if (modal === 'edit' && editingId) {
        const existing = await productRepo.findById(editingId);
        if (existing) {
          await productRepo.update({
            ...existing,
            name: form.name.trim(),
            sku: form.sku.trim(),
            description: form.description.trim(),
            price: derivedPrice,
            cost: Number(form.cost),
            categoryIds: form.categoryIds,
            variants: form.variants,
            status: form.status,
            featured: form.featured,
            featuredOrder: featuredOrderVal,
            isNew: form.isNew,
            visible: form.visible,
            garmentType: form.garmentType,
            inventoryConfigured: form.inventoryConfigured,
            purchaseOptions: validatedOpts,
            updatedAt: now,
          });
        }
      }
      await load();
      setModal(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await productRepo.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError('Error al eliminar producto.');
    }
  }

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { id: generateId('var'), size: '', color: '', stock: 0 }],
    }));
  }

  function removeVariant(id: string) {
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));
  }

  function updateVariant(id: string, field: keyof ProductVariant, value: string | number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    }));
  }

  const allCategories = categories;

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Productos</h1>
          <p className="text-brown-light text-sm">{products.length} productos en total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate} size="sm">
            <Plus size={16} /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose/30 rounded-2xl text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-rose/30 rounded-2xl px-3 py-2.5 text-sm text-brown focus:outline-none focus:border-rose cursor-pointer"
        >
          <option value="">Todas las categorías</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Checkbox filters */}
        <label className="flex items-center gap-2 cursor-pointer bg-white border border-rose/30 rounded-2xl px-3 py-2.5 text-sm text-brown hover:border-rose transition-colors">
          <input
            type="checkbox"
            checked={filterNoImage}
            onChange={(e) => setFilterNoImage(e.target.checked)}
            className="accent-rose"
          />
          <ImageIcon size={13} className="text-amber-500" />
          Sin imagen
        </label>

        <label className="flex items-center gap-2 cursor-pointer bg-white border border-rose/30 rounded-2xl px-3 py-2.5 text-sm text-brown hover:border-rose transition-colors">
          <input
            type="checkbox"
            checked={filterInvPending}
            onChange={(e) => setFilterInvPending(e.target.checked)}
            className="accent-rose"
          />
          <Settings size={13} className="text-purple-500" />
          Inventario pendiente
        </label>

        <label className="flex items-center gap-2 cursor-pointer bg-white border border-rose/30 rounded-2xl px-3 py-2.5 text-sm text-brown hover:border-rose transition-colors">
          <input
            type="checkbox"
            checked={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.checked)}
            className="accent-rose"
          />
          <span className="text-yellow-500 text-xs">★</span>
          Destacados ({featuredCount}/{MAX_FEATURED})
        </label>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description="Crea tu primer producto para empezar."
          action={<Button onClick={openCreate}><Plus size={16} /> Nuevo producto</Button>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-rose/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream text-xs text-brown-light font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Precio</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Visible</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-cream hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail product={p} size={48} />
                        <div className="min-w-0">
                          <p className="font-semibold text-brown text-sm leading-tight truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-brown-light font-mono">{p.sku}</p>
                          {p.garmentType && <p className="text-xs text-brown-light/70">{p.garmentType}</p>}
                        </div>
                        {p.featured && (
                          <span title={`Destacado #${p.featuredOrder ?? '?'}`} className="text-yellow-500 text-xs font-bold shrink-0">
                            ★{p.featuredOrder != null ? p.featuredOrder : ''}
                          </span>
                        )}
                        {!p.inventoryConfigured && (
                          <span title="Inventario pendiente" className="text-purple-400 shrink-0">
                            <Settings size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brown">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleVisible(p)}
                        className={`p-1.5 rounded-xl transition-colors ${p.visible ? 'text-green-600 hover:bg-green-50' : 'text-brown-light hover:bg-cream'}`}
                        title={p.visible ? 'Ocultar' : 'Publicar'}
                      >
                        {p.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {p.slug ? (
                          <a
                            href={`/producto/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ver ${p.name} en la tienda`}
                            className="p-1.5 rounded-xl hover:bg-blue-50 text-brown-light hover:text-blue-pastel transition-colors"
                            title="Ver en tienda"
                          >
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <span className="p-1.5 rounded-xl text-brown-light/30 cursor-not-allowed" title="Sin slug — guarda el producto primero">
                            <ExternalLink size={15} />
                          </span>
                        )}
                        <button
                          onClick={() => p.slug && copyLink(p.slug)}
                          disabled={!p.slug}
                          aria-label={`Copiar enlace de ${p.name}`}
                          className={`p-1.5 rounded-xl transition-colors ${p.slug ? 'hover:bg-cream text-brown-light hover:text-brown' : 'text-brown-light/30 cursor-not-allowed'}`}
                          title={copiedSlug === p.slug ? 'Enlace copiado' : 'Copiar enlace'}
                        >
                          {copiedSlug === p.slug ? <Check size={15} className="text-green-600" /> : <Link2 size={15} />}
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light hover:text-rose transition-colors" title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => duplicate(p)} className="p-1.5 rounded-xl hover:bg-cream text-brown-light hover:text-blue-pastel transition-colors" title="Duplicar">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-xl hover:bg-red-50 text-brown-light hover:text-red-500 transition-colors" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm border border-rose/10">
                {/* Top row: thumbnail + info + status */}
                <div className="flex items-start gap-3">
                  <ProductThumbnail product={p} size={72} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-brown text-sm leading-tight line-clamp-2">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-brown-light font-mono mb-0.5">{p.sku}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brown text-sm">{formatPrice(p.price)}</span>
                      {p.featured && (
                        <span title={`Destacado #${p.featuredOrder ?? '?'}`} className="text-yellow-500 text-xs font-bold">
                          ★{p.featuredOrder != null ? p.featuredOrder : ''}
                        </span>
                      )}
                      {!p.inventoryConfigured && <span title="Inventario pendiente"><Settings size={11} className="text-purple-400" /></span>}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-cream">
                  <div className="flex gap-1.5">
                    {p.slug ? (
                      <a href={`/producto/${p.slug}`} target="_blank" rel="noopener noreferrer"
                        aria-label={`Ver ${p.name} en la tienda`}
                        className="p-2 rounded-xl hover:bg-blue-50 text-brown-light min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                    <button onClick={() => toggleVisible(p)}
                      aria-label={p.visible ? 'Ocultar producto' : 'Publicar producto'}
                      className="p-2 rounded-xl hover:bg-cream text-brown-light min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      {p.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(p)} aria-label="Editar producto"
                      className="p-2 rounded-xl hover:bg-cream text-brown-light min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => duplicate(p)} aria-label="Duplicar producto"
                      className="p-2 rounded-xl hover:bg-cream text-brown-light min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} aria-label="Eliminar producto"
                      className="p-2 rounded-xl hover:bg-red-50 text-red-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Visible status indicator */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.visible ? 'bg-green-50 text-green-700' : 'bg-cream text-brown-light'}`}>
                    {p.visible ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo producto' : 'Editar producto'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Quick links — only for saved products */}
          {modal === 'edit' && editingId && (() => {
            const prod = products.find((p) => p.id === editingId);
            return prod?.slug ? (
              <div className="flex gap-2 pb-1">
                <a
                  href={`/producto/${prod.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver ${prod.name} en la tienda`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-pastel hover:text-blue-pastel/80 border border-blue-pastel/30 hover:border-blue-pastel/60 px-3 py-1.5 rounded-xl transition-all"
                >
                  <ExternalLink size={13} /> Ver en tienda
                </a>
                <button
                  onClick={() => prod.slug && copyLink(prod.slug)}
                  aria-label={`Copiar enlace de ${prod.name}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brown-light hover:text-brown border border-brown/20 hover:border-brown/40 px-3 py-1.5 rounded-xl transition-all"
                >
                  {copiedSlug === prod.slug ? <><Check size={13} className="text-green-600" /> Enlace copiado</> : <><Link2 size={13} /> Copiar enlace</>}
                </button>
              </div>
            ) : null;
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="SKU *" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} error={errors.sku} />
          </div>
          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

          {/* ── Opciones de compra / Precio ────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brown">Opciones de compra *</p>
              <button
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  purchaseOptions: [...f.purchaseOptions, { id: '', label: '', price: '' }],
                }))}
                className="text-xs text-rose font-semibold hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Agregar opción
              </button>
            </div>
            {form.purchaseOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    value={opt.label}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      purchaseOptions: f.purchaseOptions.map((o, j) => j === i ? { ...o, label: e.target.value } : o),
                    }))}
                    placeholder="Nombre (ej: Unidad, Pack x5…)"
                    className="w-full px-3 py-2 border border-rose/20 rounded-xl text-sm text-brown focus:outline-none focus:border-rose"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={opt.price}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      purchaseOptions: f.purchaseOptions.map((o, j) => j === i ? { ...o, price: e.target.value } : o),
                      price: i === 0 ? e.target.value : f.price,
                    }))}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-rose/20 rounded-xl text-sm text-brown focus:outline-none focus:border-rose"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    purchaseOptions: f.purchaseOptions.filter((_, j) => j !== i),
                  }))}
                  className="p-2 rounded-xl hover:bg-red-50 text-red-400 shrink-0"
                  aria-label="Eliminar opción"
                  disabled={form.purchaseOptions.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            <p className="text-xs text-brown-light">
              {form.purchaseOptions.length > 1
                ? `Desde ${form.purchaseOptions.filter(o => o.price).length > 0 ? Math.min(...form.purchaseOptions.map(o => Number(o.price) || Infinity)).toFixed(2) : '—'} € · ${form.purchaseOptions.length} opciones`
                : 'Un solo precio'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div />
            <Input label="Costo (€) *" type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} error={errors.cost} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de prenda"
              value={form.garmentType}
              onChange={(e) => setForm((f) => ({ ...f, garmentType: e.target.value }))}
              options={GARMENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InventoryStatus }))}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm font-semibold text-brown mb-2">Categorías</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(c.id)}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      categoryIds: e.target.checked
                        ? [...f.categoryIds, c.id]
                        : f.categoryIds.filter((id) => id !== c.id),
                    }))}
                    className="accent-rose"
                  />
                  <span className="text-sm text-brown">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {(['isNew', 'visible'] as const).map((flag) => (
                <label key={flag} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[flag]}
                    onChange={(e) => setForm((f) => ({ ...f, [flag]: e.target.checked }))}
                    className="accent-rose"
                  />
                  <span className="text-sm text-brown">
                    {flag === 'isNew' ? 'Novedad' : 'Visible en tienda'}
                  </span>
                </label>
              ))}
            </div>

            {/* Featured — with limit guard and order field */}
            <div className="bg-yellow-50 rounded-2xl p-3 space-y-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => {
                    const next = e.target.checked;
                    // Block if at limit and trying to add a new product
                    const isNewProduct = modal === 'create' || !products.find((p) => p.id === editingId)?.featured;
                    if (next && isNewProduct && featuredCount >= MAX_FEATURED) return;
                    setForm((f) => ({ ...f, featured: next, featuredOrder: next ? f.featuredOrder : '' }));
                  }}
                  className="accent-rose"
                  disabled={
                    !form.featured &&
                    (modal === 'create' || !products.find((p) => p.id === editingId)?.featured) &&
                    featuredCount >= MAX_FEATURED
                  }
                />
                <span className="text-sm font-semibold text-brown">
                  ★ Producto destacado
                </span>
                <span className="text-xs text-brown-light ml-auto">
                  {featuredCount}/{MAX_FEATURED} destacados
                </span>
              </label>

              {featuredCount >= MAX_FEATURED && !form.featured && (
                <p className="text-xs text-amber-700 ml-5">
                  Puedes seleccionar un máximo de {MAX_FEATURED} productos destacados.
                </p>
              )}

              {form.featured && (
                <div className="ml-5">
                  <label className="text-xs font-semibold text-brown-light block mb-1">
                    Orden de aparición (1 = primero)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={MAX_FEATURED}
                    step="1"
                    value={form.featuredOrder}
                    onChange={(e) => setForm((f) => ({ ...f, featuredOrder: e.target.value }))}
                    placeholder="1–16"
                    className="w-24 px-3 py-1.5 border border-rose/30 rounded-xl text-sm text-brown focus:outline-none focus:border-rose"
                  />
                  <p className="text-xs text-brown-light mt-1">
                    Define la posición en el carrusel de la home. Deja vacío para aparecer al final.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Inventory configured toggle */}
          <div className="bg-purple-50 rounded-2xl p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inventoryConfigured}
                onChange={(e) => setForm((f) => ({ ...f, inventoryConfigured: e.target.checked }))}
                className="accent-rose"
              />
              <span className="text-sm font-semibold text-brown">Inventario configurado</span>
            </label>
            {!form.inventoryConfigured && (
              <p className="text-xs text-purple-600 mt-1.5 ml-6">
                Sin inventario real configurado. La tienda mostrará &ldquo;Consultar disponibilidad&rdquo;.
              </p>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-brown">Variantes / Tallas</p>
              <button onClick={addVariant} className="text-xs text-rose font-semibold hover:underline">+ Agregar</button>
            </div>
            {errors.variants && <p className="text-xs text-red-500 mb-2">{errors.variants}</p>}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {form.variants.map((v) => (
                <div key={v.id} className="grid grid-cols-3 gap-2 items-center">
                  <Input placeholder="Talla (ej: 3T)" value={v.size} onChange={(e) => updateVariant(v.id, 'size', e.target.value)} />
                  <Input placeholder="Color (opcional)" value={v.color ?? ''} onChange={(e) => updateVariant(v.id, 'color', e.target.value)} />
                  <div className="flex gap-1">
                    <Input placeholder="Stock" type="number" min="0" value={String(v.stock)} onChange={(e) => updateVariant(v.id, 'stock', Number(e.target.value))} />
                    {form.variants.length > 1 && (
                      <button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 px-1"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image manager — only available when editing an existing product */}
          {modal === 'edit' && editingId && (
            <div className="border-t border-cream pt-4">
              <ProductImageManager
                productId={editingId}
                productName={form.name}
                initialImages={(() => {
                  const prod = products.find((p) => p.id === editingId);
                  if (!prod) return [];
                  // Use real DB metadata when available (Supabase mode)
                  if (prod.productImages && prod.productImages.length > 0) {
                    return prod.productImages.map((img) => ({
                      id:          img.id,
                      src:         img.publicUrl,
                      storagePath: img.storagePath,
                      altText:     img.altText || `${prod.name} de Luale Kids Shop`,
                      position:    img.position,
                      isPrimary:   img.isPrimary,
                      width:       img.width,
                      height:      img.height,
                      fileSize:    img.fileSize,
                    } satisfies ManagedImage));
                  }
                  // Fallback: mock mode — no real IDs, local paths
                  return prod.images.map((src, i) => ({
                    id:        `img-${editingId}-${i}`,
                    src,
                    altText:   `${prod.name} de Luale Kids Shop`,
                    position:  i,
                    isPrimary: i === 0,
                  } satisfies ManagedImage));
                })()}
                onImagesChange={() => load()}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} fullWidth>
              {modal === 'create' ? 'Crear producto' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar producto" size="sm">
        <p className="text-sm text-brown-light mb-5">Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar este producto?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Eliminar</Button>
        </div>
      </Modal>

    </div>
  );
}
