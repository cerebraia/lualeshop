'use client';

import { storageGet, storageSet } from '../storage';
import { mockProducts } from '../mock/products';
import type { Product } from '../types';

const KEY = 'products';

function seed(): Product[] {
  const stored = storageGet<Product[] | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockProducts);
  return mockProducts;
}

export const productRepository = {
  findAll(): Product[] {
    return seed();
  },

  findById(id: string): Product | undefined {
    return seed().find((p) => p.id === id);
  },

  findBySlug(slug: string): Product | undefined {
    return seed().find((p) => p.slug === slug);
  },

  findByCategoryId(categoryId: string): Product[] {
    return seed().filter((p) => p.categoryIds.includes(categoryId) && p.visible);
  },

  findFeatured(): Product[] {
    return seed().filter((p) => p.featured && p.visible);
  },

  findNew(): Product[] {
    return seed().filter((p) => p.isNew && p.visible);
  },

  findVisible(): Product[] {
    return seed().filter((p) => p.visible);
  },

  findWithoutImages(): Product[] {
    return seed().filter((p) => p.images.length === 0);
  },

  findInventoryNotConfigured(): Product[] {
    return seed().filter((p) => !p.inventoryConfigured);
  },

  create(product: Product): void {
    const products = seed();
    storageSet(KEY, [...products, product]);
  },

  update(updated: Product): void {
    const products = seed().map((p) => (p.id === updated.id ? updated : p));
    storageSet(KEY, products);
  },

  delete(id: string): void {
    storageSet(KEY, seed().filter((p) => p.id !== id));
  },

  reset(): void {
    storageSet(KEY, mockProducts);
  },

  migrate(): void {
    // Called externally (e.g. from MigrationRunner or admin page)
    // The actual migration logic is in lib/migrations.ts
    // This method just reseeds if needed
    const stored = storageGet<Product[] | null>(KEY, null);
    if (stored === null) {
      storageSet(KEY, mockProducts);
    }
  },
};
