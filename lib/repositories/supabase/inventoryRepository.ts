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

  /** Adjust inventory via the transactional RPC (records movement + updates levels). */
  async createMovement(movement: InventoryMovement): Promise<void> {
    const delta =
      movement.type === 'exit'
        ? -Math.abs(movement.quantity)
        : Math.abs(movement.quantity);

    const { error } = await getSupabaseBrowserClient().rpc('adjust_inventory', {
      p_variant_id: movement.variantId,
      p_delta:      delta,
      p_reason:     movement.reason ?? 'Ajuste manual',
    });
    if (error) throw new Error(`adjust_inventory: ${error.message}`);
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

  async createEntry(entry: MerchandiseEntry): Promise<string> {
    const supabase = getSupabaseBrowserClient();
    // Don't pass id — let Supabase generate UUID via DEFAULT gen_random_uuid()
    const { data, error } = await supabase.from('merchandise_entries').insert({
      reference:        entry.reference,
      entry_date:       entry.date,
      additional_costs: entry.additionalCosts,
      notes:            entry.notes ?? null,
      status:           'draft',
    }).select('id').single();
    if (error) throw new Error(`merchandise_entries insert: ${error.message}`);

    // Insert items referencing the Supabase-generated ID
    if (entry.items.length > 0) {
      const { error: itemErr } = await supabase.from('merchandise_entry_items').insert(
        entry.items.map((it) => ({
          merchandise_entry_id: data.id,
          variant_id:           it.variantId,
          quantity:             it.quantity,
          unit_cost:            it.unitCost,
        }))
      );
      if (itemErr) throw new Error(`merchandise_entry_items insert: ${itemErr.message}`);
    }

    return data.id;
  },

  /** Confirm a merchandise entry: atomically adjusts inventory via RPC. */
  async confirmEntry(entryId: string): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .rpc('confirm_merchandise_entry', { p_entry_id: entryId });
    if (error) throw new Error(`confirm_merchandise_entry: ${error.message}`);
  },
};
