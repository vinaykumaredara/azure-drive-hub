# Usage Guide for Refactored Components

## Overview
This guide explains how to use the newly refactored components and services in the car rental application.

## Component Usage

### Car Management Dashboard
The main entry point for car management functionality:

```tsx
import CarManagementDashboard from '@/components/admin/car-management/CarManagementDashboard';

function AdminPage() {
  return (
    <div>
      <CarManagementDashboard />
    </div>
  );
}
```

### Individual Components
Each component can be used independently:

```tsx
import CarList from '@/components/admin/car-management/CarList';
import CarForm from '@/components/admin/car-management/CarForm';
import CarFilters from '@/components/admin/car-management/CarFilters';
import DeleteCarDialog from '@/components/admin/car-management/DeleteCarDialog';

// Example usage in a custom implementation
function CustomCarManager() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  return (
    <div>
      <CarFilters 
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        // ... other props
      />
      <CarList 
        cars={cars}
        isLoading={false}
        onEdit={setSelectedCar}
        onDelete={handleDelete}
      />
      <CarForm 
        open={!!selectedCar}
        onOpenChange={setIsOpen}
        car={selectedCar}
      />
    </div>
  );
}
```

## Service Usage

### Car Service
The CarService provides all car-related business logic:

```tsx
import { CarService } from '@/services/api/carService';
import { CreateCarRequest, UpdateCarRequest } from '@/services/api/car.types';

// Create a new car
const newCarData: CreateCarRequest = {
  title: 'New Car',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  seats: 5,
  fuel_type: 'petrol',
  transmission: 'automatic',
  price_per_day: 1500,
  status: 'published',
  images: [] // File array
};

const createdCar = await CarService.createCar(newCarData);

// Update an existing car
const updateData: UpdateCarRequest = {
  title: 'Updated Car Title',
  price_per_day: 1800
};

const updatedCar = await CarService.updateCar('car-id', updateData);

// Delete a car
await CarService.deleteCar('car-id');

// Get all cars for admin
const adminCars = await CarService.getAdminCars();

// Get public cars for users
const publicCars = await CarService.getPublicCars();
```

## Hook Usage

### Data Hooks
Custom hooks for data management:

```tsx
import { useCarQueries } from '@/hooks/queries/useCarQueries';
import { useCarMutations } from '@/hooks/data/useCarMutations';

function CarManagementPage() {
  const { adminCars, cars } = useCarQueries();
  const { createMutation, updateMutation, deleteMutation } = useCarMutations();
  
  // Access data
  const carData = adminCars.data;
  const isLoading = adminCars.isLoading;
  const isError = adminCars.isError;
  
  // Perform mutations
  const handleCreateCar = (carData: CreateCarRequest) => {
    createMutation.mutate(carData);
  };
  
  const handleUpdateCar = (id: string, carData: UpdateCarRequest) => {
    updateMutation.mutate({ id, carData });
  };
  
  const handleDeleteCar = (id: string) => {
    deleteMutation.mutate(id);
  };
  
  return (
    <div>
      {/* Render components with data */}
    </div>
  );
}
```

## UI Component Usage

### Reusable Form Components
Standardized form components for consistent UI:

```tsx
import CustomFormField from '@/components/ui/forms/FormField';
import ImageDropzone from '@/components/ui/forms/ImageDropzone';
import ValidationMessage from '@/components/ui/forms/ValidationMessage';

function CustomForm() {
  return (
    <form>
      <CustomFormField name="title" label="Car Title">
        <Input />
      </CustomFormField>
      
      <ImageDropzone 
        onImagesSelected={handleImagesSelected}
        existingImages={existingImages}
        maxImages={10}
      />
      
      <ValidationMessage 
        message="This field is required" 
        type="error" 
      />
    </form>
  );
}
```

### Data Display Components
Components for displaying data consistently:

```tsx
import DataTable from '@/components/ui/data-display/DataTable';
import StatusBadge from '@/components/ui/data-display/StatusBadge';
import PriceDisplay from '@/components/ui/data-display/PriceDisplay';
import RatingStars from '@/components/ui/data-display/RatingStars';

function CarDisplay() {
  return (
    <div>
      <StatusBadge status="published" />
      <PriceDisplay amount={1500} />
      <RatingStars rating={4.5} showLabel />
      
      <DataTable 
        data={cars}
        columns={[
          { key: 'title', title: 'Title', sortable: true },
          { key: 'make', title: 'Make', sortable: true },
          { key: 'price_per_day', title: 'Price', render: (value) => <PriceDisplay amount={value} /> }
        ]}
        searchable
      />
    </div>
  );
}
```

## Layout Components

### Page Components
Standardized layout components:

```tsx
import PageHeader from '@/components/ui/layout/PageHeader';
import ContentWrapper from '@/components/ui/layout/ContentWrapper';

function MyPage() {
  return (
    <ContentWrapper padding="md">
      <PageHeader 
        title="Car Management"
        description="Manage your car inventory"
        action={{
          label: "Add Car",
          onClick: handleAddCar,
          icon: <PlusIcon />
        }}
      />
      {/* Page content */}
    </ContentWrapper>
  );
}
```

## Performance Optimization

### Lazy Loading
Components and pages are automatically code-split:

```tsx
import { lazy } from 'react';

// These will be automatically code-split
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const UserDashboard = lazy(() => import('./UserDashboard'));
const CarDetails = lazy(() => import('./CarDetails'));
```

### Image Optimization
Images are optimized for performance:

```tsx
import LazyImage from '@/components/LazyImage';

function ImageDisplay() {
  return (
    <LazyImage 
      src={imageUrl}
      alt="Car image"
      className="w-full h-48 object-cover"
      aspectRatio="4/3"
    />
  );
}
```

## Error Handling

### Error Boundaries
Components are wrapped with error boundaries:

```tsx
import ErrorBoundary from '@/components/ui/feedback/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <CarManagementDashboard />
    </ErrorBoundary>
  );
}
```

## Testing

### Component Testing
Components are designed to be easily testable:

```tsx
// Example test structure
import { render, screen } from '@testing-library/react';
import CarList from '@/components/admin/car-management/CarList';

test('renders car list', () => {
  render(<CarList cars={mockCars} isLoading={false} />);
  expect(screen.getByText('Car Title')).toBeInTheDocument();
});
```

## Migration from Old Components

### Before (Old Component)
```tsx
// Large monolithic component
import AdminCarManagement from '@/components/AdminCarManagement';
```

### After (Refactored Components)
```tsx
// Modular components
import CarManagementDashboard from '@/components/admin/car-management/CarManagementDashboard';
```

The new components provide the same functionality with better maintainability and performance.

## Best Practices

1. **Use TypeScript types** - All components and services are fully typed
2. **Follow single responsibility** - Each component has one clear purpose
3. **Leverage React Query** - Use built-in caching and state management
4. **Implement error boundaries** - Wrap components that might fail
5. **Use lazy loading** - Import components dynamically when possible
6. **Optimize images** - Use LazyImage for better performance
7. **Write tests** - Components are designed to be testable

This refactored architecture provides a solid foundation for building scalable, maintainable, and performant React applications.