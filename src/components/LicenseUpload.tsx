import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/hooks/use-toast";

interface LicenseUploadProps {
  onUploaded: (licenseId: string) => void;
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({ onUploaded }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid File",
          description: "Please select an image file or PDF",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {return;}

    setIsUploading(true);

    try {
      console.debug('[LicenseUpload] Upload started', { fileName: file.name, size: file.size });
      
      // Upload file to Supabase Storage - Fix RLS policy match
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Match RLS policy: {user_id}/{filename}

      const { error: uploadError } = await supabase.storage
        .from('license-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error('[LicenseUpload] Upload failed:', uploadError);
        toast({
          title: "Upload Failed",
          description: uploadError.message || "Failed to upload license. Please check your connection and try again.",
          variant: "destructive",
        });
        throw uploadError;
      }
      
      console.debug('[LicenseUpload] Upload successful', { filePath });

      // Create license record in database
      const { data: license, error: insertError } = await (supabase
        .from('licenses') as any)
        .insert({
          user_id: user.id,
          storage_path: filePath,
          verified: false
        })
        .select()
        .single();

      if (insertError) {
        // Rollback file upload if database insert fails
        await supabase.storage.from('license-uploads').remove([filePath]);
        throw insertError;
      }

      console.debug('[LicenseUpload] License record created', { licenseId: (license as any).id });
      
      toast({
        title: "License Uploaded Successfully!",
        description: "Your license has been uploaded and is awaiting admin verification.",
      });

      // Notify parent component
      onUploaded((license as any).id);

      // Clear file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Driver's License Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-5 md:p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">Upload Your License</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-2">
              Take a clear photo with your camera or upload from your device. We'll verify it before your booking.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="default"
                className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] px-4 py-2 text-sm sm:text-base"
              >
                {isUploading ? "Processing..." : "Take Photo / Choose File"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Supports: JPG, PNG, PDF (max 5MB) • Camera or file upload
            </p>
          </div>

          {/* Upload Button */}
          {file && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate max-w-[180px] sm:max-w-[250px] md:max-w-[350px]">
                  {file.name}
                </span>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                size="sm"
                className="w-full sm:w-auto min-w-[140px] sm:min-w-[160px] px-4 py-2 text-sm sm:text-base"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload License"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};