import { useEffect, useState } from 'react';
import { resolveCarImageUrl } from '@/utils/carImageUtils';

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholder?: React.ReactNode;
  debug?: boolean; // Add debug prop
};

export default function AdminImage({ src, alt = '', className = '', placeholder = null, debug = false }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [finalSrc, setFinalSrc] = useState<string | null>(null);

  // Resolve URL synchronously
  const resolvedUrl = resolveCarImageUrl(src);

  useEffect(() => {
    let cancelled = false;
    
    // Reset state when src changes
    setOk(null);
    setFinalSrc(resolvedUrl);
    
    // Log for debugging
    if (debug) {
      console.log("AdminImage - Resolved URL:", resolvedUrl);
    }
    
    if (!resolvedUrl) {
      if (!cancelled) {
        setOk(false);
        setFinalSrc(null);
      }
      return;
    }
    
    // Pre-validate the image by creating a new Image object
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setOk(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        if (debug) {
          console.log("AdminImage - Failed to load image:", resolvedUrl);
        }
        setOk(false);
      }
    };
    img.src = resolvedUrl;
    
    return () => { cancelled = true; };
  }, [resolvedUrl, debug]);

  if (ok === null) {
    // Loading placeholder
    return (
      <div className="flex flex-col">
        <div className={`animate-pulse bg-gray-200 ${className}`} style={{ minHeight: 160 }} />
        {debug && resolvedUrl && (
          <div className="text-xs p-1 bg-gray-100 break-all">
            {resolvedUrl}
          </div>
        )}
      </div>
    );
  }
  if (!ok || !finalSrc) {
    return (
      <div className="flex flex-col">
        <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ minHeight: 160 }}>
          {placeholder ?? <span className="text-sm text-gray-500">No image</span>}
        </div>
        {debug && resolvedUrl && (
          <div className="text-xs p-1 bg-gray-100 break-all text-red-500">
            Failed: {resolvedUrl}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <img 
        src={finalSrc} 
        alt={alt} 
        className={className} 
        loading="lazy"
        onError={(_e) => {
          console.log("Image onError triggered for:", finalSrc);
          // Fallback to error state
          setOk(false);
        }}
      />
      {debug && (
        <div className="text-xs p-1 bg-gray-100 break-all">
          {finalSrc}
        </div>
      )}
    </div>
  );
}