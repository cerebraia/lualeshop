'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Package,
  ArrowLeft,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { productRepository } from '@/lib/repositories/productRepository';
import { inventoryRepository } from '@/lib/repositories/inventoryRepository';
import type { Product, MerchandiseEntry, MerchandiseEntryItem } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { generateId, formatPrice } from '@/lib/utils';

const INITIAL_REFERENCE = 'INICIAL-LUALE';

interface VariantRow {
  productId: string;
  productName: string;
  sku: string;
  catalogNumber: number | undefined;
  variantId: string;
  size: string;
  quantity: string;
  unitCost: string;
  notes: string;
  error?: string;
}

type ImportError = { row: number; sku: string; variantSize: string; message: string };

function parsePositiveInt(val: string): number | null {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function parsePositiveDecimal(val: string): number | null {
  const n = parseFloat(val);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function exportTemplate(products: Product[]): void {
  const rows: string[] = [
    'sku,catalog_number,product_name,variant_id,size,initial_quantity,unit_cost,notes',
  ];
  for (const p of products) {
    for (const v of p.variants) {
      const row = [
        p.sku,
        p.catalogNumber ?? '',
        `"${p.name.replace(/"/g, '""')}"`,
        v.id,
        `"${v.size.replace(/"/g, '""')}"`,
        '',
        '',
        '',
      ].join(',');
      rows.push(row);
    }
  }
  const bom = '﻿';
  const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'luale-inventario-inicial.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function InventarioInicialPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');
  const [saving, setSaving] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    const prods = productRepository.findAll().sort((a, b) => (a.catalogNumber ?? 999) - (b.catalogNumber ?? 999));
    const entries = inventoryRepository.findAllEntries();
    const exists = entries.some((e) => e.reference === INITIAL_REFERENCE);

    setProducts(prods);
    setAlreadyExists(exists);

    const initialRows: VariantRow[] = [];
    for (const p of prods) {
      for (const v of p.variants) {
        initialRows.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          catalogNumber: p.catalogNumber,
          variantId: v.id,
          size: v.size,
          quantity: '',
          unitCost: '',
          notes: '',
        });
      }
    }
    setRows(initialRows);
    setLoaded(true);
  }

  useEffect(load, []);

  function updateRow(index: number, field: 'quantity' | 'unitCost' | 'notes', value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value, error: undefined } : r)));
  }

  function validateRows(): boolean {
    let valid = true;
    const updated = rows.map((r) => {
      const qty = r.quantity.trim();
      const cost = r.unitCost.trim();

      if (qty === '' && cost === '') return r; // untouched row — allowed (skip)

      let error: string | undefined;
      if (qty !== '') {
        const n = parsePositiveInt(qty);
        if (n === null) { error = 'Cantidad debe ser un entero ≥ 0'; valid = false; }
      }
      if (!error && cost !== '') {
        const n = parsePositiveDecimal(cost);
        if (n === null) { error = 'Costo debe ser un número ≥ 0'; valid = false; }
      }
      return { ...r, error };
    });
    setRows(updated);
    return valid;
  }

  function handlePreview() {
    if (!validateRows()) return;
    setStep('preview');
  }

  async function handleConfirm() {
    setSaving(true);

    const items: MerchandiseEntryItem[] = [];
    let totalCost = 0;

    for (const r of rows) {
      const qty = parsePositiveInt(r.quantity.trim());
      if (qty === null || qty === 0) continue;
      const cost = parsePositiveDecimal(r.unitCost.trim()) ?? 0;
      items.push({
        productId: r.productId,
        variantId: r.variantId,
        quantity: qty,
        unitCost: cost,
      });
      totalCost += qty * cost;
    }

    const entry: MerchandiseEntry = {
      id: generateId('ent'),
      date: new Date().toISOString().split('T')[0],
      reference: INITIAL_REFERENCE,
      supplier: 'Inventario inicial',
      items,
      additionalCosts: 0,
      totalCost,
      notes: 'Carga de inventario inicial Luale Kids Shop',
      createdAt: new Date().toISOString(),
    };

    inventoryRepository.createEntry(entry);

    // Update product cost and inventoryConfigured flag
    for (const r of rows) {
      const cost = parsePositiveDecimal(r.unitCost.trim());
      if (cost === null) continue;
      const product = products.find((p) => p.id === r.productId);
      if (!product) continue;
      // Only update cost if it was provided
      productRepository.update({
        ...product,
        cost,
        inventoryConfigured: true,
        updatedAt: new Date().toISOString(),
      });
    }

    // Update variant stock
    for (const r of rows) {
      const qty = parsePositiveInt(r.quantity.trim());
      if (qty === null || qty === 0) continue;
      const product = products.find((p) => p.id === r.productId);
      if (!product) continue;
      const updatedProduct = productRepository.findById(r.productId);
      if (!updatedProduct) continue;
      productRepository.update({
        ...updatedProduct,
        inventoryConfigured: true,
        variants: updatedProduct.variants.map((v) =>
          v.id === r.variantId ? { ...v, stock: qty } : v
        ),
        updatedAt: new Date().toISOString(),
      });
    }

    setTimeout(() => {
      setSaving(false);
      setStep('done');
      setAlreadyExists(true);
      load();
    }, 400);
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      // Remove BOM if present
      const cleaned = text.replace(/^﻿/, '');
      const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setImportErrors([{ row: 0, sku: '', variantSize: '', message: 'El archivo no tiene datos' }]);
        return;
      }

      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const skuIdx = header.indexOf('sku');
      const variantIdx = header.indexOf('variant_id');
      const sizeIdx = header.indexOf('size');
      const qtyIdx = header.indexOf('initial_quantity');
      const costIdx = header.indexOf('unit_cost');
      const notesIdx = header.indexOf('notes');

      if (skuIdx === -1 || variantIdx === -1) {
        setImportErrors([{
          row: 1, sku: '', variantSize: '',
          message: 'El CSV debe tener columnas "sku" y "variant_id"',
        }]);
        return;
      }

      const errors: ImportError[] = [];
      const updates: Map<string, { quantity?: number; unitCost?: number; notes?: string }> = new Map();

      function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
          } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
        result.push(current);
        return result;
      }

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const sku = cols[skuIdx]?.trim() ?? '';
        const variantId = cols[variantIdx]?.trim() ?? '';
        const size = sizeIdx >= 0 ? (cols[sizeIdx]?.trim() ?? '') : '';
        const qtyRaw = qtyIdx >= 0 ? (cols[qtyIdx]?.trim() ?? '') : '';
        const costRaw = costIdx >= 0 ? (cols[costIdx]?.trim() ?? '') : '';
        const notesVal = notesIdx >= 0 ? (cols[notesIdx]?.trim() ?? '') : '';

        if (!sku && !variantId) continue;

        const product = products.find((p) => p.sku === sku);
        if (!product) {
          errors.push({ row: i + 1, sku, variantSize: size, message: `SKU "${sku}" no encontrado en el catálogo` });
          continue;
        }

        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant) {
          errors.push({ row: i + 1, sku, variantSize: size, message: `variant_id "${variantId}" no encontrado en ${sku}` });
          continue;
        }

        let qty: number | undefined;
        let cost: number | undefined;

        if (qtyRaw) {
          const n = parsePositiveInt(qtyRaw);
          if (n === null) {
            errors.push({ row: i + 1, sku, variantSize: variant.size, message: 'Cantidad inválida: debe ser entero ≥ 0' });
            continue;
          }
          qty = n;
        }

        if (costRaw) {
          const n = parsePositiveDecimal(costRaw);
          if (n === null) {
            errors.push({ row: i + 1, sku, variantSize: variant.size, message: 'Costo inválido: debe ser número ≥ 0' });
            continue;
          }
          cost = n;
        }

        updates.set(variantId, { quantity: qty, unitCost: cost, notes: notesVal });
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      // Apply to rows
      setRows((prev) =>
        prev.map((r) => {
          const upd = updates.get(r.variantId);
          if (!upd) return r;
          return {
            ...r,
            quantity: upd.quantity !== undefined ? String(upd.quantity) : r.quantity,
            unitCost: upd.unitCost !== undefined ? String(upd.unitCost) : r.unitCost,
            notes: upd.notes !== undefined ? upd.notes : r.notes,
          };
        })
      );

      setImportSuccess(true);
    };

    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  // Preview summary
  const filledRows = rows.filter((r) => r.quantity.trim() !== '' || r.unitCost.trim() !== '');
  const previewItems = rows.filter((r) => {
    const qty = parsePositiveInt(r.quantity.trim());
    return qty !== null && qty > 0;
  });
  const totalUnits = previewItems.reduce((s, r) => s + (parsePositiveInt(r.quantity) ?? 0), 0);
  const totalValue = previewItems.reduce((s, r) => {
    const qty = parsePositiveInt(r.quantity) ?? 0;
    const cost = parsePositiveDecimal(r.unitCost) ?? 0;
    return s + qty * cost;
  }, 0);
  const missingCostRows = previewItems.filter((r) => !r.unitCost.trim() || parsePositiveDecimal(r.unitCost) === null).length;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center">
          <CheckCircle size={40} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-brown mb-2">Inventario inicial registrado</h2>
          <p className="text-brown-light text-sm mb-6">
            Se guardó la entrada con referencia <code className="font-mono">{INITIAL_REFERENCE}</code> y se actualizaron
            los productos con el stock y costo registrados.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/admin/inventario" className="text-rose font-semibold text-sm hover:underline">
              Ver inventario →
            </Link>
            <Link href="/admin/puesta-en-marcha" className="text-brown-light text-sm hover:underline">
              Volver a puesta en marcha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="max-w-3xl">
        <button
          onClick={() => setStep('form')}
          className="flex items-center gap-1.5 text-sm text-brown-light hover:text-brown mb-6"
        >
          <ArrowLeft size={14} /> Volver al formulario
        </button>

        <h1 className="text-2xl font-extrabold text-brown mb-1">Confirmar inventario inicial</h1>
        <p className="text-brown-light text-sm mb-6">Revisa el resumen antes de guardar.</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-rose/10 p-4 text-center">
            <p className="text-2xl font-extrabold text-brown">{previewItems.length}</p>
            <p className="text-xs text-brown-light">variantes con stock</p>
          </div>
          <div className="bg-white rounded-2xl border border-rose/10 p-4 text-center">
            <p className="text-2xl font-extrabold text-brown">{totalUnits}</p>
            <p className="text-xs text-brown-light">unidades totales</p>
          </div>
          <div className="bg-white rounded-2xl border border-rose/10 p-4 text-center">
            <p className="text-2xl font-extrabold text-brown">{formatPrice(totalValue)}</p>
            <p className="text-xs text-brown-light">valorización total</p>
          </div>
        </div>

        {missingCostRows > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <strong>{missingCostRows} variante{missingCostRows > 1 ? 's' : ''}</strong> no tiene costo registrado.
              La valorización y utilidad serán incompletas hasta que se registre el costo.
            </p>
          </div>
        )}

        {/* Items table */}
        <div className="bg-white rounded-3xl border border-rose/10 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-xs text-brown-light font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Talla</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo unit.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((r, i) => {
                  const qty = parsePositiveInt(r.quantity) ?? 0;
                  const cost = parsePositiveDecimal(r.unitCost) ?? 0;
                  return (
                    <tr key={i} className="border-t border-cream">
                      <td className="px-4 py-2.5 font-mono text-xs text-brown-light">{r.sku}</td>
                      <td className="px-4 py-2.5 text-brown font-medium">{r.productName}</td>
                      <td className="px-4 py-2.5 text-brown-light">{r.size}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-brown">{qty}</td>
                      <td className="px-4 py-2.5 text-right text-brown-light">
                        {cost > 0 ? formatPrice(cost) : <span className="text-amber-500">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-brown">
                        {cost > 0 ? formatPrice(qty * cost) : <span className="text-amber-500">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {previewItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-brown-light">
                      Ninguna variante con cantidad mayor a 0
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Esta acción guardará la entrada <strong>{INITIAL_REFERENCE}</strong> y actualizará el stock
            y costo de los productos. No podrá ejecutarse dos veces con la misma referencia.
            Asegúrate de que los datos son correctos antes de confirmar.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep('form')}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            loading={saving}
            disabled={previewItems.length === 0}
          >
            Confirmar y guardar inventario inicial
          </Button>
        </div>
      </div>
    );
  }

  // ── Form step ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/inventario" className="text-brown-light hover:text-brown">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-extrabold text-brown">Inventario inicial</h1>
      </div>
      <p className="text-brown-light text-sm mb-6 ml-7">
        Registra el stock y costo real con el que comienza Luale. Solo puede realizarse una vez
        con la referencia <code className="font-mono text-xs">{INITIAL_REFERENCE}</code>.
      </p>

      {/* Already exists warning */}
      {alreadyExists && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Ya existe una entrada de inventario inicial con referencia <strong>{INITIAL_REFERENCE}</strong>.
            Si necesitas corregir el stock, usa la página de{' '}
            <Link href="/admin/inventario" className="underline font-semibold">Inventario</Link> para ajustes manuales.
          </p>
        </div>
      )}

      {/* CSV actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportTemplate(products)}
        >
          <Download size={14} /> Exportar plantilla CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} /> Importar CSV
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleCSVImport}
        />
      </div>

      {/* CSV import status */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
          <CheckCircle size={15} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">CSV importado correctamente. Revisa los datos y confirma.</p>
        </div>
      )}
      {importErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} /> {importErrors.length} error{importErrors.length > 1 ? 'es' : ''} en el CSV
          </p>
          <ul className="space-y-1">
            {importErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-600">
                Fila {err.row}: <strong>{err.sku}</strong> {err.variantSize && `(${err.variantSize})`} — {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CSV format note */}
      <div className="bg-cream rounded-2xl px-4 py-3 mb-6 text-xs text-brown-light">
        <strong className="text-brown">Formato CSV:</strong>{' '}
        <code>sku, catalog_number, product_name, variant_id, size, initial_quantity, unit_cost, notes</code>
        {' '}· Encoding UTF-8 · Usa comas como separador · Deja cantidad/costo vacíos si no se conocen aún.
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="text-brown-light">
          <strong className="text-brown">{filledRows.length}</strong> de <strong className="text-brown">{rows.length}</strong> variantes con datos
        </span>
        <span className="text-brown-light">
          Unidades: <strong className="text-brown">{rows.reduce((s, r) => s + (parsePositiveInt(r.quantity) ?? 0), 0)}</strong>
        </span>
        <span className="text-brown-light">
          Valor: <strong className="text-brown">
            {formatPrice(rows.reduce((s, r) => {
              const qty = parsePositiveInt(r.quantity) ?? 0;
              const cost = parsePositiveDecimal(r.unitCost) ?? 0;
              return s + qty * cost;
            }, 0))}
          </strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-rose/10 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-xs text-brown-light font-semibold uppercase tracking-wide sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Talla</th>
                <th className="px-4 py-3 text-left w-28">Cantidad inicial</th>
                <th className="px-4 py-3 text-left w-28">Costo unit. ($)</th>
                <th className="px-4 py-3 text-left">Observación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.variantId}
                  className={`border-t border-cream ${r.error ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-2 text-xs text-brown-light font-mono">{r.sku}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-brown text-xs">{r.productName}</p>
                  </td>
                  <td className="px-4 py-2 text-xs text-brown-light">{r.size}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={r.quantity}
                      onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                      placeholder="0"
                      disabled={alreadyExists}
                      className="w-full px-2 py-1.5 text-sm border border-rose/30 rounded-xl focus:outline-none focus:border-rose text-brown disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={r.unitCost}
                      onChange={(e) => updateRow(i, 'unitCost', e.target.value)}
                      placeholder="0.00"
                      disabled={alreadyExists}
                      className="w-full px-2 py-1.5 text-sm border border-rose/30 rounded-xl focus:outline-none focus:border-rose text-brown disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.notes}
                      onChange={(e) => updateRow(i, 'notes', e.target.value)}
                      placeholder="Opcional"
                      disabled={alreadyExists}
                      className="w-full px-2 py-1.5 text-sm border border-rose/30 rounded-xl focus:outline-none focus:border-rose text-brown-light disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row errors summary */}
      {rows.some((r) => r.error) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <AlertCircle size={14} /> Errores de validación
          </p>
          {rows.filter((r) => r.error).map((r, i) => (
            <p key={i} className="text-xs text-red-600 mt-1">
              {r.sku} — {r.size}: {r.error}
            </p>
          ))}
        </div>
      )}

      {!alreadyExists && (
        <div className="flex gap-3">
          <Link href="/admin/inventario">
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button
            onClick={handlePreview}
            disabled={filledRows.length === 0}
          >
            <Package size={15} /> Vista previa →
          </Button>
        </div>
      )}

      {alreadyExists && (
        <div className="flex gap-3">
          <Link href="/admin/inventario">
            <Button variant="ghost">Ver inventario</Button>
          </Link>
          <Link href="/admin/mercancia">
            <Button variant="outline" size="md">Nueva entrada de mercancía</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
