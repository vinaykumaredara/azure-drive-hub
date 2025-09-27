import { useState, useRef, useEffect } from 'react';
import { resolveCarImageUrl } from '@/utils/carImageUtils';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: string; // small LQIP if available
  aspectRatio?: string; // e.g., "4/3", "16/9", "1/1"
  fallback?: string; // custom fallback image URL
  debug?: boolean; // Add debug prop
};

export default function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  aspectRatio, 
  fallback,
  className = '',
  debug = false,
  ...rest 
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Resolve URL synchronously
  const resolvedSrc = resolveCarImageUrl(src);
  
  // Log for debugging
  useEffect(() => {
    if (debug) {
      console.log("LazyImage - Props:", { src, alt, resolvedSrc });
    }
  }, [src, alt, resolvedSrc, debug]);

  // Add maximum retry limit (max 3 retries)
  const MAX_RETRIES = 3;
  // Reduced timeout for better UX
  const TIMEOUT_MS = 5000;

  // Use Intersection Observer for better lazy loading
  useEffect(() => {
    const node = imgRef.current;
    if (!node || !resolvedSrc) return;
    
    // Use native lazy loading if available
    if ('loading' in HTMLImageElement.prototype) {
      setVisible(true);
      return;
    }
    
    // Fallback to Intersection Observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    }, { 
      rootMargin: '200px', // Load images 200px before they come into view
      threshold: 0.01 
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [resolvedSrc]);

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (!visible || !resolvedSrc || loaded || error) return;
    
    const timeout = setTimeout(() => {
      if (!loaded && !error) {
        console.warn('LazyImage timeout for src:', resolvedSrc);
        setError(true);
      }
    }, TIMEOUT_MS);
    
    return () => clearTimeout(timeout);
  }, [visible, resolvedSrc, loaded, error]);

  // Aspect ratio container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio ? {
      aspectRatio: aspectRatio,
    } : {
      width: '100%',
      height: 'auto',
    })
  };

  // Default fallback image
  const defaultFallback = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

  return (
    <div style={containerStyle} className="bg-gray-100">
      {!loaded && !error && placeholder && (
        <img 
          src={placeholder} 
          alt={alt} 
          style={{ 
            filter: 'blur(8px)', 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }} 
        />
      )}
      {visible && !error && resolvedSrc && (
        <img
          ref={imgRef}
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => {
            if (debug) {
              console.log('LazyImage loaded successfully', resolvedSrc);
            }
            setLoaded(true);
          }}
          onError={() => {
            if (debug) {
              console.log('LazyImage failed to load', resolvedSrc);
            }
            
            // Add retry logic with exponential backoff
            if (retryCount < MAX_RETRIES) {
              // Retry with exponential backoff
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setError(false);
                setLoaded(false);
              }, Math.pow(2, retryCount) * 1000);
            } else {
              // Final fallback after all retries
              if (fallback && resolvedSrc !== fallback) {
                // We can't change the src directly, so we need to trigger a re-render
                setError(true);
              } else if (resolvedSrc !== defaultFallback) {
                // We can't change the src directly, so we need to trigger a re-render
                setError(true);
              } else {
                if (debug) {
                  console.log('Failed to load image:', src);
                }
                setError(true);
              }
            }
          }}
          className={`${className} ${loaded ? 'block' : 'hidden'} w-full h-full object-cover`}
          {...rest}
        />
      )}
      {error && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-xs text-gray-500 mt-1">Image not available</p>
          </div>
        </div>
      )}
      {!visible && !loaded && !error && (
        // Show placeholder while waiting for intersection
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
      {debug && resolvedSrc && (
        <div className="text-xs p-1 bg-gray-100 break-all">
          {resolvedSrc}
        </div>
      )}
    </div>
  );
}