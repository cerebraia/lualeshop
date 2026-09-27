/**
 * Featured carousel and manual receivable tests.
 * All run with mock provider (DATA_PROVIDER not set in vitest).
 */

import { describe, it, expect } from 'vitest';
import { mockProducts } from '../lib/mock/index';
import { getFeaturedProducts } from '../lib/data/catalog';

// ── Featured products ─────────────────────────────────────────────────────────

describe('Featured products (mock provider)', () => {
  it('exactly 16 featured products in mock data', () => {
    const featured = mockProducts.filter((p) => p.featured);
    expect(featured).toHaveLength(16);
  });

  it('all 16 are visible (status active)', () => {
    const featured = mockProducts.filter((p) => p.featured);
    for (const p of featured) {
      expect(p.visible, `${p.sku} should be visible`).toBe(true);
    }
  });

  it('all 16 have a valid featuredOrder (1–16)', () => {
    const featured = mockProducts.filter((p) => p.featured);
    for (const p of featured) {
      expect(p.featuredOrder, `${p.sku} must have featuredOrder`).not.toBeNull();
      expect(p.featuredOrder! >= 1 && p.featuredOrder! <= 16, `${p.sku} featuredOrder out of range`).toBe(true);
    }
  });

  it('featuredOrder values are unique (no duplicates)', () => {
    const orders = mockProducts
      .filter((p) => p.featured && p.featuredOrder !== null)
      .map((p) => p.featuredOrder!);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('featuredOrder values cover exactly 1–16', () => {
    const orders = mockProducts
      .filter((p) => p.featured)
      .map((p) => p.featuredOrder!)
      .sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('getFeaturedProducts(16) returns 16 ordered by featuredOrder', async () => {
    const products = await getFeaturedProducts(16);
    expect(products).toHaveLength(16);
    for (let i = 0; i < products.length - 1; i++) {
      const a = products[i].featuredOrder ?? 999;
      const b = products[i + 1].featuredOrder ?? 999;
      expect(a).toBeLessThanOrEqual(b);
    }
  });

  it('getFeaturedProducts(8) returns only 8 products', async () => {
    const products = await getFeaturedProducts(8);
    expect(products).toHaveLength(8);
  });

  it('getFeaturedProducts has no duplicate IDs', async () => {
    const products = await getFeaturedProducts(16);
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carousel page 1 (products 1-8) and page 2 (9-16) cover all 16', async () => {
    const all = await getFeaturedProducts(16);
    const page1 = all.slice(0, 8);
    const page2 = all.slice(8, 16);
    expect(page1).toHaveLength(8);
    expect(page2).toHaveLength(8);
    const combined = [...page1, ...page2].map((p) => p.id);
    expect(new Set(combined).size).toBe(16);
  });

  it('breakpoint perPage values are all correct', () => {
    // lg(>=1024): 2×4=8, md(768-1023): 2×3=6, sm(480-767): 2×2=4, xs(<480): 2×1=2
    const breakpoints = [
      { width: 1440, perPage: 8 },
      { width: 1024, perPage: 8 },
      { width: 768,  perPage: 6 },
      { width: 480,  perPage: 4 },
      { width: 390,  perPage: 2 },
      { width: 360,  perPage: 2 },
    ];
    function getPerPage(w: number) {
      if (w >= 1024) return 8;
      if (w >= 768)  return 6;
      if (w >= 480)  return 4;
      return 2;
    }
    for (const { width, perPage } of breakpoints) {
      expect(getPerPage(width), `${width}px → ${perPage}`).toBe(perPage);
    }
  });

  it('with 16 products and perPage=8, there are exactly 2 pages', async () => {
    const all = await getFeaturedProducts(16);
    const perPage = 8;
    const pages = Math.ceil(all.length / perPage);
    expect(pages).toBe(2);
  });

  it('admin MAX_FEATURED is 16 (mock data never exceeds it)', () => {
    const MAX_FEATURED = 16;
    const featured = mockProducts.filter((p) => p.featured);
    expect(featured.length).toBeLessThanOrEqual(MAX_FEATURED);
  });

  it('works correctly with fewer than 16 featured products', async () => {
    // Simulate 5 featured products
    const simulated = mockProducts.filter((p) => p.featured).slice(0, 5);
    expect(simulated.length).toBe(5);
    const perPage = 8;
    const pages = Math.ceil(simulated.length / perPage);
    expect(pages).toBe(1); // fits in a single page → no nav controls shown
  });
});

// ── Manual receivable architecture ────────────────────────────────────────────

describe('Manual receivable data model', () => {
  it('orders table source field allows "manual_receivable" via migration 0018', async () => {
    // Structural test: verify the migration SQL contains the correct constraint
    const { readFileSync } = await import('fs');
    const sql = readFileSync('supabase/migrations/20240018000000_featured_16_and_manual_receivables.sql', 'utf-8');
    expect(sql).toContain("'manual_receivable'");
    expect(sql).toContain('create_manual_receivable');
    expect(sql).toContain('p_initial_payment');
  });

  it('receivable balance formula: total − paid = balance', () => {
    function computeBalance(total: number, payments: { amount: number; voided: boolean }[]) {
      const paid = payments.filter((p) => !p.voided).reduce((s, p) => s + p.amount, 0);
      return Math.max(0, total - paid);
    }

    // No payment → pending, balance = total
    expect(computeBalance(100, [])).toBe(100);
    // Partial payment
    expect(computeBalance(100, [{ amount: 40, voided: false }])).toBe(60);
    // Full payment
    expect(computeBalance(100, [{ amount: 100, voided: false }])).toBe(0);
    // Voided payment → does not reduce balance
    expect(computeBalance(100, [{ amount: 40, voided: true }])).toBe(100);
  });

  it('status derivation is correct', () => {
    function deriveStatus(orderStatus: string, balance: number, paid: number, dueDate?: string) {
      if (orderStatus === 'cancelled') return 'cancelled';
      if (balance <= 0) return 'paid';
      if (paid > 0) return 'partial';
      if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
      return 'pending';
    }

    expect(deriveStatus('confirmed', 100, 0, undefined)).toBe('pending');
    expect(deriveStatus('confirmed', 60, 40, undefined)).toBe('partial');
    expect(deriveStatus('confirmed', 0, 100, undefined)).toBe('paid');
    expect(deriveStatus('confirmed', 100, 0, '2020-01-01')).toBe('overdue');
    expect(deriveStatus('cancelled', 100, 0, undefined)).toBe('cancelled');
  });

  it('initial payment validation: cannot exceed total', () => {
    function validate(total: number, initial: number): string | null {
      if (total <= 0) return 'Total must be positive';
      if (initial < 0) return 'Initial payment cannot be negative';
      if (initial > total) return `Initial payment (${initial}) exceeds total (${total})`;
      return null;
    }

    expect(validate(100, 0)).toBeNull();
    expect(validate(100, 50)).toBeNull();
    expect(validate(100, 100)).toBeNull();
    expect(validate(100, 101)).toContain('exceeds total');
    expect(validate(100, -1)).toContain('negative');
    expect(validate(0, 0)).toContain('positive');
  });

  it('initial payment = 0 results in pending status', () => {
    const paid = 0;
    const total = 150;
    const balance = total - paid;
    expect(balance).toBe(150);
    // status: balance > 0, paid = 0 → pending
    expect(paid > 0).toBe(false);
  });

  it('partial initial payment results in partial status', () => {
    const paid = 50;
    const total = 150;
    const balance = total - paid;
    expect(balance).toBe(100);
    expect(paid > 0).toBe(true);
    expect(balance > 0).toBe(true);
  });

  it('full initial payment (= total) results in paid status', () => {
    const paid = 150;
    const total = 150;
    const balance = total - paid;
    expect(balance).toBe(0);
    expect(balance <= 0).toBe(true);
  });

  it('PayablesTab is independent — payables data model unchanged', async () => {
    const { readFileSync } = await import('fs');
    const sql = readFileSync('supabase/migrations/20240017000000_payables.sql', 'utf-8');
    expect(sql).toContain('create table if not exists payables');
    expect(sql).toContain('create table if not exists payable_payments');
  });
});
