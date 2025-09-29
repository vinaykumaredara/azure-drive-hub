import React from 'react';
import { resolveCarImageUrl } from '@/utils/carImageUtils';

interface SimpleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

export default function SimpleImage({ 
  src, 
  alt, 
  className = '',
  ...rest 
}: SimpleImageProps) {
  // Resolve URL synchronously
  const resolvedSrc = resolveCarImageUrl(src);
  
  return (
    <img
      src={resolvedSrc || FALLBACK_IMAGE}
      alt={alt}
      className={className}
      {...rest}
    />
  );
}