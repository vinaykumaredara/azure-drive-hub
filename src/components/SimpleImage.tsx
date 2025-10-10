import { ImgHTMLAttributes, useState, useEffect } from 'react';
import LazyImage from '@/components/LazyImage';

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
  lazy = true,
  ...rest
}: SimpleImageProps) {
  // Defensive approach - handle potential errors gracefully
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only render on client side to avoid SSR issues
    setIsClient(true);
  }, []);

  // If we're not on the client side, render nothing or a placeholder
  if (!isClient) {
    return (
      <div
        className={`bg-gray-100 ${className}`}
        style={{ minHeight: '200px' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  try {
    return (
      <LazyImage
        src={src}
        alt={alt}
        className={`aspect-video object-cover ${className}`}
        lazy={lazy}
        fallback={FALLBACK_IMAGE}
        aspectRatio="16/9"
        {...rest}
      />
    );
  } catch (error) {
    console.error('Error rendering SimpleImage:', error);
    // Fallback to a simple img tag if LazyImage fails
    return (
      <img
        src={src || FALLBACK_IMAGE}
        alt={alt}
        className={`aspect-video object-cover ${className}`}
        onError={e => {
          // @ts-expect-error: e.target is an HTMLImageElement but TypeScript doesn't know this in the onError handler
          e.target.src = FALLBACK_IMAGE;
        }}
        {...rest}
      />
    );
  }
}
