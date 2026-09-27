/**
 * Category page integration tests.
 *
 * These run with DATA_PROVIDER=mock (vitest default — env var not set).
 * They verify the logic that the category Server Components depend on,
 * and catch regressions in the Supabase query structure.
 */

import { describe, it, expect } from 'vitest';
import { mockProducts, mockCategories } from '../lib/mock/index';
import { getCategoryBySlug, getProductsByCategory } from '../lib/data/catalog';

// ── getCategoryBySlug ─────────────────────────────────────────────────────────

describe('getCategoryBySlug (mock provider)', () => {
  it('returns Bebés for slug "bebes"', async () => {
    const cat = await getCategoryBySlug('bebes');
    expect(cat).toBeDefined();
    expect(cat?.name).toBe('Bebés');
    expect(cat?.active).toBe(true);
  });

  it('returns Niñas for slug "ninas"', async () => {
    const cat = await getCategoryBySlug('ninas');
    expect(cat).toBeDefined();
    expect(cat?.name).toBe('Niñas');
  });

  it('returns Niños for slug "ninos"', async () => {
    const cat = await getCategoryBySlug('ninos');
    expect(cat).toBeDefined();
    expect(cat?.name).toBe('Niños');
  });

  it('returns undefined for a nonexistent slug (triggers notFound in page)', async () => {
    const result = await getCategoryBySlug('categoria-que-no-existe');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', async () => {
    const result = await getCategoryBySlug('');
    expect(result).toBeUndefined();
  });
});

// ── getProductsByCategory ─────────────────────────────────────────────────────

describe('getProductsByCategory (mock provider)', () => {
  it('Bebés returns exactly 31 products', async () => {
    const cat = await getCategoryBySlug('bebes');
    const products = await getProductsByCategory(cat!.id);
    expect(products).toHaveLength(31);
  });

  it('Niñas returns exactly 7 products', async () => {
    const cat = await getCategoryBySlug('ninas');
    const products = await getProductsByCategory(cat!.id);
    expect(products).toHaveLength(7);
  });

  it('Niños returns exactly 8 products', async () => {
    const cat = await getCategoryBySlug('ninos');
    const products = await getProductsByCategory(cat!.id);
    expect(products).toHaveLength(8);
  });

  it('returns only visible products', async () => {
    const cat = await getCategoryBySlug('bebes');
    const products = await getProductsByCategory(cat!.id);
    for (const p of products) {
      expect(p.visible, `${p.sku} should be visible`).toBe(true);
    }
  });

  it('no duplicate product IDs within a category', async () => {
    for (const slug of ['bebes', 'ninas', 'ninos'] as const) {
      const cat = await getCategoryBySlug(slug);
      const products = await getProductsByCategory(cat!.id);
      const ids = products.map((p) => p.id);
      expect(new Set(ids).size, `Duplicates in ${slug}`).toBe(ids.length);
    }
  });

  it('nonexistent category ID returns empty array (no throw)', async () => {
    const result = await getProductsByCategory('00000000-0000-0000-0000-000000000000');
    expect(result).toHaveLength(0);
  });

  it('total across all three categories sums to 46', async () => {
    const counts = await Promise.all(
      ['bebes', 'ninas', 'ninos'].map(async (slug) => {
        const cat = await getCategoryBySlug(slug);
        return (await getProductsByCategory(cat!.id)).length;
      })
    );
    expect(counts.reduce((a, b) => a + b, 0)).toBe(46);
  });
});

// ── Supabase select string integrity ─────────────────────────────────────────

describe('Supabase select string integrity', () => {
  it('PRODUCT_SELECT does not appear duplicated in getProductsByCategory source', async () => {
    // Read the source file and verify product_categories appears exactly ONCE
    // in the select used for category queries. This catches the regression
    // that caused React error #441 / digest 1549173734 in production.
    const { readFileSync } = await import('fs');
    const source = readFileSync('lib/data/catalog.ts', 'utf-8');

    // The two-step approach uses PRODUCT_SELECT (without !inner) in step 2.
    // Verify there is NO line combining both product_categories forms.
    const hasDuplicate = source.includes(
      'product_categories (category_id), product_categories!inner'
    ) || source.includes(
      '`${PRODUCT_SELECT}, product_categories!inner'
    );
    expect(hasDuplicate, 'product_categories must not appear twice in any select').toBe(false);
  });

  it('mockCategories has exactly 3 active categories', () => {
    const active = mockCategories.filter((c) => c.active);
    expect(active).toHaveLength(3);
    const slugs = active.map((c) => c.slug).sort();
    expect(slugs).toEqual(['bebes', 'ninas', 'ninos']);
  });

  it('mock data total: 31 + 7 + 8 = 46', () => {
    const catBebes = mockCategories.find((c) => c.slug === 'bebes')!;
    const catNinas = mockCategories.find((c) => c.slug === 'ninas')!;
    const catNinos = mockCategories.find((c) => c.slug === 'ninos')!;
    const bebes = mockProducts.filter((p) => p.visible && p.categoryIds.includes(catBebes.id));
    const ninas = mockProducts.filter((p) => p.visible && p.categoryIds.includes(catNinas.id));
    const ninos = mockProducts.filter((p) => p.visible && p.categoryIds.includes(catNinos.id));
    expect(bebes).toHaveLength(31);
    expect(ninas).toHaveLength(7);
    expect(ninos).toHaveLength(8);
    expect(bebes.length + ninas.length + ninos.length).toBe(46);
  });
});
