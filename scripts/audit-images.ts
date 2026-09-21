/**
 * Image Audit Script
 *
 * Scans the mock product catalog for image-related issues.
 * In Supabase mode, connect and check product_images table against Storage.
 *
 * Usage:
 *   npx tsx scripts/audit-images.ts
 *
 * Output:
 *   artifacts/product-images/image-audit.json
 *
 * Does NOT delete anything. Reports only.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { mockProducts } from '../lib/mock/products';

const MAX_IMAGES = 8;
const OUTPUT_PATH = path.join(process.cwd(), 'artifacts', 'product-images', 'image-audit.json');

interface ImageIssue {
  productId: string;
  sku: string;
  catalogNumber?: number;
  productName: string;
  issues: string[];
  images: {
    src: string;
    exists: boolean;
    isPrimary: boolean;
  }[];
}

interface AuditReport {
  generatedAt: string;
  mode: 'mock' | 'supabase';
  summary: {
    totalProducts: number;
    productsWithIssues: number;
    productsWithoutImages: number;
    productsWithoutPrimary: number;
    productsOver8Images: number;
    missingFiles: number;
    emptyAlt: number;
  };
  issues: ImageIssue[];
  clean: { productId: string; sku: string; productName: string; imageCount: number }[];
}

function checkFileExists(relativePath: string): boolean {
  if (!relativePath.startsWith('/')) return false;
  const absolutePath = path.join(process.cwd(), 'public', relativePath);
  return fs.existsSync(absolutePath);
}

function runMockAudit(): AuditReport {
  const issues: ImageIssue[] = [];
  const clean: AuditReport['clean'] = [];

  for (const product of mockProducts) {
    const productIssues: string[] = [];
    const imageDetails: ImageIssue['images'] = [];

    if (product.images.length === 0) {
      productIssues.push('Sin imágenes');
    }

    if (product.images.length > MAX_IMAGES) {
      productIssues.push(`Más de ${MAX_IMAGES} imágenes (tiene ${product.images.length})`);
    }

    let hasPrimary = false;

    for (let i = 0; i < product.images.length; i++) {
      const src = product.images[i];
      const exists = checkFileExists(src);
      const isPrimary = i === 0; // mock: first image is primary

      if (isPrimary) hasPrimary = true;

      if (!exists) {
        productIssues.push(`Archivo no encontrado: ${src}`);
      }

      if (!src || src.trim() === '') {
        productIssues.push(`Ruta de imagen vacía en posición ${i}`);
      }

      imageDetails.push({ src, exists, isPrimary });
    }

    if (product.images.length > 0 && !hasPrimary) {
      productIssues.push('Sin imagen principal definida');
    }

    // Check for duplicate paths
    const uniqueSrcs = new Set(product.images);
    if (uniqueSrcs.size < product.images.length) {
      productIssues.push('Rutas de imagen duplicadas');
    }

    if (productIssues.length > 0) {
      issues.push({
        productId: product.id,
        sku: product.sku,
        catalogNumber: product.catalogNumber,
        productName: product.name,
        issues: productIssues,
        images: imageDetails,
      });
    } else {
      clean.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        imageCount: product.images.length,
      });
    }
  }

  const missingFiles = issues.reduce(
    (sum, p) => sum + p.images.filter((img) => !img.exists).length,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    mode: 'mock',
    summary: {
      totalProducts: mockProducts.length,
      productsWithIssues: issues.length,
      productsWithoutImages: issues.filter((p) => p.issues.includes('Sin imágenes')).length,
      productsWithoutPrimary: issues.filter((p) =>
        p.issues.some((i) => i.includes('Sin imagen principal'))
      ).length,
      productsOver8Images: issues.filter((p) =>
        p.issues.some((i) => i.includes(`Más de ${MAX_IMAGES}`))
      ).length,
      missingFiles,
      emptyAlt: 0, // alt text is computed from product name in mock mode
    },
    issues,
    clean,
  };
}

function main() {
  const report = runMockAudit();

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n🔍 Image Audit Report');
  console.log('═══════════════════════════════════════');
  console.log(`Mode:            ${report.mode}`);
  console.log(`Generated:       ${report.generatedAt}`);
  console.log(`Total products:  ${report.summary.totalProducts}`);
  console.log(`With issues:     ${report.summary.productsWithIssues}`);
  console.log(`Without images:  ${report.summary.productsWithoutImages}`);
  console.log(`Without primary: ${report.summary.productsWithoutPrimary}`);
  console.log(`Missing files:   ${report.summary.missingFiles}`);
  console.log('');

  if (report.issues.length === 0) {
    console.log('✅ All products have valid images.');
  } else {
    console.log(`⚠️  ${report.issues.length} products with issues:`);
    for (const item of report.issues) {
      console.log(`\n  ${item.sku} — ${item.productName}`);
      for (const issue of item.issues) {
        console.log(`    • ${issue}`);
      }
    }
  }

  console.log(`\nFull report: ${OUTPUT_PATH}`);

  process.exit(report.issues.length > 0 ? 1 : 0);
}

main();
