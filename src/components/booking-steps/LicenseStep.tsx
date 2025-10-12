import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LicenseUpload } from '@/components/LicenseUpload';

interface LicenseStepProps {
  existingLicense: {
    id: string;
    verified: boolean | null;
    createdAt: string;
  } | null;
  licenseId: string | null;
  onLicenseUploaded: (licenseId: string) => void;
  onExistingLicenseSelect: (licenseId: string) => void;
}

export const LicenseStep: React.FC<LicenseStepProps> = ({
  existingLicense,
  licenseId,
  onLicenseUploaded,
  onExistingLicenseSelect
}) => {
  return (
    <motion.div
      key="license"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Upload Driver's License</h3>
        <p className="text-muted-foreground">
          Please upload a clear photo of your driver's license
        </p>
      </div>

      {/* Show existing license if available */}
      {existingLicense && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Existing License on File</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {existingLicense.verified === true ? (
                    <span className="text-green-600">Verified</span>
                  ) : existingLicense.verified === false ? (
                    <span className="text-red-600">Rejected</span>
                  ) : (
                    <span className="text-yellow-600">Pending Verification</span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExistingLicenseSelect(existingLicense.id)}
                disabled={licenseId === existingLicense.id}
                aria-label={licenseId === existingLicense.id ? "License already selected" : "Use this existing license"}
              >
                {licenseId === existingLicense.id ? 'Selected' : 'Use This License'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <LicenseUpload onLicenseUpload={onLicenseUploaded} />

      {licenseId && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg" role="status" aria-live="polite">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">License uploaded successfully</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your license has been submitted for verification
          </p>
        </div>
      )}
    </motion.div>
  );
};