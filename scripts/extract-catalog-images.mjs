#!/usr/bin/env node
/**
 * extract-catalog-images.mjs
 *
 * Extracts product photos from the official Luale Kids Shop PDF catalog.
 * Each PDF page contains one full-page rasterized image (1080x1350).
 * The product photo sits inside a white card at consistent coordinates.
 *
 * PDF structure:
 *   Page  1    → portada (skip)
 *   Page  2    → portada Bebés (skip)
 *   Pages 3-32 → catalogNumbers 1-30
 *   Page  33   → catalogNumber 46
 *   Page  34   → portada Niños (skip)
 *   Pages 35-49 → catalogNumbers 31-45
 *   Page  50   → cierre (skip)
 *
 * Crop coordinates (within 1080×1350 raw page image):
 *   left=100, top=263, right=980, bottom=905  → 880×642 px
 *
 * Run: node scripts/extract-catalog-images.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');

// ── Paths ─────────────────────────────────────────────────────────────────────
const PDF_PATH   = join(ROOT, 'reference', 'Catalogo_Luale_Kids_Shop_Movil_Portada_Actualizada.pdf');
const OUT_DIR    = join(ROOT, 'public', 'images', 'products');
const TMP_DIR    = join(ROOT, '.tmp-pdf-extract');
const AUDIT_DIR  = join(ROOT, 'artifacts', 'catalog-image-audit');
const MANIFEST   = join(ROOT, 'lib', 'mock', 'product-image-manifest.ts');
const PRODUCTS_TS= join(ROOT, 'lib', 'mock', 'products.ts');

// ── Crop coordinates (validated from pixel analysis) ─────────────────────────
const CROP = { left: 100, top: 263, right: 980, bottom: 905 };

// ── Product catalog data (parsed from products.ts) ───────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseProducts() {
  const src = readFileSync(PRODUCTS_TS, 'utf8');
  const products = [];

  // Split by product blocks
  const blocks = src.split(/(?=\/\/ ── prod-\d+)/);
  for (const block of blocks) {
    const idM   = block.match(/id:\s*['"]([^'"]+)['"]/);
    const skuM  = block.match(/sku:\s*'(LK-\d+)'/);
    const nameM = block.match(/name:\s*["']([^"']+)["']/);
    const catM  = block.match(/catalogNumber:\s*(\d+)/);
    if (idM && skuM && nameM && catM) {
      products.push({
        id:            idM[1],
        sku:           skuM[1],
        name:          nameM[1],
        catalogNumber: parseInt(catM[1], 10),
        slug:          slugify(nameM[1]),
      });
    }
  }

  if (products.length !== 46) {
    console.error(`⚠ Expected 46 products, parsed ${products.length}`);
  }
  return products;
}

// ── PDF page → catalogNumber mapping ─────────────────────────────────────────
function pageTocat(page) {
  if (page >= 3 && page <= 32) return page - 2;      // 1-30
  if (page === 33) return 46;
  if (page >= 35 && page <= 49) return page - 4;     // 31-45
  return null; // cover/closing pages — skip
}

// ── Python helper to extract + crop + save WebP ───────────────────────────────
function extractImage(pdfPath, pageIndex, crop, outPath, quality = 85) {
  const py = `
import fitz, io, sys
from PIL import Image

doc = fitz.open(${JSON.stringify(pdfPath)})
page = doc[${pageIndex}]
imgs = page.get_images(full=True)
if not imgs:
    sys.exit(f"No images on page {${pageIndex + 1}}")

xref = imgs[0][0]
raw  = doc.extract_image(xref)
img  = Image.open(io.BytesIO(raw["image"])).convert("RGB")

crop = (${crop.left}, ${crop.top}, ${crop.right}, ${crop.bottom})
img  = img.crop(crop)
img.save(${JSON.stringify(outPath)}, "WEBP", quality=${quality}, method=4)
print(f"{img.size[0]}x{img.size[1]}")
doc.close()
`;
  const result = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `python exit ${result.status}`);
  }
  return result.stdout.trim(); // "880x642"
}

// ── File size helper ─────────────────────────────────────────────────────────
function fileSize(p) {
  try {
    return JSON.parse(spawnSync('stat', ['-f', '%z', p], { encoding: 'utf8' }).stdout.trim());
  } catch {
    return 0;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🖼  Luale Kids Shop — Catalog Image Extractor\n');

  // Validate PDF
  if (!existsSync(PDF_PATH)) {
    console.error(`❌ PDF not found at: ${PDF_PATH}`);
    process.exit(1);
  }
  console.log(`✓  PDF: ${PDF_PATH}`);

  // Setup dirs
  mkdirSync(OUT_DIR,   { recursive: true });
  mkdirSync(TMP_DIR,   { recursive: true });
  mkdirSync(AUDIT_DIR, { recursive: true });

  const products = parseProducts();
  console.log(`✓  Products parsed: ${products.length}`);

  const bycat = Object.fromEntries(products.map(p => [p.catalogNumber, p]));

  // Determine which PDF pages to process
  const pagesToProcess = [
    ...Array.from({ length: 30 }, (_, i) => i + 3),  // 3-32
    33,
    ...Array.from({ length: 15 }, (_, i) => i + 35), // 35-49
  ];

  const manifest  = [];
  const errors    = [];
  let extracted   = 0;

  for (const pdfPage of pagesToProcess) {
    const cat = pageTocat(pdfPage);
    if (!cat) { console.log(`  skip page ${pdfPage} (no cat)`); continue; }

    const prod = bycat[cat];
    if (!prod) {
      console.error(`  ❌ page ${pdfPage} → cat ${cat}: no product found`);
      errors.push({ pdfPage, cat, error: 'no product' });
      continue;
    }

    const num      = String(cat).padStart(3, '0');
    const filename = `luale-${num}-${prod.slug}.webp`;
    const outPath  = join(OUT_DIR, filename);
    const webPath  = `/images/products/${filename}`;

    process.stdout.write(`  Page ${String(pdfPage).padStart(2)} → cat ${String(cat).padStart(2)}  ${prod.sku}  ${prod.name.substring(0,35).padEnd(35)}  `);

    try {
      // Skip if already exists and is valid (idempotent)
      let dims = '';
      if (existsSync(outPath) && fileSize(outPath) > 1000) {
        const check = spawnSync('python3', ['-c', `
from PIL import Image
img = Image.open(${JSON.stringify(outPath)})
print(f"{img.size[0]}x{img.size[1]}")
`], { encoding: 'utf8' });
        dims = check.stdout.trim();
        process.stdout.write(`[skip, exists ${dims}]\n`);
      } else {
        dims = extractImage(PDF_PATH, pdfPage - 1, CROP, outPath, 85);
        process.stdout.write(`✓ ${dims}\n`);
        extracted++;
      }

      const [w, h] = dims.split('x').map(Number);
      manifest.push({
        catalogNumber:   cat,
        productId:       prod.id,
        sku:             prod.sku,
        productName:     prod.name,
        pdfPage,
        imagePath:       webPath,
        width:           w,
        height:          h,
        extractionMethod:'page-crop',
        fileSize:        fileSize(outPath),
      });
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
      errors.push({ pdfPage, cat, sku: prod.sku, error: err.message });
    }
  }

  console.log(`\n✓  Extracted: ${extracted} new images`);
  console.log(`✓  Total in manifest: ${manifest.length}`);
  if (errors.length) {
    console.error(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.error(`   page ${e.pdfPage} cat ${e.cat}: ${e.error}`));
  }

  // Write manifest TypeScript file
  manifest.sort((a, b) => a.catalogNumber - b.catalogNumber);
  const manifestTs = `// AUTO-GENERATED by scripts/extract-catalog-images.mjs — do not edit manually
// Generated: ${new Date().toISOString()}

export interface ProductImageEntry {
  catalogNumber:   number;
  productId:       string;
  sku:             string;
  productName:     string;
  pdfPage:         number;
  imagePath:       string;
  width:           number;
  height:          number;
  extractionMethod:string;
  fileSize:        number;
}

export const productImageManifest: ProductImageEntry[] = ${JSON.stringify(manifest, null, 2)};

export const imageByProductId: Record<string, string> =
  Object.fromEntries(productImageManifest.map(e => [e.productId, e.imagePath]));

export const imageByCatalogNumber: Record<number, string> =
  Object.fromEntries(productImageManifest.map(e => [e.catalogNumber, e.imagePath]));
`;
  writeFileSync(MANIFEST, manifestTs, 'utf8');
  console.log(`✓  Manifest written: ${MANIFEST}`);

  // Write audit report JSON
  const totalSize = manifest.reduce((s, e) => s + e.fileSize, 0);
  const report = {
    generatedAt:    new Date().toISOString(),
    expectedTotal:  46,
    extracted:      manifest.length,
    newThisRun:     extracted,
    errors:         errors.length,
    errorDetails:   errors,
    totalFileSizeKB:Math.round(totalSize / 1024),
    images:         manifest,
  };
  writeFileSync(join(AUDIT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`✓  Audit report: ${join(AUDIT_DIR, 'report.json')}`);

  // Clean tmp dir
  try {
    const files = spawnSync('ls', [TMP_DIR], { encoding: 'utf8' }).stdout.trim();
    if (!files) {
      // rmdir empty dir
    }
  } catch { /* ok */ }

  console.log('\n✅  Done.\n');
  return errors.length === 0;
}

main().then(ok => process.exit(ok ? 0 : 1)).catch(err => {
  console.error(err);
  process.exit(1);
});
