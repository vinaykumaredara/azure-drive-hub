import React, { useState } from 'react';
import LazyImage from '@/components/LazyImage';

export default function ImageCarousel({ images = [], className = '', debug = false }: { images?: string[], className?: string, debug?: boolean }) {
  const [idx, setIdx] = useState(0);
  
  if (debug) {
    console.log('ImageCarousel - Received images:', images);
  }
  
  // Handle null/undefined images array
  const validImages = images && Array.isArray(images) ? images.filter(img => img && typeof img === 'string') : [];
  
  if (validImages.length === 0) {
    if (debug) {
      console.log('ImageCarousel - No valid images found, showing fallback');
    }
    return <div className={`bg-gray-100 ${className}`} style={{ minHeight: 160 }}>No image</div>;
  }
  
  const next = () => setIdx(i => (i + 1) % validImages.length);
  const prev = () => setIdx(i => (i - 1 + validImages.length) % validImages.length);

  return (
    <div className={`relative ${className}`}>
      <LazyImage 
        src={validImages[idx]} 
        alt={`Car image ${idx + 1}`} 
        className="w-full h-40 object-cover rounded" 
        aspectRatio="4/3"
        debug={debug}
      />
      {validImages.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-1">‹</button>
          <button onClick={next} aria-label="Next" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-1">›</button>
          <div className="flex gap-2 justify-center mt-2">
            {validImages.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-primary' : 'bg-gray-300'}`}></button>)}
          </div>
        </>
      )}
      {debug && (
        <div className="mt-2 text-xs p-2 bg-gray-100 break-all">
          <strong>Current Image URL:</strong> {validImages[idx]}
        </div>
      )}
    </div>
  );
}