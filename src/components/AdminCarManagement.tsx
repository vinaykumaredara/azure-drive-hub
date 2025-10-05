import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Car, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { formatINRFromPaise, toPaise } from '@/utils/currency';
import SimpleImage from '@/components/SimpleImage';
import { mapCarForUI } from '@/utils/adminImageUtils';
import ImageCarousel from '@/components/ImageCarousel';
// Import the new image CRUD utilities
import { 
  createCarWithImages, 
  updateCarWithImages
} from '@/utils/imageCrudUtils';

interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel_type: string;
  transmission: string;
  price_per_day: number;
  price_per_hour?: number;
  service_charge?: number;
  description?: string;
  location_city?: string;
  status: string;
  image_urls: string[] | null; // Make it explicitly nullable
  created_at: string;
  price_in_paise?: number;
  currency?: string;
  // New fields for atomic booking
  booking_status?: string;
  booked_by?: string;
  booked_at?: string;
}

const AdminCarManagement: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([]);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  
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
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.location_city?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Real-time subscription for cars
  useRealtimeSubscription<Car>(
    'cars',
    (payload: { new: Car }) => {
      setCars(prev => [...prev, payload.new]);
    },
    (payload: { new: Car }) => {
      setCars(prev => prev.map(car => 
        car.id === payload.new.id ? payload.new : car
      ));
    },
    (payload: { old: Car }) => {
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
      
      // Log all car image data for debugging
      data?.forEach((car: any) => {
        console.log('Admin Car Data:', {
          id: car.id,
          title: car.title,
          image_urls: car.image_urls,
          image_paths: car.image_paths,
          image_urls_type: typeof car.image_urls,
          image_paths_type: typeof car.image_paths,
          image_urls_length: Array.isArray(car.image_urls) ? car.image_urls.length : 'Not an array',
          image_paths_length: Array.isArray(car.image_paths) ? car.image_paths.length : 'Not an array'
        });
      });
      
      // Map car data for UI using the new utility function
      const carsWithMappedImages = (data || []).map((car: any) => mapCarForUI(car));
      
      // Log mapped images for debugging
      carsWithMappedImages.forEach((car: any) => {
        console.log('Mapped Car Images:', {
          id: car.id,
          title: car.title,
          images: car.images,
          thumbnail: car.thumbnail,
          images_type: typeof car.images,
          images_length: Array.isArray(car.images) ? car.images.length : 'Not an array'
        });
      });
      
      setCars(carsWithMappedImages as Car[]);
      setFilteredCars(carsWithMappedImages as Car[]);
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

  const handleImageUpload = async (files: File[] | FileList) => {
    setUploadingImages(true);

    try {
      // Convert FileList to File[] if needed
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      
      // Validate that all files are images
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a valid image. Please upload only image files (JPEG, PNG, GIF, etc.).`);
        }
      }

      // Generate previews for the uploaded files
      const previews = fileArray.map(file => URL.createObjectURL(file));
      
      // Update state with new files and previews
      setUploadedImageFiles(prev => [...prev, ...fileArray]);
      setUploadedImagePreviews(prev => [...prev, ...previews]);
      
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
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
    setUploadedImageFiles([]);
    setUploadedImagePreviews([]);
    setImagesToRemove([]); // Reset images to remove
    
    // Clean up object URLs
    uploadedImagePreviews.forEach(url => URL.revokeObjectURL(url));
  };

  const handleEdit = (car: Car) => {
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
    // Reset uploaded images when editing
    setUploadedImageFiles([]);
    setUploadedImagePreviews([]);
    setImagesToRemove([]); // Reset images to remove
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!carToDelete) {return;}

    try {
      // First try server-side deletion endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      let serverDeleteSuccess = false;
      
      if (supabaseUrl) {
        try {
          // Construct the correct Edge Function URL
          const functionUrl = `${supabaseUrl.replace('.co', '-functions.supabase.co')}/delete-car`;
          
          // Get current session
          const { data } = await supabase.auth.getSession();
          
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data?.session?.access_token || ''}`
            },
            body: JSON.stringify({ carId: carToDelete.id })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Server-side deletion result:', result);
            serverDeleteSuccess = true;
            
            // Show success message
            toast({
              title: "Success",
              description: "Car deleted successfully from database and storage",
            });
          } else {
            const errorText = await response.text();
            console.warn('Server-side deletion failed:', response.status, errorText);
            
            // Don't return here, try client-side deletion as fallback
            toast({
              title: "Warning",
              description: `Server deletion failed, trying client-side deletion...`,
              variant: "default",
            });
          }
        } catch (serverError) {
          console.warn('Server-side deletion error:', serverError);
          // Continue to client-side deletion
        }
      }

      // Fallback to client-side deletion if server deletion failed
      if (!serverDeleteSuccess) {
        try {
          // Import the client-side deletion utility
          const { deleteCarWithImages } = await import('@/utils/imageCrudUtils');
          await deleteCarWithImages(carToDelete.id);
          
          toast({
            title: "Success",
            description: "Car deleted successfully using client-side method",
          });
        } catch (clientError: any) {
          console.error('Client-side deletion failed:', clientError);
          throw new Error(`Failed to delete car using both methods: ${clientError.message || 'Unknown error'}`);
        }
      }

      // Update local state (remove from UI)
      setCars(prev => prev.filter(c => c.id !== carToDelete.id));
      setFilteredCars(prev => prev.filter(c => c.id !== carToDelete.id));
      
      setIsDeleteDialogOpen(false);
      setCarToDelete(null);

    } catch (error: any) {
      console.error('Error deleting car:', error);
      toast({
        title: "Error",
        description: `Failed to delete car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure status is always 'published' for new cars
      const carStatus = selectedCar ? formData.status : 'published';
      
      // Convert price to paise for INR storage
      const priceInPaise = toPaise(formData.price_per_day);
      
      // Prepare car data
      const carData = {
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
        status: carStatus,
        price_in_paise: priceInPaise,
        currency: 'INR' // Defensive fallback - ensure currency is always present
      };

      setUploadingImages(true);

      if (selectedCar) {
        // Update existing car - append new images and remove selected ones
        const updatedCar = await updateCarWithImages(
          selectedCar.id,
          carData,
          uploadedImageFiles,
          false, // Don't remove all old images
          imagesToRemove // Remove specific images selected by admin
        );
        
        console.log('Car updated successfully:', updatedCar);
      } else {
        // Create new car
        const newCar = await createCarWithImages(carData, uploadedImageFiles);
        console.log('Car created successfully:', newCar);
      }

      // Success - reset form and refresh
      setIsEditDialogOpen(false);
      resetForm();
      fetchCars();
      
      toast({
        title: "Success",
        description: selectedCar ? "Car updated successfully" : "Car created successfully",
      });

    } catch (error: any) {
      console.error('Error saving car:', error);
      toast({
        title: "Error",
        description: `Failed to save car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (index: number) => {
    const newFiles = [...uploadedImageFiles];
    const newPreviews = [...uploadedImagePreviews];
    
    // Clean up object URL
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setUploadedImageFiles(newFiles);
    setUploadedImagePreviews(newPreviews);
  };

  const toggleImageToRemove = (imageUrl: string) => {
    setImagesToRemove(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        return [...prev, imageUrl];
      }
    });
  };

  const getStatusBadge = (status: string) => {
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
        <Button onClick={() => setIsEditDialogOpen(true)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by title, make, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fuel">Fuel Type</Label>
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transmission">Transmission</Label>
              <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transmissions</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCars.map((car) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {/* Use ImageCarousel for consistent image display */}
                <ImageCarousel 
                  images={car.image_urls && car.image_urls.length > 0 ? car.image_urls : undefined} 
                  className="h-48" 
                />
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
                  <Button variant="outline" size="sm" onClick={() => handleEdit(car)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCarToDelete(car);
                      setIsDeleteDialogOpen(true);
                    }}
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
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Car
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transmission">Transmission</Label>
                <Select value={formData.transmission} onValueChange={(value) => setFormData({ ...formData, transmission: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price_per_day">Price per Day (₹)</Label>
                <Input
                  id="price_per_day"
                  type="number"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="price_per_hour">Price per Hour (₹)</Label>
                <Input
                  id="price_per_hour"
                  type="number"
                  value={formData.price_per_hour || ''}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="service_charge">Service Charge (₹)</Label>
                <Input
                  id="service_charge"
                  type="number"
                  value={formData.service_charge || ''}
                  onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="location_city">Location</Label>
                <Input
                  id="location_city"
                  value={formData.location_city || ''}
                  onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <Label>Images</Label>
              <div className="mt-2">
                {selectedCar && selectedCar.image_urls && selectedCar.image_urls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Images:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedCar.image_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <SimpleImage
                            src={url}
                            alt={`Current car image ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant={imagesToRemove.includes(url) ? "default" : "destructive"}
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => toggleImageToRemove(url)}
                          >
                            {imagesToRemove.includes(url) ? (
                              <span className="text-xs">Undo</span>
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                          {imagesToRemove.includes(url) && (
                            <div className="absolute inset-0 bg-red-500/50 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">REMOVE</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {imagesToRemove.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {imagesToRemove.length} image(s) marked for removal
                      </p>
                    )}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {uploadingImages ? 'Uploading...' : 'Drag and drop images here, or click to select files'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleImageUpload(files);
                      }
                    }}
                    disabled={uploadingImages}
                    className="hidden"
                    id="image-upload"
                    ref={fileInputRef}
                  />
                  <Label htmlFor="image-upload">
                    <Button asChild variant="outline" disabled={uploadingImages}>
                      <span>Select Images</span>
                    </Button>
                  </Label>
                </div>
                
                {uploadedImagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">New Images:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {uploadedImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Uploaded car image ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeUploadedImage(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadingImages}>
                {uploadingImages ? 'Saving...' : (selectedCar ? 'Update Car' : 'Add Car')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <span className="font-semibold">{carToDelete?.title}</span>?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCarManagement;