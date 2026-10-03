'use server';

/**
 * Server Actions for expense CRUD.
 * Use the service role key so RLS is bypassed — admin panel has no auth session.
 * SUPABASE_SERVICE_ROLE_KEY is a server-only env var; it never reaches the browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Expense } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin credentials not configured on server.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapRow(row: Row): Expense {
  return {
    id:            String(row.id),
    date:          String(row.expense_date),
    category:      (row.expense_categories?.slug ?? 'other') as Expense['category'],
    description:   String(row.description),
    amount:        Number(row.amount),
    paymentMethod: String(row.payment_method) as Expense['paymentMethod'],
    receiptUrl:    row.receipt_path ?? undefined,
    notes:         row.notes ?? undefined,
    createdAt:     String(row.created_at),
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_categories(slug)')
    .is('archived_at', null)
    .order('expense_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createExpense(expense: Expense): Promise<void> {
  const supabase = getAdminClient();

  const { data: cat } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('slug', expense.category)
    .single();

  const { error } = await supabase.from('expenses').insert({
    id:             expense.id,
    expense_date:   expense.date,
    category_id:    cat?.id ?? null,
    description:    expense.description,
    amount:         expense.amount,
    payment_method: expense.paymentMethod,
    notes:          expense.notes ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function archiveExpense(id: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('expenses')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
