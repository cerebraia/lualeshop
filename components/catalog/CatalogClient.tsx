'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { ProductGrid } from '@/components/product/ProductGrid';

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';

interface FiltersProps {
  categories: Category[];
  allSizes: string[];
  allTypes: string[];
  categoryId: string;
  size: string;
  type: string;
  status: string;
  onlyNew: boolean;
  priceMin: string;
  priceMax: string;
  hasFilters: boolean;
  onCategory: (v: string) => void;
  onSize: (v: string) => void;
  onType: (v: string) => void;
  onStatus: (v: string) => void;
  onOnlyNew: (v: boolean) => void;
  onPriceMin: (v: string) => void;
  onPriceMax: (v: string) => void;
  onClear: () => void;
}

function FiltersPanel({
  categories, allSizes, allTypes,
  categoryId, size, type, status, onlyNew, priceMin, priceMax, hasFilters,
  onCategory, onSize, onType, onStatus, onOnlyNew, onPriceMin, onPriceMax, onClear,
}: FiltersProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-wide mb-2">Categoría</p>
        <div className="space-y-1">
          {[{ id: '', name: 'Todas' }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => onCategory(c.id)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${categoryId === c.id ? 'bg-rose text-white font-semibold' : 'text-brown hover:bg-cream'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-wide mb-2">Tipo de prenda</p>
        <div className="space-y-1">
          {[{ value: '', label: 'Todos' }, ...allTypes.map((t) => ({ value: t, label: t }))].map((o) => (
            <button
              key={o.value}
              onClick={() => onType(o.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${type === o.value ? 'bg-rose text-white font-semibold' : 'text-brown hover:bg-cream'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-wide mb-2">Talla</p>
        <div className="flex flex-wrap gap-1.5">
          {['', ...allSizes].map((s) => (
            <button
              key={s}
              onClick={() => onSize(s)}
              className={`px-3 py-1 text-xs rounded-xl border transition-colors ${size === s ? 'bg-rose border-rose text-white font-semibold' : 'border-rose/30 text-brown hover:border-rose'}`}
            >
              {s || 'Todas'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-wide mb-2">Precio (€)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => onPriceMin(e.target.value)}
            className="w-full border border-rose/30 rounded-xl px-3 py-1.5 text-sm text-brown focus:outline-none focus:border-rose"
          />
          <span className="text-brown-light text-xs shrink-0">—</span>
          <input
            type="number"
            min="0"
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => onPriceMax(e.target.value)}
            className="w-full border border-rose/30 rounded-xl px-3 py-1.5 text-sm text-brown focus:outline-none focus:border-rose"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-wide mb-2">Disponibilidad</p>
        <div className="space-y-1">
          {[
            { value: '', label: 'Todas' },
            { value: 'available', label: 'Disponible' },
            { value: 'low_stock', label: 'Últimas unidades' },
            { value: 'out_of_stock', label: 'Agotado' },
            { value: 'coming_soon', label: 'Próximamente' },
          ].map((o) => (
            <button
              key={o.value}
              onClick={() => onStatus(o.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${status === o.value ? 'bg-rose text-white font-semibold' : 'text-brown hover:bg-cream'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyNew}
          onChange={(e) => onOnlyNew(e.target.checked)}
          className="accent-rose w-4 h-4"
        />
        <span className="text-sm text-brown font-medium">Solo novedades</span>
      </label>

      {hasFilters && (
        <button onClick={onClear} className="flex items-center gap-1 text-sm text-rose font-semibold hover:underline">
          <X size={14} /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

interface Props {
  products: Product[];
  categories: Category[];
}

export function CatalogClient({ products, categories }: Props) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [size, setSize] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.size)))).sort(),
    [products]
  );
  const allTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.garmentType))).sort(),
    [products]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearch(q.slice(0, 100));
      setPage(1);
    }
  }, []);

  const filtered = useMemo<Product[]>(() => {
    let list = products.filter((p) => p.visible);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    if (search.trim()) {
      const normalize = (s: string) =>
        s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const q = normalize(search.trim());
      list = list.filter(
        (p) =>
          normalize(p.name).includes(q) ||
          normalize(p.description).includes(q) ||
          normalize(p.garmentType).includes(q) ||
          p.categoryIds.some((id) => normalize(catMap.get(id) ?? '').includes(q)) ||
          p.variants.some((v) => normalize(v.size).includes(q))
      );
    }
    if (categoryId) list = list.filter((p) => p.categoryIds.includes(categoryId));
    if (size) list = list.filter((p) => p.variants.some((v) => v.size === size));
    if (type) list = list.filter((p) => p.garmentType === type);
    if (status) list = list.filter((p) => p.status === status);
    if (onlyNew) list = list.filter((p) => p.isNew);
    if (priceMin !== '') list = list.filter((p) => p.price >= Number(priceMin));
    if (priceMax !== '') list = list.filter((p) => p.price <= Number(priceMax));

    switch (sort) {
      case 'price_asc': return [...list].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...list].sort((a, b) => b.price - a.price);
      case 'name': return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [search, categoryId, size, type, status, onlyNew, priceMin, priceMax, sort, products, categories]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;
  const hasFilters = !!(search || categoryId || size || type || status || onlyNew || priceMin || priceMax);

  function clearFilters() {
    setSearch(''); setCategoryId(''); setSize(''); setType('');
    setStatus(''); setOnlyNew(false); setPriceMin(''); setPriceMax('');
    setPage(1);
  }

  const filterProps = {
    categories, allSizes, allTypes,
    categoryId, size, type, status, onlyNew, priceMin, priceMax, hasFilters,
    onCategory: (v: string) => { setCategoryId(v); setPage(1); },
    onSize:     (v: string) => { setSize(v); setPage(1); },
    onType:     (v: string) => { setType(v); setPage(1); },
    onStatus:   (v: string) => { setStatus(v); setPage(1); },
    onOnlyNew:  (v: boolean) => { setOnlyNew(v); setPage(1); },
    onPriceMin: (v: string) => { setPriceMin(v); setPage(1); },
    onPriceMax: (v: string) => { setPriceMax(v); setPage(1); },
    onClear: clearFilters,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brown mb-1">Catálogo</h1>
        <p className="text-brown-light text-sm">{filtered.length} productos encontrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose/30 rounded-2xl text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-white border border-rose/30 rounded-2xl px-4 py-2.5 text-sm text-brown focus:outline-none focus:border-rose cursor-pointer"
        >
          <option value="newest">Más recientes</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="name">Nombre A–Z</option>
        </select>
        <button
          className="lg:hidden flex items-center gap-2 bg-white border border-rose/30 rounded-2xl px-4 py-2.5 text-sm text-brown font-medium"
          onClick={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={15} />
          Filtros {hasFilters && <span className="bg-rose text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>}
        </button>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-brown text-sm">Filtros</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-rose hover:underline">Limpiar</button>
              )}
            </div>
            <FiltersPanel {...filterProps} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <ProductGrid
            products={paginated}
            emptyTitle="Sin resultados"
            emptyDescription="Prueba ajustando los filtros o la búsqueda."
            emptyAction={
              hasFilters ? (
                <button onClick={clearFilters} className="text-rose font-semibold text-sm hover:underline">
                  Limpiar filtros
                </button>
              ) : undefined
            }
          />
          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border-2 border-rose text-rose font-semibold px-8 py-3 rounded-2xl hover:bg-rose hover:text-white transition-all"
              >
                Ver más productos
              </button>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-brown/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <span className="font-bold text-brown">Filtros</span>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-cream">
                <X size={18} className="text-brown" />
              </button>
            </div>
            <FiltersPanel {...filterProps} />
            <button
              onClick={() => setShowFilters(false)}
              className="mt-6 w-full bg-rose text-white font-semibold py-3 rounded-2xl"
            >
              Ver {filtered.length} productos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
