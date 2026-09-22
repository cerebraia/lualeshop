'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Truck,
  MapPin,
  Minus,
  Plus,
  AlertCircle,
  Info,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { mockProducts } from '@/lib/mock/products';
import { mockCategories } from '@/lib/mock/categories';
import { intentRepository } from '@/lib/repositories/intentRepository';
import type { ProductVariant, ProductPurchaseOption } from '@/lib/types';
import { formatPrice, buildWhatsAppLink } from '@/lib/utils';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductImageCarousel } from '@/components/product/ProductImageCarousel';

const WHATSAPP_NUMBER = '584220162748';

function generateIntentId(): string {
  return `intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildMessage(
  productName: string,
  sku: string,
  categoryName: string | undefined,
  purchaseOptionLabel: string | undefined,
  variant: ProductVariant,
  quantity: number,
  price: number,
  url: string
): string {
  const total = price * quantity;
  const lines = [
    `Hola, estoy interesado/a en *${productName}* de Luale Kids Shop.`,
    '',
    `SKU: ${sku}`,
    ...(categoryName ? [`Categoría: ${categoryName}`] : []),
    `Opción: ${purchaseOptionLabel ?? 'Unidad'}`,
    `Talla: ${variant.size}`,
    `Cantidad: ${quantity}`,
    `Precio unitario: $${price.toFixed(2)}`,
    `Total: $${total.toFixed(2)}`,
    `Enlace: ${url}`,
    '',
    '¿Está disponible?',
  ];
  return lines.join('\n');
}

export default function ProductoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  // Hooks must be declared before any early returns
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOption, setSelectedOption] = useState<ProductPurchaseOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState('');

  const productRaw = mockProducts.find((p) => p.slug === slug && p.visible);
  if (!productRaw) return notFound();
  const product = productRaw;

  const hasPurchaseOptions = !!(product.purchaseOptions && product.purchaseOptions.length > 1);
  const displayPrice = hasPurchaseOptions
    ? (selectedOption?.price ?? product.price)
    : product.price;

  const categories = mockCategories.filter((c) => product.categoryIds.includes(c.id));

  const relatedProducts = mockProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.visible &&
        p.categoryIds.some((id) => product.categoryIds.includes(id))
    )
    .slice(0, 4);

  function handleSelectVariant(variant: ProductVariant) {
    setSelectedVariant(variant);
    setValidationError('');
    setQuantity(1);
  }

  function handleSelectOption(option: ProductPurchaseOption) {
    setSelectedOption(option);
    setValidationError('');
  }

  function handleQtyChange(delta: number) {
    setQuantity((q) => Math.max(1, q + delta));
  }

  function handleWhatsApp() {
    if (!selectedVariant) {
      setValidationError('Por favor selecciona una talla antes de continuar.');
      return;
    }
    if (hasPurchaseOptions && !selectedOption) {
      setValidationError('Por favor selecciona una opción de compra antes de continuar.');
      return;
    }

    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://lualekids.shop/producto/${slug}`;

    const message = buildMessage(
      product.name,
      product.sku,
      categories[0]?.name,
      selectedOption?.label,
      selectedVariant,
      quantity,
      displayPrice,
      url
    );

    // Log intent — never block the WhatsApp redirect if this fails
    try {
      intentRepository.create({
        id: generateIntentId(),
        productId: product.id,
        productName: product.name,
        purchaseOptionLabel: selectedOption?.label,
        variantSize: selectedVariant.size,
        quantity,
        price: displayPrice,
        origin: 'product_page',
        date: new Date().toISOString(),
      });
    } catch {
      // Intentional no-op: intent logging is best-effort
    }

    const link = buildWhatsAppLink(WHATSAPP_NUMBER, message);
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  const SITE = 'https://lualekids.shop';
  const productUrl = `${SITE}/producto/${slug}`;
  const productImage = product.images[0] ? `${SITE}${product.images[0]}` : `${SITE}/og-image.jpg`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: productImage,
    url: productUrl,
    brand: { '@type': 'Brand', name: 'Luale Kids Shop' },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: displayPrice.toFixed(2),
      // Only state availability when inventory is confirmed; otherwise omit
      ...(product.inventoryConfigured
        ? {
            availability:
              product.status === 'available'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          }
        : {}),
      seller: { '@type': 'Organization', name: 'Luale Kids Shop' },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE}/catalogo` },
        ...(categories[0]
          ? [{ '@type': 'ListItem', position: 3, name: categories[0].name, item: `${SITE}/categoria/${categories[0].slug}` }]
          : []),
        { '@type': 'ListItem', position: categories[0] ? 4 : 3, name: product.name, item: productUrl },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-brown-light mb-8 flex-wrap">
        <Link href="/" className="hover:text-rose transition-colors">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/catalogo" className="hover:text-rose transition-colors">Catálogo</Link>
        {categories[0] && (
          <>
            <ChevronRight size={14} />
            <Link href={`/categoria/${categories[0].slug}`} className="hover:text-rose transition-colors">
              {categories[0].name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-brown font-semibold truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
            {product.isNew && <Badge variant="new">Nuevo</Badge>}
            {product.featured && <Badge variant="featured">Destacado</Badge>}
          </div>
          <ProductImageCarousel
            images={product.images.map((src, i) => ({
              src,
              alt: `${product.name} de Luale Kids Shop${product.images.length > 1 ? ` — foto ${i + 1}` : ''}`,
            }))}
            productName={product.name}
            index={0}
            priority
          />
        </motion.div>

        {/* Product info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-5"
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-brown-light font-medium">{product.garmentType}</span>
              <span className="text-brown-light">·</span>
              <span className="text-xs text-brown-light font-mono">{product.sku}</span>
              {product.catalogNumber !== undefined && (
                <>
                  <span className="text-brown-light">·</span>
                  <span className="text-xs text-brown-light">Cat. #{product.catalogNumber}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brown leading-tight mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {hasPurchaseOptions && !selectedOption ? (
                <span className="text-3xl font-bold text-brown">
                  Desde {formatPrice(product.price)}
                </span>
              ) : (
                <span className="text-3xl font-bold text-brown">{formatPrice(displayPrice)}</span>
              )}
              {product.inventoryConfigured ? (
                <StatusBadge status={product.status} />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  <Info size={11} />
                  Consultar disponibilidad
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-brown-light leading-relaxed text-sm">{product.description}</p>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categoria/${c.slug}`}
                className="text-xs bg-cream text-brown-light font-medium px-3 py-1 rounded-full hover:bg-rose/10 hover:text-rose transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Purchase option selector */}
          {hasPurchaseOptions && (
            <div>
              <p className="text-sm font-bold text-brown mb-2">
                Opción de compra
                <span className="text-red-400 ml-1">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.purchaseOptions!.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition-all
                        ${isSelected ? 'border-rose bg-rose text-white shadow-sm' : 'border-rose/30 text-brown hover:border-rose'}
                      `}
                    >
                      {option.label}
                      {option.unitDescription && (
                        <span className="ml-1 text-xs opacity-70">· {option.unitDescription}</span>
                      )}
                      <span className="ml-2 font-bold">{formatPrice(option.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant selector */}
          <div>
            <p className="text-sm font-bold text-brown mb-2">
              Selecciona tu talla
              <span className="text-red-400 ml-1">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                // When inventory is not configured, all sizes are selectable
                const outOfStock = product.inventoryConfigured && v.stock === 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => !outOfStock && handleSelectVariant(v)}
                    disabled={outOfStock}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition-all
                      ${isSelected ? 'border-rose bg-rose text-white shadow-sm' : ''}
                      ${!isSelected && !outOfStock ? 'border-rose/30 text-brown hover:border-rose' : ''}
                      ${outOfStock ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed' : ''}
                    `}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
            {product.sizeNote && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Info size={11} />
                {product.sizeNote}
              </p>
            )}
            {selectedVariant && product.inventoryConfigured && (
              <p className="text-xs text-brown-light mt-2">
                Stock disponible: <strong className="text-brown">{selectedVariant.stock}</strong> unidades
              </p>
            )}
            {selectedVariant && !product.inventoryConfigured && (
              <p className="text-xs text-brown-light mt-2">
                Consulta disponibilidad por WhatsApp al finalizar.
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <p className="text-sm font-bold text-brown mb-2" id="qty-label">Cantidad</p>
            <div className="flex items-center gap-3" role="group" aria-labelledby="qty-label">
              <button
                onClick={() => handleQtyChange(-1)}
                disabled={quantity <= 1}
                aria-label="Reducir cantidad"
                className="w-9 h-9 rounded-2xl border-2 border-rose/30 flex items-center justify-center text-brown hover:border-rose hover:bg-rose hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus size={15} />
              </button>
              <span className="text-xl font-bold text-brown w-8 text-center" aria-live="polite" aria-label={`Cantidad: ${quantity}`}>{quantity}</span>
              <button
                onClick={() => handleQtyChange(1)}
                disabled={
                  product.inventoryConfigured
                    ? !selectedVariant || quantity >= selectedVariant.stock
                    : false
                }
                aria-label="Aumentar cantidad"
                className="w-9 h-9 rounded-2xl border-2 border-rose/30 flex items-center justify-center text-brown hover:border-rose hover:bg-rose hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Validation */}
          {validationError && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {validationError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleWhatsApp}
            aria-label={`Pedir ${product.name} por WhatsApp`}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-sm text-base active:scale-[0.98]"
          >
            <WhatsAppIcon size={22} />
            Pedir por WhatsApp
          </button>

          <p className="text-xs text-brown-light text-center">
            Te redirigiremos a WhatsApp para coordinar tu pedido
          </p>

          {/* Delivery info */}
          <div className="bg-cream rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brown">Delivery en Caracas</p>
                <p className="text-xs text-brown-light">Costo adicional según la zona.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={16} className="text-blue-pastel shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brown">Envíos nacionales</p>
                <p className="text-xs text-brown-light">A cualquier ciudad de Venezuela.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold text-brown mb-6">También te puede gustar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
