'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Star,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Check,
  GripVertical,
  Info,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { productRepository } from '@/lib/repositories/productRepository';

// ── Types ─────────────────────────────────────────────────────

export interface ManagedImage {
  id: string;
  src: string;               // public URL or local /public path
  storagePath?: string;      // only in Supabase mode
  altText: string;
  position: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
}

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  errorMessage?: string;
  progress: number;
}

interface Props {
  productId: string;
  productName: string;
  initialImages: ManagedImage[];
  onImagesChange?: (images: ManagedImage[]) => void;
  readOnly?: boolean;
}

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function isSupabaseMode() {
  return process.env.NEXT_PUBLIC_DATA_PROVIDER === 'supabase';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Drag state ─────────────────────────────────────────────────
const useDragReorder = (
  images: ManagedImage[],
  onReorder: (imgs: ManagedImage[]) => void
) => {
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function onDragStart(i: number) {
    dragIndex.current = i;
  }

  function onDragEnter(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return;
    setDragOver(i);
  }

  function onDragEnd() {
    if (dragIndex.current === null || dragOver === null || dragIndex.current === dragOver) {
      dragIndex.current = null;
      setDragOver(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(dragOver, 0, moved);
    const reindexed = next.map((img, idx) => ({ ...img, position: idx }));
    onReorder(reindexed);
    dragIndex.current = null;
    setDragOver(null);
  }

  return { dragOver, onDragStart, onDragEnter, onDragEnd };
};

// ── Main component ─────────────────────────────────────────────
export function ProductImageManager({
  productId,
  productName,
  initialImages,
  onImagesChange,
  readOnly = false,
}: Props) {
  const [images, setImages] = useState<ManagedImage[]>(
    [...initialImages].sort((a, b) => a.position - b.position)
  );
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [editAlt, setEditAlt] = useState<{ id: string; value: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ManagedImage | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseMode = isSupabaseMode();

  const updateImages = useCallback((next: ManagedImage[] | ((prev: ManagedImage[]) => ManagedImage[])) => {
    setImages((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      onImagesChange?.(resolved);
      return resolved;
    });
  }, [onImagesChange]);

  // Active image guard
  useEffect(() => {
    if (activeIndex >= images.length && images.length > 0) {
      setActiveIndex(images.length - 1);
    }
  }, [images.length, activeIndex]);

  // ── Drag-to-reorder ──────────────────────────────────────────
  const { dragOver, onDragStart, onDragEnter, onDragEnd } = useDragReorder(images, async (reordered: ManagedImage[]) => {
    updateImages(reordered);
    if (!supabaseMode) {
      // Mock: persist order via productRepository (images array = paths in order)
      const product = productRepository.findById(productId);
      if (product) {
        productRepository.update({
          ...product,
          images: reordered.map((img) => img.src),
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }
    // Supabase: call RPC
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const sb = getSupabaseBrowserClient();
      await sb.rpc('reorder_product_images', {
        p_product_id: productId,
        p_image_ids: reordered.map((img) => img.id),
      });
    } catch (err) {
      console.error('[ImageManager] reorder failed', err);
    }
  });

  // ── Upload pipeline ──────────────────────────────────────────
  function validateFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return `Formato no aceptado: ${file.type}. Usa JPEG, PNG o WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo supera los 8 MB (${formatBytes(file.size)}).`;
    }
    return null;
  }

  async function enqueueFiles(files: FileList | File[]) {
    const fileArr = Array.from(files);
    const available = MAX_IMAGES - images.length - uploads.filter(u => u.status !== 'error').length;
    if (available <= 0) {
      return;
    }
    const toUpload = fileArr.slice(0, available);

    const newItems: UploadItem[] = toUpload.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'idle' as UploadStatus,
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      const validationErr = validateFile(item.file);
      if (validationErr) {
        setUploads((prev) => prev.map((u) =>
          u.id === item.id ? { ...u, status: 'error', errorMessage: validationErr } : u
        ));
        continue;
      }
      await uploadFile(item);
    }
  }

  async function uploadFile(item: UploadItem) {
    if (!supabaseMode) {
      setUploads((prev) => prev.map((u) =>
        u.id === item.id
          ? { ...u, status: 'error', errorMessage: 'La carga de fotos requiere modo Supabase. Configura .env.local con DATA_PROVIDER=supabase.' }
          : u
      ));
      return;
    }

    setUploads((prev) => prev.map((u) =>
      u.id === item.id ? { ...u, status: 'processing', progress: 10 } : u
    ));

    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('alt_text', `${productName} de Luale Kids Shop`);

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/products/${productId}/images`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round(30 + (e.loaded / e.total) * 60);
          setUploads((prev) => prev.map((u) =>
            u.id === item.id ? { ...u, status: 'uploading', progress: pct } : u
          ));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          const result = JSON.parse(xhr.responseText);
          const newImg: ManagedImage = {
            id: result.id,
            src: result.public_url,
            storagePath: result.storage_path,
            altText: `${productName} de Luale Kids Shop`,
            position: result.position,
            isPrimary: result.is_primary,
            width: result.width,
            height: result.height,
            fileSize: result.file_size,
          };
          setUploads((prev) => prev.map((u) =>
            u.id === item.id ? { ...u, status: 'done', progress: 100 } : u
          ));
          updateImages((prev) => [...prev, newImg]);
          // Remove done upload from queue after delay
          setTimeout(() => {
            setUploads((prev) => prev.filter((u) => u.id !== item.id));
            URL.revokeObjectURL(item.preview);
          }, 1500);
        } else {
          let errMsg = 'Error al subir la imagen';
          try {
            const body = JSON.parse(xhr.responseText);
            if (body.error) errMsg = body.error;
          } catch { /* noop */ }
          setUploads((prev) => prev.map((u) =>
            u.id === item.id ? { ...u, status: 'error', errorMessage: errMsg } : u
          ));
        }
        resolve();
      };

      xhr.onerror = () => {
        setUploads((prev) => prev.map((u) =>
          u.id === item.id ? { ...u, status: 'error', errorMessage: 'Error de conexión' } : u
        ));
        resolve();
      };

      setUploads((prev) => prev.map((u) =>
        u.id === item.id ? { ...u, status: 'uploading', progress: 30 } : u
      ));

      xhr.send(formData);
    });
  }

  // ── Set primary ──────────────────────────────────────────────
  async function setPrimary(img: ManagedImage) {
    if (img.isPrimary) return;
    setSaving(true);

    const next = images.map((i) => ({
      ...i,
      isPrimary: i.id === img.id,
    }));
    updateImages(next);

    if (supabaseMode) {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        await getSupabaseBrowserClient().rpc('set_primary_product_image', {
          p_product_id: productId,
          p_image_id: img.id,
        });
      } catch (err) {
        console.error('[ImageManager] set_primary failed', err);
      }
    } else {
      // Mock: put this image first in the array
      const product = productRepository.findById(productId);
      if (product) {
        const sorted = [...next].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
        productRepository.update({
          ...product,
          images: sorted.map((i) => i.src),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    setSaving(false);
  }

  // ── Delete ───────────────────────────────────────────────────
  async function confirmDelete(img: ManagedImage) {
    setSaving(true);
    setDeleteConfirm(null);

    if (supabaseMode) {
      const res = await fetch(
        `/api/products/${productId}/images?image_id=${img.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        console.error('[ImageManager] delete failed', await res.text());
        setSaving(false);
        return;
      }
    } else {
      // Mock: remove from productRepository
      const product = productRepository.findById(productId);
      if (product) {
        productRepository.update({
          ...product,
          images: product.images.filter((src) => src !== img.src),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const remaining = images
      .filter((i) => i.id !== img.id)
      .map((i, idx) => ({ ...i, position: idx }));

    // Reassign primary if needed
    if (img.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }

    updateImages(remaining);
    setSaving(false);
  }

  // ── Edit alt text ────────────────────────────────────────────
  async function saveAlt() {
    if (!editAlt) return;
    const trimmed = editAlt.value.trim();
    if (!trimmed) return;
    const next = images.map((img) =>
      img.id === editAlt.id ? { ...img, altText: trimmed } : img
    );
    updateImages(next);

    if (supabaseMode) {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      await getSupabaseBrowserClient()
        .from('product_images')
        .update({ alt_text: trimmed })
        .eq('id', editAlt.id);
    }
    setEditAlt(null);
  }

  // ── Drop zone ────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (readOnly) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) enqueueFiles(files);
  }

  // ── Keyboard nav ─────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') setActiveIndex((i) => Math.max(0, i - 1));
    if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(images.length - 1, i + 1));
    if (e.key === 'Escape') setLightbox(false);
  }

  const activeImage = images[activeIndex] ?? null;
  const canUploadMore = images.length + uploads.filter(u => u.status !== 'error' && u.status !== 'done').length < MAX_IMAGES;

  return (
    <div className="space-y-5" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brown text-sm">Fotografías del producto</h3>
          <p className="text-xs text-brown-light mt-0.5">
            {images.length}/{MAX_IMAGES} fotos.{' '}
            {images.length === 0 ? 'Sin imágenes aún.' : 'La primera es la portada del catálogo.'}
          </p>
        </div>
        {saving && <Loader2 size={16} className="text-rose animate-spin" />}
      </div>

      {/* Mock mode notice */}
      {!supabaseMode && !readOnly && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Modo demo.</strong> La carga de nuevas fotos requiere Supabase activo.
            Las imágenes existentes se pueden reordenar y cambiar de portada localmente.
          </p>
        </div>
      )}

      {/* Main carousel */}
      {images.length > 0 && (
        <div className="relative">
          {/* Main image */}
          <div
            className="relative aspect-square rounded-3xl overflow-hidden bg-cream cursor-pointer border border-rose/10"
            onClick={() => setLightbox(true)}
            role="button"
            aria-label="Ampliar imagen"
          >
            {activeImage && (
              <Image
                src={activeImage.src}
                alt={activeImage.altText}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={activeIndex === 0}
              />
            )}
            {activeImage?.isPrimary && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-400 text-brown text-xs font-bold px-2 py-1 rounded-full">
                <Star size={11} fill="currentColor" />
                Portada
              </div>
            )}
            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.max(0, i - 1)); }}
                  disabled={activeIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.min(images.length - 1, i + 1)); }}
                  disabled={activeIndex === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {/* Dot indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className={cn('w-2 h-2 rounded-full transition-all', i === activeIndex ? 'bg-rose w-4' : 'bg-white/70')}
                    aria-label={`Ir a imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action buttons for active image */}
          {!readOnly && activeImage && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {!activeImage.isPrimary && (
                <Button size="sm" variant="outline" onClick={() => setPrimary(activeImage)}>
                  <Star size={13} /> Establecer portada
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditAlt({ id: activeImage.id, value: activeImage.altText })}
              >
                <Edit2 size={13} /> Alt
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteConfirm(activeImage)}
              >
                <Trash2 size={13} /> Eliminar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Thumbnails with drag reorder */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable={!readOnly}
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
                i === activeIndex ? 'border-rose' : 'border-transparent hover:border-rose/40',
                dragOver === i ? 'ring-2 ring-rose ring-offset-1 scale-105' : ''
              )}
              onClick={() => setActiveIndex(i)}
              role="button"
              aria-label={`Miniatura ${i + 1}`}
            >
              <Image
                src={img.src}
                alt={img.altText}
                fill
                className="object-cover"
                sizes="64px"
              />
              {img.isPrimary && (
                <div className="absolute top-0.5 left-0.5 bg-yellow-400 rounded-md p-0.5">
                  <Star size={8} fill="currentColor" className="text-brown" />
                </div>
              )}
              {!readOnly && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-brown/30 transition-opacity">
                  <GripVertical size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          className={cn(
            'border-2 border-dashed rounded-3xl p-6 text-center transition-all',
            dragActive ? 'border-rose bg-rose/5' : 'border-rose/30 bg-white hover:border-rose/60',
            !canUploadMore ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
          )}
          onClick={() => canUploadMore && fileInputRef.current?.click()}
          role="button"
          aria-label="Zona de carga de imágenes"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_EXT.join(',')}
            multiple
            onChange={(e) => e.target.files && enqueueFiles(e.target.files)}
          />
          <Upload size={22} className="text-rose mx-auto mb-2" />
          <p className="text-sm font-semibold text-brown">
            {canUploadMore
              ? 'Arrastra fotos aquí o haz clic para seleccionar'
              : `Límite alcanzado (${MAX_IMAGES} fotos)`}
          </p>
          <p className="text-xs text-brown-light mt-1">
            JPEG, PNG, WebP · máx 8 MB · hasta {MAX_IMAGES - images.length} más
          </p>
          <p className="text-xs text-brown-light/70 mt-2">
            Agrega hasta 8 fotografías del producto. Puedes arrastrarlas para cambiar el orden.
            La primera imagen será la portada del catálogo.
          </p>
        </div>
      )}

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border',
              u.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-rose/10'
            )}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                <Image src={u.preview} alt="Preview" width={40} height={40} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-brown truncate">{u.file.name}</p>
                {u.status === 'error' ? (
                  <p className="text-xs text-red-600">{u.errorMessage}</p>
                ) : (
                  <div className="mt-1 h-1.5 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose rounded-full transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {u.status === 'done' && <Check size={16} className="text-green-600" />}
                {u.status === 'error' && (
                  <button onClick={() => uploadFile(u)} className="text-xs text-rose font-semibold hover:underline">
                    Reintentar
                  </button>
                )}
                {(u.status === 'idle' || u.status === 'processing' || u.status === 'uploading') && (
                  <Loader2 size={16} className="text-rose animate-spin" />
                )}
              </div>
              {u.status === 'error' && (
                <button
                  onClick={() => {
                    URL.revokeObjectURL(u.preview);
                    setUploads((prev) => prev.filter((x) => x.id !== u.id));
                  }}
                  className="ml-1"
                >
                  <X size={14} className="text-brown-light" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploads.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-brown-light">
          <ImageIcon size={28} className="text-brown-light/40" />
          <p className="text-sm">Sin fotografías aún</p>
        </div>
      )}

      {/* Alt text edit modal */}
      {editAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brown/40 backdrop-blur-sm" onClick={() => setEditAlt(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <button onClick={() => setEditAlt(null)} className="absolute top-4 right-4">
              <X size={18} className="text-brown-light" />
            </button>
            <h3 className="font-bold text-brown mb-4">Texto alternativo (alt)</h3>
            <textarea
              value={editAlt.value}
              onChange={(e) => setEditAlt({ ...editAlt, value: e.target.value })}
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 border border-rose/30 rounded-2xl text-sm text-brown resize-none focus:outline-none focus:border-rose"
              placeholder={`${productName} de Luale Kids Shop`}
            />
            <p className="text-xs text-brown-light mt-1">{editAlt.value.length}/200 caracteres</p>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={() => setEditAlt(null)} fullWidth>Cancelar</Button>
              <Button onClick={saveAlt} disabled={!editAlt.value.trim()} fullWidth>Guardar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brown/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-brown mb-3">Eliminar fotografía</h3>
            <div className="relative aspect-square w-24 rounded-2xl overflow-hidden mx-auto mb-4">
              <Image src={deleteConfirm.src} alt={deleteConfirm.altText} fill className="object-cover" sizes="96px" />
            </div>
            {deleteConfirm.isPrimary && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Esta es la portada. Si la eliminas, la siguiente foto pasará a ser portada automáticamente.</p>
              </div>
            )}
            {images.length === 1 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">Es la única fotografía. El producto mostrará el fallback de Luale si la eliminas.</p>
              </div>
            )}
            <p className="text-sm text-brown-light text-center mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)} fullWidth>Cancelar</Button>
              <Button variant="danger" onClick={() => confirmDelete(deleteConfirm)} loading={saving} fullWidth>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-brown/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.max(0, i - 1)); }}
                disabled={activeIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.min(images.length - 1, i + 1)); }}
                disabled={activeIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
                aria-label="Siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div
            className="relative max-w-3xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.altText}
              width={activeImage.width ?? 1200}
              height={activeImage.height ?? 1200}
              className="object-contain max-h-[85vh] mx-auto rounded-2xl"
              sizes="90vw"
            />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            {activeIndex + 1} / {images.length} · {activeImage.altText}
          </p>
        </div>
      )}
    </div>
  );
}
