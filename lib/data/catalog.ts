/**
 * Server-side catalog data access.
 * Routes between static mock data and Supabase based on DATA_PROVIDER.
 * Import only from Server Components — never from 'use client' files.
 */

import { getDataProvider } from '@/lib/data-provider';
import { mockProducts } from '@/lib/mock/products';
import { mockCategories } from '@/lib/mock/categories';
import type { Product, Category } from '@/lib/types';

const PRODUCT_SELECT = `
  *,
  product_variants (*, inventory_levels (quantity_on_hand)),
  product_purchase_options (*),
  product_images (*),
  product_categories (category_id)
`;

async function getSupabase() {
  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  return getSupabaseServerClient();
}

function getMapped() {
  return import('@/lib/repositories/supabase/mappers');
}

export async function getVisibleProducts(): Promise<Product[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .order('catalog_number');
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapProduct);
  }
  return mockProducts.filter((p) => p.visible);
}

export async function getAllProducts(): Promise<Product[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .order('catalog_number');
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapProduct);
  }
  return mockProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();
    if (error) return undefined;
    return mapProduct(data);
  }
  return mockProducts.find((p) => p.slug === slug && p.visible);
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(`${PRODUCT_SELECT}, product_categories!inner (category_id)`)
      .eq('status', 'active')
      .eq('product_categories.category_id', categoryId)
      .order('catalog_number');
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapProduct);
  }
  return mockProducts.filter((p) => p.visible && p.categoryIds.includes(categoryId));
}

export async function getFeaturedProducts(limit = 16): Promise<Product[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .eq('featured', true)
      .order('featured_order', { nullsFirst: false })
      .order('catalog_number')
      .limit(limit);
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapProduct);
  }
  return mockProducts
    .filter((p) => p.visible && p.featured)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
    .slice(0, limit);
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapProduct }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .eq('is_new', true)
      .order('catalog_number')
      .limit(limit);
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapProduct);
  }
  return mockProducts
    .filter((p) => p.visible && p.isNew)
    .sort((a, b) => (a.catalogNumber ?? 0) - (b.catalogNumber ?? 0))
    .slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapCategory }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order');
    if (error) throw new Error(`[Catalog] ${error.message}`);
    return (data ?? []).map(mapCategory);
  }
  return mockCategories.filter((c) => c.active).sort((a, b) => a.order - b.order);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (getDataProvider() === 'supabase') {
    const [supabase, { mapCategory }] = await Promise.all([getSupabase(), getMapped()]);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();
    if (error) return undefined;
    return mapCategory(data);
  }
  return mockCategories.find((c) => c.slug === slug && c.active);
}
