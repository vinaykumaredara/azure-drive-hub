import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Car, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { formatINRFromPaise, toPaise } from '@/utils/currency';
import AdminImage from '@/components/AdminImage';
import ImageCarousel from '@/components/ImageCarousel';
// Import the new image CRUD utilities
import { 
  uploadMultipleImageFiles
} from '@/utils/imageCrudUtils';
import { resolveImageUrlsForCarAdmin } from '@/utils/adminImageUtils';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

// Use a more specific name to avoid conflict with the imported Car type
type CarRow = Database['public']['Tables']['cars']['Row'];

const AdminCarManagement: React.FC = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState<CarRow[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<CarRow | null>(null);

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    seats: 5,
    fuel_type: 'petrol',
    transmission: 'automatic',
    price_per_day: 0,
    price_per_hour: 0,
    service_charge: 0,
    description: '',
    location_city: '',
    status: 'published'
  });

  useEffect(() => {
    fetchCars();
  }, []);
  
  // Filter cars based on search and filter criteria
  useEffect(() => {
    let filtered = cars;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(car => 
        car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.make && car.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.location_city && car.location_city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => car.status === statusFilter);
    }
    
    // Fuel filter
    if (fuelFilter !== 'all') {
      filtered = filtered.filter(car => car.fuel_type === fuelFilter);
    }
    
    // Transmission filter
    if (transmissionFilter !== 'all') {
      filtered = filtered.filter(car => car.transmission === transmissionFilter);
    }
    
    setFilteredCars(filtered);
  }, [cars, searchTerm, statusFilter, fuelFilter, transmissionFilter]);

  // Real-time subscription for cars - properly typed
  useRealtimeSubscription(
    'cars',
    (payload: { new: CarRow }) => {
      setCars(prev => [...prev, payload.new]);
    },
    (payload: { new: CarRow }) => {
      setCars(prev => prev.map(car => 
        car.id === payload.new.id ? payload.new : car
      ));
    },
    (payload: { old: CarRow }) => {
      setCars(prev => prev.filter(car => car.id !== payload.old.id));
    }
  );

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      
      // Debug logging
      console.info('Admin: Fetched cars from DB', {
        count: data?.length,
        sampleCar: data?.[0] ? {
          id: (data[0] as any).id,
          title: (data[0] as any).title,
          image_urls: (data[0] as any).image_urls,
          envUrl: import.meta.env.VITE_SUPABASE_URL || ''
        } : null
      });
      
      // Resolve image URLs for all cars using admin-specific resolver
      const carsWithResolvedImages: any[] = await Promise.all(
        (data || []).map((car: any) => resolveImageUrlsForCarAdmin(car))
      );
      
      setCars(carsWithResolvedImages as CarRow[]);
      setFilteredCars(carsWithResolvedImages as CarRow[]);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast({
        title: "Error",
        description: "Failed to load cars",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);

    try {
      // Validate that all files are images
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a valid image. Please upload only image files (JPEG, PNG, GIF, etc.).`);
        }
      }

      // If we're editing an existing car, get its ID
      const carId = selectedCar?.id || `new-${Date.now()}`;

      // Upload files in parallel and get paths and URLs
      const { paths: _paths, urls } = await uploadMultipleImageFiles(Array.from(files), carId);
      
      // Update state with new paths and URLs

      setUploadedImageUrls(prev => [...prev, ...urls]);
      
      return urls;
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Atomic upload function that ensures database and storage consistency


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure status is always 'published' for new cars
      const carStatus = selectedCar ? formData.status : 'published';
      
      // Convert price to paise for INR storage

      
      // Handle image upload first
      let allImageUrls: string[] = [];
      
      // Include existing images for the car (when editing)
      if (selectedCar && selectedCar.image_urls) {
        allImageUrls = [...selectedCar.image_urls];
      }
      
      // Add newly uploaded images
      allImageUrls = [...allImageUrls, ...uploadedImageUrls];
      
      // Prepare base car data according to Supabase schema
      const carData: Partial<Database['public']['Tables']['cars']['Insert']> = {
        title: formData.title,
        make: formData.make || undefined,
        model: formData.model || undefined,
        year: formData.year || undefined,
        seats: formData.seats || undefined,
        fuel_type: formData.fuel_type || undefined,
        transmission: formData.transmission || undefined,
        price_per_day: formData.price_per_day,
        price_per_hour: formData.price_per_hour || 0,
        service_charge: formData.service_charge || undefined,
        description: formData.description || undefined,
        location_city: formData.location_city || undefined,
        status: carStatus,
        image_urls: allImageUrls.length > 0 ? allImageUrls : undefined
      };

      if (selectedCar) {
        // Update existing car
        const { error } = await (supabase.from('cars') as any)
          .update(carData)
          .eq('id', selectedCar.id);

        if (error) {throw error;}
      
        // Log audit entry for car update
        await logAuditAction('car_update', `Updated car: ${formData.title}`, { carId: selectedCar.id });
      
        toast({
          title: "Success",
          description: "Car updated successfully",
        });
      } else {
        // Create new car
        const { error } = await (supabase.from('cars') as any)
          .insert([carData])
          .select()
          .single();

        if (error) {throw error;}
      
        // Log audit entry for car creation
        await logAuditAction('car_create', `Created car: ${formData.title}`);
      
        toast({
          title: "Success",
          description: "Car created successfully",
        });
      }

      setIsEditDialogOpen(false);
      resetForm();
      fetchCars(); // Refresh the car list
    } catch (error: any) {
      console.error('Error saving car:', error);
      // Add verbose logging for debugging
      console.error('Supabase insert error details:', {
        error: error,
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      
      // If the error is about booking_status, service_charge or currency column not existing, try again without it
      if (error.message && (error.message.includes('booking_status') || error.message.includes('service_charge') || error.message.includes('column'))) {
        try {
          // Prepare car data without problematic columns
          const carData: any = {
            title: formData.title,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            seats: formData.seats,
            fuel_type: formData.fuel_type,
            transmission: formData.transmission,
            price_per_day: formData.price_per_day,
            price_per_hour: formData.price_per_hour || 0,
            service_charge: formData.service_charge || 0,
            description: formData.description || '',
            location_city: formData.location_city || '',
            status: selectedCar ? formData.status : 'published',
            image_urls: [],
            price_in_paise: toPaise(formData.price_per_day),
            currency: 'INR' // Defensive fallback - ensure currency is always present
          };

          // Only add service_charge if it exists in the schema
          // We'll handle this more gracefully in the future
        
          // Handle images
          let allImageUrls: string[] = [];
          
          if (selectedCar && selectedCar.image_urls) {
            allImageUrls = [...selectedCar.image_urls];
          }
          
          allImageUrls = [...allImageUrls, ...uploadedImageUrls];
          
          carData.image_urls = allImageUrls;

          if (selectedCar) {
            const { error: retryError } = await (supabase.from('cars') as any)
              .update(carData)
              .eq('id', selectedCar.id);

            if (retryError) {throw retryError;}
          } else {
            const { error: retryError } = await (supabase.from('cars') as any)
              .insert([carData]);

            if (retryError) {throw retryError;}
          }

          toast({
            title: "Success",
            description: "Car saved successfully",
          });

          setIsEditDialogOpen(false);
          resetForm();
          fetchCars();
          return;
        } catch (retryError: any) {
          console.error('Retry error:', retryError);
          // Add verbose logging for retry errors
          console.error('Supabase retry error details:', {
            error: retryError,
            message: retryError.message,
            code: retryError.code,
            hint: retryError.hint,
            details: retryError.details
          });
          
          toast({
            title: "Error",
            description: `Failed to save car: ${retryError.message || 'Unknown error'}`,
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to save car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 0,
      price_per_hour: 0,
      service_charge: 0,
      description: '',
      location_city: '',
      status: 'published'
    });
    setSelectedCar(null);

    setUploadedImageUrls([]);
  };

  const handleEdit = (car: CarRow) => {
    setSelectedCar(car);
    setFormData({
      title: car.title,
      make: car.make || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      seats: car.seats || 5,
      fuel_type: car.fuel_type || 'petrol',
      transmission: car.transmission || 'automatic',
      price_per_day: car.price_per_day || 0,
      price_per_hour: car.price_per_hour || 0,
      service_charge: car.service_charge || 0,
      description: car.description || '',
      location_city: car.location_city || '',
      status: car.status || 'published'
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!carToDelete) {return;}

    try {
      // Delete associated images from storage
      if (carToDelete.image_urls && carToDelete.image_urls.length > 0) {
        // Extract file paths from URLs for deletion
        const filePaths = carToDelete.image_urls.map((url: string) => {
          // Extract the file path from the URL
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          // Find the part that starts with 'cars/'
          const carsIndex = pathParts.findIndex(part => part.startsWith('cars%2F') || part.startsWith('cars/'));
          if (carsIndex !== -1) {
            return pathParts.slice(carsIndex).join('/').replace('%2F', '/');
          }
          return '';
        }).filter((path: string) => path !== '');

        if (filePaths.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('cars-photos')
            .remove(filePaths);
          
          if (deleteError) {
            console.warn('Failed to delete images from storage:', deleteError);
            // Continue with car deletion even if image deletion fails
          }
        }
      }

      // Delete car from database
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carToDelete.id);

      if (error) {throw error;}

      toast({
        title: "Success",
        description: "Car deleted successfully",
      });

      fetchCars();
    } catch (error: any) {
      console.error('Error deleting car:', error);
      toast({
        title: "Error",
        description: `Failed to delete car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCarToDelete(null);
    }
  };

  // Add the missing functions
  const openEditDialog = (car?: CarRow) => {
    if (car) {
      handleEdit(car);
    } else {
      resetForm();
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (car: CarRow) => {
    setCarToDelete(car);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setCarToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    await handleDelete();
  };

  const logAuditAction = async (action: string, description: string, metadata?: any) => {
    try {
      await supabase.from('audit_logs').insert([{
        action,
        description,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        metadata
      }] as any);
    } catch (error) {
      console.warn('Failed to log audit action:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success text-success-foreground';
      case 'maintenance':
        return 'bg-warning text-warning-foreground';
      case 'inactive':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/admin')}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Car Management</h2>
            <p className="text-muted-foreground">
              {cars.length} total cars • {cars.filter(c => c.status === 'published').length} published
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{cars.filter(c => c.status === 'published').length}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{cars.filter(c => c.status === 'maintenance').length}</div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{cars.filter(c => c.status === 'inactive').length}</div>
            <div className="text-xs text-muted-foreground">Inactive</div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars by title, make, model, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Fuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setFuelFilter('all');
                  setTransmissionFilter('all');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCars.length} of {cars.length} cars
          </div>
        </CardContent>
      </Card>
      
      {/* Add Car Button */}
      <div className="flex justify-end">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Car
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCar ? 'Edit Car' : 'Add New Car'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData(prev => ({...prev, make: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({...prev, model: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({...prev, year: parseInt(e.target.value)}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Seats</Label>
                  <Select value={formData.seats.toString()} onValueChange={(value) => setFormData(prev => ({...prev, seats: parseInt(value)}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Seats</SelectItem>
                      <SelectItem value="4">4 Seats</SelectItem>
                      <SelectItem value="5">5 Seats</SelectItem>
                      <SelectItem value="7">7 Seats</SelectItem>
                      <SelectItem value="8">8 Seats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData(prev => ({...prev, fuel_type: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select value={formData.transmission} onValueChange={(value) => setFormData(prev => ({...prev, transmission: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price_per_day">Price per Day (₹)</Label>
                  <Input
                    id="price_per_day"
                    type="number"
                    step="0.01"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData(prev => ({...prev, price_per_day: parseFloat(e.target.value)}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_hour">Price per Hour (₹)</Label>
                  <Input
                    id="price_per_hour"
                    type="number"
                    step="0.01"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData(prev => ({...prev, price_per_hour: parseFloat(e.target.value)}))}
                  />
                </div>
                <div>
                  <Label htmlFor="service_charge">Service Charge (₹)</Label>
                  <Input
                    id="service_charge"
                    type="number"
                    step="0.01"
                    value={formData.service_charge}
                    onChange={(e) => setFormData(prev => ({...prev, service_charge: parseFloat(e.target.value)}))}
                    placeholder="Optional service charge (replaces GST)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Add a service charge that will replace GST in the booking summary
                  </p>
                </div>
                <div>
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => setFormData(prev => ({...prev, location_city: e.target.value}))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Car Images</Label>
                <div className="mt-2 space-y-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        // Check if we would exceed the 6 image limit
                        const currentCount = (selectedCar?.image_urls?.length || 0) + uploadedImageUrls.length;
                        const remainingSlots = 6 - currentCount;
                        
                        if (remainingSlots <= 0) {
                          toast({
                            title: "Upload Limit Reached",
                            description: "You can only upload up to 6 images per car.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Only take as many files as we have slots for
                        const filesToUpload = Array.from(e.target.files).slice(0, remainingSlots);
                        
                        if (filesToUpload.length < e.target.files.length) {
                          toast({
                            title: "Upload Limit Applied",
                            description: `Only ${remainingSlots} more images can be uploaded for this car.`,
                          });
                        }
                        
                        // Convert File[] to FileList-like object for handleImageUpload
                        const fileList = {
                          length: filesToUpload.length,
                          item: (index: number) => filesToUpload[index],
                          [Symbol.iterator]: function* () {
                            for (let i = 0; i < filesToUpload.length; i++) {
                              yield filesToUpload[i];
                            }
                          }
                        } as FileList;
                        
                        await handleImageUpload(fileList);
                      }
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {uploadingImages && (
                    <p className="text-sm text-muted-foreground mt-2">Uploading images...</p>
                  )}
                  
                  {/* Image Preview Section */}
                  {((selectedCar?.image_urls && selectedCar.image_urls.length > 0) || uploadedImageUrls.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Images Preview</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* Existing images for editing */}
                        {selectedCar?.image_urls?.map((url: string, index: number) => (
                          <div key={`existing-${index}`} className="relative group">
                            <AdminImage
                              src={url}
                              alt={`Car image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedCar) {
                                  setSelectedCar({
                                    ...selectedCar,
                                    image_urls: selectedCar.image_urls?.filter((_item: string, i: number) => i !== index) || []
                                  });
                                }
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                        {/* Newly uploaded images */}
                        {uploadedImageUrls.map((url: string, index: number) => (
                          <div key={`new-${index}`} className="relative group">
                            <AdminImage
                              src={url}
                              alt={`New car image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-green-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImageUrls(prev => prev.filter((_item: string, i: number) => i !== index));
                          
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total images: {(selectedCar?.image_urls?.length || 0) + uploadedImageUrls.length} • 
                        New uploads: {uploadedImageUrls.length}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedCar ? 'Update Car' : 'Add Car'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  {car.image_urls && car.image_urls.length > 0 ? (
                    <ImageCarousel images={car.image_urls} className="h-48" />
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{car.title}</h3>
                    <Badge className={getStatusColor(car.status || 'published')}>
                      {car.status || 'published'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {car.make} {car.model} ({car.year})
                  </p>
                  <p className="text-sm">
                    {car.seats} seats • {car.fuel_type} • {car.transmission}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatINRFromPaise(toPaise(car.price_per_day))}/day
                    {car.service_charge && car.service_charge > 0 && (
                      <span className="text-xs text-muted-foreground block">
                        +{formatINRFromPaise(toPaise(car.service_charge))} service charge
                      </span>
                    )}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(car)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(car)}
                        className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        title="Delete car"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {car.location_city}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCars.length === 0 && (
        <div className="text-center py-12">
          {cars.length === 0 ? (
            <>
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars yet</h3>
              <p className="text-muted-foreground mb-4">Add your first car to get started</p>
              <Button onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Car
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars match your filters</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setFuelFilter('all');
                  setTransmissionFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this car? This action cannot be undone.
            </p>
            {carToDelete && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{carToDelete.title}</p>
                <p className="text-sm text-muted-foreground">
                  {carToDelete.make} {carToDelete.model} ({carToDelete.year})
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCarManagement;