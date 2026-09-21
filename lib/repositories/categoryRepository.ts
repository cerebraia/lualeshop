'use client';

import { storageGet, storageSet } from '../storage';
import { mockCategories } from '../mock/categories';
import type { Category } from '../types';

const KEY = 'categories';

function seed(): Category[] {
  const stored = storageGet<Category[] | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockCategories);
  return mockCategories;
}

export const categoryRepository = {
  findAll(): Category[] {
    return seed().sort((a, b) => a.order - b.order);
  },

  findActive(): Category[] {
    return seed()
      .filter((c) => c.active)
      .sort((a, b) => a.order - b.order);
  },

  findById(id: string): Category | undefined {
    return seed().find((c) => c.id === id);
  },

  findBySlug(slug: string): Category | undefined {
    return seed().find((c) => c.slug === slug);
  },

  create(category: Category): void {
    const categories = seed();
    storageSet(KEY, [...categories, category]);
  },

  update(updated: Category): void {
    const categories = seed().map((c) => (c.id === updated.id ? updated : c));
    storageSet(KEY, categories);
  },

  delete(id: string): void {
    storageSet(KEY, seed().filter((c) => c.id !== id));
  },

  reset(): void {
    storageSet(KEY, mockCategories);
  },
};
