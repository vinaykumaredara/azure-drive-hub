import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import LazyImage from '@/components/LazyImage';

interface CarImageGalleryProps {
  images: string[];
  carTitle?: string;
  className?: string;
  showThumbnails?: boolean;
  aspectRatio?: 'video' | 'square' | 'wide';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const CarImageGallery: React.FC<CarImageGalleryProps> = ({
  images = [],
  carTitle = 'Car Images',
  className = '',
  showThumbnails = true,
  aspectRatio = 'video',
  size = 'md',
  interactive = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // Fallback images if no images provided
  const displayImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1570733117311-d990c3816c47?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
  ];

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[16/9]'
  };

  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  // Handle image loading
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  // Single image display
  if (displayImages.length === 1) {
    const isLoaded = loadedImages[0] || false;
    
    return (
      <div className={`relative ${className}`}>
        <div className={`relative overflow-hidden rounded-lg bg-muted ${aspectRatioClasses[aspectRatio]}`}>
          {/* Loading placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          )}
          
          <LazyImage
            src={displayImages[0]}
            alt={carTitle}
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => handleImageLoad(0)}
          />
          
          {interactive && (
            <div className="absolute top-2 right-2">
              <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl h-[90vh] p-0">
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <LazyImage
                      src={displayImages[0]}
                      alt={carTitle}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multiple images carousel
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Carousel */}
      <div className="relative group">
        <Carousel className="w-full">
          <CarouselContent>
            {displayImages.map((image, index) => {
              const isLoaded = loadedImages[index] || false;
              
              return (
                <CarouselItem key={index}>
                  <div className={`relative overflow-hidden rounded-lg bg-muted ${aspectRatioClasses[aspectRatio]}`}>
                    {/* Loading placeholder */}
                    {!isLoaded && (
                      <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      </div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isLoaded ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LazyImage
                        src={image}
                        alt={`${carTitle} - Image ${index + 1}`}
                        className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => handleImageLoad(index)}
                      />
                    </motion.div>
                    
                    {/* Image counter badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {index + 1} / {displayImages.length}
                      </Badge>
                    </div>

                    {/* Fullscreen button */}
                    {interactive && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-black/50 hover:bg-black/70 text-white border-0"
                              onClick={() => setSelectedIndex(index)}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {displayImages.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => {
            const isLoaded = loadedImages[index] || false;
            
            return (
              <motion.button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === index 
                    ? 'border-primary scale-105' 
                    : 'border-transparent hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Loading placeholder */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse"></div>
                )}
                
                <LazyImage
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImageLoad(index)}
                />
                {selectedIndex === index && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setIsFullscreenOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="relative w-full h-full">
              <LazyImage
                src={displayImages[selectedIndex]}
                alt={`${carTitle} - Fullscreen`}
                className="max-w-full max-h-full object-contain mx-auto"
              />
              
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Optimized compact version for car cards
export const CarImageGalleryCompact: React.FC<CarImageGalleryProps> = (props) => {
  return (
    <CarImageGallery
      {...props}
      showThumbnails={false}
      interactive={false}
      aspectRatio="video"
    />
  );
};