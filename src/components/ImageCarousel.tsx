import { useState, memo, useEffect, useRef, useCallback } from 'react';
import SimpleImage from '@/components/SimpleImage';

export default memo(
  function ImageCarousel({
    images = [],
    className = '',
    debug = false,
  }: {
    images?: string[];
    className?: string;
    debug?: boolean;
  }) {
    const [idx, setIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Only show debug info in development mode
    const showDebug = debug && import.meta.env.DEV;

    if (showDebug) {
      console.log('ImageCarousel - Received images:', images);
    }

    // Handle null/undefined images array
    const validImages =
      images && Array.isArray(images)
        ? images.filter(img => img && typeof img === 'string')
        : [];

    const next = useCallback(
      () => setIdx(i => (i + 1) % validImages.length),
      [validImages.length]
    );
    const prev = useCallback(
      () => setIdx(i => (i - 1 + validImages.length) % validImages.length),
      [validImages.length]
    );

    // Handle touch events for mobile swipe using useEffect
    useEffect(() => {
      const el = containerRef.current;
      if (!el) {
        return;
      }

      let touchStartX = 0;

      function onTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
      }

      function onTouchMove(e: TouchEvent) {
        const touchMoveX = e.touches[0].clientX;
        const diff = touchStartX - touchMoveX;

        // Minimum swipe distance to trigger navigation
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            next(); // Swipe left - next image
          } else {
            prev(); // Swipe right - previous image
          }

          // Reset touch start position to prevent multiple triggers
          touchStartX = 0;
        }
      }

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: true });

      return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
      };
    }, [next, prev]);

    if (validImages.length === 0) {
      if (showDebug) {
        console.log('ImageCarousel - No valid images found, showing fallback');
      }
      return (
        <div className={`bg-gray-100 ${className}`} style={{ minHeight: 160 }}>
          No image
        </div>
      );
    }

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <SimpleImage
          src={validImages[idx]}
          alt={`Car image ${idx + 1}`}
          className="w-full aspect-video object-cover rounded"
        />
        {validImages.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow-md hover:bg-white transition-all active:scale-95 sm:p-1"
            >
              <span className="text-gray-800 text-lg font-bold sm:text-base">
                ‹
              </span>
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow-md hover:bg-white transition-all active:scale-95 sm:p-1"
            >
              <span className="text-gray-800 text-lg font-bold sm:text-base">
                ›
              </span>
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
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.images === nextProps.images &&
      prevProps.className === nextProps.className &&
      prevProps.debug === nextProps.debug
    );
  }
);
