'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface FinanceSummary {
  totalRevenue:   number;
  totalExpenses:  number;
  profit:         number;
  paidOrderCount: number;
  expenseCount:   number;
}

export const supabaseFinanceRepository = {
  async getSummary(from?: string, to?: string): Promise<FinanceSummary> {
    const supabase = getSupabaseBrowserClient();

    // Revenue: sum of paid orders that are not cancelled
    let revenueQuery = supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .neq('status', 'cancelled');

    if (from) revenueQuery = revenueQuery.gte('created_at', from);
    if (to)   revenueQuery = revenueQuery.lte('created_at', to + 'T23:59:59');

    const { data: revenueRows, error: revErr } = await revenueQuery;
    if (revErr) throw revErr;

    const totalRevenue = (revenueRows ?? []).reduce((s: number, o: {total: unknown}) => s + Number(o.total), 0);
    const paidOrderCount = revenueRows?.length ?? 0;

    // Expenses: sum of active expenses
    let expQuery = supabase
      .from('expenses')
      .select('amount')
      .is('archived_at', null);

    if (from) expQuery = expQuery.gte('expense_date', from);
    if (to)   expQuery = expQuery.lte('expense_date', to);

    const { data: expRows, error: expErr } = await expQuery;
    if (expErr) throw expErr;

    const totalExpenses = (expRows ?? []).reduce((s: number, e: {amount: unknown}) => s + Number(e.amount), 0);
    const expenseCount  = expRows?.length ?? 0;

    return {
      totalRevenue,
      totalExpenses,
      profit:        totalRevenue - totalExpenses,
      paidOrderCount,
      expenseCount,
    };
  },
};
