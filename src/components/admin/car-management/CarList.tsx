// src/components/admin/car-management/CarList.tsx
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ImageCarousel from '@/components/ImageCarousel';
import { Car as CarType } from '@/services/api/car.types';
import { formatINRFromPaise, toPaise } from '@/utils/currency';

interface CarListProps {
  cars: CarType[];
  isLoading: boolean;
  onEdit: (car: CarType) => void;
  onDelete: (car: CarType) => void;
}

const CarList = ({ cars, isLoading, onEdit, onDelete }: CarListProps) => {
  const getStatusBadge = (status: string | null) => {
    if (!status) {return <Badge variant="default">Unknown</Badge>;}
    
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <CardContent className="p-4">
              <div className="h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded mb-4 w-1/2"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-200 animate-pulse rounded w-20"></div>
                <div className="h-8 bg-gray-200 animate-pulse rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <motion.div
          key={car.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {/* Use ImageCarousel for consistent image display */}
              <ImageCarousel images={car.image_urls || []} className="h-48" />
              <div className="absolute top-2 right-2">
                {getStatusBadge(car.status)}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-1">{car.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">
                {car.make} {car.model} ({car.year})
              </p>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-primary">
                  {formatINRFromPaise(car.price_in_paise || toPaise(car.price_per_day))}
                </span>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{car.seats} seats</span>
                  <span>•</span>
                  <span className="capitalize">{car.fuel_type}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => onEdit(car)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(car)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CarList;