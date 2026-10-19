'use server';

/**
 * Server Actions for product CRUD.
 *
 * Security model:
 *  1. requireActiveAdmin() validates the caller's session server-side via
 *     supabase.auth.getUser() (JWT validation, not cookie trust) and then
 *     confirms the profile is active with role admin|owner.
 *  2. getAdminClient() creates a service-role Supabase client ONLY after
 *     the caller has been authenticated. The service-role key is read from
 *     a server-only env var (no NEXT_PUBLIC_ prefix) and never reaches the
 *     browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Product, ProductPurchaseOption, InventoryStatus } from '@/lib/types';

// ── Auth guard ────────────────────────────────────────────────────────────────

/**
 * Validates the incoming request's session and confirms the caller is an
 * active admin or owner. Throws a user-readable error if not.
 *
 * Uses getUser() — not getSession() — so the JWT is verified with the auth
 * server rather than trusted from the local cookie.
 */
async function requireActiveAdmin(): Promise<void> {
  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    throw new Error('No autorizado: sesión inválida o expirada.');
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('active, role')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    throw new Error('No autorizado: perfil no encontrado.');
  }
  if (!profile.active) {
    throw new Error('No autorizado: cuenta inactiva.');
  }
  if (!['admin', 'owner'].includes(profile.role as string)) {
    throw new Error('No autorizado: se requiere rol de administrador u owner.');
  }
}

// ── Admin Supabase client (service role, server-only) ─────────────────────────

type Sb = ReturnType<typeof getAdminClient>;

function getAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin credentials not configured on server.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/**
 * Validates featured_order strictly: must be an integer 1–16 or null.
 * Throws a user-visible error for invalid values — no silent clamping.
 */
function validateFeaturedOrder(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 1 || value > 16) {
    throw new Error(
      `El orden destacado debe ser un número entero entre 1 y 16 (recibido: ${value}).`
    );
  }
  return value;
}

// ── Purchase options sync ─────────────────────────────────────────────────────

async function syncPurchaseOptions(
  sb: Sb,
  productId: string,
  fallbackPrice: number,
  options?: ProductPurchaseOption[]
): Promise<void> {
  const { data: existing, error: fetchErr } = await sb
    .from('product_purchase_options')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order');
  if (fetchErr) throw new Error(`purchase_option fetch: ${fetchErr.message} (${fetchErr.code})`);
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
        if (error) throw new Error(`purchase_option update: ${error.message} (${error.code})`);
      } else {
        const { error } = await sb.from('product_purchase_options').insert({
          product_id: productId,
          label:      opt.label,
          price:      opt.price,
          sort_order: i,
          active:     true,
        });
        if (error) throw new Error(`purchase_option insert: ${error.message} (${error.code})`);
      }
    }
    for (const ex of existingList) {
      if (!updatedIds.has(String(ex.id))) {
        const { error } = await sb
          .from('product_purchase_options')
          .delete()
          .eq('id', ex.id);
        if (error) throw new Error(`purchase_option delete: ${error.message} (${error.code})`);
      }
    }
  } else {
    if (existingList.length > 0) {
      const { error } = await sb
        .from('product_purchase_options')
        .update({ price: fallbackPrice })
        .eq('id', existingList[0].id);
      if (error) throw new Error(`purchase_option price update: ${error.message} (${error.code})`);
    } else {
      const { error } = await sb.from('product_purchase_options').insert({
        product_id: productId,
        label:      'Unidad',
        price:      fallbackPrice,
        sort_order: 0,
        active:     true,
      });
      if (error) throw new Error(`purchase_option initial insert: ${error.message} (${error.code})`);
    }
  }
}

// ── Categories sync ───────────────────────────────────────────────────────────

async function syncCategories(
  sb: Sb,
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const { error: delError } = await sb
    .from('product_categories')
    .delete()
    .eq('product_id', productId);
  if (delError) throw new Error(`category delete: ${delError.message} (${delError.code})`);

  if (categoryIds.length > 0) {
    const { error } = await sb.from('product_categories').insert(
      categoryIds.map((cid) => ({ product_id: productId, category_id: cid }))
    );
    if (error) throw new Error(`category insert: ${error.message} (${error.code})`);
  }
}

// ── Exported server actions ───────────────────────────────────────────────────

export async function createProduct(product: Product): Promise<void> {
  await requireActiveAdmin();
  const sb = getAdminClient();

  const featuredOrder = validateFeaturedOrder(product.featuredOrder);

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
    featured_order:       featuredOrder,
    is_new:               product.isNew,
    inventory_configured: product.inventoryConfigured,
    tags:                 product.tags ?? [],
    catalog_number:       product.catalogNumber ?? null,
    size_note:            product.sizeNote ?? null,
  });
  if (error) throw new Error(`product insert: ${error.message} (code: ${error.code})`);

  await syncPurchaseOptions(sb, product.id, product.price, product.purchaseOptions);
  await syncCategories(sb, product.id, product.categoryIds);

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
    if (varError) throw new Error(`variant insert: ${varError.message} (${varError.code})`);
  }
}

export async function updateProduct(product: Product): Promise<void> {
  await requireActiveAdmin();
  const sb = getAdminClient();

  const featuredOrder = validateFeaturedOrder(product.featuredOrder);

  const { error } = await sb.from('products').update({
    name:                 product.name,
    garment_type:         product.garmentType ?? '',
    description:          product.description ?? '',
    status:               product.visible ? 'active' : 'draft',
    manual_availability:  toManualAvailability(product.status),
    featured:             product.featured,
    featured_order:       featuredOrder,
    is_new:               product.isNew,
    inventory_configured: product.inventoryConfigured,
    tags:                 product.tags ?? [],
    size_note:            product.sizeNote ?? null,
  }).eq('id', product.id);
  if (error) throw new Error(`product update: ${error.message} (code: ${error.code})`);

  await syncPurchaseOptions(sb, product.id, product.price, product.purchaseOptions);
  await syncCategories(sb, product.id, product.categoryIds);
}

export async function toggleProductVisibility(
  productId: string,
  visible: boolean
): Promise<void> {
  await requireActiveAdmin();
  const sb = getAdminClient();
  const { error } = await sb
    .from('products')
    .update({ status: visible ? 'active' : 'draft' })
    .eq('id', productId);
  if (error) throw new Error(`visibility update: ${error.message} (${error.code})`);
}
