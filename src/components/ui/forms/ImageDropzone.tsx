// src/components/ui/forms/ImageDropzone.tsx
import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageDropzoneProps {
  onImagesSelected: (files: File[]) => void;
  existingImages?: string[];
  maxImages?: number;
  disabled?: boolean;
}

const ImageDropzone = ({ onImagesSelected, existingImages = [], maxImages = 10, disabled = false }: ImageDropzoneProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      return;
    }
    
    // Limit by maxImages
    const totalImages = existingImages.length + uploadedImages.length + imageFiles.length;
    if (totalImages > maxImages) {
      const allowedCount = maxImages - (existingImages.length + uploadedImages.length);
      imageFiles.splice(allowedCount);
    }
    
    // Generate previews
    const previews = imageFiles.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...previews]);
    
    // Notify parent
    onImagesSelected(imageFiles);
  };

  const removeImage = (index: number) => {
    const newPreviews = [...uploadedImages];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setUploadedImages(newPreviews);
  };

  return (
    <div className="space-y-4">
      {existingImages.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Images:</p>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Current image ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          {dragActive ? 'Drop images here' : 'Drag and drop images here, or click to select files'}
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
              handleFiles(Array.from(files));
            }
          }}
          disabled={disabled}
          className="hidden"
          id="image-dropzone"
          ref={fileInputRef}
        />
        <Label htmlFor="image-dropzone">
          <Button asChild variant="outline" disabled={disabled}>
            <span>Select Images</span>
          </Button>
        </Label>
      </div>
      
      {uploadedImages.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">New Images:</p>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;