'use client';

import { storageGet, storageSet } from './storage';
import { mockProducts } from './mock/products';
import type { Product } from './types';

const SCHEMA_VERSION_KEY = 'luale_schema_version';
const TARGET_VERSION = '3';

export function runMigrations(): void {
  if (typeof window === 'undefined') return;
  const current = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (current === TARGET_VERSION) return;

  if (!current || current === '1') {
    migrateToV2();
  }
  if (!current || current === '1' || current === '2') {
    migrateToV3();
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, TARGET_VERSION);
}

function migrateToV2(): void {
  // Merge new catalog products into existing stored products
  const stored = storageGet<Product[] | null>('products', null);
  if (stored === null) {
    storageSet('products', mockProducts);
    return;
  }

  const storedById = new Map(stored.map((p) => [p.id, p]));
  const merged: Product[] = [];

  for (const p of stored) {
    if (!p.id.startsWith('prod-')) merged.push(p);
  }

  for (const mockProd of mockProducts) {
    const storedProd = storedById.get(mockProd.id);
    merged.push(storedProd ?? mockProd);
  }

  storageSet('products', merged);
}

function migrateToV3(): void {
  // Add real product images to stored products that have no image or only placeholders.
  // - Never overwrite images already added manually by an admin user.
  // - Match by catalogNumber for reliability.
  const stored = storageGet<Product[] | null>('products', null);
  if (stored === null) {
    // First run — seed directly with full catalog (already has images)
    storageSet('products', mockProducts);
    return;
  }

  // Build a lookup from catalogNumber → real image path (from the updated mockProducts)
  const realImageByCat = new Map<number, string>();
  for (const mp of mockProducts) {
    if (mp.catalogNumber != null && mp.images[0]) {
      realImageByCat.set(mp.catalogNumber, mp.images[0]);
    }
  }

  const isPlaceholderOrEmpty = (images: string[]) =>
    images.length === 0 ||
    images.every((img) => !img || img.startsWith('/images/placeholder'));

  let changed = 0;
  const updated = stored.map((p) => {
    // Only update catalog products (id starts with 'prod-')
    if (!p.id.startsWith('prod-')) return p;
    // Only update if images are empty or placeholder
    if (!isPlaceholderOrEmpty(p.images)) return p;
    // Look up real image by catalogNumber
    const realImg = p.catalogNumber != null ? realImageByCat.get(p.catalogNumber) : undefined;
    if (!realImg) return p;
    changed++;
    return { ...p, images: [realImg], updatedAt: new Date().toISOString() };
  });

  if (changed > 0) {
    storageSet('products', updated);
  }
}
