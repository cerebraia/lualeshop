'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ProductPlaceholder } from './ProductPlaceholder';

interface ProductImageProps {
  src?: string;
  alt: string;
  name?: string;
  index?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

/** Shows next/image when a real image path exists; falls back to ProductPlaceholder. */
export function ProductImage({
  src,
  alt,
  name,
  index = 0,
  className,
  priority = false,
  fill = true,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}: ProductImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <ProductPlaceholder name={name} index={index} className={className} />;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
