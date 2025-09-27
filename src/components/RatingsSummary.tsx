import React from "react";
import { Star } from "lucide-react";

interface RatingsSummaryProps {
  ratings: number[]; // array of ratings like [5,4,4,5,3,...]
  reviewCount?: number;
  className?: string;
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({ 
  ratings, 
  reviewCount,
  className = "" 
}) => {
  // Compute counts for each star rating (1-5)
  const counts = [0, 0, 0, 0, 0, 0]; // index 0 unused, indices 1-5 for star ratings
  ratings.forEach(r => {
    if (r >= 1 && r <= 5) {
      counts[Math.round(r)] = (counts[Math.round(r)] || 0) + 1;
    }
  });
  
  const total = reviewCount || ratings.length || 0;
  const average = total ? (ratings.reduce((a, b) => a + b, 0) / total) : 0;
  const avgFixed = Math.round(average * 10) / 10;

  return (
    <div className={`flex gap-6 items-start ${className}`}>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-semibold">{avgFixed || '0.0'}</div>
        <div className="flex items-center gap-1">
          <Stars value={average} />
          <div className="text-sm text-gray-500">({total})</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {[5, 4, 3, 2, 1].map(star => {
          const c = counts[star] || 0;
          const pct = total ? Math.round((c / total) * 100) : 0;
          return (
            <div className="flex items-center gap-3 py-1" key={star}>
              <div className="w-8 text-sm">{star}</div>
              <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                <div
                  aria-hidden
                  style={{ width: `${pct}%` }}
                  className="h-3 bg-amber-400 transition-all duration-500"
                />
              </div>
              <div className="w-10 text-right text-sm text-gray-600">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StarsProps {
  value: number;
}

function Stars({ value }: StarsProps) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  
  return (
    <div className="flex items-center gap-0.5" aria-label={`Average rating ${value.toFixed(1)} out of 5`}>
      {[...Array(full)].map((_, idx) => (
        <Star key={`full-${idx}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && (
        <Star key="half" className="w-4 h-4 fill-amber-400 text-amber-400" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
      )}
      {[...Array(empty)].map((_, idx) => (
        <Star key={`empty-${idx}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  );
}

export default RatingsSummary;