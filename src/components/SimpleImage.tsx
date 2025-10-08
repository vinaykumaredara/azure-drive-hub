import { ImgHTMLAttributes } from 'react';
import LazyImage from '@/components/LazyImage';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

export default function SimpleImage({
  src,
  alt,
  className = '',
  lazy,
  ...rest
}: SimpleImageProps) {
  const isMobile = useIsMobile();
  // For desktop views, disable lazy loading to ensure images load properly
  const shouldLazyLoad = lazy !== undefined ? lazy : isMobile;

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`aspect-video object-cover ${className}`}
      lazy={shouldLazyLoad}
      fallback={FALLBACK_IMAGE}
      aspectRatio="16/9"
      {...rest}
    />
  );
}
