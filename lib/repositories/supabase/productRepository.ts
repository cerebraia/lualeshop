'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapProduct } from './mappers';
import type { Product } from '@/lib/types';

const PRODUCT_SELECT = `
  *,
  product_variants (*, inventory_levels (quantity_on_hand)),
  product_purchase_options (*),
  product_images (*),
  product_categories (category_id)
`;

export const supabaseProductRepository = {
  async findAll(): Promise<Product[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('products')
      .select(PRODUCT_SELECT)
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
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('products').insert({
      id:                   product.id,
      sku:                  product.sku,
      slug:                 product.slug,
      name:                 product.name,
      garment_type:         product.garmentType,
      description:          product.description,
      status:               product.visible ? 'active' : 'draft',
      manual_availability:  'consult',
      featured:             product.featured,
      is_new:               product.isNew,
      inventory_configured: product.inventoryConfigured,
      tags:                 product.tags,
      catalog_number:       product.catalogNumber,
      size_note:            product.sizeNote,
    });
    if (error) throw error;
  },

  async update(updated: Product): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('products')
      .update({
        name:                 updated.name,
        garment_type:         updated.garmentType,
        description:          updated.description,
        status:               updated.visible ? 'active' : 'draft',
        featured:             updated.featured,
        featured_order:       updated.featuredOrder ?? null,
        is_new:               updated.isNew,
        inventory_configured: updated.inventoryConfigured,
        tags:                 updated.tags,
        size_note:            updated.sizeNote,
      })
      .eq('id', updated.id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('products')
      .update({ status: 'archived' })  // soft delete
      .eq('id', id);
    if (error) throw error;
  },
};
