'use client';

import { storageGet, storageSet } from '../storage';
import { mockExpenses } from '../mock/expenses';
import type { Expense } from '../types';

const KEY = 'expenses';

function seed(): Expense[] {
  const stored = storageGet<Expense[] | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockExpenses);
  return mockExpenses;
}

export const expenseRepository = {
  findAll(): Expense[] {
    return seed().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  findById(id: string): Expense | undefined {
    return seed().find((e) => e.id === id);
  },

  create(expense: Expense): void {
    storageSet(KEY, [...seed(), expense]);
  },

  update(updated: Expense): void {
    storageSet(KEY, seed().map((e) => (e.id === updated.id ? updated : e)));
  },

  delete(id: string): void {
    storageSet(KEY, seed().filter((e) => e.id !== id));
  },

  reset(): void {
    storageSet(KEY, mockExpenses);
  },
};
