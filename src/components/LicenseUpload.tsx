import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, FileImage, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface LicenseUploadProps {
  onLicenseUpload: (filePath: string) => void;
  existingLicense?: string | null;
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({ onLicenseUpload, existingLicense }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingLicense || null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('licenses')
        .getPublicUrl(filePath);

      setPreviewUrl(data.publicUrl);
      setFileName(file.name);
      onLicenseUpload(filePath);

      toast({
        title: "License Uploaded",
        description: "Your license has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('License upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onLicenseUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };
    input.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Driver's License
          </CardTitle>
          <CardDescription>
            Upload a clear photo of your driver's license for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="License preview" 
                  className="w-full h-48 object-contain rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewUrl(null);
                    setFileName(null);
                  }}
                  className="absolute top-2 right-2"
                >
                  Change
                </Button>
              </div>
              {fileName && (
                <p className="text-sm text-muted-foreground truncate">
                  {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your license here, or click to browse
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="license-upload"
                />
                <Label htmlFor="license-upload">
                  <Button variant="outline" className="mr-2" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              
              <Button 
                variant="default" 
                className="w-full"
                onClick={handleCameraCapture}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Important</p>
                <p className="text-xs text-blue-700 mt-1">
                  Make sure your license is clear and all information is visible. 
                  Blurry or incomplete images may be rejected.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};