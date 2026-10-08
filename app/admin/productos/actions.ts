'use server';

/**
 * Server Actions for product CRUD.
 * Uses the service role key so RLS is bypassed — the browser client (anon key)
 * cannot satisfy is_active_admin() when there is no active auth session in the
 * admin panel. The service role key is a server-only secret and never reaches
 * the browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Product, ProductPurchaseOption, InventoryStatus } from '@/lib/types';

type Sb = ReturnType<typeof getAdminClient>;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin credentials not configured on server.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

// Sync product_purchase_options for a product.
// If options[] is provided: full diff (insert/update/delete).
// If options is undefined/empty: upsert a single default option with fallbackPrice.
async function syncPurchaseOptions(
  sb: Sb,
  productId: string,
  fallbackPrice: number,
  options?: ProductPurchaseOption[]
): Promise<void> {
  const { data: existing } = await sb
    .from('product_purchase_options')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order');
  const existingList: Array<{ id: string }> = existing ?? [];

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
        if (error) throw new Error(`purchase_option update: ${error.message}`);
      } else {
        const { error } = await sb.from('product_purchase_options').insert({
          product_id: productId,
          label:      opt.label,
          price:      opt.price,
          sort_order: i,
          active:     true,
        });
        if (error) throw new Error(`purchase_option insert: ${error.message}`);
      }
    }
    for (const ex of existingList) {
      if (!updatedIds.has(String(ex.id))) {
        const { error } = await sb
          .from('product_purchase_options')
          .delete()
          .eq('id', ex.id);
        if (error) throw new Error(`purchase_option delete: ${error.message}`);
      }
    }
  } else {
    if (existingList.length > 0) {
      const { error } = await sb
        .from('product_purchase_options')
        .update({ price: fallbackPrice })
        .eq('id', existingList[0].id);
      if (error) throw new Error(`purchase_option price update: ${error.message}`);
    } else {
      const { error } = await sb.from('product_purchase_options').insert({
        product_id: productId,
        label:      'Unidad',
        price:      fallbackPrice,
        sort_order: 0,
        active:     true,
      });
      if (error) throw new Error(`purchase_option initial insert: ${error.message}`);
    }
  }
}

// Replace all category associations for a product.
async function syncCategories(
  sb: Sb,
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const { error: delError } = await sb
    .from('product_categories')
    .delete()
    .eq('product_id', productId);
  if (delError) throw new Error(`category delete: ${delError.message}`);

  if (categoryIds.length > 0) {
    const { error } = await sb.from('product_categories').insert(
      categoryIds.map((cid) => ({ product_id: productId, category_id: cid }))
    );
    if (error) throw new Error(`category insert: ${error.message}`);
  }
}

export async function createProduct(product: Product): Promise<void> {
  const sb = getAdminClient();

  const { error } = await sb.from('products').insert({
    id:                   product.id,
    sku:                  product.sku,
    slug:                 product.slug,
    name:                 product.name,
    garment_type:         product.garmentType ?? '',
    description:          product.description ?? '',
    status:               product.visible ? 'active' : 'draft',
    manual_availability:  toManualAvailability(product.status),
    featured:             product.featured,
    featured_order:       product.featuredOrder ?? null,
    is_new:               product.isNew,
    inventory_configured: product.inventoryConfigured,
    tags:                 product.tags ?? [],
    catalog_number:       product.catalogNumber ?? null,
    size_note:            product.sizeNote ?? null,
  });
  if (error) throw new Error(`product insert: ${error.message}`);

  await syncPurchaseOptions(sb, product.id, product.price, product.purchaseOptions);
  await syncCategories(sb, product.id, product.categoryIds);

  // Insert variants with a non-empty size
  const validVariants = product.variants.filter((v) => v.size.trim());
  if (validVariants.length > 0) {
    const { error: varError } = await sb.from('product_variants').insert(
      validVariants.map((v) => ({
        id:         v.id,
        product_id: product.id,
        size:       v.size.trim(),
        color:      v.color?.trim() || null,
        sku:        v.sku || null,
        active:     true,
      }))
    );
    if (varError) throw new Error(`variant insert: ${varError.message}`);
  }
}

export async function updateProduct(product: Product): Promise<void> {
  const sb = getAdminClient();

  const { error } = await sb.from('products').update({
    name:                 product.name,
    garment_type:         product.garmentType ?? '',
    description:          product.description ?? '',
    status:               product.visible ? 'active' : 'draft',
    manual_availability:  toManualAvailability(product.status),
    featured:             product.featured,
    featured_order:       product.featuredOrder ?? null,
    is_new:               product.isNew,
    inventory_configured: product.inventoryConfigured,
    tags:                 product.tags ?? [],
    size_note:            product.sizeNote ?? null,
  }).eq('id', product.id);
  if (error) throw new Error(`product update: ${error.message}`);

  await syncPurchaseOptions(sb, product.id, product.price, product.purchaseOptions);
  await syncCategories(sb, product.id, product.categoryIds);
}

export async function toggleProductVisibility(
  productId: string,
  visible: boolean
): Promise<void> {
  const sb = getAdminClient();
  const { error } = await sb
    .from('products')
    .update({ status: visible ? 'active' : 'draft' })
    .eq('id', productId);
  if (error) throw new Error(`visibility update: ${error.message}`);
}
