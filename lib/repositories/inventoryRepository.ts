'use client';

import { storageGet, storageSet } from '../storage';
import { mockInventoryMovements, mockMerchandiseEntries } from '../mock/inventory';
import type { InventoryMovement, MerchandiseEntry } from '../types';

const MOV_KEY = 'inventory_movements';
const ENT_KEY = 'merchandise_entries';

function seedMovements(): InventoryMovement[] {
  const stored = storageGet<InventoryMovement[] | null>(MOV_KEY, null);
  if (stored !== null) return stored;
  storageSet(MOV_KEY, mockInventoryMovements);
  return mockInventoryMovements;
}

function seedEntries(): MerchandiseEntry[] {
  const stored = storageGet<MerchandiseEntry[] | null>(ENT_KEY, null);
  if (stored !== null) return stored;
  storageSet(ENT_KEY, mockMerchandiseEntries);
  return mockMerchandiseEntries;
}

export const inventoryRepository = {
  findAllMovements(): InventoryMovement[] {
    return seedMovements().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  findMovementsByProduct(productId: string): InventoryMovement[] {
    return seedMovements().filter((m) => m.productId === productId);
  },

  createMovement(movement: InventoryMovement): void {
    storageSet(MOV_KEY, [...seedMovements(), movement]);
  },

  findAllEntries(): MerchandiseEntry[] {
    return seedEntries().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  createEntry(entry: MerchandiseEntry): void {
    storageSet(ENT_KEY, [...seedEntries(), entry]);
  },

  reset(): void {
    storageSet(MOV_KEY, mockInventoryMovements);
    storageSet(ENT_KEY, mockMerchandiseEntries);
  },
};
