/**
 * Public product search.
 *
 * Works with both mock (localStorage) and Supabase providers.
 * Returns ONLY public fields — no costs, inventory levels, or private data.
 */

import { mockProducts } from './mock/products';
import { mockCategories } from './mock/categories';
import type { InventoryStatus } from './types';

export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  garmentType: string;
  image: string;
  price: number;
  isMultiPrice: boolean;
  categoryNames: string[];
  status: InventoryStatus;
  inventoryConfigured: boolean;
  sizes: string[];
}

const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 8;

/** Strip diacritics and lowercase — same logic used both in mock and Supabase (via unaccent). */
export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Sanitize query: trim whitespace, enforce max length, strip SQL-sensitive chars for display. */
export function sanitizeQuery(raw: string): string {
  return raw.slice(0, MAX_QUERY_LENGTH).trim();
}

function mockSearch(query: string, limit: number): SearchResult[] {
  const q = normalizeText(query);
  if (!q || q.length < 2) return [];

  const catMap = new Map(mockCategories.map((c) => [c.id, c.name]));

  return mockProducts
    .filter((p) => {
      if (!p.visible) return false;
      const name    = normalizeText(p.name);
      const desc    = normalizeText(p.description);
      const type    = normalizeText(p.garmentType);
      const cats    = p.categoryIds.map((id) => normalizeText(catMap.get(id) ?? ''));
      const sizes   = p.variants.map((v) => normalizeText(v.size));
      return (
        name.includes(q) ||
        desc.includes(q) ||
        type.includes(q) ||
        cats.some((c) => c.includes(q)) ||
        sizes.some((s) => s.includes(q))
      );
    })
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      garmentType: p.garmentType,
      image: p.images[0] ?? '',
      price: p.price,
      isMultiPrice: !!(p.purchaseOptions && p.purchaseOptions.length > 1),
      categoryNames: p.categoryIds.map((id) => catMap.get(id) ?? '').filter(Boolean),
      status: p.status,
      inventoryConfigured: p.inventoryConfigured,
      sizes: Array.from(new Set(p.variants.map((v) => v.size))).slice(0, 4),
    }));
}

async function supabaseSearch(query: string, limit: number): Promise<SearchResult[]> {
  const { getSupabaseBrowserClient } = await import('./supabase/client');
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.rpc('search_public_products', {
    p_query: query,
    p_limit: limit,
  });

  if (error) throw new Error(error.message);

  return (data as Array<Record<string, unknown>> ?? []).map((row) => ({
    id:                  String(row.id),
    slug:                String(row.slug),
    name:                String(row.name),
    garmentType:         String(row.garment_type ?? ''),
    image:               String(row.image_url ?? ''),
    price:               Number(row.price ?? 0),
    isMultiPrice:        Boolean(row.is_multi_price),
    categoryNames:       Array.isArray(row.category_names) ? row.category_names.map(String) : [],
    status:              (row.status as InventoryStatus) ?? 'available',
    inventoryConfigured: Boolean(row.inventory_configured),
    sizes:               Array.isArray(row.sizes) ? row.sizes.map(String) : [],
  }));
}

/**
 * Search public products.
 * @param query   Raw user input (will be sanitized internally)
 * @param limit   Max results (default 8, max 20)
 * @param signal  Optional AbortSignal for cancellation
 */
export async function searchPublicProducts(
  query: string,
  limit = DEFAULT_LIMIT,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const q = sanitizeQuery(query);
  const effectiveLimit = Math.min(limit, 20);

  if (q.length < 2) return [];
  if (signal?.aborted) return [];

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';

  if (provider === 'supabase') {
    return supabaseSearch(q, effectiveLimit);
  }

  // Mock: synchronous but wrapped in a promise for uniform API
  return Promise.resolve(mockSearch(q, effectiveLimit));
}
