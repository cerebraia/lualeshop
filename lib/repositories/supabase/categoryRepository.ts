'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapCategory } from './mappers';
import type { Category } from '@/lib/types';

export const supabaseCategoryRepository = {
  async findAll(): Promise<Category[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  },

  async findActive(): Promise<Category[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  },

  async findById(id: string): Promise<Category | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return undefined;
    return mapCategory(data);
  },

  async findBySlug(slug: string): Promise<Category | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) return undefined;
    return mapCategory(data);
  },

  async create(category: Category): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('categories')
      .insert({
        id:          category.id,
        name:        category.name,
        slug:        category.slug,
        description: category.description,
        active:      category.active,
        sort_order:  category.order,
      });
    if (error) throw error;
  },

  async update(updated: Category): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('categories')
      .update({
        name:        updated.name,
        slug:        updated.slug,
        description: updated.description,
        active:      updated.active,
        sort_order:  updated.order,
      })
      .eq('id', updated.id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
