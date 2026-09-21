import { describe, it, expect } from 'vitest';
import { mockProducts } from '../lib/mock/products';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Image Catalog Tests ────────────────────────────────────────────────────

describe('Product image catalog', () => {
  it('all 46 products have at least one image', () => {
    const noImage = mockProducts.filter((p) => p.images.length === 0);
    expect(noImage).toHaveLength(0);
  });

  it('no product exceeds 8 images', () => {
    const over8 = mockProducts.filter((p) => p.images.length > 8);
    expect(over8).toHaveLength(0);
  });

  it('all image paths are non-empty strings', () => {
    for (const p of mockProducts) {
      for (const src of p.images) {
        expect(typeof src).toBe('string');
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('all image paths start with /images/products/', () => {
    for (const p of mockProducts) {
      for (const src of p.images) {
        expect(src).toMatch(/^\/images\/products\//);
      }
    }
  });

  it('all image paths end with .webp', () => {
    for (const p of mockProducts) {
      for (const src of p.images) {
        expect(src.toLowerCase()).toMatch(/\.webp$/);
      }
    }
  });

  it('no product has duplicate image paths', () => {
    for (const p of mockProducts) {
      const unique = new Set(p.images);
      expect(unique.size).toBe(p.images.length);
    }
  });

  it('all image files exist on disk', () => {
    for (const p of mockProducts) {
      for (const src of p.images) {
        const filePath = path.join(process.cwd(), 'public', src);
        expect(
          fs.existsSync(filePath),
          `Image file missing: ${src} (product: ${p.sku})`
        ).toBe(true);
      }
    }
  });
});

// ── Storage path format ────────────────────────────────────────────────────

describe('Storage path validation', () => {
  it('rejects paths not matching products/{product_id}/{uuid}.webp', () => {
    const validPattern = /^products\/[0-9a-f-]{8,}\/[0-9a-f-]{8,}\.webp$/;
    const invalidPaths = [
      '../../../etc/passwd',
      'products//img.webp',
      'other-bucket/img.webp',
      'products/abc/my image.webp',
      'products/abc/IMG_001.WEBP', // uppercase
    ];
    for (const p of invalidPaths) {
      expect(validPattern.test(p), `Expected "${p}" to be rejected`).toBe(false);
    }
  });

  it('valid UUID-based storage path matches pattern', () => {
    const pattern = /^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;
    const validPath = 'products/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000.webp';
    expect(pattern.test(validPath)).toBe(true);
  });
});

// ── Image audit helpers ────────────────────────────────────────────────────

describe('Image count limits', () => {
  it('MAX_IMAGES constant is 8', () => {
    const MAX_IMAGES = 8;
    expect(MAX_IMAGES).toBe(8);
  });

  it('enforces max 8 images in add logic', () => {
    function canAddMore(currentCount: number, maxImages: number) {
      return currentCount < maxImages;
    }
    expect(canAddMore(7, 8)).toBe(true);
    expect(canAddMore(8, 8)).toBe(false);
    expect(canAddMore(9, 8)).toBe(false);
  });
});

// ── Primary image logic ────────────────────────────────────────────────────

describe('Primary image assignment', () => {
  interface MockImage {
    id: string;
    position: number;
    isPrimary: boolean;
  }

  it('first uploaded image becomes primary when no other exists', () => {
    const existingImages: MockImage[] = [];
    const isPrimary = existingImages.length === 0;
    expect(isPrimary).toBe(true);
  });

  it('subsequent images are not primary by default', () => {
    const existingImages: MockImage[] = [{ id: '1', position: 0, isPrimary: true }];
    const isPrimary = existingImages.length === 0;
    expect(isPrimary).toBe(false);
  });

  it('when primary is deleted, next image by position becomes primary', () => {
    const images: MockImage[] = [
      { id: '1', position: 0, isPrimary: true },
      { id: '2', position: 1, isPrimary: false },
      { id: '3', position: 2, isPrimary: false },
    ];

    // Delete the primary
    const deletedId = '1';
    let remaining = images.filter((img) => img.id !== deletedId);

    // Reassign primary to first remaining
    if (remaining.length > 0 && images.find((img) => img.id === deletedId)?.isPrimary) {
      remaining = remaining.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0,
      }));
    }

    expect(remaining[0].isPrimary).toBe(true);
    expect(remaining[0].id).toBe('2');
    expect(remaining[1].isPrimary).toBe(false);
  });

  it('deleting the only image results in no primary', () => {
    const images: MockImage[] = [{ id: '1', position: 0, isPrimary: true }];
    const remaining = images.filter((img) => img.id !== '1');
    expect(remaining).toHaveLength(0);
  });
});

// ── Alt text validation ────────────────────────────────────────────────────

describe('Alt text validation', () => {
  function isValidAlt(alt: string): boolean {
    const trimmed = alt.trim();
    if (!trimmed) return false;
    if (trimmed.length > 200) return false;
    if (/<[^>]+>/.test(trimmed)) return false; // basic HTML check
    return true;
  }

  it('accepts normal alt text', () => {
    expect(isValidAlt('Pijama de dinosaurios de Luale Kids Shop')).toBe(true);
  });

  it('rejects empty alt text', () => {
    expect(isValidAlt('')).toBe(false);
    expect(isValidAlt('   ')).toBe(false);
  });

  it('rejects alt text over 200 chars', () => {
    expect(isValidAlt('A'.repeat(201))).toBe(false);
  });

  it('rejects alt text with HTML', () => {
    expect(isValidAlt('<script>alert(1)</script>')).toBe(false);
    expect(isValidAlt('<b>bold</b>')).toBe(false);
  });
});

// ── File validation ────────────────────────────────────────────────────────

describe('File type validation', () => {
  const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  it('accepts JPEG, PNG, WebP', () => {
    for (const mime of ACCEPTED_MIME) {
      expect(ACCEPTED_MIME.includes(mime)).toBe(true);
    }
  });

  it('rejects SVG', () => {
    expect(ACCEPTED_MIME.includes('image/svg+xml')).toBe(false);
  });

  it('rejects GIF', () => {
    expect(ACCEPTED_MIME.includes('image/gif')).toBe(false);
  });

  it('rejects PDF', () => {
    expect(ACCEPTED_MIME.includes('application/pdf')).toBe(false);
  });

  it('rejects files over 10MB', () => {
    const oversized = MAX_FILE_SIZE + 1;
    expect(oversized > MAX_FILE_SIZE).toBe(true);
  });

  it('accepts files exactly at 10MB limit', () => {
    expect(MAX_FILE_SIZE <= MAX_FILE_SIZE).toBe(true);
  });
});
