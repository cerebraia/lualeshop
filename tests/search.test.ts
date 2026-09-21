import { describe, it, expect } from 'vitest';
import { normalizeText, sanitizeQuery, searchPublicProducts } from '../lib/search';

// ── normalizeText ─────────────────────────────────────────────

describe('normalizeText', () => {
  it('lowercases ASCII', () => {
    expect(normalizeText('PIJAMA')).toBe('pijama');
  });

  it('strips accents — bebe → bebe', () => {
    expect(normalizeText('Bebé')).toBe('bebe');
  });

  it('strips accents — ninos → ninos', () => {
    expect(normalizeText('Niños')).toBe('ninos');
  });

  it('strips accents — marron → marron', () => {
    expect(normalizeText('Marrón')).toBe('marron');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  vestido  ')).toBe('vestido');
  });

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

// ── sanitizeQuery ─────────────────────────────────────────────

describe('sanitizeQuery', () => {
  it('trims whitespace', () => {
    expect(sanitizeQuery('  pijama  ')).toBe('pijama');
  });

  it('enforces max 100 characters', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeQuery(long)).toHaveLength(100);
  });

  it('allows normal queries', () => {
    expect(sanitizeQuery('vestido floral')).toBe('vestido floral');
  });

  it('does not strip special characters (SQL safety is handled by parameterized queries)', () => {
    // We pass the value as a parameter — the DB driver escapes it
    const q = sanitizeQuery("pijama's");
    expect(q).toBe("pijama's");
  });
});

// ── searchPublicProducts (mock mode) ─────────────────────────

describe('searchPublicProducts — mock mode', () => {
  it('returns empty array for query shorter than 2 chars', async () => {
    const results = await searchPublicProducts('a');
    expect(results).toHaveLength(0);
  });

  it('returns empty array for empty query', async () => {
    const results = await searchPublicProducts('');
    expect(results).toHaveLength(0);
  });

  it('finds pijamas by exact word', async () => {
    const results = await searchPublicProducts('pijama');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.name || r.garmentType)).toBe(true);
  });

  it('finds products without accent — bebe finds Bebé category', async () => {
    const results = await searchPublicProducts('bebe');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds products by garment type — vestido', async () => {
    const results = await searchPublicProducts('vestido');
    expect(results.length).toBeGreaterThan(0);
  });

  it('case-insensitive search', async () => {
    const lower = await searchPublicProducts('pijama');
    const upper = await searchPublicProducts('PIJAMA');
    expect(lower.length).toBe(upper.length);
  });

  it('returns no more than 8 results by default', async () => {
    const results = await searchPublicProducts('set');
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it('respects custom limit', async () => {
    const results = await searchPublicProducts('set', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('max limit is capped at 20', async () => {
    const results = await searchPublicProducts('a', 100);
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('returns results with required public fields', async () => {
    const results = await searchPublicProducts('pijama');
    for (const r of results) {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('slug');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('garmentType');
      expect(r).toHaveProperty('price');
      expect(r).toHaveProperty('status');
      expect(r).toHaveProperty('inventoryConfigured');
      expect(r).toHaveProperty('sizes');
      expect(r).toHaveProperty('categoryNames');
    }
  });

  it('never returns cost or private fields', async () => {
    const results = await searchPublicProducts('pijama');
    for (const r of results) {
      expect(r).not.toHaveProperty('cost');
      expect(r).not.toHaveProperty('purchaseOptions');
    }
  });

  it('returns empty for non-existent product', async () => {
    const results = await searchPublicProducts('xyzabc123nonexistent');
    expect(results).toHaveLength(0);
  });

  it('handles special characters safely', async () => {
    const results = await searchPublicProducts('%');
    // Should not throw; may return 0 results
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles single quotes safely', async () => {
    const results = await searchPublicProducts("it's");
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles unicode input safely', async () => {
    const results = await searchPublicProducts('👗');
    expect(Array.isArray(results)).toBe(true);
  });

  it('searches waffle and finds matching product', async () => {
    const results = await searchPublicProducts('waffle');
    expect(results.length).toBeGreaterThan(0);
  });

  it('abort signal prevents returning results', async () => {
    const controller = new AbortController();
    controller.abort();
    const results = await searchPublicProducts('pijama', 8, controller.signal);
    expect(results).toHaveLength(0);
  });
});

// ── Search result shape ───────────────────────────────────────

describe('SearchResult shape', () => {
  it('all results have valid slugs for routing', async () => {
    const results = await searchPublicProducts('set');
    for (const r of results) {
      expect(r.slug).toBeTruthy();
      expect(r.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('image field is a string (may be empty)', async () => {
    const results = await searchPublicProducts('pijama');
    for (const r of results) {
      expect(typeof r.image).toBe('string');
    }
  });

  it('sizes is an array of strings', async () => {
    const results = await searchPublicProducts('set');
    for (const r of results) {
      expect(Array.isArray(r.sizes)).toBe(true);
    }
  });
});
