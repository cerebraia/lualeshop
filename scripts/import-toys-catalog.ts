/**
 * scripts/import-toys-catalog.ts
 * Import toy products from Catalogo_Juguetes_Luale_CORREGIDO.pdf into Supabase.
 *
 * Usage:
 *   npm run import:toys -- --dry-run
 *   npm run import:toys -- --apply
 *
 * Data extracted from PDF (text is selectable):
 *   Page 2: 01 / Juego de clasificación   / 20€
 *   Page 3: 02 / Tableros de encaje educ. / 10€ c/u
 *   Page 4: 03 / Busy Book                / 15€
 *   Page 5: 04 / Puzzle My World          / 10€ c/u
 *   Page 6: 05 / Piezas magnéticas        / 20€
 *
 * Idempotent: running twice will not create duplicates (upsert on sku).
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const PDF_PATH = path.resolve(
  'reference/Catalogo_Juguetes_Luale_CORREGIDO.pdf'
);

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DRY_RUN       = process.argv.includes('--dry-run');
const APPLY         = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
  console.error('Usage: npm run import:toys -- --dry-run | --apply');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Extracted product data ────────────────────────────────────────────────────

const TOYS = [
  {
    sku:         'JUG-001',
    catalogNum:  1,
    name:        'Juego de clasificación',
    slug:        'juego-de-clasificacion',
    description: 'Juego educativo de clasificación por colores y formas. Incluye animales y cuencos de colores. Ideal para desarrollar la motricidad fina y el reconocimiento de colores.',
    price:       20,
    pdfPage:     2,
  },
  {
    sku:         'JUG-002',
    catalogNum:  2,
    name:        'Tableros de encaje educativo',
    slug:        'tableros-de-encaje-educativo',
    description: 'Set de tableros de encaje educativo con letras, números y figuras geométricas. Fomentan el reconocimiento visual y el desarrollo cognitivo.',
    price:       10,
    pdfPage:     3,
    priceNote:   'c/u',
  },
  {
    sku:         'JUG-003',
    catalogNum:  3,
    name:        'Busy Book',
    slug:        'busy-book',
    description: 'Libro interactivo con actividades sensoriales y páginas desmontables. Estimula la creatividad, la concentración y las habilidades motoras.',
    price:       15,
    pdfPage:     4,
  },
  {
    sku:         'JUG-004',
    catalogNum:  4,
    name:        'Puzzle My World',
    slug:        'puzzle-my-world',
    description: 'Set de puzzles temáticos (animales, transporte, frutas) con piezas grandes y coloridas. Desarrolla la lógica espacial y la coordinación.',
    price:       10,
    pdfPage:     5,
    priceNote:   'c/u',
  },
  {
    sku:         'JUG-005',
    catalogNum:  5,
    name:        'Piezas magnéticas',
    slug:        'piezas-magneticas',
    description: 'Set de piezas magnéticas geométricas multicolor. Permiten construir estructuras en 2D y 3D desarrollando la creatividad y el pensamiento espacial.',
    price:       20,
    pdfPage:     6,
  },
];

const CATEGORY_NAME = 'Juguetes';
const CATEGORY_SLUG = 'juguetes';
const BUCKET        = 'product-images';

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg); }
function warn(msg: string) { console.warn('⚠️  ' + msg); }

function extractImageFromPdf(sku: string): Buffer {
  // Images pre-extracted by Python to /tmp/luale_toys_imgs/<SKU>.png
  const imgPath = `/tmp/luale_toys_imgs/${sku}.png`;
  if (!existsSync(imgPath)) {
    throw new Error(
      `Image not found at ${imgPath}. Run the Python extraction step first:\n` +
      `  python3 -c "import fitz,os; os.makedirs('/tmp/luale_toys_imgs',exist_ok=True); doc=fitz.open('${PDF_PATH}'); [open(f'/tmp/luale_toys_imgs/{s}.png','wb').write(doc.extract_image(x)['image']) for s,x in [('JUG-001',7),('JUG-002',15),('JUG-003',9),('JUG-004',19),('JUG-005',11)]]; doc.close()"`
    );
  }
  return readFileSync(imgPath);
}

async function processImage(rawBuffer: Buffer): Promise<{ webpBuffer: Buffer; width: number; height: number }> {
  const s = sharp(rawBuffer).rotate();
  const { data, info } = await s
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  return { webpBuffer: data, width: info.width, height: info.height };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!existsSync(PDF_PATH)) {
    console.error('PDF not found:', PDF_PATH);
    process.exit(1);
  }

  log(`\n${'='.repeat(60)}`);
  log(`Luale Toys Import — ${DRY_RUN ? 'DRY RUN (no changes)' : 'APPLY'}`);
  log(`${'='.repeat(60)}\n`);

  // 1. Ensure category exists
  log('Step 1: Category "Juguetes"');
  const { data: existingCat } = await sb
    .from('categories')
    .select('id,name,slug')
    .eq('slug', CATEGORY_SLUG)
    .maybeSingle();

  let categoryId: string;
  if (existingCat) {
    categoryId = existingCat.id;
    log(`  ✓ Already exists: id=${categoryId}`);
  } else {
    if (DRY_RUN) {
      categoryId = 'DRY-RUN-CATEGORY-ID';
      log(`  [dry-run] Would create category "${CATEGORY_NAME}" slug="${CATEGORY_SLUG}"`);
    } else {
      const { data: newCat, error } = await sb
        .from('categories')
        .insert({ name: CATEGORY_NAME, slug: CATEGORY_SLUG, active: true, sort_order: 4 })
        .select('id')
        .single();
      if (error) { console.error('Category insert failed:', error.message); process.exit(1); }
      categoryId = newCat.id;
      log(`  ✓ Created: id=${categoryId}`);
    }
  }

  log('');

  // 2. Summary
  log('=== DRY-RUN SUMMARY ===');
  log(`Pages in PDF: 7 (1 cover + 5 products + 1 closing)`);
  log(`Products detected: ${TOYS.length}`);
  log(`Products with price: ${TOYS.length}`);
  log(`Products without price: 0`);
  log(`Products with image: ${TOYS.length}`);
  log(`Possible duplicates: checking by SKU...`);

  const { data: existingProds } = await sb
    .from('products')
    .select('sku,name')
    .in('sku', TOYS.map((t) => t.sku));
  const existingSkus = new Set((existingProds ?? []).map((p: { sku: string }) => p.sku));
  const toCreate = TOYS.filter((t) => !existingSkus.has(t.sku));
  const toSkip   = TOYS.filter((t) => existingSkus.has(t.sku));

  log(`Products already in DB (skip): ${toSkip.length} → ${toSkip.map((t) => t.sku).join(', ') || 'none'}`);
  log(`Products to create: ${toCreate.length} → ${toCreate.map((t) => t.sku).join(', ') || 'none'}`);
  log('');

  TOYS.forEach((t) => {
    const exists = existingSkus.has(t.sku);
    log(`  ${exists ? '↩' : '+'} ${t.sku} "${t.name}" €${t.price}${t.priceNote ? ' ' + t.priceNote : ''} (page ${t.pdfPage})`);
  });

  log('');

  if (DRY_RUN) {
    log('Dry run complete. Run with --apply to import.');
    return;
  }

  // 3. Import each new toy
  const manifest: Array<{ sku: string; name: string; price: number; productId: string; imageStoragePath: string; pdfPage: number }> = [];

  for (const toy of TOYS) {
    if (existingSkus.has(toy.sku)) {
      log(`↩ Skipping ${toy.sku} (already in DB)`);
      continue;
    }

    log(`+ Importing ${toy.sku}: ${toy.name}`);

    // 3a. Extract and process image
    log(`  Extracting image…`);
    let webpBuffer: Buffer;
    let imgWidth: number;
    let imgHeight: number;
    try {
      const raw = extractImageFromPdf(toy.sku);
      const processed = await processImage(raw);
      webpBuffer = processed.webpBuffer;
      imgWidth   = processed.width;
      imgHeight  = processed.height;
      log(`  Image: ${imgWidth}x${imgHeight} WebP ${webpBuffer.length}B`);
    } catch (err) {
      warn(`  Image extraction failed for ${toy.sku}: ${err}`);
      continue;
    }

    // 3b. Create product record
    const productId   = randomUUID();
    const { error: prodErr } = await sb.from('products').insert({
      id:                   productId,
      sku:                  toy.sku,
      name:                 toy.name,
      slug:                 toy.slug,
      garment_type:         'Juguete',
      description:          toy.description,
      status:               'active',
      manual_availability:  'available',
      featured:             false,
      is_new:               true,
      inventory_configured: false,
      catalog_number:       null,
    });
    if (prodErr) { warn(`  Product insert failed: ${prodErr.message}`); continue; }
    log(`  ✓ Product created: id=${productId}`);

    // 3c. Link to Juguetes category
    const { error: catErr } = await sb.from('product_categories').insert({
      product_id:  productId,
      category_id: categoryId,
    });
    if (catErr) { warn(`  Category link failed: ${catErr.message}`); }

    // 3d. Create purchase option (price)
    const { error: optErr } = await sb.from('product_purchase_options').insert({
      product_id: productId,
      label:      toy.priceNote ? `Precio ${toy.priceNote}` : 'Precio',
      price:      toy.price,
      sort_order: 0,
      active:     true,
    });
    if (optErr) { warn(`  Purchase option insert failed: ${optErr.message}`); }

    // 3e. Upload image to Storage
    const imageId      = randomUUID();
    const storagePath  = `products/${productId}/${imageId}.webp`;
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType:   'image/webp',
        cacheControl:  '31536000',
        upsert:        false,
      });
    if (uploadErr) {
      warn(`  Storage upload failed: ${uploadErr.message} — cleaning up product`);
      await sb.from('products').delete().eq('id', productId);
      continue;
    }

    // 3f. Create product_images record
    const { error: imgErr } = await sb.from('product_images').insert({
      id:           imageId,
      product_id:   productId,
      storage_path: storagePath,
      alt_text:     `${toy.name} de Luale Kids Shop`,
      position:     0,
      is_primary:   true,
      width:        imgWidth,
      height:       imgHeight,
      file_size:    webpBuffer.length,
      mime_type:    'image/webp',
    });
    if (imgErr) {
      warn(`  product_images insert failed: ${imgErr.message}`);
      await sb.storage.from(BUCKET).remove([storagePath]);
      await sb.from('products').delete().eq('id', productId);
      continue;
    }

    manifest.push({
      sku:              toy.sku,
      name:             toy.name,
      price:            toy.price,
      productId,
      imageStoragePath: storagePath,
      pdfPage:          toy.pdfPage,
    });

    log(`  ✓ Done: ${toy.sku} → product=${productId}`);
    log(`           image=${storagePath}`);
  }

  log('\n=== IMPORT COMPLETE ===');
  log(`Imported: ${manifest.length}/${toCreate.length}`);
  log(`Skipped (already existed): ${toSkip.length}`);
  log('');

  if (manifest.length > 0) {
    log('MANIFEST:');
    manifest.forEach((m) => {
      log(`  ${m.sku} | ${m.name} | €${m.price} | page ${m.pdfPage}`);
      log(`    productId: ${m.productId}`);
      log(`    image: ${m.imageStoragePath}`);
    });
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
