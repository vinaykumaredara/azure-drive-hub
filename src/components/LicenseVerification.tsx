import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye,
  Download,
  AlertCircle,
  UserCheck,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface License {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  storage_path: string;
  ocr_text: string;
  ocr_confidence: number;
  expires_at: string;
  verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes: string | null;
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

const LicenseVerification: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockLicenses: License[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'Rajesh Kumar',
          user_email: 'rajesh@example.com',
          storage_path: 'license-uploads/user1/license.jpg',
          ocr_text: 'DL-0420110149647\nRajesh Kumar\nDOB: 15/06/1990\nValid: 15/06/2030\nAddress: 123 Main St, Mumbai',
          ocr_confidence: 92,
          expires_at: '2030-06-15',
          verified: true,
          verification_status: 'verified',
          verification_notes: 'License verified successfully',
          submitted_at: '2025-09-25T10:30:00Z',
          verified_at: '2025-09-25T11:15:00Z',
          verified_by: 'admin1'
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: 'Priya Sharma',
          user_email: 'priya@example.com',
          storage_path: 'license-uploads/user2/license.png',
          ocr_text: 'DL-0720150234567\nPriya Sharma\nDOB: 22/11/1988\nValid: 22/11/2028\nAddress: 456 Park Ave, Delhi',
          ocr_confidence: 87,
          expires_at: '2028-11-22',
          verified: false,
          verification_status: 'pending',
          verification_notes: null,
          submitted_at: '2025-09-27T14:20:00Z',
          verified_at: null,
          verified_by: null
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: 'Amit Patel',
          user_email: 'amit@example.com',
          storage_path: 'license-uploads/user3/license.jpg',
          ocr_text: 'DL-1220180345678\nAmit Patel\nDOB: 05/03/1995\nValid: 05/03/2027\nAddress: 789 Beach Rd, Goa',
          ocr_confidence: 78,
          expires_at: '2027-03-05',
          verified: false,
          verification_status: 'rejected',
          verification_notes: 'License appears to be expired',
          submitted_at: '2025-09-20T09:45:00Z',
          verified_at: '2025-09-21T10:30:00Z',
          verified_by: 'admin2'
        },
        {
          id: '4',
          user_id: 'user4',
          user_name: 'Sneha Reddy',
          user_email: 'sneha@example.com',
          storage_path: 'license-uploads/user4/license.png',
          ocr_text: 'DL-1520200456789\nSneha Reddy\nDOB: 18/09/1992\nValid: 18/09/2032\nAddress: 321 Hill St, Bangalore',
          ocr_confidence: 95,
          expires_at: '2032-09-18',
          verified: true,
          verification_status: 'verified',
          verification_notes: 'License verified with high confidence',
          submitted_at: '2025-09-28T08:15:00Z',
          verified_at: '2025-09-28T09:00:00Z',
          verified_by: 'admin1'
        }
      ];

      setLicenses(mockLicenses);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and sort licenses
  const filteredAndSortedLicenses = useMemo(() => {
    let filtered = licenses;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(license => 
        license.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.ocr_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(license => license.verification_status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof License];
      const bVal = b[sortBy as keyof License];
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [licenses, searchTerm, statusFilter, sortBy, sortOrder]);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle verification action
  const handleVerify = async (licenseId: string, status: 'verified' | 'rejected', notes: string) => {
    // In a real app, this would update the database
    toast({
      title: `License ${status}`,
      description: `License verification status updated to ${status}`,
    });
    
    setSelectedLicense(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">License Verification</h1>
          <p className="text-muted-foreground">Manage and verify driver's license submissions</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{licenses.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold">
                  {licenses.filter(l => l.verification_status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">
                  {licenses.filter(l => l.verification_status === 'verified').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {licenses.filter(l => l.verification_status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search licenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted_at">Submission Date</SelectItem>
                  <SelectItem value="ocr_confidence">OCR Confidence</SelectItem>
                  <SelectItem value="expires_at">Expiry Date</SelectItem>
                  <SelectItem value="user_name">User Name</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedLicenses.map((license, index) => (
          <motion.div
            key={license.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg truncate">{license.user_name}</h3>
                        <p className="text-muted-foreground text-sm">{license.user_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusVariant(license.verification_status)}>
                            {getStatusText(license.verification_status)}
                          </Badge>
                          <Badge variant="secondary">
                            Conf: {license.ocr_confidence}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(license.submitted_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(license.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Extracted Text:</p>
                      <div className="bg-muted p-3 rounded-lg text-sm max-h-24 overflow-y-auto">
                        {license.ocr_text}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${getConfidenceColor(license.ocr_confidence)}`} />
                        <span className={`text-sm ${getConfidenceColor(license.ocr_confidence)}`}>
                          OCR Confidence: {license.ocr_confidence}%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLicense(license)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* License Detail Modal */}
      {selectedLicense && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">License Review</h2>
                <p className="text-muted-foreground">Review and verify driver's license</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLicense(null)}>
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        User Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{selectedLicense.user_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedLicense.user_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submission Date</p>
                          <p className="font-medium">
                            {new Date(selectedLicense.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">License Expiry</p>
                          <p className="font-medium">
                            {new Date(selectedLicense.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Verification Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <Badge variant={getStatusVariant(selectedLicense.verification_status)}>
                            {getStatusText(selectedLicense.verification_status)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>OCR Confidence</span>
                          <span className={`font-medium ${getConfidenceColor(selectedLicense.ocr_confidence)}`}>
                            {selectedLicense.ocr_confidence}%
                          </span>
                        </div>
                        {selectedLicense.verified_at && (
                          <div>
                            <p className="text-sm text-muted-foreground">Verified At</p>
                            <p className="font-medium">
                              {new Date(selectedLicense.verified_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedLicense.verification_notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="font-medium">{selectedLicense.verification_notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        License Document
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <Button variant="outline" className="mr-2">
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Document
                        </Button>
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Extracted Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {selectedLicense.ocr_text}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {selectedLicense.verification_status === 'pending' && (
              <div className="p-6 border-t">
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="destructive"
                    onClick={() => handleVerify(selectedLicense.id, 'rejected', 'License rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject License
                  </Button>
                  <Button 
                    onClick={() => handleVerify(selectedLicense.id, 'verified', 'License verified successfully')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify License
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LicenseVerification;