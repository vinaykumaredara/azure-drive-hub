import { useState, useEffect, useRef } from 'react';
import { resolveCarImageUrl, preloadImage } from '@/utils/carImageUtils';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: string; // small LQIP if available
  aspectRatio?: string; // e.g., "4/3", "16/9", "1/1"
  fallback?: string; // custom fallback image URL
  debug?: boolean; // Add debug prop
  lazy?: boolean; // Enable lazy loading
};

// Default fallback image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

export default function LazyImage({ 
  src, 
  alt, 
  placeholder: _placeholder,
  aspectRatio, 
  fallback,
  className = '',
  debug = false,
  lazy = true,
  ...rest 
}: Props) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Resolve URL synchronously
  const resolvedSrc = resolveCarImageUrl(src);
  
  // Log for debugging
  useEffect(() => {
    if (debug) {
      console.log("LazyImage - Props:", { src, alt, resolvedSrc });
    }
  }, [src, alt, resolvedSrc, debug]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) {return;}

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Load images when they're 50px away from viewport
        threshold: 0.01
      }
    );

    // Observe the image element
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy]);

  // Preload image when it becomes visible
  useEffect(() => {
    if (!isVisible || !resolvedSrc) {return;}

    let isMounted = true;
    
    preloadImage(resolvedSrc)
      .then(() => {
        if (isMounted) {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isVisible, resolvedSrc]);

  // Aspect ratio container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    ...(aspectRatio ? {
      aspectRatio: aspectRatio,
    } : {}),
    display: 'block'
  };

  // Handle image load error
  const handleError = () => {
    if (debug) {
      console.log('Image failed to load', resolvedSrc);
    }
    setError(true);
  };

  // Determine which image to display
  const displaySrc = error || !resolvedSrc ? (fallback || FALLBACK_IMAGE) : resolvedSrc;

  // Show placeholder while loading
  if (!loaded && isVisible) {
    return (
      <div style={containerStyle} className="bg-gray-100">
        <img
          ref={imgRef}
          src={displaySrc}
          alt={alt}
          onError={handleError}
          onLoad={() => setLoaded(true)}
          className={`${className} block w-full h-full object-cover ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          {...rest}
        />
        
        {debug && resolvedSrc && (
          <div className="text-xs p-1 bg-gray-100 break-all">
            {resolvedSrc}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle} className="bg-gray-100">
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        onError={handleError}
        className={`${className} block w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        {...rest}
      />
      
      {debug && resolvedSrc && (
        <div className="text-xs p-1 bg-gray-100 break-all">
          {resolvedSrc}
        </div>
      )}
    </div>
  );
}