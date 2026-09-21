'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { ProductImage } from '@/components/ui/ProductImage';
import { Badge } from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const isMultiPrice = !!(product.purchaseOptions && product.purchaseOptions.length > 1);
  const showRealStatus = product.inventoryConfigured;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/producto/${product.slug}`}
        className="group block bg-white rounded-3xl overflow-hidden border border-brown/6 hover:border-rose/20 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-cream">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
            <ProductImage
              src={product.images[0]}
              alt={`${product.name} de Luale Kids Shop`}
              name={product.name}
              index={index}
              className="w-full h-full"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {product.isNew && <Badge variant="new">Nuevo</Badge>}
            {product.featured && <Badge variant="featured">Destacado</Badge>}
          </div>

          {showRealStatus && product.status !== 'available' && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant={product.status as 'low_stock' | 'out_of_stock' | 'coming_soon'}>
                {product.status === 'low_stock' ? 'Últimas' : product.status === 'out_of_stock' ? 'Agotado' : 'Pronto'}
              </Badge>
            </div>
          )}

          {/* Arrow overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end justify-end p-2">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-sm">
              <ArrowRight size={13} className="text-brown" />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-brown-light/80 font-medium mb-1 uppercase tracking-wide">{product.garmentType}</p>
          <h3 className="font-bold text-brown text-sm leading-snug mb-3 group-hover:text-rose transition-colors line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-extrabold text-brown">
              {isMultiPrice ? `Desde ${formatPrice(product.price)}` : formatPrice(product.price)}
            </span>
            <span className="inline-flex items-center justify-center w-8 h-8 bg-rose group-hover:bg-rose-dark text-white rounded-xl shrink-0 transition-colors shadow-sm">
              <ArrowRight size={14} />
            </span>
          </div>

          {!showRealStatus ? (
            <p className="text-xs text-brown-light/60 mt-2">Consultar disponibilidad</p>
          ) : product.status === 'available' ? (
            <p className="text-xs text-green-600 font-medium mt-2">Disponible</p>
          ) : null}

          {product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {product.variants.slice(0, 3).map((v) => (
                <span
                  key={v.id}
                  className="text-xs border border-rose/20 text-brown-light px-1.5 py-0.5 rounded-lg"
                >
                  {v.size}
                </span>
              ))}
              {product.variants.length > 3 && (
                <span className="text-xs text-brown-light">+{product.variants.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
