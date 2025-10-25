// src/components/admin/car-management/CarForm.tsx
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCarMutations } from '@/hooks/data/useCarMutations';
import { Car as CarType } from '@/services/api/car.types';
import SimpleImage from '@/components/SimpleImage';
import { toast } from '@/hooks/use-toast';

const carFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  seats: z.number().min(1).max(20),
  fuel_type: z.string().min(1, 'Fuel type is required'),
  transmission: z.string().min(1, 'Transmission is required'),
  price_per_day: z.number().min(1, 'Price per day must be at least ₹1'),
  price_per_hour: z.number().min(0).optional(),
  service_charge: z.number().min(0).optional(),
  description: z.string().optional(),
  location_city: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

type CarFormValues = z.infer<typeof carFormSchema>;

interface CarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarType | null;
}

const CarForm = ({ open, onOpenChange, car }: CarFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([]);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const { createMutation, updateMutation } = useCarMutations();
  
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      title: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: undefined as any,
      price_per_hour: undefined,
      service_charge: 0,
      description: '',
      location_city: '',
      status: 'published'
    }
  });

  // Reset form when car changes
  useEffect(() => {
    if (car) {
      form.reset({
        title: car.title || '',
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
    } else {
      form.reset({
        title: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        seats: 5,
        fuel_type: 'petrol',
        transmission: 'automatic',
        price_per_day: undefined as any,
        price_per_hour: undefined,
        service_charge: 0,
        description: '',
        location_city: '',
        status: 'published'
      });
      setUploadedImageFiles([]);
      setUploadedImagePreviews([]);
    }
    
    // Clean up object URLs on unmount only
    return () => {
      uploadedImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [car, form]); // Removed uploadedImagePreviews from dependencies to fix memory leak

  const handleImageUpload = async (files: File[] | FileList) => {
    setUploadingImages(true);

    try {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      
      // Enhanced validation for mobile
      let totalSize = 0;
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a valid image.`);
        }
        
        // Validate individual file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
        
        totalSize += file.size;
      }
      
      // Validate total upload size (max 50MB total)
      if (totalSize > 50 * 1024 * 1024) {
        throw new Error('Total file size exceeds 50MB. Please select fewer or smaller images.');
      }

      // Generate optimized previews
      const previews = fileArray.map(file => URL.createObjectURL(file));
      
      setUploadedImageFiles(prev => [...prev, ...fileArray]);
      setUploadedImagePreviews(prev => [...prev, ...previews]);
      
      toast({
        title: "Success",
        description: `${fileArray.length} image(s) ready to upload`,
      });
      
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
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

  const onSubmit = async (data: CarFormValues) => {
    try {
      if (car) {
        await updateMutation.mutateAsync({
          id: car.id,
          carData: {
            ...data,
            newImages: uploadedImageFiles,
            removeOldImages: true
          }
        });
        
        toast({
          title: "Success",
          description: "Car updated successfully",
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          images: uploadedImageFiles
        });
        
        toast({
          title: "Success",
          description: "Car added successfully",
        });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving car:', error);
      
      // User-friendly error message
      let errorMessage = "Failed to save car. Please try again.";
      
      if (error.message?.includes('image')) {
        errorMessage = "There was a problem uploading the images. Please try with smaller images.";
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage = "You don't have permission to perform this action.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{car ? 'Edit Car' : 'Add New Car'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 5)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Day (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter price"
                        value={field.value || ''}
                        onChange={e => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Hour (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Optional"
                        value={field.value || ''}
                        onChange={e => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Charge (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div>
              <Label>Images</Label>
              <div className="mt-2">
                {car && car.image_urls && car.image_urls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Images:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {car.image_urls.map((url, index) => (
                        <div key={index} className="relative">
                          <SimpleImage
                            src={url}
                            alt={`Current car image ${index + 1}`}
                            className="w-full h-20 sm:h-24 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">
                    {uploadingImages ? 'Uploading...' : 'Drag and drop images here, or click to select files'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
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
                            className="w-full h-20 sm:h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={uploadingImages || createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {uploadingImages || createMutation.isPending || updateMutation.isPending ? 'Saving...' : (car ? 'Update Car' : 'Add Car')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CarForm;