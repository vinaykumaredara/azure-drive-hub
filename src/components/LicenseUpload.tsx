import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface License {
  id: string;
  storage_path: string;
  ocr_text: string;
  ocr_confidence: number;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

export const LicenseUpload: React.FC = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's licenses
  const fetchLicenses = async () => {
    if (!user) {return;}

    try {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {throw error;}
      setLicenses(data || []);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast({
        title: "Error",
        description: "Failed to load licenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLicenses();
  }, [user]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {return;}

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload and process with OCR
          const { data, error } = await supabase.functions.invoke("upload-license", {
            body: {
              fileName: file.name,
              fileData: base64Data,
            },
          });

          if (error) {throw error;}

          toast({
            title: "License Uploaded Successfully!",
            description: `OCR Confidence: ${(data.ocr_result.confidence * 100).toFixed(1)}%`,
          });

          // Refresh licenses list
          fetchLicenses();

          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

        } catch (error) {
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

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to read file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const getStatusBadge = (license: License) => {
    if (license.verified) {
      return <Badge className="bg-success text-success-foreground">Verified</Badge>;
    } else if (license.ocr_confidence > 0.8) {
      return <Badge variant="secondary">Pending Review</Badge>;
    } else {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) {return "text-success";}
    if (confidence >= 0.7) {return "text-warning";}
    return "text-destructive";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Your License</h3>
            <p className="text-muted-foreground mb-4">
              Take a clear photo of your driver's license. We'll automatically extract and verify the information.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mb-2"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, WebP (max 5MB)
            </p>
          </div>

          {/* Licenses List */}
          {licenses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Licenses</h3>
              {licenses.map((license) => (
                <Card key={license.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">
                          License #{license.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(license)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className={`ml-2 font-medium ${getConfidenceColor(license.ocr_confidence)}`}>
                            {(license.ocr_confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="ml-2">
                            {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Uploaded:</span>
                          <span className="ml-2">
                            {new Date(license.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`ml-2 ${license.verified ? 'text-success' : 'text-warning'}`}>
                            {license.verified ? "Verified" : "Under Review"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLicense(license)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {licenses.length === 0 && !isUploading && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No License Uploaded</h3>
              <p className="text-muted-foreground">
                Upload your driver's license to start booking cars
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Detail Modal */}
      {selectedLicense && (
        <Dialog open={!!selectedLicense} onOpenChange={() => setSelectedLicense(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                License Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-2">License #{selectedLicense.id.slice(0, 8)}</h3>
                  {getStatusBadge(selectedLicense)}
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(selectedLicense.ocr_confidence)}`}>
                    {(selectedLicense.ocr_confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uploaded</label>
                  <div>{new Date(selectedLicense.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expires</label>
                  <div>
                    {selectedLicense.expires_at 
                      ? new Date(selectedLicense.expires_at).toLocaleDateString()
                      : "Not detected"
                    }
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Extracted Text</label>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedLicense.ocr_text}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              {selectedLicense.verified && (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">
                    License verified by admin
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};