import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Car, Eye, ArrowLeft, Search, Filter, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useNavigate } from 'react-router-dom';
import { formatINRFromPaise, toPaise } from '@/utils/currency';

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
  image_urls: string[];
  created_at: string;
  price_in_paise?: number;
  currency?: string;
  // New fields for atomic booking
  booking_status?: string;
  booked_by?: string;
  booked_at?: string;
}

const AdminCarManagement: React.FC = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
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
  useRealtimeSubscription(
    'cars',
    (payload) => {
      setCars(prev => [...prev, payload.new]);
    },
    (payload) => {
      setCars(prev => prev.map(car => 
        car.id === payload.new.id ? payload.new : car
      ));
    },
    (payload) => {
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
      setCars(data || []);
      setFilteredCars(data || []);
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
    const imageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}-${file.name}`;
        
        // Upload image to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cars-photos')
          .upload(fileName, file);

        if (uploadError) {throw uploadError;}

        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('cars-photos')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure status is always 'published' for new cars
      const carStatus = selectedCar ? formData.status : 'published';
      
      // Convert price to paise for INR storage
      const priceInPaise = toPaise(formData.price_per_day);
      
      // Handle image upload first
      let allImageUrls: string[] = [];
      
      // Include existing images for the car (when editing)
      if (selectedCar && selectedCar.image_urls) {
        allImageUrls = [...selectedCar.image_urls];
      }
      
      // Upload new images if any
      if (uploadedImages.length > 0) {
        allImageUrls = [...allImageUrls, ...uploadedImages];
      }
      
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
        image_urls: allImageUrls,
        price_in_paise: priceInPaise,
        currency: 'INR',
        // Reset booking status for new/updated cars
        booking_status: 'available'
      };

      if (selectedCar) {
        // Update existing car
        const { error } = await supabase
          .from('cars')
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
        const { error } = await supabase
          .from('cars')
          .insert([carData]);

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
    } catch (error) {
      console.error('Error saving car:', error);
      toast({
        title: "Error",
        description: `Failed to save car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (car: Car) => {
    setCarToDelete(car);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!carToDelete) {return;}

    try {
      // Optimistic update - remove from UI immediately
      setCars(prev => prev.filter(car => car.id !== carToDelete.id));
      setFilteredCars(prev => prev.filter(car => car.id !== carToDelete.id));
      
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carToDelete.id);

      if (error) {
        // Revert optimistic update on error
        fetchCars();
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Car deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting car:', error);
      toast({
        title: "Error",
        description: "Failed to delete car. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCarToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setCarToDelete(null);
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
    setUploadedImages([]);
  };

  const openEditDialog = (car?: Car) => {
    if (car) {
      setSelectedCar(car);
      setFormData({
        title: car.title,
        make: car.make,
        model: car.model,
        year: car.year,
        seats: car.seats,
        fuel_type: car.fuel_type,
        transmission: car.transmission,
        price_per_day: car.price_per_day,
        price_per_hour: car.price_per_hour || 0,
        service_charge: car.service_charge || 0,
        description: car.description || '',
        location_city: car.location_city || '',
        status: car.status
      });
      setUploadedImages([]);
    } else {
      resetForm();
    }
    setIsEditDialogOpen(true);
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

  const logAuditAction = async (action: string, description: string, metadata?: any) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      
      // Insert audit log entry
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          description,
          user_id: user?.id,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
      
      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (error) {
      console.error('Error logging audit action:', error);
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
                        const urls = await handleImageUpload(e.target.files);
                        if (urls.length > 0) {
                          setUploadedImages(prev => [...prev, ...urls]);
                        }
                      }
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {uploadingImages && (
                    <p className="text-sm text-muted-foreground mt-2">Uploading images...</p>
                  )}
                  
                  {/* Image Preview Section */}
                  {((selectedCar?.image_urls && selectedCar.image_urls.length > 0) || uploadedImages.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Images Preview</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* Existing images for editing */}
                        {selectedCar?.image_urls?.map((url, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={url}
                              alt={`Car image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedCar) {
                                  setSelectedCar({
                                    ...selectedCar,
                                    image_urls: selectedCar.image_urls?.filter((_, i) => i !== index) || []
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
                        {uploadedImages.map((url, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img
                              src={url}
                              alt={`New car image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-green-200"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImages(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total images: {(selectedCar?.image_urls?.length || 0) + uploadedImages.length} • 
                        New uploads: {uploadedImages.length}
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
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                  {car.image_urls?.[0] ? (
                    <img
                      src={car.image_urls[0]}
                      alt={car.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{car.title}</h3>
                    <Badge className={getStatusColor(car.status)}>
                      {car.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {car.make} {car.model} ({car.year})
                  </p>
                  <p className="text-sm">
                    {car.seats} seats • {car.fuel_type} • {car.transmission}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatINRFromPaise(car.price_in_paise || toPaise(car.price_per_day))}/day
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