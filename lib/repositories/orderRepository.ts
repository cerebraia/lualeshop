'use client';

import { storageGet, storageSet } from '../storage';
import { mockOrders } from '../mock/orders';
import type { Order } from '../types';

const KEY = 'orders';

function seed(): Order[] {
  const stored = storageGet<Order[] | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockOrders);
  return mockOrders;
}

export const orderRepository = {
  findAll(): Order[] {
    return seed().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  findById(id: string): Order | undefined {
    return seed().find((o) => o.id === id);
  },

  findByCustomerId(customerId: string): Order[] {
    return seed().filter((o) => o.customerId === customerId);
  },

  findPaid(): Order[] {
    return seed().filter((o) => o.paymentStatus === 'paid');
  },

  create(order: Order): void {
    storageSet(KEY, [...seed(), order]);
  },

  update(updated: Order): void {
    storageSet(KEY, seed().map((o) => (o.id === updated.id ? updated : o)));
  },

  delete(id: string): void {
    storageSet(KEY, seed().filter((o) => o.id !== id));
  },

  reset(): void {
    storageSet(KEY, mockOrders);
  },
};
