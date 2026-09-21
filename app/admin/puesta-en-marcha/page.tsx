'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  Boxes,
  Users,
  Settings,
  Shield,
  Globe,
  Database,
  BarChart3,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { productRepository } from '@/lib/repositories/productRepository';
import { orderRepository } from '@/lib/repositories/orderRepository';
import { customerRepository } from '@/lib/repositories/customerRepository';
import { expenseRepository } from '@/lib/repositories/expenseRepository';
import { inventoryRepository } from '@/lib/repositories/inventoryRepository';
import { settingsRepository } from '@/lib/repositories/settingsRepository';
import type { Product, StoreSettings } from '@/lib/types';

type ReadinessStatus = 'ready' | 'pending' | 'blocked';

interface CategoryScore {
  name: string;
  icon: React.ReactNode;
  status: ReadinessStatus;
  items: CheckItem[];
}

interface CheckItem {
  label: string;
  status: ReadinessStatus;
  detail?: string;
  href?: string;
}

const STATUS_COLOR: Record<ReadinessStatus, string> = {
  ready: 'text-green-600',
  pending: 'text-amber-600',
  blocked: 'text-red-500',
};

const STATUS_BG: Record<ReadinessStatus, string> = {
  ready: 'bg-green-50 border-green-200',
  pending: 'bg-amber-50 border-amber-200',
  blocked: 'bg-red-50 border-red-200',
};

const STATUS_LABEL: Record<ReadinessStatus, string> = {
  ready: 'Listo',
  pending: 'Pendiente',
  blocked: 'Bloqueado',
};

function StatusIcon({ status, size = 16 }: { status: ReadinessStatus; size?: number }) {
  if (status === 'ready') return <CheckCircle size={size} className="text-green-600 shrink-0" />;
  if (status === 'blocked') return <XCircle size={size} className="text-red-500 shrink-0" />;
  return <AlertCircle size={size} className="text-amber-500 shrink-0" />;
}

function categoryStatus(items: CheckItem[]): ReadinessStatus {
  if (items.some((i) => i.status === 'blocked')) return 'blocked';
  if (items.some((i) => i.status === 'pending')) return 'pending';
  return 'ready';
}

interface DemoDataReport {
  orders: number;
  customers: number;
  expenses: number;
  movements: number;
  entries: number;
}

export default function PuestaEnMarchaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [demoData, setDemoData] = useState<DemoDataReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';
  const isSupabase = provider === 'supabase';
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  function load() {
    const prods = productRepository.findAll();
    const ords = orderRepository.findAll();
    const custs = customerRepository.findAll();
    const exps = expenseRepository.findAll();
    const movs = inventoryRepository.findAllMovements();
    const ents = inventoryRepository.findAllEntries();
    const stgs = settingsRepository.get();

    setProducts(prods);
    setSettings(stgs);

    // Demo data: records that look like demo/test (mock IDs)
    const demoCusts = custs.filter(
      (c) => c.id.startsWith('cust-') && ['cust-001', 'cust-002', 'cust-003'].includes(c.id)
    );
    const demoOrds = ords.filter(
      (o) => o.id.startsWith('ord-') && ['ord-001', 'ord-002', 'ord-003'].includes(o.id)
    );
    const demoExps = exps.filter(
      (e) => e.id.startsWith('exp-') && ['exp-001', 'exp-002', 'exp-003', 'exp-004'].includes(e.id)
    );
    const demoMovs = movs.filter(
      (m) => m.id.startsWith('mov-') && ['mov-001', 'mov-002', 'mov-003'].includes(m.id)
    );
    const demoEnts = ents.filter(
      (e) => e.id.startsWith('ent-') && ['ent-001'].includes(e.id)
    );

    setDemoData({
      orders: demoOrds.length,
      customers: demoCusts.length,
      expenses: demoExps.length,
      movements: demoMovs.length,
      entries: demoEnts.length,
    });

    setLoaded(true);
  }

  useEffect(load, []);

  if (!loaded || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
      </div>
    );
  }

  // ── Computed metrics ──────────────────────────────────────────────────────
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.visible).length;
  const noImage = products.filter((p) => p.images.length === 0).length;
  const noCategory = products.filter((p) => p.categoryIds.length === 0).length;
  const noPrice = products.filter((p) => p.price <= 0).length;
  const noCost = products.filter((p) => p.cost <= 0).length;
  const inventoryPending = products.filter((p) => !p.inventoryConfigured).length;
  const outOfStock = products.filter((p) =>
    p.variants.every((v) => v.stock === 0)
  ).length;
  const readyToSell = products.filter(
    (p) =>
      p.visible &&
      p.images.length > 0 &&
      p.price > 0 &&
      p.categoryIds.length > 0 &&
      p.inventoryConfigured &&
      p.variants.some((v) => v.stock > 0)
  ).length;

  const hasWhatsApp = Boolean(settings.whatsappLink?.trim());
  const hasInstagram = Boolean(settings.instagram?.trim());
  const hasDeliveryInfo = Boolean(settings.deliveryInfo?.trim());
  const hasShippingInfo = Boolean(settings.shippingInfo?.trim());

  const totalDemoRecords =
    (demoData?.orders ?? 0) +
    (demoData?.customers ?? 0) +
    (demoData?.expenses ?? 0) +
    (demoData?.movements ?? 0) +
    (demoData?.entries ?? 0);

  // ── Readiness categories ──────────────────────────────────────────────────
  const categories: CategoryScore[] = [
    {
      name: 'Catálogo',
      icon: <Package size={16} />,
      items: [
        {
          label: `${totalProducts} productos en catálogo`,
          status: totalProducts === 46 ? 'ready' : 'blocked',
          detail: totalProducts !== 46 ? `Se esperan 46, hay ${totalProducts}` : undefined,
          href: '/admin/productos',
        },
        {
          label: `${publishedProducts} productos publicados`,
          status: publishedProducts > 0 ? 'ready' : 'pending',
          detail: publishedProducts === 0 ? 'Ningún producto visible en la tienda' : undefined,
          href: '/admin/productos',
        },
        {
          label: noImage === 0 ? 'Todos los productos tienen imagen' : `${noImage} productos sin imagen`,
          status: noImage === 0 ? 'ready' : 'blocked',
          href: '/admin/productos',
        },
        {
          label: noCategory === 0 ? 'Todos los productos tienen categoría' : `${noCategory} sin categoría`,
          status: noCategory === 0 ? 'ready' : 'blocked',
          href: '/admin/productos',
        },
        {
          label: noPrice === 0 ? 'Todos los productos tienen precio' : `${noPrice} sin precio de venta`,
          status: noPrice === 0 ? 'ready' : 'blocked',
          href: '/admin/productos',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Inventario',
      icon: <Boxes size={16} />,
      items: [
        {
          label: inventoryPending === 0
            ? 'Todos los productos con inventario configurado'
            : `${inventoryPending}/${totalProducts} sin inventario configurado`,
          status: inventoryPending === 0 ? 'ready' : inventoryPending === totalProducts ? 'blocked' : 'pending',
          href: '/admin/inventario/inicial',
        },
        {
          label: noCost === 0
            ? 'Todos los productos tienen costo registrado'
            : `${noCost}/${totalProducts} sin costo unitario`,
          status: noCost === 0 ? 'ready' : 'blocked',
          detail: noCost > 0 ? 'Sin costo no es posible calcular utilidad real' : undefined,
          href: '/admin/inventario/inicial',
        },
        {
          label: outOfStock === 0
            ? 'Todos los productos tienen stock disponible'
            : `${outOfStock} productos sin stock`,
          status: outOfStock === 0 ? 'ready' : outOfStock < totalProducts ? 'pending' : 'blocked',
          href: '/admin/inventario',
        },
        {
          label: readyToSell > 0
            ? `${readyToSell} productos listos para vender`
            : 'Sin productos listos para vender',
          status: readyToSell > 0 ? 'ready' : 'blocked',
          href: '/admin/inventario',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Finanzas',
      icon: <BarChart3 size={16} />,
      items: [
        {
          label: noCost === 0
            ? 'Costos completos — utilidad calculable'
            : `${noCost} productos sin costo — utilidad incompleta`,
          status: noCost === 0 ? 'ready' : 'blocked',
          detail: noCost > 0 ? 'El dashboard mostrará "Utilidad incompleta"' : undefined,
          href: '/admin/finanzas',
        },
        {
          label: totalDemoRecords === 0
            ? 'Sin datos de demostración en registros financieros'
            : `${demoData?.orders ?? 0} pedidos, ${demoData?.expenses ?? 0} gastos de demo`,
          status: totalDemoRecords === 0 ? 'ready' : 'pending',
          detail: totalDemoRecords > 0 ? 'Elimina los datos demo antes del lanzamiento' : undefined,
          href: '/admin/pedidos',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Configuración',
      icon: <Settings size={16} />,
      items: [
        {
          label: hasWhatsApp ? `WhatsApp: ${settings.whatsapp}` : 'WhatsApp no configurado',
          status: hasWhatsApp ? 'ready' : 'blocked',
          href: '/admin/configuracion',
        },
        {
          label: hasInstagram ? `Instagram: ${settings.instagram}` : 'Instagram no configurado',
          status: hasInstagram ? 'ready' : 'pending',
          href: '/admin/configuracion',
        },
        {
          label: hasDeliveryInfo ? 'Información de delivery configurada' : 'Sin información de delivery',
          status: hasDeliveryInfo ? 'ready' : 'pending',
          href: '/admin/configuracion',
        },
        {
          label: hasShippingInfo ? 'Información de envíos configurada' : 'Sin información de envíos',
          status: hasShippingInfo ? 'ready' : 'pending',
          href: '/admin/configuracion',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Seguridad',
      icon: <Shield size={16} />,
      items: [
        {
          label: isSupabase ? 'Supabase conectado' : 'Modo demostración — sin autenticación real',
          status: isSupabase ? 'ready' : 'blocked',
          detail: !isSupabase ? 'Configura .env.local con NEXT_PUBLIC_DATA_PROVIDER=supabase' : undefined,
        },
        {
          label: isSupabase ? 'RLS activo en Supabase' : 'RLS no verificable en modo mock',
          status: isSupabase ? 'ready' : 'blocked',
          detail: !isSupabase ? 'Aplica las migraciones en tu proyecto Supabase' : undefined,
        },
        {
          label: 'Usuario propietario (owner)',
          status: isSupabase ? 'pending' : 'blocked',
          detail: !isSupabase
            ? 'Crea el usuario owner en Supabase Auth'
            : 'Verifica que exista un perfil con role=owner',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Infraestructura',
      icon: <Globe size={16} />,
      items: [
        {
          label: allowIndexing ? 'ADVERTENCIA: indexación pública activa' : 'Indexación desactivada (noindex)',
          status: allowIndexing ? 'blocked' : 'ready',
          detail: !allowIndexing ? 'robots.txt envía noindex hasta aprobación' : undefined,
        },
        {
          label: 'Dominio lualekids.shop',
          status: 'pending',
          detail: 'Verificar manualmente que DNS y HTTPS estén activos',
        },
        {
          label: 'Deploy activo en Railway',
          status: 'pending',
          detail: 'Verificar URL de producción y commit desplegado',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
    {
      name: 'Operación',
      icon: <DollarSign size={16} />,
      items: [
        {
          label: totalDemoRecords === 0
            ? 'Sin datos de demostración encontrados'
            : `${totalDemoRecords} registros demo detectados`,
          status: totalDemoRecords === 0 ? 'ready' : 'pending',
          detail: totalDemoRecords > 0
            ? `Pedidos: ${demoData?.orders}, Clientes: ${demoData?.customers}, Gastos: ${demoData?.expenses}`
            : undefined,
          href: '/admin/pedidos',
        },
        {
          label: 'Prueba operativa segura realizada',
          status: 'pending',
          detail: 'Ver docs/first-real-sale.md para el checklist guiado',
        },
        {
          label: 'Respaldo inicial documentado',
          status: 'pending',
          detail: 'Ver docs/backup-strategy.md',
        },
      ],
      get status() {
        return categoryStatus(this.items);
      },
    },
  ];

  const blockedCount = categories.filter((c) => c.status === 'blocked').length;
  const pendingCount = categories.filter((c) => c.status === 'pending').length;
  const readyCount = categories.filter((c) => c.status === 'ready').length;
  const overallStatus: ReadinessStatus =
    blockedCount > 0 ? 'blocked' : pendingCount > 0 ? 'pending' : 'ready';
  const goNoGo = blockedCount === 0 ? 'GO' : 'NO-GO';

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brown">Puesta en Marcha</h1>
        <p className="text-brown-light text-sm mt-1">
          Estado real del negocio antes del lanzamiento público
        </p>
      </div>

      {/* GO / NO-GO banner */}
      <div
        className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 mb-8 ${
          overallStatus === 'blocked'
            ? 'bg-red-50 border-red-200'
            : overallStatus === 'pending'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={overallStatus} size={22} />
          <div>
            <p className={`font-extrabold text-lg ${STATUS_COLOR[overallStatus]}`}>
              {goNoGo} para lanzamiento
            </p>
            <p className="text-sm text-brown-light">
              {blockedCount > 0
                ? `${blockedCount} categoría${blockedCount > 1 ? 's' : ''} bloqueada${blockedCount > 1 ? 's' : ''}. Resuelve los bloqueadores antes de publicar.`
                : pendingCount > 0
                ? `${pendingCount} elemento${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}. Puedes avanzar pero completa esto antes de la primera venta real.`
                : 'Todas las categorías verificadas. Listo para operar.'}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-brown-light hover:text-brown font-medium shrink-0"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Listas', count: readyCount, status: 'ready' as ReadinessStatus },
          { label: 'Pendientes', count: pendingCount, status: 'pending' as ReadinessStatus },
          { label: 'Bloqueadas', count: blockedCount, status: 'blocked' as ReadinessStatus },
        ].map(({ label, count, status }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 text-center ${STATUS_BG[status]}`}
          >
            <p className={`text-3xl font-extrabold ${STATUS_COLOR[status]}`}>{count}</p>
            <p className="text-xs font-semibold text-brown-light mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Product metrics summary */}
      <div className="bg-white rounded-3xl border border-rose/10 shadow-sm p-5 mb-8">
        <h2 className="font-bold text-brown mb-4 flex items-center gap-2">
          <Package size={16} className="text-brown-light" />
          Métricas del catálogo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: totalProducts, note: 'productos', ok: totalProducts === 46 },
            { label: 'Publicados', value: publishedProducts, note: 'visibles', ok: publishedProducts > 0 },
            { label: 'Listos', value: readyToSell, note: 'para vender', ok: readyToSell > 0 },
            { label: 'Sin costo', value: noCost, note: 'bloqueados', ok: noCost === 0 },
            { label: 'Sin imagen', value: noImage, note: 'sin foto', ok: noImage === 0 },
            { label: 'Sin inv.', value: inventoryPending, note: 'pendientes', ok: inventoryPending === 0 },
            { label: 'Sin stock', value: outOfStock, note: 'agotados', ok: outOfStock === 0 },
            { label: 'Sin precio', value: noPrice, note: 'sin precio', ok: noPrice === 0 },
          ].map(({ label, value, note, ok }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-extrabold ${ok ? 'text-green-600' : value === 0 ? 'text-brown' : 'text-red-500'}`}>
                {value}
              </p>
              <p className="text-xs font-semibold text-brown">{label}</p>
              <p className="text-xs text-brown-light">{note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-cream flex flex-wrap gap-3">
          <Link
            href="/admin/inventario/inicial"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose hover:underline"
          >
            <Boxes size={13} /> Configurar inventario inicial →
          </Link>
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brown-light hover:text-brown"
          >
            <Package size={13} /> Ver productos →
          </Link>
        </div>
      </div>

      {/* Demo data report */}
      {totalDemoRecords > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            Datos de demostración detectados
          </h2>
          <p className="text-sm text-amber-700 mb-3">
            Se encontraron {totalDemoRecords} registros de demostración. Elimínalos manualmente antes
            del lanzamiento para que las métricas financieras reflejen solo operaciones reales.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Pedidos', value: demoData?.orders ?? 0, href: '/admin/pedidos' },
              { label: 'Clientes', value: demoData?.customers ?? 0, href: '/admin/clientes' },
              { label: 'Gastos', value: demoData?.expenses ?? 0, href: '/admin/gastos' },
              { label: 'Movimientos', value: demoData?.movements ?? 0, href: '/admin/inventario' },
              { label: 'Entradas', value: demoData?.entries ?? 0, href: '/admin/mercancia' },
            ].map(({ label, value, href }) => (
              <Link key={label} href={href} className="text-center p-2 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-colors">
                <p className={`text-xl font-extrabold ${value > 0 ? 'text-amber-700' : 'text-green-600'}`}>{value}</p>
                <p className="text-xs text-amber-600">{label}</p>
              </Link>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3">
            No elimines automáticamente — revisa cada registro antes de borrarlo. En modo mock, ve a cada módulo y elimina los registros con prefijo demo (ord-00x, cust-00x, etc.).
          </p>
        </div>
      )}

      {/* Categories detail */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-white rounded-3xl border border-rose/10 shadow-sm overflow-hidden"
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${
                cat.status === 'ready'
                  ? 'bg-green-50 border-green-100'
                  : cat.status === 'blocked'
                  ? 'bg-red-50 border-red-100'
                  : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={STATUS_COLOR[cat.status]}>{cat.icon}</span>
                <span className="font-bold text-brown">{cat.name}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BG[cat.status]} ${STATUS_COLOR[cat.status]}`}
              >
                {STATUS_LABEL[cat.status]}
              </span>
            </div>
            <ul className="divide-y divide-cream">
              {cat.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown">{item.label}</p>
                    {item.detail && (
                      <p className="text-xs text-brown-light mt-0.5">{item.detail}</p>
                    )}
                  </div>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="shrink-0 text-xs text-rose font-semibold hover:underline flex items-center gap-1"
                    >
                      Ver <ExternalLink size={11} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* What owner must provide */}
      <div className="mt-8 bg-white rounded-3xl border border-rose/10 shadow-sm p-5">
        <h2 className="font-bold text-brown mb-4 flex items-center gap-2">
          <Users size={16} className="text-brown-light" />
          Datos que debe suministrar el propietario
        </h2>
        <ul className="space-y-2 text-sm">
          {[
            { label: 'Costo unitario real de cada producto', hint: 'Necesario para calcular utilidad bruta', href: '/admin/inventario/inicial' },
            { label: 'Cantidad inicial de stock por variante', hint: 'Usar flujo de inventario inicial o CSV', href: '/admin/inventario/inicial' },
            { label: 'Credenciales Supabase (URL + anon key + service role)', hint: 'Configurar en .env.local en el servidor' },
            { label: 'Cuenta de usuario owner en Supabase Auth', hint: 'Crear manualmente con el CLI de Supabase' },
            { label: 'Verificación de dominio lualekids.shop', hint: 'Confirmar DNS activo y HTTPS habilitado' },
            { label: 'Confirmación de deploy en Railway', hint: 'Verificar URL de producción y commit' },
            { label: 'Métodos de pago aceptados y datos bancarios', hint: 'Para mostrar instrucciones al cliente', href: '/admin/configuracion' },
            { label: 'Costo de delivery por zona en Caracas', hint: 'Actualizar en configuración', href: '/admin/configuracion' },
          ].map(({ label, hint, href }) => (
            <li key={label} className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-brown">{label}</span>
                {hint && <p className="text-xs text-brown-light">{hint}</p>}
              </div>
              {href && (
                <Link href={href} className="text-xs text-rose font-semibold hover:underline shrink-0">
                  Ir →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Documentation links */}
      <div className="mt-6 bg-white rounded-3xl border border-rose/10 shadow-sm p-5">
        <h2 className="font-bold text-brown mb-4 flex items-center gap-2">
          <Database size={16} className="text-brown-light" />
          Documentación de operación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {[
            { label: 'Inventario inicial', path: 'docs/initial-inventory.md' },
            { label: 'Importación CSV', path: 'docs/inventory-csv-import.md' },
            { label: 'Primera venta real', path: 'docs/first-real-sale.md' },
            { label: 'Fórmulas financieras', path: 'docs/finance-formulas.md' },
            { label: 'Estrategia de respaldo', path: 'docs/backup-strategy.md' },
            { label: 'Runbook de recuperación', path: 'docs/recovery-runbook.md' },
            { label: 'Checklist de lanzamiento', path: 'docs/launch-readiness.md' },
            { label: 'Guía de admin', path: 'docs/admin-user-guide.md' },
          ].map(({ label, path }) => (
            <div key={path} className="flex items-center gap-2 text-brown-light">
              <span className="text-brown-light/40">→</span>
              <code className="text-xs font-mono">{path}</code>
              <span className="text-xs">— {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
