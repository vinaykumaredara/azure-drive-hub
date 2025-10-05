import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Search, Eye, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  is_suspended: boolean;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  suspended_by?: string | null;
  last_login?: string | null;
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search and filter criteria
  useEffect(() => {
    let filtered = customers;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'suspended') {
        filtered = filtered.filter(customer => customer.is_suspended);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(customer => !customer.is_suspended);
      } else if (statusFilter === 'admin') {
        filtered = filtered.filter(customer => customer.is_admin);
      }
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      // Fetch users from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {throw usersError;}

      // Transform data to match Customer interface
      const transformedCustomers = (usersData as any)?.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email || 'user@example.com', // Placeholder - would need to fetch from auth
        phone: user.phone,
        is_admin: user.is_admin,
        created_at: user.created_at,
        is_suspended: user.is_suspended || false,
        suspension_reason: user.suspension_reason,
        suspended_at: user.suspended_at,
        suspended_by: user.suspended_by,
        last_login: null // Placeholder - would need to fetch from auth
      })) || [];

      setCustomers(transformedCustomers as Customer[]);
      setFilteredCustomers(transformedCustomers as Customer[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendCustomer = async () => {
    if (!selectedCustomer) {return;}

    try {
      // Update customer suspension status
      const { error } = await (supabase
        .from('users') as any)
        .update({
          is_suspended: !selectedCustomer.is_suspended,
          suspension_reason: !selectedCustomer.is_suspended ? suspendReason : null,
          suspended_at: !selectedCustomer.is_suspended ? new Date().toISOString() : null,
          suspended_by: !selectedCustomer.is_suspended ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', selectedCustomer.id);

      if (error) {throw error;}

      toast({
        title: "Success",
        description: `Customer ${selectedCustomer.full_name || selectedCustomer.email} has been ${selectedCustomer.is_suspended ? 'activated' : 'suspended'}.`,
      });

      // Log audit entry
      await logAuditAction(
        selectedCustomer.is_suspended ? 'customer_activate' : 'customer_suspend',
        `Customer ${selectedCustomer.full_name || selectedCustomer.email} ${selectedCustomer.is_suspended ? 'activated' : 'suspended'}`,
        { customerId: selectedCustomer.id, reason: suspendReason }
      );

      setIsSuspendDialogOpen(false);
      setSuspendReason('');
      setSelectedCustomer(null);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      });
    }
  };

  const logAuditAction = async (action: string, description: string, metadata?: any) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      
      // Insert audit log entry
      const { error } = await (supabase
        .from('audit_logs') as any)
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

  const getStatusBadge = (customer: Customer) => {
    if (customer.is_admin) {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>;
    }
    if (customer.is_suspended) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge className="bg-success hover:bg-success/90">Active</Badge>;
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
      {/* Header */}
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
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">
            Manage customer accounts and permissions
          </p>
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
                placeholder="Search by name, email, or phone..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </CardContent>
      </Card>
      
      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Last Login</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {customer.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {customer.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(customer)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {customer.last_login 
                          ? new Date(customer.last_login).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsSuspendDialogOpen(true);
                          }}
                        >
                          {customer.is_suspended ? 'Activate' : 'Suspend'}
                        </Button>
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
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend/Activate Dialog */}
      {isSuspendDialogOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {selectedCustomer.is_suspended ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <h3 className="text-lg font-semibold">
                  {selectedCustomer.is_suspended ? 'Activate Customer' : 'Suspend Customer'}
                </h3>
              </div>
              
              <div className="mb-4">
                <p className="text-muted-foreground mb-2">
                  {selectedCustomer.is_suspended 
                    ? 'Are you sure you want to activate this customer?'
                    : 'Are you sure you want to suspend this customer?'}
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">
                    {selectedCustomer.full_name || selectedCustomer.email}
                  </p>
                </div>
              </div>
              
              {!selectedCustomer.is_suspended && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Reason for suspension (optional)
                  </label>
                  <Input
                    placeholder="Enter reason for suspension..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuspendDialogOpen(false);
                    setSelectedCustomer(null);
                    setSuspendReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={selectedCustomer.is_suspended ? "default" : "destructive"}
                  onClick={handleSuspendCustomer}
                >
                  {selectedCustomer.is_suspended ? 'Activate' : 'Suspend'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;