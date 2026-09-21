'use client';

/**
 * Launch readiness calculations — derives real indicators from repository data.
 * Works with both mock (localStorage) and Supabase repositories since it
 * receives already-loaded data as arguments.
 */

import type { Product, StoreSettings, MerchandiseEntry, Order, Expense } from './types';

export type ReadinessStatus = 'ready' | 'pending' | 'blocked';

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  value: string;
  href?: string;
}

export interface ReadinessCategory {
  id: string;
  label: string;
  checks: ReadinessCheck[];
  score: number;   // 0–100
  blocked: boolean;
}

export interface ReadinessReport {
  categories: ReadinessCategory[];
  totalScore: number;
  blockedCount: number;
  pendingCount: number;
  readyCount: number;
  canActivateIndexing: boolean;
}

export interface ProductReadinessDetail {
  id: string;
  sku: string;
  catalogNumber?: number;
  name: string;
  hasImage: boolean;
  hasPrice: boolean;
  hasCost: boolean;
  hasVariant: boolean;
  inventoryConfigured: boolean;
  hasStock: boolean;
  isVisible: boolean;
  isReadyToSell: boolean;
  pendingReason: string[];
}

// ── Product-level analysis ────────────────────────────────────────────────────

export function analyzeProducts(products: Product[]): {
  total: number;
  published: number;
  noImage: number;
  inventoryPending: number;
  noCost: number;
  noVariant: number;
  readyToSell: number;
  details: ProductReadinessDetail[];
} {
  const details: ProductReadinessDetail[] = products.map((p) => {
    const hasImage = p.images.length > 0 && p.images[0] !== '';
    const hasPrice = p.price > 0 || (p.purchaseOptions?.some((po) => po.price > 0) ?? false);
    const hasCost  = p.cost > 0;
    const hasVariant = p.variants.length > 0;
    const inventoryConfigured = p.inventoryConfigured;
    const hasStock = p.variants.some((v) => v.stock > 0);
    const isVisible = p.visible;

    const pendingReason: string[] = [];
    if (!hasImage) pendingReason.push('Sin imagen');
    if (!hasPrice) pendingReason.push('Sin precio');
    if (!hasCost) pendingReason.push('Sin costo');
    if (!hasVariant) pendingReason.push('Sin talla');
    if (!inventoryConfigured) pendingReason.push('Inventario pendiente');
    if (inventoryConfigured && !hasStock) pendingReason.push('Sin stock');

    const isReadyToSell =
      isVisible && hasImage && hasPrice && hasVariant &&
      inventoryConfigured && (hasStock || p.status === 'available');

    return {
      id: p.id,
      sku: p.sku,
      catalogNumber: p.catalogNumber,
      name: p.name,
      hasImage,
      hasPrice,
      hasCost,
      hasVariant,
      inventoryConfigured,
      hasStock,
      isVisible,
      isReadyToSell,
      pendingReason,
    };
  });

  return {
    total:               details.length,
    published:           details.filter((d) => d.isVisible).length,
    noImage:             details.filter((d) => !d.hasImage).length,
    inventoryPending:    details.filter((d) => !d.inventoryConfigured).length,
    noCost:              details.filter((d) => !d.hasCost).length,
    noVariant:           details.filter((d) => !d.hasVariant).length,
    readyToSell:         details.filter((d) => d.isReadyToSell).length,
    details,
  };
}

// ── Full report ───────────────────────────────────────────────────────────────

export function computeReadinessReport(
  products:  Product[],
  settings:  StoreSettings | null,
  entries:   MerchandiseEntry[],
  orders:    Order[],
  expenses:  Expense[],
  hasOwner:  boolean,
  dataProvider: string,
): ReadinessReport {

  const pa = analyzeProducts(products);
  const allProductsHaveImages = pa.noImage === 0;

  // ── Catalog ──────────────────────────────────────────────────────────────
  const catalogChecks: ReadinessCheck[] = [
    {
      id: 'products_count',
      label: 'Productos en catálogo',
      status: pa.total >= 46 ? 'ready' : 'blocked',
      value: `${pa.total} / 46`,
      href: '/admin/productos',
    },
    {
      id: 'products_published',
      label: 'Productos publicados',
      status: pa.published === pa.total ? 'ready' : 'pending',
      value: `${pa.published} de ${pa.total}`,
      href: '/admin/productos',
    },
    {
      id: 'products_images',
      label: 'Imágenes principales',
      status: allProductsHaveImages ? 'ready' : 'blocked',
      value: allProductsHaveImages ? '46 / 46' : `Faltan ${pa.noImage}`,
      href: '/admin/productos',
    },
  ];

  // ── Inventory ─────────────────────────────────────────────────────────────
  const configuredCount = pa.total - pa.inventoryPending;
  const inventoryChecks: ReadinessCheck[] = [
    {
      id: 'inventory_configured',
      label: 'Inventario configurado',
      status: configuredCount === pa.total ? 'ready' : configuredCount > 0 ? 'pending' : 'pending',
      value: `${configuredCount} / ${pa.total}`,
      href: '/admin/inventario/inicial',
    },
    {
      id: 'costs_loaded',
      label: 'Costos cargados',
      status: pa.noCost === 0 ? 'ready' : pa.noCost < pa.total ? 'pending' : 'pending',
      value: pa.noCost === 0
        ? 'Todos los productos'
        : `${pa.total - pa.noCost} de ${pa.total} (faltan ${pa.noCost})`,
      href: '/admin/inventario/inicial',
    },
    {
      id: 'ready_to_sell',
      label: 'Listos para vender',
      status: pa.readyToSell === pa.total ? 'ready' : pa.readyToSell > 0 ? 'pending' : 'pending',
      value: `${pa.readyToSell} de ${pa.total}`,
      href: '/admin/puesta-en-marcha',
    },
  ];

  // ── Configuration ─────────────────────────────────────────────────────────
  const whatsappOk = !!(settings?.whatsappLink && settings.whatsappLink.length >= 10);
  const configChecks: ReadinessCheck[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp configurado',
      status: whatsappOk ? 'ready' : 'blocked',
      value: settings?.whatsapp ?? 'No configurado',
      href: '/admin/configuracion',
    },
    {
      id: 'store_name',
      label: 'Nombre de tienda',
      status: settings?.storeName ? 'ready' : 'blocked',
      value: settings?.storeName ?? 'No configurado',
      href: '/admin/configuracion',
    },
    {
      id: 'delivery_info',
      label: 'Información de delivery',
      status: settings?.deliveryInfo ? 'ready' : 'pending',
      value: settings?.deliveryInfo ? 'Configurado' : 'Pendiente',
      href: '/admin/configuracion',
    },
  ];

  // ── Security ──────────────────────────────────────────────────────────────
  const securityChecks: ReadinessCheck[] = [
    {
      id: 'owner',
      label: 'Owner activo',
      status: hasOwner ? 'ready' : 'blocked',
      value: hasOwner ? 'Activo' : 'Sin configurar',
      href: '/admin',
    },
    {
      id: 'no_indexing',
      label: 'Indexación desactivada',
      status: process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true' ? 'ready' : 'pending',
      value: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'ACTIVA (revisar)' : 'Desactivada ✓',
      href: '/admin/puesta-en-marcha',
    },
    {
      id: 'data_provider',
      label: 'Proveedor de datos',
      status: dataProvider === 'supabase' ? 'ready' : 'pending',
      value: dataProvider === 'supabase' ? 'Supabase ✓' : `Mock (${dataProvider})`,
      href: '/admin/configuracion',
    },
  ];

  // ── Operations ────────────────────────────────────────────────────────────
  const opsChecks: ReadinessCheck[] = [
    {
      id: 'first_sale_test',
      label: 'Prueba de venta guiada',
      status: 'pending',
      value: 'Pendiente del propietario',
      href: '/admin/pedidos',
    },
    {
      id: 'payment_methods',
      label: 'Métodos de pago documentados',
      status: 'pending',
      value: 'Confirmar con propietario',
      href: '/admin/configuracion',
    },
  ];

  const buildCategory = (
    id: string,
    label: string,
    checks: ReadinessCheck[]
  ): ReadinessCategory => {
    const ready   = checks.filter((c) => c.status === 'ready').length;
    const blocked = checks.some((c) => c.status === 'blocked');
    return {
      id,
      label,
      checks,
      score: Math.round((ready / checks.length) * 100),
      blocked,
    };
  };

  const categories: ReadinessCategory[] = [
    buildCategory('catalog',   'Catálogo',       catalogChecks),
    buildCategory('inventory', 'Inventario',     inventoryChecks),
    buildCategory('config',    'Configuración',  configChecks),
    buildCategory('security',  'Seguridad',      securityChecks),
    buildCategory('ops',       'Operación',      opsChecks),
  ];

  const allChecks = categories.flatMap((c) => c.checks);
  const readyCount   = allChecks.filter((c) => c.status === 'ready').length;
  const pendingCount = allChecks.filter((c) => c.status === 'pending').length;
  const blockedCount = allChecks.filter((c) => c.status === 'blocked').length;
  const totalScore   = Math.round((readyCount / allChecks.length) * 100);
  const canActivateIndexing = blockedCount === 0 && dataProvider === 'supabase';

  return { categories, totalScore, blockedCount, pendingCount, readyCount, canActivateIndexing };
}
