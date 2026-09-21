'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapInventoryMovement, mapMerchandiseEntry } from './mappers';
import type { InventoryMovement, MerchandiseEntry } from '@/lib/types';

export const supabaseInventoryRepository = {
  async findAllMovements(): Promise<InventoryMovement[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('inventory_movements')
      .select('*, product_variants (product_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => mapInventoryMovement({ ...row, variant: row['product_variants'] }));
  },

  async findMovementsByProduct(productId: string): Promise<InventoryMovement[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('inventory_movements')
      .select('*, product_variants!inner (product_id)')
      .eq('product_variants.product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => mapInventoryMovement({ ...row, variant: row['product_variants'] }));
  },

  async createMovement(_movement: InventoryMovement): Promise<void> {
    // Movements are created via RPC (adjust_inventory), never directly
    throw new Error(
      'Use the adjust_inventory RPC instead of creating movements directly. ' +
        'Call: supabase.rpc("adjust_inventory", { p_variant_id, p_delta, p_reason })'
    );
  },

  async findAllEntries(): Promise<MerchandiseEntry[]> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('merchandise_entries')
      .select(`
        *,
        suppliers (name),
        merchandise_entry_items (*, product_variants (product_id))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapMerchandiseEntry);
  },

  async createEntry(entry: MerchandiseEntry): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.from('merchandise_entries').insert({
      id:               entry.id,
      reference:        entry.reference,
      entry_date:       entry.date,
      additional_costs: entry.additionalCosts,
      notes:            entry.notes,
      status:           'draft',
    }).select('id').single();
    if (error) throw error;

    // Insert items
    if (entry.items.length > 0) {
      const { error: itemErr } = await supabase.from('merchandise_entry_items').insert(
        entry.items.map((it) => ({
          merchandise_entry_id: data.id,
          variant_id:           it.variantId,
          quantity:             it.quantity,
          unit_cost:            it.unitCost,
        }))
      );
      if (itemErr) throw itemErr;
    }
  },
};
