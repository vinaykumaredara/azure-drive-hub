import { useState, memo } from 'react';
import SimpleImage from '@/components/SimpleImage';

interface ImageCarouselProps {
  images?: string[];
  className?: string;
  debug?: boolean;
}

const ImageCarouselComponent = ({ images = [], className = '', debug = false }: ImageCarouselProps) => {
  const [idx, setIdx] = useState(0);
  
  // Only show debug info in development mode
  const showDebug = debug && import.meta.env.DEV;
  
  if (showDebug) {
    console.log('ImageCarousel - Received images:', images);
  }
  
  // Handle null/undefined images array
  const validImages = images && Array.isArray(images) ? images.filter(img => img && typeof img === 'string') : [];
  
  if (validImages.length === 0) {
    if (showDebug) {
      console.log('ImageCarousel - No valid images found, showing fallback');
    }
    return <div className={`bg-gray-100 ${className}`} style={{ minHeight: 160 }}>No image</div>;
  }
  
  const next = () => setIdx(i => (i + 1) % validImages.length);
  const prev = () => setIdx(i => (i - 1 + validImages.length) % validImages.length);

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touchStartX = e.touches[0].clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touchMoveX = moveEvent.touches[0].clientX;
      const diff = touchStartX - touchMoveX;
      
      // Minimum swipe distance to trigger navigation
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          next(); // Swipe left - next image
        } else {
          prev(); // Swipe right - previous image
        }
        
        // Remove event listeners after swipe
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    // Add event listeners for touch move and end
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
  };

  return (
    <div className={`relative ${className}`} onTouchStart={handleTouchStart}>
      <SimpleImage 
        src={validImages[idx]} 
        alt={`Car image ${idx + 1}`} 
        className="w-full h-full object-cover" 
      />
      {validImages.length > 1 && (
        <>
          <button 
            onClick={prev} 
            aria-label="Previous" 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow-md hover:bg-white transition-all active:scale-95 sm:p-1"
          >
            <span className="text-gray-800 text-lg font-bold sm:text-base">‹</span>
          </button>
          <button 
            onClick={next} 
            aria-label="Next" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow-md hover:bg-white transition-all active:scale-95 sm:p-1"
          >
            <span className="text-gray-800 text-lg font-bold sm:text-base">›</span>
          </button>
          <div className="flex gap-1 sm:gap-2 justify-center mt-2">
            {validImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIdx(i)} 
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${i === idx ? 'bg-primary scale-125' : 'bg-gray-300'}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
      {showDebug && (
        <div className="mt-2 text-xs p-2 bg-gray-100 break-all">
          <strong>Current Image URL:</strong> {validImages[idx]}
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ImageCarouselComponent);