import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter, Download, Eye, User, Key, LogIn, Car, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  action: string;
  description: string;
  user_id: string | null;
  user_email: string | null;
  metadata: any;
  timestamp: string;
}

interface KYCStatus {
  user_id: string;
  full_name: string | null;
  email: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_documents: string[];
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
}

const SecurityCompliance: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [kycStatuses, setKycStatuses] = useState<KYCStatus[]>([]);
  const [filteredKyc, setFilteredKyc] = useState<KYCStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
    fetchKycStatuses();
  }, []);

  // Filter audit logs
  useEffect(() => {
    let filtered = auditLogs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, actionFilter]);

  // Filter KYC statuses
  useEffect(() => {
    let filtered = kycStatuses;
    
    if (searchTerm) {
      filtered = filtered.filter(kyc => 
        kyc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (kycFilter !== 'all') {
      filtered = filtered.filter(kyc => kyc.kyc_status === kycFilter);
    }
    
    setFilteredKyc(filtered);
  }, [kycStatuses, searchTerm, kycFilter]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {throw error;}

      // Transform data to include user email
      const logsWithUser = data?.map(log => ({
        ...log,
        user_email: (log as any).user?.email || (log.metadata as any)?.user_email || 'System'
      })) || [];

      setAuditLogs(logsWithUser);
      setFilteredLogs(logsWithUser);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    }
  };

  const fetchKycStatuses = async () => {
    try {
      // In a real implementation, this would fetch from a KYC table
      // For now, we'll simulate some data
      const mockKycData: KYCStatus[] = [
        {
          user_id: 'user1',
          full_name: 'John Doe',
          email: 'john@example.com',
          kyc_status: 'verified',
          kyc_documents: ['license_front.jpg', 'license_back.jpg'],
          submitted_at: new Date(Date.now() - 86400000).toISOString(),
          verified_at: new Date(Date.now() - 43200000).toISOString(),
          verified_by: 'admin@rpcars.in'
        },
        {
          user_id: 'user2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          kyc_status: 'pending',
          kyc_documents: ['license_front.jpg'],
          submitted_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          user_id: 'user3',
          full_name: 'Bob Johnson',
          email: 'bob@example.com',
          kyc_status: 'rejected',
          kyc_documents: ['license_front.jpg', 'license_back.jpg'],
          submitted_at: new Date(Date.now() - 259200000).toISOString(),
          verified_at: new Date(Date.now() - 172800000).toISOString(),
          verified_by: 'admin@rpcars.in'
        }
      ];

      setKycStatuses(mockKycData);
      setFilteredKyc(mockKycData);
    } catch (error) {
      console.error('Error fetching KYC statuses:', error);
      toast({
        title: "Error",
        description: "Failed to load KYC statuses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Description', 'User', 'Metadata'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.action,
        log.description,
        log.user_email || 'N/A',
        JSON.stringify(log.metadata || {})
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Audit logs exported successfully",
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <LogIn className="w-4 h-4" />;
      case 'car_create': return <Car className="w-4 h-4" />;
      case 'car_update': return <Car className="w-4 h-4" />;
      case 'customer_suspend': return <User className="w-4 h-4" />;
      case 'settings_update': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-blue-100 text-blue-800';
      case 'car_create': return 'bg-green-100 text-green-800';
      case 'car_update': return 'bg-yellow-100 text-yellow-800';
      case 'customer_suspend': return 'bg-red-100 text-red-800';
      case 'settings_update': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-success">Verified</Badge>;
      case 'pending': return <Badge className="bg-warning">Pending</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Security & Compliance</h2>
        <p className="text-muted-foreground">
          Audit logs and KYC management
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'audit' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('audit')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Audit Logs
        </Button>
        <Button
          variant={activeTab === 'kyc' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('kyc')}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          KYC Management
        </Button>
      </div>
      
      {activeTab === 'audit' ? (
        <>
          {/* Audit Logs Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audit logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Action Filter */}
                <div className="flex gap-2">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="car_create">Car Create</SelectItem>
                      <SelectItem value="car_update">Car Update</SelectItem>
                      <SelectItem value="customer_suspend">Customer Suspend</SelectItem>
                      <SelectItem value="settings_update">Settings Update</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setActionFilter('all');
                    }}
                  >
                    Clear
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={exportAuditLogs}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {auditLogs.length} audit logs
              </div>
            </CardContent>
          </Card>
          
          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Timestamp</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getActionColor(log.action)}>
                            <div className="flex items-center gap-1">
                              {getActionIcon(log.action)}
                              <span className="capitalize">{log.action.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {log.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {log.user_email || 'System'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* KYC Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex gap-2">
                  <Select value={kycFilter} onValueChange={setKycFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setKycFilter('all');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredKyc.length} of {kycStatuses.length} KYC records
              </div>
            </CardContent>
          </Card>
          
          {/* KYC Table */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Submitted</th>
                      <th className="text-left py-3 px-4">Verified</th>
                      <th className="text-left py-3 px-4">Documents</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKyc.map((kyc) => (
                      <motion.tr 
                        key={kyc.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {kyc.full_name || 'Unnamed User'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {kyc.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getKycStatusBadge(kyc.kyc_status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {new Date(kyc.submitted_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {kyc.verified_at 
                              ? new Date(kyc.verified_at).toLocaleDateString()
                              : 'Not verified'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {kyc.kyc_documents.length} document(s)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredKyc.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No KYC records found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SecurityCompliance;