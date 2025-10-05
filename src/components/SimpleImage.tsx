import { ImgHTMLAttributes } from 'react';
import LazyImage from '@/components/LazyImage';

interface SimpleImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

export default function SimpleImage({ 
  src, 
  alt, 
  className = '',
  lazy = true,
  ...rest 
}: SimpleImageProps) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={className}
      lazy={lazy}
      fallback={FALLBACK_IMAGE}
      {...rest}
    />
  );
}