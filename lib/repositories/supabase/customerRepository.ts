'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapCustomer } from './mappers';
import type { Customer } from '@/lib/types';

export const supabaseCustomerRepository = {
  async findAll(): Promise<Customer[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('customers')
      .select('*, orders (id)')
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCustomer);
  },

  async findById(id: string): Promise<Customer | undefined> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('customers')
      .select('*, orders (id)')
      .eq('id', id)
      .single();
    if (error) return undefined;
    return mapCustomer(data);
  },

  async create(customer: Customer): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('customers')
      .insert({
        id:      customer.id,
        name:    customer.name,
        phone:   customer.phone,
        city:    customer.city,
        address: customer.address,
        notes:   customer.notes,
      });
    if (error) throw error;
  },

  async update(updated: Customer): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('customers')
      .update({
        name:    updated.name,
        phone:   updated.phone,
        city:    updated.city,
        address: updated.address,
        notes:   updated.notes,
      })
      .eq('id', updated.id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('customers')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
