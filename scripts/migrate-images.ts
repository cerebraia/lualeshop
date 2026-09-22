/**
 * migrate-images.ts
 *
 * Migrates local WebP product images from /public/images/products/
 * to Supabase Storage bucket 'product-images', then inserts
 * product_images rows for each uploaded image.
 *
 * Safe to re-run (idempotent): skips files already in Storage.
 *
 * Usage:
 *   npx tsx scripts/migrate-images.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY     ← needed for Storage upload
 *
 * NEVER commit this file with real keys.
 * NEVER print the service role key to stdout.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ── Load env ────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[migrate-images] Missing required env var: ${name}`);
    process.exit(1);
  }
  return val;
}

const SUPABASE_URL      = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY  = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Config ─────────────────────────────────────────────────────────────────

const BUCKET       = 'product-images';
const IMAGES_DIR   = path.join(process.cwd(), 'public', 'images', 'products');
const RESULTS: { file: string; status: 'ok' | 'skipped' | 'error'; detail?: string }[] = [];

// Maps local filename prefix to product SKU
// e.g. 'luale-001-...' → 'LK-001'
function skuFromFilename(filename: string): string | null {
  const match = filename.match(/^luale-(\d+)-/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return `LK-${String(num).padStart(3, '0')}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📸 Luale Kids Shop — Image Migration');
  console.log('═══════════════════════════════════════\n');

  // 1. Verify bucket exists
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error('[migrate-images] Cannot list buckets:', bucketsErr.message);
    process.exit(1);
  }
  const bucket = buckets?.find((b) => b.id === BUCKET);
  if (!bucket) {
    console.error(`[migrate-images] Bucket '${BUCKET}' not found. Apply migrations first.`);
    process.exit(1);
  }
  console.log(`✓ Bucket '${BUCKET}' found`);

  // 2. List local images
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`[migrate-images] Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(IMAGES_DIR)
    .filter((f) => f.endsWith('.webp') && f !== '.gitkeep')
    .sort();
  console.log(`✓ Found ${files.length} local WebP files\n`);

  // 3. Get all products from DB (need product IDs)
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, sku');
  if (prodErr) {
    console.error('[migrate-images] Cannot fetch products:', prodErr.message);
    process.exit(1);
  }
  const productBySku = new Map((products ?? []).map((p: { id: string; sku: string }) => [p.sku, p.id]));
  console.log(`✓ ${products?.length ?? 0} products found in database\n`);

  // 4. List existing Storage objects to skip already-uploaded files
  const { data: existingObjs } = await supabase.storage.from(BUCKET).list('products', {
    limit: 1000,
  });
  const existingPaths = new Set<string>();
  for (const folder of existingObjs ?? []) {
    const { data: folderObjs } = await supabase.storage.from(BUCKET).list(`products/${folder.name}`);
    for (const obj of folderObjs ?? []) {
      existingPaths.add(`products/${folder.name}/${obj.name}`);
    }
  }
  console.log(`✓ ${existingPaths.size} files already in Storage\n`);

  // 5. Upload each file
  for (const filename of files) {
    const sku = skuFromFilename(filename);
    if (!sku) {
      RESULTS.push({ file: filename, status: 'skipped', detail: 'Cannot derive SKU from filename' });
      continue;
    }

    const productId = productBySku.get(sku);
    if (!productId) {
      RESULTS.push({ file: filename, status: 'skipped', detail: `SKU ${sku} not found in database` });
      continue;
    }

    // Stable storage path: products/{productId}/{sku}.webp
    const storagePath = `products/${productId}/${sku.toLowerCase()}.webp`;

    // Skip if already uploaded
    if (existingPaths.has(storagePath)) {
      // Check if image record exists too
      const { count } = await supabase
        .from('product_images')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('storage_path', storagePath);
      if ((count ?? 0) > 0) {
        RESULTS.push({ file: filename, status: 'skipped', detail: 'Already in Storage and DB' });
        continue;
      }
    }

    // Upload file
    const fileBuffer = fs.readFileSync(path.join(IMAGES_DIR, filename));
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,   // safe re-upload if file exists but DB record missing
      });

    if (uploadErr) {
      RESULTS.push({ file: filename, status: 'error', detail: `Storage: ${uploadErr.message}` });
      continue;
    }

    // Insert or upsert product_images record
    const altText = `${sku} de Luale Kids Shop`;
    const { error: dbErr } = await supabase
      .from('product_images')
      .upsert({
        product_id:   productId,
        storage_path: storagePath,
        alt_text:     altText,
        position:     0,
        is_primary:   true,
        mime_type:    'image/webp',
      }, {
        onConflict: 'product_id,storage_path',
        ignoreDuplicates: false,
      });

    if (dbErr) {
      RESULTS.push({ file: filename, status: 'error', detail: `DB: ${dbErr.message}` });
      continue;
    }

    RESULTS.push({ file: filename, status: 'ok', detail: storagePath });
    process.stdout.write(`  ↑ ${sku}: ${storagePath}\n`);
  }

  // 6. Summary
  const ok      = RESULTS.filter((r) => r.status === 'ok').length;
  const skipped = RESULTS.filter((r) => r.status === 'skipped').length;
  const errors  = RESULTS.filter((r) => r.status === 'error');

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Uploaded:  ${ok}`);
  console.log(`⏭  Skipped:  ${skipped}`);
  console.log(`❌ Errors:   ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  ${e.file}: ${e.detail}`);
    }
  }

  console.log('\nDone. Local copies in /public/images/products/ preserved.\n');
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[migrate-images] Unexpected error:', err);
  process.exit(1);
});
