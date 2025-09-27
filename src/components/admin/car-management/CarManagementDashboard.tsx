// src/components/admin/car-management/CarManagementDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Car, Search, Filter, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCarQueries } from '@/hooks/queries/useCarQueries';
import { useCarMutations } from '@/hooks/data/useCarMutations';
import CarList from './CarList';
import CarForm from './CarForm';
import CarFilters from './CarFilters';
import DeleteCarDialog from './DeleteCarDialog';
import { Car as CarType } from '@/services/api/car.types';

const CarManagementDashboard = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [carToDelete, setCarToDelete] = useState<CarType | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');

  const { adminCars } = useCarQueries();
  const { deleteMutation } = useCarMutations();

  // Filter cars based on search and filter criteria
  const filteredCars = adminCars.data?.filter(car => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = 
        car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.make && car.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.location_city && car.location_city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && car.status !== statusFilter) {
      return false;
    }
    
    // Fuel filter
    if (fuelFilter !== 'all' && car.fuel_type !== fuelFilter) {
      return false;
    }
    
    // Transmission filter
    if (transmissionFilter !== 'all' && car.transmission !== transmissionFilter) {
      return false;
    }
    
    return true;
  }) || [];

  const handleEdit = (car: CarType) => {
    setSelectedCar(car);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (car: CarType) => {
    setCarToDelete(car);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!carToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(carToDelete.id);
      setIsDeleteDialogOpen(false);
      setCarToDelete(null);
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setIsEditDialogOpen(true);
  };

  if (adminCars.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Car Management</h1>
          <p className="text-muted-foreground">Manage your car inventory</p>
        </div>
        <Button onClick={handleAddCar}>
          <Plus className="w-4 h-4 mr-2" />
          Add Car
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CarFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            fuelFilter={fuelFilter}
            onFuelFilterChange={setFuelFilter}
            transmissionFilter={transmissionFilter}
            onTransmissionFilterChange={setTransmissionFilter}
          />
        </CardContent>
      </Card>

      {/* Car List */}
      <CarList
        cars={filteredCars}
        isLoading={adminCars.isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {filteredCars.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cars found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || fuelFilter !== 'all' || transmissionFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding a new car'}
          </p>
          {!searchTerm && statusFilter === 'all' && fuelFilter === 'all' && transmissionFilter === 'all' && (
            <Button onClick={handleAddCar}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Car
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <CarForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        car={selectedCar}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCarDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        car={carToDelete}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default CarManagementDashboard;