import React, { useState } from 'react';
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

  // Single image display
  if (displayImages.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <div className={`relative overflow-hidden rounded-lg bg-muted ${aspectRatioClasses[aspectRatio]}`}>
          <img
            src={displayImages[0]}
            alt={carTitle}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
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
                    <img
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
            {displayImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className={`relative overflow-hidden rounded-lg bg-muted ${aspectRatioClasses[aspectRatio]}`}>
                  <motion.img
                    src={image}
                    alt={`${carTitle} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  
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
            ))}
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
          {displayImages.map((image, index) => (
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
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative w-full h-full bg-black">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsFullscreenOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Main fullscreen image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedIndex}
                  src={displayImages[selectedIndex]}
                  alt={`${carTitle} - Image ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Badge variant="secondary" className="bg-black/50 text-white border-0">
                  {selectedIndex + 1} / {displayImages.length}
                </Badge>
              </div>
            </div>

            {/* Thumbnail strip in fullscreen */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                      selectedIndex === index 
                        ? 'border-white' 
                        : 'border-transparent hover:border-white/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Compact version for cards
export const CarImageGalleryCompact: React.FC<{
  images: string[];
  carTitle?: string;
  className?: string;
}> = ({ images, carTitle, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const displayImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop&crop=center&auto=format&q=80'
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={displayImages[currentIndex]}
          alt={carTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {displayImages.length > 1 && (
          <>
            {/* Navigation dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Image counter */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                {currentIndex + 1}/{displayImages.length}
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
};