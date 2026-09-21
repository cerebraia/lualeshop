'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapExpense } from './mappers';
import type { Expense } from '@/lib/types';

export const supabaseExpenseRepository = {
  async findAll(): Promise<Expense[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('expenses')
      .select('*, expense_categories (slug)')
      .is('archived_at', null)
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapExpense);
  },

  async findById(id: string): Promise<Expense | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('expenses')
      .select('*, expense_categories (slug)')
      .eq('id', id)
      .single();
    if (error) return undefined;
    return mapExpense(data);
  },

  async create(expense: Expense): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    // Resolve category_id from slug
    const { data: cat } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('slug', expense.category)
      .single();

    const { error } = await supabase.from('expenses').insert({
      id:             expense.id,
      expense_date:   expense.date,
      category_id:    cat?.id,
      description:    expense.description,
      amount:         expense.amount,
      payment_method: expense.paymentMethod,
      notes:          expense.notes,
    });
    if (error) throw error;
  },

  async update(updated: Expense): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const { data: cat } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('slug', updated.category)
      .single();

    const { error } = await supabase.from('expenses').update({
      expense_date:   updated.date,
      category_id:    cat?.id,
      description:    updated.description,
      amount:         updated.amount,
      payment_method: updated.paymentMethod,
      notes:          updated.notes,
    }).eq('id', updated.id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('expenses')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
