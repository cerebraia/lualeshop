import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_IMAGES_PER_PRODUCT = 8;
const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
// Magic bytes: JPEG=FFD8FF, PNG=89504E47, WebP=52494646????57454250
const MAGIC: Array<{ mime: string; bytes: number[]; offset: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header
];

function detectMime(buf: Buffer): string | null {
  for (const sig of MAGIC) {
    const slice = buf.subarray(sig.offset, sig.offset + sig.bytes.length);
    if (sig.bytes.every((b, i) => slice[i] === b)) {
      if (sig.mime === 'image/webp') {
        // Also verify WEBP marker at offset 8
        const marker = buf.subarray(8, 12).toString('ascii');
        if (marker !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );
}

// POST /api/products/[id]/images  — upload one image
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  // 1. Validate Supabase env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  // 2. Auth
  const supabase = await getSupabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Profile check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single();
  if (!profile?.active || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Validate product exists
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // 5. Check current image count
  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);
  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return NextResponse.json({ error: `Maximum ${MAX_IMAGES_PER_PRODUCT} images per product` }, { status: 400 });
  }

  // 6. Parse form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 7. Size check
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 8 MB limit' }, { status: 400 });
  }

  // 8. Read buffer and validate real MIME
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  const realMime = detectMime(inputBuffer);
  if (!realMime || !ACCEPTED_MIME.has(realMime)) {
    return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, or WebP.' }, { status: 400 });
  }

  // 9. Process with Sharp
  let outputBuffer: Buffer;
  let width: number;
  let height: number;
  try {
    const sharp = (await import('sharp')).default;
    const pipeline = sharp(inputBuffer)
      .rotate()                    // auto-correct EXIF orientation
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    outputBuffer = data;
    width  = info.width;
    height = info.height;
  } catch {
    return NextResponse.json({ error: 'Image processing failed' }, { status: 500 });
  }

  // 10. Generate safe storage path
  const imageId = randomUUID();
  const storagePath = `products/${productId}/${imageId}.webp`;

  // 11. Upload to Storage
  const { error: uploadErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, outputBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json({ error: 'Storage upload failed', detail: uploadErr.message }, { status: 500 });
  }

  // 12. Determine position and primary status
  const nextPosition = count ?? 0; // 0-indexed: existing count = next slot
  const isPrimary = nextPosition === 0; // first image becomes primary

  // 13. Create metadata record
  const altText = formData.get('alt_text') as string | null;
  const { data: imageRecord, error: dbErr } = await supabase
    .from('product_images')
    .insert({
      id:           imageId,
      product_id:   productId,
      storage_path: storagePath,
      alt_text:     altText?.trim() || null,
      position:     nextPosition,
      is_primary:   isPrimary,
      width,
      height,
      file_size:    outputBuffer.length,
      mime_type:    'image/webp',
      created_by:   user.id,
    })
    .select()
    .single();

  if (dbErr) {
    // Cleanup: remove orphaned Storage object
    await supabase.storage.from('product-images').remove([storagePath]);
    return NextResponse.json({ error: 'Database insert failed', detail: dbErr.message }, { status: 500 });
  }

  // 14. Build public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(storagePath);

  return NextResponse.json({
    id: imageRecord.id,
    storage_path: storagePath,
    public_url: publicUrl,
    width,
    height,
    file_size: outputBuffer.length,
    is_primary: isPrimary,
    position: nextPosition,
  }, { status: 201 });
}

// DELETE /api/products/[id]/images?image_id=xxx  — delete one image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single();
  if (!profile?.active || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const imageId = req.nextUrl.searchParams.get('image_id');
  if (!imageId) {
    return NextResponse.json({ error: 'image_id required' }, { status: 400 });
  }

  // Call RPC — handles metadata removal, position reorder, primary reassignment
  const { data: storagePath, error: rpcErr } = await supabase
    .rpc('delete_product_image', { p_image_id: imageId });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  // Validate path belongs to this product before deleting from Storage
  if (typeof storagePath === 'string' && storagePath.startsWith(`products/${productId}/`)) {
    const { error: storageErr } = await supabase.storage
      .from('product-images')
      .remove([storagePath]);
    if (storageErr) {
      // Metadata was removed; log but don't fail the response
      console.error('[image-delete] orphaned storage object:', storagePath, storageErr.message);
    }
  } else {
    // Path does not match product — do not delete, log for audit
    console.warn('[image-delete] path mismatch for productId', productId, 'got', storagePath);
  }

  return NextResponse.json({ deleted: imageId });
}
