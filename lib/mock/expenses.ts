import type { Expense } from '../types';

export const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    date: '2024-09-01',
    category: 'merchandise',
    description: 'Compra de mercancía inicial — Set León y Pijamas',
    amount: 145,
    paymentMethod: 'transfer',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'exp-002',
    date: '2024-09-05',
    category: 'packaging',
    description: 'Bolsas y cajas para empaque',
    amount: 30,
    paymentMethod: 'cash',
    createdAt: '2024-09-05T00:00:00Z',
  },
  {
    id: 'exp-003',
    date: '2024-09-08',
    category: 'advertising',
    description: 'Publicidad en Instagram — septiembre',
    amount: 20,
    paymentMethod: 'mobile_payment',
    createdAt: '2024-09-08T00:00:00Z',
  },
  {
    id: 'exp-004',
    date: '2024-09-10',
    category: 'delivery',
    description: 'Delivery El Hatillo × 2',
    amount: 8,
    paymentMethod: 'cash',
    createdAt: '2024-09-10T00:00:00Z',
  },
];
