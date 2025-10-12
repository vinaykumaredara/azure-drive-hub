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
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('license-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {throw uploadError;}

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
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Your License</h3>
            <p className="text-muted-foreground mb-4">
              Take a clear photo with your camera or upload from your device. We'll verify it before your booking.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="default"
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
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                size="sm"
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