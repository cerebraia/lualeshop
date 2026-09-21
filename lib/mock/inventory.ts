import type { InventoryMovement, MerchandiseEntry } from '../types';

export const mockInventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-001',
    productId: 'prod-002',
    variantId: 'v-002-1',
    type: 'entry',
    quantity: 10,
    reason: 'Entrada inicial de mercancía',
    reference: 'ENT-001',
    date: '2024-09-01',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'mov-002',
    productId: 'prod-002',
    variantId: 'v-002-1',
    type: 'exit',
    quantity: 2,
    reason: 'Venta — Pedido ORD-001',
    reference: 'ORD-001',
    date: '2024-09-05',
    createdAt: '2024-09-05T00:00:00Z',
  },
  {
    id: 'mov-003',
    productId: 'prod-006',
    variantId: 'v-006-4',
    type: 'adjustment',
    quantity: -1,
    reason: 'Producto dañado',
    date: '2024-09-08',
    createdAt: '2024-09-08T00:00:00Z',
  },
];

export const mockMerchandiseEntries: MerchandiseEntry[] = [
  {
    id: 'ent-001',
    date: '2024-09-01',
    reference: 'ENT-001',
    supplier: 'Proveedor Textiles Caracas',
    items: [
      { productId: 'prod-002', variantId: 'v-002-1', quantity: 10, unitCost: 10 },
      { productId: 'prod-006', variantId: 'v-006-1', quantity: 5, unitCost: 9 },
      { productId: 'prod-006', variantId: 'v-006-3', quantity: 5, unitCost: 9 },
    ],
    additionalCosts: 10,
    totalCost: 205,
    notes: 'Primera entrada de mercancía. Productos revisados y en buen estado.',
    createdAt: '2024-09-01T00:00:00Z',
  },
];
