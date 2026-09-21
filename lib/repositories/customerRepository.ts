'use client';

import { storageGet, storageSet } from '../storage';
import { mockCustomers } from '../mock/customers';
import type { Customer } from '../types';

const KEY = 'customers';

function seed(): Customer[] {
  const stored = storageGet<Customer[] | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockCustomers);
  return mockCustomers;
}

export const customerRepository = {
  findAll(): Customer[] {
    return seed().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById(id: string): Customer | undefined {
    return seed().find((c) => c.id === id);
  },

  create(customer: Customer): void {
    storageSet(KEY, [...seed(), customer]);
  },

  update(updated: Customer): void {
    storageSet(KEY, seed().map((c) => (c.id === updated.id ? updated : c)));
  },

  delete(id: string): void {
    storageSet(KEY, seed().filter((c) => c.id !== id));
  },

  reset(): void {
    storageSet(KEY, mockCustomers);
  },
};
