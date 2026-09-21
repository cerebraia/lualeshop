'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapOrder } from './mappers';
import type { Order } from '@/lib/types';

const ORDER_SELECT = `
  *, order_items (*), order_payments (payment_method)
`;

export const supabaseOrderRepository = {
  async findAll(): Promise<Order[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapOrder);
  },

  async findById(id: string): Promise<Order | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', id)
      .single();
    if (error) return undefined;
    return mapOrder(data);
  },

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('orders')
      .select(ORDER_SELECT)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapOrder);
  },

  async findPaid(): Promise<Order[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('orders')
      .select(ORDER_SELECT)
      .eq('payment_status', 'paid')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapOrder);
  },

  async update(updated: Order): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('orders')
      .update({
        status:         updated.status,
        payment_status: updated.paymentStatus,
        notes:          updated.notes,
      })
      .eq('id', updated.id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    // Cancels via RPC to ensure inventory is restored
    const { error } = await getSupabaseBrowserClient()
      .rpc('cancel_order', { p_order_id: id, p_reason: 'Deleted via admin panel' });
    if (error) throw error;
  },
};
