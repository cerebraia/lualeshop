/**
 * scripts/audit-catalog.ts
 *
 * Programmatic audit of the product catalog.
 * Run with:  npm run audit:catalog
 *            npx tsx scripts/audit-catalog.ts
 * Exits with code 1 if any check fails.
 */

import { mockProducts } from '../lib/mock/products';
import type { Product } from '../lib/types';

const EXPECTED_TOTAL = 46;
const EXPECTED_BEBES = 31;
const EXPECTED_NINAS = 7;
const EXPECTED_NINOS = 8;
const EXPECTED_MULTI_PRICE = 5;

const CAT_BEBES = 'cat-bebes';
const CAT_NINAS = 'cat-ninas';
const CAT_NINOS = 'cat-ninos';

let failures = 0;

function fail(msg: string): void {
  console.error(`  ✗ FAIL: ${msg}`);
  failures++;
}

function pass(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function check(condition: boolean, passMsg: string, failMsg: string): void {
  if (condition) pass(passMsg);
  else fail(failMsg);
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ─── Totals ───────────────────────────────────────────────────────────────────
section('Totals');

const total = mockProducts.length;
check(total === EXPECTED_TOTAL, `Total: ${total}`, `Expected ${EXPECTED_TOTAL} products, got ${total}`);

const bebes = mockProducts.filter((p) => p.categoryIds.includes(CAT_BEBES));
const ninas = mockProducts.filter((p) => p.categoryIds.includes(CAT_NINAS));
const ninos = mockProducts.filter((p) => p.categoryIds.includes(CAT_NINOS));

check(bebes.length === EXPECTED_BEBES, `Bebés: ${bebes.length}`, `Expected ${EXPECTED_BEBES} Bebés, got ${bebes.length}`);
check(ninas.length === EXPECTED_NINAS, `Niñas: ${ninas.length}`, `Expected ${EXPECTED_NINAS} Niñas, got ${ninas.length}`);
check(ninos.length === EXPECTED_NINOS, `Niños: ${ninos.length}`, `Expected ${EXPECTED_NINOS} Niños, got ${ninos.length}`);

const totalCategorized = bebes.length + ninas.length + ninos.length;
check(
  totalCategorized === EXPECTED_TOTAL,
  `Category sum (${totalCategorized}) matches total`,
  `Category sum ${totalCategorized} ≠ total ${total}`
);

// ─── Uniqueness ───────────────────────────────────────────────────────────────
section('Uniqueness');

function checkUnique(label: string, values: (string | number)[]): void {
  const seen = new Set<string | number>();
  const dupes: (string | number)[] = [];
  for (const v of values) {
    if (seen.has(v)) dupes.push(v);
    seen.add(v);
  }
  check(dupes.length === 0, `Unique ${label}: ${values.length}`, `Duplicate ${label}: ${dupes.join(', ')}`);
}

checkUnique('IDs', mockProducts.map((p) => p.id));
checkUnique('slugs', mockProducts.map((p) => p.slug));
checkUnique('SKUs', mockProducts.map((p) => p.sku));
checkUnique('catalogNumbers', mockProducts.map((p) => p.catalogNumber ?? -999));

// ─── catalogNumbers completeness ──────────────────────────────────────────────
section('catalogNumbers 1-46');

const catNums = mockProducts.map((p) => p.catalogNumber ?? -1).sort((a, b) => a - b);
const expected = Array.from({ length: 46 }, (_, i) => i + 1);
const missing = expected.filter((n) => !catNums.includes(n));
const extra = catNums.filter((n) => !expected.includes(n));

check(missing.length === 0, 'All catalogNumbers 1-46 present', `Missing catalogNumbers: ${missing.join(', ')}`);
check(extra.length === 0, 'No unexpected catalogNumbers', `Unexpected catalogNumbers: ${extra.join(', ')}`);

// ─── Prices ───────────────────────────────────────────────────────────────────
section('Prices');

const zeroPrices = mockProducts.filter((p) => p.price <= 0);
check(zeroPrices.length === 0, 'All prices > 0', `Products with price ≤ 0: ${zeroPrices.map((p) => p.sku).join(', ')}`);

// ─── Categories ───────────────────────────────────────────────────────────────
section('Category membership');

const noCategory = mockProducts.filter((p) => p.categoryIds.length === 0);
check(noCategory.length === 0, 'All products have at least one category', `Products with no category: ${noCategory.map((p) => p.sku).join(', ')}`);

const validCats = new Set([CAT_BEBES, CAT_NINAS, CAT_NINOS]);
const badCat = mockProducts.filter((p) => p.categoryIds.some((c) => !validCats.has(c)));
check(badCat.length === 0, 'All categoryIds reference valid categories', `Products with invalid categoryIds: ${badCat.map((p) => p.sku).join('; ')}`);

// ─── Tallas ───────────────────────────────────────────────────────────────────
section('Tallas / sizeNote');

const noSize = mockProducts.filter((p) => p.variants.length === 0 || p.variants.every((v) => !v.size?.trim()));
const noSizeWithoutNote = noSize.filter((p) => !p.sizeNote?.trim());
check(noSizeWithoutNote.length === 0, 'All products have a talla or a sizeNote', `Products with no talla and no sizeNote: ${noSizeWithoutNote.map((p) => p.sku).join(', ')}`);

const withSizeNote = mockProducts.filter((p) => p.sizeNote);
pass(`Products with sizeNote: ${withSizeNote.length} (${withSizeNote.map((p) => p.sku).join(', ')})`);

// ─── Purchase options ─────────────────────────────────────────────────────────
section('Purchase options');

const withMulti = mockProducts.filter((p) => p.purchaseOptions && p.purchaseOptions.length > 1);
const withSingle = mockProducts.filter((p) => p.purchaseOptions && p.purchaseOptions.length === 1);

check(withMulti.length === EXPECTED_MULTI_PRICE, `Exactly ${EXPECTED_MULTI_PRICE} products with 2+ purchase options`, `Expected ${EXPECTED_MULTI_PRICE} multi-option products, got ${withMulti.length}: ${withMulti.map((p) => p.sku).join(', ')}`);
check(withSingle.length === 0, 'No products with exactly 1 purchase option', `Products with exactly 1 purchase option (should be removed): ${withSingle.map((p) => p.sku).join(', ')}`);

for (const p of withMulti) {
  const minOptionPrice = Math.min(...p.purchaseOptions!.map((o) => o.price));
  check(p.price === minOptionPrice, `${p.sku}: price = min option price (${p.price})`, `${p.sku}: price (${p.price}) should equal min purchase option price (${minOptionPrice})`);
}

// ─── inventoryConfigured ─────────────────────────────────────────────────────
section('inventoryConfigured');

const configured = mockProducts.filter((p) => p.inventoryConfigured);
const notConfigured = mockProducts.filter((p) => !p.inventoryConfigured);
pass(`inventoryConfigured=true: ${configured.length}`);
pass(`inventoryConfigured=false: ${notConfigured.length} (all pending real stock)`);

// ─── Summary ──────────────────────────────────────────────────────────────────
section('Summary');

if (failures === 0) {
  console.log('\n✅ AUDIT PASSED — all checks OK\n');
} else {
  console.error(`\n❌ AUDIT FAILED — ${failures} check(s) failed\n`);
}

// ─── Catalog table ────────────────────────────────────────────────────────────
function printCatalogTable(products: Product[]): void {
  console.log('\n── Catalog table (catalogNumber → SKU → product) ──\n');
  const sorted = [...products].sort((a, b) => (a.catalogNumber ?? 0) - (b.catalogNumber ?? 0));
  console.log('Cat# │ SKU      │ Nombre                                 │ Cat    │ Precio base │ Opts');
  console.log('─────┼──────────┼────────────────────────────────────────┼────────┼─────────────┼─────');
  for (const p of sorted) {
    const cat = p.categoryIds.includes(CAT_BEBES) ? 'Bebés' : p.categoryIds.includes(CAT_NINAS) ? 'Niñas' : 'Niños';
    const opts = p.purchaseOptions?.length ?? 0;
    const priceDisplay = p.purchaseOptions && p.purchaseOptions.length > 1 ? `Desde $${p.price}` : `$${p.price}`;
    const row = [
      String(p.catalogNumber ?? '?').padStart(4),
      p.sku.padEnd(8),
      p.name.slice(0, 39).padEnd(39),
      cat.padEnd(6),
      priceDisplay.padEnd(11),
      opts > 1 ? String(opts) : '-',
    ].join(' │ ');
    console.log(row);
  }
}

printCatalogTable(mockProducts);

if (failures > 0) process.exit(1);
