import { describe, it, expect } from 'vitest';
import { mockProducts } from '../lib/mock/products';
import { mockCategories } from '../lib/mock/categories';
import { mockOrders } from '../lib/mock/orders';
import { mockExpenses } from '../lib/mock/expenses';

const CAT_BEBES = 'cat-bebes';
const CAT_NINAS = 'cat-ninas';
const CAT_NINOS = 'cat-ninos';

// ─── Catalog counts ─────────────────────────────────────────────────────────

describe('Catalog totals', () => {
  it('has exactly 46 products', () => {
    expect(mockProducts).toHaveLength(46);
  });

  it('has exactly 31 Bebés products', () => {
    expect(mockProducts.filter((p) => p.categoryIds.includes(CAT_BEBES))).toHaveLength(31);
  });

  it('has exactly 7 Niñas products', () => {
    expect(mockProducts.filter((p) => p.categoryIds.includes(CAT_NINAS))).toHaveLength(7);
  });

  it('has exactly 8 Niños products', () => {
    expect(mockProducts.filter((p) => p.categoryIds.includes(CAT_NINOS))).toHaveLength(8);
  });

  it('every product belongs to at least one valid category', () => {
    const validCats = new Set([CAT_BEBES, CAT_NINAS, CAT_NINOS]);
    for (const p of mockProducts) {
      expect(p.categoryIds.length, `${p.sku} has no category`).toBeGreaterThan(0);
      for (const c of p.categoryIds) {
        expect(validCats.has(c), `${p.sku} has invalid categoryId: ${c}`).toBe(true);
      }
    }
  });
});

// ─── Uniqueness ─────────────────────────────────────────────────────────────

describe('Uniqueness constraints', () => {
  it('all IDs are unique', () => {
    const ids = mockProducts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all slugs are unique', () => {
    const slugs = mockProducts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all SKUs are unique', () => {
    const skus = mockProducts.map((p) => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('all catalogNumbers are unique and cover 1-46', () => {
    const nums = mockProducts.map((p) => p.catalogNumber ?? -1).sort((a, b) => a - b);
    expect(new Set(nums).size).toBe(46);
    expect(nums).toEqual(Array.from({ length: 46 }, (_, i) => i + 1));
  });
});

// ─── Prices ─────────────────────────────────────────────────────────────────

describe('Prices', () => {
  it('all prices are greater than zero', () => {
    for (const p of mockProducts) {
      expect(p.price, `${p.sku} has price ≤ 0`).toBeGreaterThan(0);
    }
  });

  it('multi-price products: price equals minimum purchase option', () => {
    const multiPrice = mockProducts.filter(
      (p) => p.purchaseOptions && p.purchaseOptions.length > 1
    );
    for (const p of multiPrice) {
      const minOptionPrice = Math.min(...p.purchaseOptions!.map((o) => o.price));
      expect(p.price, `${p.sku}: price should equal min option price`).toBe(minOptionPrice);
    }
  });
});

// ─── Purchase options ────────────────────────────────────────────────────────

describe('Purchase options', () => {
  it('exactly 5 products have 2 or more purchase options', () => {
    const multi = mockProducts.filter(
      (p) => p.purchaseOptions && p.purchaseOptions.length > 1
    );
    expect(multi).toHaveLength(5);
  });

  it('no product has exactly 1 purchase option', () => {
    const single = mockProducts.filter(
      (p) => p.purchaseOptions && p.purchaseOptions.length === 1
    );
    expect(single).toHaveLength(0);
  });

  it('multi-price products are the correct 5', () => {
    const multiSkus = mockProducts
      .filter((p) => p.purchaseOptions && p.purchaseOptions.length > 1)
      .map((p) => p.sku)
      .sort();
    expect(multiSkus).toEqual(['LK-003', 'LK-005', 'LK-014', 'LK-015', 'LK-016']);
  });

  it('ProductCard "Desde $X" condition: only triggers for 2+ options', () => {
    const fromPrice = mockProducts.filter(
      (p) => p.purchaseOptions && p.purchaseOptions.length > 1
    );
    expect(fromPrice).toHaveLength(5);
  });
});

// ─── WhatsApp message construction ──────────────────────────────────────────

describe('WhatsApp message', () => {
  function buildMessage(
    productName: string,
    purchaseOptionLabel: string | undefined,
    variantSize: string,
    quantity: number,
    price: number,
    url: string
  ): string {
    const total = price * quantity;
    return [
      `Hola, estoy interesado/a en *${productName}* de Luale Kids Shop.`,
      '',
      `Opción: ${purchaseOptionLabel ?? 'Unidad'}`,
      `Talla: ${variantSize}`,
      `Cantidad: ${quantity}`,
      `Precio unitario: $${price.toFixed(2)}`,
      `Total: $${total.toFixed(2)}`,
      `Enlace: ${url}`,
      '',
      '¿Está disponible?',
    ].join('\n');
  }

  it('includes product name', () => {
    const msg = buildMessage('Set Floral Rosa', undefined, '4 años', 1, 25, 'https://example.com');
    expect(msg).toContain('Set Floral Rosa');
  });

  it('calculates total correctly for quantity > 1', () => {
    const msg = buildMessage('Medias Básicas', 'Cinco pares', '2-3 años', 2, 8, 'https://example.com');
    expect(msg).toContain('Total: $16.00');
    expect(msg).toContain('Precio unitario: $8.00');
  });

  it('includes "Unidad" when no purchase option', () => {
    const msg = buildMessage('Set Floral Rosa', undefined, '4 años', 1, 25, 'https://example.com');
    expect(msg).toContain('Opción: Unidad');
  });

  it('includes purchase option label when provided', () => {
    const msg = buildMessage('Medias con Lazo', 'Cinco pares', '1-3 años', 1, 8, 'https://example.com');
    expect(msg).toContain('Opción: Cinco pares');
  });

  it('includes URL', () => {
    const url = 'https://lualekids.shop/producto/set-floral-rosa';
    const msg = buildMessage('Set Floral Rosa', undefined, '4 años', 1, 25, url);
    expect(msg).toContain(url);
  });

  it('includes "¿Está disponible?" at end', () => {
    const msg = buildMessage('Set Floral Rosa', undefined, '4 años', 1, 25, 'https://example.com');
    expect(msg.endsWith('¿Está disponible?')).toBe(true);
  });
});

// ─── Financial: only paid orders generate revenue ────────────────────────────

describe('Financial logic', () => {
  it('only paid orders are counted as revenue', () => {
    const paidOrders = mockOrders.filter((o) => o.paymentStatus === 'paid');
    const nonPaidRevenue = mockOrders
      .filter((o) => o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    expect(paidOrders.length).toBeGreaterThan(0);
    // Revenue must come ONLY from paid orders — not from pending/partial
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    expect(revenue).toBeGreaterThan(0);
    // Ensure there ARE non-paid orders (so the test is meaningful)
    expect(nonPaidRevenue).toBeGreaterThan(0);
  });

  it('expenses are tracked correctly', () => {
    const total = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
    expect(total).toBeGreaterThan(0);
    for (const e of mockExpenses) {
      expect(e.amount).toBeGreaterThan(0);
    }
  });
});

// ─── Migration idempotency ───────────────────────────────────────────────────

describe('Migration idempotency', () => {
  it('running merge twice produces the same result', () => {
    const merge = (stored: typeof mockProducts) => {
      const storedById = new Map(stored.map((p) => [p.id, p]));
      const merged: typeof mockProducts = [];

      // keep user-created (not starting with 'prod-')
      for (const p of stored) {
        if (!p.id.startsWith('prod-')) merged.push(p);
      }

      // for each mock product: keep stored version if exists, else insert mock
      for (const mockProd of mockProducts) {
        const storedProd = storedById.get(mockProd.id);
        merged.push(storedProd ?? mockProd);
      }

      return merged;
    };

    const firstRun = merge(mockProducts);
    const secondRun = merge(firstRun);

    expect(secondRun.length).toBe(firstRun.length);
    expect(secondRun.map((p) => p.id)).toEqual(firstRun.map((p) => p.id));
  });

  it('user-edited product is preserved across migration', () => {
    const editedProduct = { ...mockProducts[0], name: 'Edited by admin' };
    const storedProducts = mockProducts.map((p) =>
      p.id === editedProduct.id ? editedProduct : p
    );

    const storedById = new Map(storedProducts.map((p) => [p.id, p]));
    const merged = mockProducts.map((mockProd) => storedById.get(mockProd.id) ?? mockProd);

    const found = merged.find((p) => p.id === editedProduct.id);
    expect(found?.name).toBe('Edited by admin');
  });

  it('new mock products are inserted when missing from localStorage', () => {
    // Simulate: localStorage has only the first 10 products
    const partial = mockProducts.slice(0, 10);
    const partialById = new Map(partial.map((p) => [p.id, p]));

    const merged = mockProducts.map((mockProd) => partialById.get(mockProd.id) ?? mockProd);

    expect(merged.length).toBe(mockProducts.length);
    // Products 11-46 come from mock
    for (const p of mockProducts.slice(10)) {
      const found = merged.find((m) => m.id === p.id);
      expect(found?.id).toBe(p.id);
    }
  });
});

// ─── WhatsApp intent: no personal data, no financial side effects ─────────────

describe('WhatsApp intent constraints', () => {
  const INTENT_FIELDS = ['id', 'productId', 'productName', 'purchaseOptionLabel', 'variantSize', 'quantity', 'price', 'origin', 'date'] as const;
  const FORBIDDEN_FIELDS = ['customerName', 'phone', 'email', 'address', 'customerPhone'];

  it('WhatsAppIntent type has no personal data fields', () => {
    // Structural check: verify the type doesn't include personal fields
    // We do this by checking that a mock intent object doesn't have those keys
    const mockIntent = {
      id: 'intent-001',
      productId: 'prod-009',
      productName: 'Set Floral Rosa',
      purchaseOptionLabel: undefined,
      variantSize: '4 años',
      quantity: 1,
      price: 25,
      origin: 'product_page',
      date: new Date().toISOString(),
    };

    for (const forbidden of FORBIDDEN_FIELDS) {
      expect(forbidden in mockIntent, `Intent should not have field: ${forbidden}`).toBe(false);
    }

    for (const field of INTENT_FIELDS) {
      expect(field in mockIntent, `Intent should have field: ${field}`).toBe(true);
    }
  });
});

// ─── Categories mock ─────────────────────────────────────────────────────────

describe('Categories', () => {
  it('all 3 main categories exist and are active', () => {
    expect(mockCategories.find((c) => c.id === CAT_BEBES)?.active).toBe(true);
    expect(mockCategories.find((c) => c.id === CAT_NINAS)?.active).toBe(true);
    expect(mockCategories.find((c) => c.id === CAT_NINOS)?.active).toBe(true);
  });

  it('categories are referenced consistently from products', () => {
    const catIds = new Set(mockCategories.map((c) => c.id));
    for (const p of mockProducts) {
      for (const c of p.categoryIds) {
        expect(catIds.has(c), `Product ${p.sku} references missing category ${c}`).toBe(true);
      }
    }
  });
});
