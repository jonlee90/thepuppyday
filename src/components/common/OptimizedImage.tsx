/**
 * Optimized Image Component
 * Task 0222: Implement OptimizedImage component with WebP support
 *
 * Wrapper around Next.js Image with optimization defaults
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  /**
   * Whether this is a priority image (above the fold)
   */
  priority?: boolean;

  /**
   * Enable blur placeholder
   */
  enableBlur?: boolean;

  /**
   * Fallback image if main image fails to load
   */
  fallbackSrc?: string;
}

export function OptimizedImage({
  alt,
  priority = false,
  enableBlur = true,
  fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27300%27%3E%3Crect fill=%27%23EAE0D5%27 width=%27400%27 height=%27300%27/%3E%3C/svg%3E',
  onError,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <Image
      {...props}
      src={error && fallbackSrc ? fallbackSrc : props.src}
      alt={alt}
      priority={priority}
      placeholder={enableBlur ? 'blur' : 'empty'}
      blurDataURL={
        enableBlur
          ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP48e4pAAWtAsyqbuMfAAAAAElFTkSuQmCC'
          : undefined
      }
      onError={handleError}
      // Optimization settings
      quality={priority ? 90 : 75}
      loading={priority ? 'eager' : 'lazy'}
      // Ensure sizes are set for responsive images
      sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
    />
  );
}
