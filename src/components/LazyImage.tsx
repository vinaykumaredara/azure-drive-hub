import { useState, useEffect } from 'react';
import { resolveCarImageUrl } from '@/utils/carImageUtils';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: string; // small LQIP if available
  aspectRatio?: string; // e.g., "4/3", "16/9", "1/1"
  fallback?: string; // custom fallback image URL
  debug?: boolean; // Add debug prop
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
  ...rest 
}: Props) {
  const [error, setError] = useState(false);

  // Resolve URL synchronously
  const resolvedSrc = resolveCarImageUrl(src);
  
  // Log for debugging
  useEffect(() => {
    if (debug) {
      console.log("LazyImage - Props:", { src, alt, resolvedSrc });
    }
  }, [src, alt, resolvedSrc, debug]);

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

  // Handle image load error
  const handleError = () => {
    if (debug) {
      console.log('Image failed to load', resolvedSrc);
    }
    setError(true);
  };

  // Determine which image to display
  const displaySrc = error || !resolvedSrc ? (fallback || FALLBACK_IMAGE) : resolvedSrc;

  return (
    <div style={containerStyle} className="bg-gray-100">
      <img
        src={displaySrc}
        alt={alt}
        onError={handleError}
        className={`${className} block w-full h-full object-cover`}
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