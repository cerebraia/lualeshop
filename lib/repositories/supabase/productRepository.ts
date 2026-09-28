'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapProduct } from './mappers';
import type { Product, InventoryStatus, ProductPurchaseOption } from '@/lib/types';

const PRODUCT_SELECT = `
  *,
  product_variants (*, inventory_levels (quantity_on_hand)),
  product_purchase_options (*),
  product_images (*),
  product_categories (category_id)
`;

// Map Product.status (InventoryStatus) → manual_availability DB enum
function toManualAvailability(status: InventoryStatus): string {
  const m: Record<InventoryStatus, string> = {
    available:    'available',
    low_stock:    'low_stock',
    out_of_stock: 'out_of_stock',
    coming_soon:  'coming_soon',
    consult:      'consult',
  };
  return m[status] ?? 'consult';
}

// Sync product_purchase_options atomically after a product update.
// If options[] is provided: full sync (insert/update/delete).
// If options is undefined/empty: upsert a single default option with fallbackPrice.
async function syncPurchaseOptions(
  sb: ReturnType<typeof getSupabaseBrowserClient>,
  productId: string,
  fallbackPrice: number,
  options?: ProductPurchaseOption[]
): Promise<void> {
  const { data: existing } = await sb
    .from('product_purchase_options')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order');
  const existingList: Array<{ id: string; sort_order: number }> = existing ?? [];

  if (options && options.length > 0) {
    const existingIds = new Set(existingList.map((r) => String(r.id)));
    const updatedIds  = new Set(options.filter((o) => o.id).map((o) => o.id));

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (opt.id && existingIds.has(opt.id)) {
        const { error } = await sb
          .from('product_purchase_options')
          .update({ label: opt.label, price: opt.price, sort_order: i })
          .eq('id', opt.id);
        if (error) throw new Error(`purchase_options update: ${error.message}`);
      } else {
        const { error } = await sb.from('product_purchase_options').insert({
          product_id: productId,
          label:      opt.label,
          price:      opt.price,
          sort_order: i,
          active:     true,
        });
        if (error) throw new Error(`purchase_options insert: ${error.message}`);
      }
    }
    // Delete options removed from the list
    for (const ex of existingList) {
      if (!updatedIds.has(String(ex.id))) {
        const { error } = await sb
          .from('product_purchase_options')
          .delete()
          .eq('id', ex.id);
        if (error) throw new Error(`purchase_options delete: ${error.message}`);
      }
    }
  } else {
    // Single-price product: update first option's price or insert one
    if (existingList.length > 0) {
      const { error } = await sb
        .from('product_purchase_options')
        .update({ price: fallbackPrice })
        .eq('id', existingList[0].id);
      if (error) throw new Error(`purchase_options price update: ${error.message}`);
    } else {
      const { error } = await sb.from('product_purchase_options').insert({
        product_id: productId,
        label:      'Unidad',
        price:      fallbackPrice,
        sort_order: 0,
        active:     true,
      });
      if (error) throw new Error(`purchase_options initial insert: ${error.message}`);
    }
  }
}

export const supabaseProductRepository = {
  async findAll(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .neq('status', 'archived')     // exclude archived from active admin list
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findAllIncludingArchived(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .order('status')              // archived last
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findById(id: string): Promise<Product | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .single();
    if (error) return undefined;
    return mapProduct(data);
  },

  async findBySlug(slug: string): Promise<Product | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .single();
    if (error) return undefined;
    return mapProduct(data);
  },

  async findByCategoryId(categoryId: string): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(`${PRODUCT_SELECT}, product_categories!inner (category_id)`)
      .eq('status', 'active')
      .eq('product_categories.category_id', categoryId)
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findFeatured(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .eq('featured', true)
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findNew(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .eq('is_new', true)
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findVisible(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async findWithoutImages(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(`*, product_images (id)`)
      .order('catalog_number');
    if (error) throw error;
    return (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => !p.product_images || p.product_images.length === 0)
      .map(mapProduct);
  },

  async findInventoryNotConfigured(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('inventory_configured', false)
      .order('catalog_number');
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async create(product: Product): Promise<void> {
    const sb = getSupabaseBrowserClient();

    // Insert the product row
    const { error } = await sb.from('products').insert({
      id:                   product.id,
      sku:                  product.sku,
      slug:                 product.slug,
      name:                 product.name,
      garment_type:         product.garmentType,
      description:          product.description,
      status:               product.visible ? 'active' : 'draft',
      manual_availability:  toManualAvailability(product.status),
      featured:             product.featured,
      is_new:               product.isNew,
      inventory_configured: product.inventoryConfigured,
      tags:                 product.tags,
      catalog_number:       product.catalogNumber,
      size_note:            product.sizeNote,
    });
    if (error) throw error;

    // Insert the initial purchase option (price)
    await syncPurchaseOptions(sb, product.id, product.price, product.purchaseOptions);
  },

  async update(updated: Product): Promise<void> {
    const sb = getSupabaseBrowserClient();

    // 1. Update the products row — including manual_availability (BUG FIX)
    const { error } = await sb.from('products').update({
      name:                 updated.name,
      garment_type:         updated.garmentType,
      description:          updated.description,
      status:               updated.visible ? 'active' : 'draft',
      manual_availability:  toManualAvailability(updated.status),   // ← was missing
      featured:             updated.featured,
      featured_order:       updated.featuredOrder ?? null,
      is_new:               updated.isNew,
      inventory_configured: updated.inventoryConfigured,
      tags:                 updated.tags,
      size_note:            updated.sizeNote,
    }).eq('id', updated.id);
    if (error) throw error;

    // 2. Sync purchase options — price now persists (BUG FIX)
    await syncPurchaseOptions(sb, updated.id, updated.price, updated.purchaseOptions);
  },

  async attemptDelete(id: string): Promise<{
    action: 'deleted' | 'requires_archive';
    productId: string;
    reason: string | null;
    storagePaths?: string[];
  }> {
    const { data, error } = await getSupabaseBrowserClient()
      .rpc('attempt_product_delete', { p_product_id: id });
    if (error) throw new Error(error.message);
    const d = data as { action: string; productId: string; reason: string | null; storagePaths: string[] | null };
    return {
      action:       d.action as 'deleted' | 'requires_archive',
      productId:    d.productId,
      reason:       d.reason,
      storagePaths: d.storagePaths ?? [],
    };
  },

  async archive(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .rpc('archive_product', { p_product_id: id });
    if (error) throw new Error(error.message);
  },

  async restore(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .rpc('restore_product', { p_product_id: id });
    if (error) throw new Error(error.message);
  },

  // Legacy alias — kept for mock repo compatibility; Supabase uses attemptDelete/archive
  async delete(id: string): Promise<void> {
    const result = await supabaseProductRepository.archive(id);
    return result;
  },
};

