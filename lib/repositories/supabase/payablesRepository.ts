'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Payable, PayablePayment, PayableStatus, PaymentMethod } from '@/lib/types';

function derivePayableStatus(
  storedStatus: string,
  balance: number,
  paidAmount: number,
  dueDate?: string | null
): PayableStatus {
  if (storedStatus === 'cancelled') return 'cancelled';
  if (balance <= 0) return 'paid';
  if (paidAmount > 0) return 'partial';
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
  return 'pending';
}

function mapPayablePayment(row: Record<string, unknown>): PayablePayment {
  return {
    id:            String(row.id),
    payableId:     String(row.payable_id),
    amount:        Number(row.amount),
    paymentDate:   String(row.payment_date),
    paymentMethod: (row.payment_method ?? 'other') as PaymentMethod,
    reference:     row.reference ? String(row.reference) : undefined,
    notes:         row.notes ? String(row.notes) : undefined,
    expenseId:     row.expense_id ? String(row.expense_id) : undefined,
    voidedAt:      row.voided_at ? String(row.voided_at) : undefined,
    voidReason:    row.void_reason ? String(row.void_reason) : undefined,
    createdAt:     String(row.created_at),
  };
}

function mapPayable(row: Record<string, unknown>, payments: PayablePayment[]): Payable {
  const validPayments = payments.filter((p) => !p.voidedAt);
  const paidAmount = validPayments.reduce((s, p) => s + p.amount, 0);
  const originalAmount = Number(row.original_amount);
  const balance = Math.max(0, originalAmount - paidAmount);
  const dueDate = row.due_date ? String(row.due_date) : undefined;
  const supplier = row.suppliers as Record<string, unknown> | null;

  return {
    id:             String(row.id),
    supplierId:     row.supplier_id ? String(row.supplier_id) : undefined,
    supplierName:   supplier?.name ? String(supplier.name) : undefined,
    creditorName:   String(row.creditor_name),
    description:    String(row.description),
    categoryId:     row.category_id ? String(row.category_id) : undefined,
    categoryName:   (row.expense_categories as Record<string, unknown> | null)?.name
                      ? String((row.expense_categories as Record<string, unknown>).name)
                      : undefined,
    originalAmount,
    paidAmount,
    balance,
    currency:       String(row.currency ?? 'EUR'),
    issueDate:      String(row.issue_date),
    dueDate,
    status:         derivePayableStatus(String(row.status), balance, paidAmount, dueDate),
    notes:          row.notes ? String(row.notes) : undefined,
    createdAt:      String(row.created_at),
    payments,
  };
}

export const supabasePayablesRepository = {
  async findAll(): Promise<Payable[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('payables')
      .select('*, suppliers(name), expense_categories(name), payable_payments(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => {
      const payments = ((row.payable_payments ?? []) as Record<string, unknown>[]).map(mapPayablePayment);
      return mapPayable(row, payments);
    });
  },

  async findById(id: string): Promise<Payable | undefined> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('payables')
      .select('*, suppliers(name), expense_categories(name), payable_payments(*)')
      .eq('id', id)
      .single();
    if (error) return undefined;
    const payments = ((data?.payable_payments ?? []) as Record<string, unknown>[]).map(mapPayablePayment);
    return mapPayable(data as Record<string, unknown>, payments);
  },

  async create(p: {
    creditorName: string;
    description: string;
    originalAmount: number;
    issueDate: string;
    dueDate?: string;
    supplierId?: string;
    categoryId?: string;
    notes?: string;
  }): Promise<string> {
    const { data, error } = await getSupabaseBrowserClient().rpc('create_payable', {
      p_creditor_name:   p.creditorName,
      p_description:     p.description,
      p_original_amount: p.originalAmount,
      p_issue_date:      p.issueDate,
      p_due_date:        p.dueDate ?? null,
      p_supplier_id:     p.supplierId ?? null,
      p_category_id:     p.categoryId ?? null,
      p_notes:           p.notes ?? null,
    });
    if (error) throw error;
    return (data as { payable_id: string }).payable_id;
  },

  async registerPayment(
    payableId: string,
    amount: number,
    method: PaymentMethod,
    date: string,
    reference?: string,
    notes?: string
  ): Promise<{ paymentId: string; expenseId: string }> {
    const { data, error } = await getSupabaseBrowserClient().rpc('register_payable_payment', {
      p_payable_id: payableId,
      p_amount:     amount,
      p_method:     method,
      p_date:       date,
      p_reference:  reference ?? null,
      p_notes:      notes ?? null,
    });
    if (error) throw error;
    const d = data as { payment_id: string; expense_id: string };
    return { paymentId: d.payment_id, expenseId: d.expense_id };
  },

  async voidPayment(paymentId: string, reason: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('void_payable_payment', {
      p_payment_id: paymentId,
      p_reason:     reason,
    });
    if (error) throw error;
  },

  async cancel(payableId: string, reason?: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('cancel_payable', {
      p_payable_id: payableId,
      p_reason:     reason ?? null,
    });
    if (error) throw error;
  },

  async update(payableId: string, fields: {
    creditorName?: string;
    description?: string;
    dueDate?: string | null;
    notes?: string;
  }): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('update_payable', {
      p_payable_id:    payableId,
      p_creditor_name: fields.creditorName ?? null,
      p_description:   fields.description ?? null,
      p_due_date:      fields.dueDate ?? null,
      p_notes:         fields.notes ?? null,
      p_clear_due_date: fields.dueDate === null,
    });
    if (error) throw error;
  },

  async getSummary(): Promise<{
    totalPayable: number;
    overduePayable: number;
    dueIn7Days: number;
  }> {
    const all = await this.findAll();
    const open = all.filter((p) => p.balance > 0 && p.status !== 'cancelled');
    const today = new Date();
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    return {
      totalPayable:   open.reduce((s, p) => s + p.balance, 0),
      overduePayable: open
        .filter((p) => p.status === 'overdue')
        .reduce((s, p) => s + p.balance, 0),
      dueIn7Days: open
        .filter((p) => p.dueDate && new Date(p.dueDate) >= today && new Date(p.dueDate) <= in7)
        .reduce((s, p) => s + p.balance, 0),
    };
  },
};
