'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Receivable, ReceivablePayment, ReceivableStatus, PaymentMethod } from '@/lib/types';

/** Derive the display status from stored fields. Never stored in DB to avoid divergence. */
function deriveStatus(
  orderStatus: string,
  balance: number,
  paidAmount: number,
  dueDate?: string | null
): ReceivableStatus {
  if (orderStatus === 'cancelled') return 'cancelled';
  if (balance <= 0) return 'paid';
  if (paidAmount > 0) return 'partial';
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
  return 'pending';
}

function mapPayment(row: Record<string, unknown>): ReceivablePayment {
  return {
    id:         String(row.id),
    orderId:    String(row.order_id),
    amount:     Number(row.amount),
    date:       String(row.payment_date ?? row.created_at),
    method:     (row.payment_method ?? 'other') as PaymentMethod,
    reference:  row.reference ? String(row.reference) : undefined,
    notes:      row.notes ? String(row.notes) : undefined,
    voidedAt:   row.voided_at ? String(row.voided_at) : undefined,
    voidReason: row.void_reason ? String(row.void_reason) : undefined,
    createdAt:  String(row.created_at),
  };
}

function mapReceivable(row: Record<string, unknown>, payments: ReceivablePayment[]): Receivable {
  const validPayments = payments.filter((p) => !p.voidedAt);
  const paidAmount = validPayments.reduce((s, p) => s + p.amount, 0);
  const total = Number(row.total);
  const balance = Math.max(0, total - paidAmount);
  const dueDate = row.due_date ? String(row.due_date) : undefined;
  return {
    orderId:     String(row.id),
    orderNumber: String(row.order_number ?? row.id),
    customerId:  String(row.customer_id ?? ''),
    customerName: String(row.customer_name_snapshot ?? ''),
    total,
    paidAmount,
    balance,
    dueDate,
    orderStatus: row.status as Receivable['orderStatus'],
    status:      deriveStatus(String(row.status), balance, paidAmount, dueDate),
    notes:       row.notes ? String(row.notes) : undefined,
    createdAt:   String(row.created_at),
    payments,
  };
}

export const supabaseReceivablesRepository = {
  async findAll(): Promise<Receivable[]> {
    const supabase = getSupabaseBrowserClient();
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_payments(*)')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (orders ?? []).map((o: Record<string, unknown>) => {
      const payments = ((o.order_payments ?? []) as Record<string, unknown>[]).map(mapPayment);
      return mapReceivable(o, payments);
    });
  },

  async findById(orderId: string): Promise<Receivable | undefined> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_payments(*)')
      .eq('id', orderId)
      .single();
    if (error) return undefined;
    const payments = ((data?.order_payments ?? []) as Record<string, unknown>[]).map(mapPayment);
    return mapReceivable(data as Record<string, unknown>, payments);
  },

  async registerPayment(
    orderId: string,
    amount: number,
    method: PaymentMethod,
    date: string,
    reference?: string,
    notes?: string
  ): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('register_order_payment', {
      p_order_id:  orderId,
      p_amount:    amount,
      p_method:    method,
      p_date:      date,
      p_reference: reference ?? null,
      p_notes:     notes ?? null,
    });
    if (error) throw error;
  },

  async voidPayment(paymentId: string, reason: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('void_order_payment', {
      p_payment_id: paymentId,
      p_reason:     reason,
    });
    if (error) throw error;
  },

  async setDueDate(orderId: string, dueDate: string | null): Promise<void> {
    const { error } = await getSupabaseBrowserClient().rpc('set_order_due_date', {
      p_order_id: orderId,
      p_due_date: dueDate,
    });
    if (error) throw error;
  },

  /** Summary metrics */
  async getSummary(): Promise<{
    totalReceivable: number;
    overdueReceivable: number;
    dueIn7Days: number;
  }> {
    const all = await this.findAll();
    const open = all.filter((r) => r.balance > 0);
    const today = new Date();
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    return {
      totalReceivable:   open.reduce((s, r) => s + r.balance, 0),
      overdueReceivable: open
        .filter((r) => r.status === 'overdue')
        .reduce((s, r) => s + r.balance, 0),
      dueIn7Days: open
        .filter((r) => r.dueDate && new Date(r.dueDate) >= today && new Date(r.dueDate) <= in7)
        .reduce((s, r) => s + r.balance, 0),
    };
  },
};
