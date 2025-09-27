// src/components/ui/data-display/RatingStars.tsx
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const RatingStars = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showLabel = false,
  className = ''
}: RatingStarsProps) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className={`${getSize()} fill-yellow-400 text-yellow-400`} 
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star 
              className={`${getSize()} fill-gray-200 text-gray-200`} 
            />
            <Star 
              className={`absolute top-0 left-0 ${getSize()} fill-yellow-400 text-yellow-400`} 
              style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
            />
          </div>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className={`${getSize()} fill-gray-200 text-gray-200`} 
          />
        ))}
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;