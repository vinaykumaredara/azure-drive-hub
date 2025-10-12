import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  BarChart3, 
  Calendar, 
  Search,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatINRFromPaise } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_flat: number | null; // in paise
  valid_from: string;
  valid_to: string;
  active: boolean;
  usage_limit: number;
  usage_count: number;
  created_at: string;
  description: string | null;
  target_audience: 'all' | 'new_users' | 'existing_users' | 'vip';
}

const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_percent: 10,
    discount_flat: 50000, // in paise
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: 100,
    target_audience: 'all',
    description: ''
  });

  // Fetch promo codes from database
  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map to PromoCode interface
      const mappedPromos: PromoCode[] = (data || []).map((promo: any) => ({
        id: promo.id,
        code: promo.code,
        discount_percent: promo.discount_percentage || null,
        discount_flat: promo.discount_amount_paise || null,
        valid_from: promo.valid_from,
        valid_to: promo.valid_to,
        active: promo.active,
        usage_limit: promo.max_uses,
        usage_count: promo.times_used || 0,
        created_at: promo.created_at,
        description: promo.description || null,
        target_audience: 'all' // Not in schema, defaulting to 'all'
      }));
      
      setPromoCodes(mappedPromos);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);
  
  // Real-time subscription
  useRealtimeTable('promo_codes', fetchPromoCodes);

  // Filter and sort promo codes
  const filteredAndSortedPromos = useMemo(() => {
    let filtered = promoCodes;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(promo => 
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(promo => promo.active === isActive);
    }
    
    // Apply audience filter
    if (audienceFilter !== 'all') {
      filtered = filtered.filter(promo => promo.target_audience === audienceFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof PromoCode];
      const bVal = b[sortBy as keyof PromoCode];
      
      // Handle null/undefined values
      if (aVal === null && bVal === null) {return 0;}
      if (aVal === null) {return 1;}
      if (bVal === null) {return -1;}
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [promoCodes, searchTerm, statusFilter, audienceFilter, sortBy, sortOrder]);

  // Get audience text
  const getAudienceText = (audience: string) => {
    switch (audience) {
      case 'all': return 'All Users';
      case 'new_users': return 'New Users';
      case 'existing_users': return 'Existing Users';
      case 'vip': return 'VIP Customers';
      default: return audience;
    }
  };

  // Get status badge variant
  const getStatusVariant = (active: boolean) => {
    return active ? 'default' : 'secondary';
  };

  // Get status text
  const getStatusText = (active: boolean) => {
    return active ? 'Active' : 'Inactive';
  };

  // Copy promo code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Promo code ${code} copied to clipboard`,
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_percent: 10,
      discount_flat: 50000, // in paise
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage_limit: 100,
      target_audience: 'all',
      description: ''
    });
    setEditingPromo(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        discount_percentage: formData.discount_type === 'percent' ? formData.discount_percent : null,
        discount_amount_paise: formData.discount_type === 'flat' ? formData.discount_flat : null,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        max_uses: formData.usage_limit,
        description: formData.description,
        active: true
      };
      
      if (editingPromo) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingPromo.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert(promoData);
        
        if (error) throw error;
      }
      
      // Log audit action
      await supabase.from('audit_logs').insert({
        action: editingPromo ? 'promo_updated' : 'promo_created',
        description: `Promo code ${formData.code} ${editingPromo ? 'updated' : 'created'}`,
        metadata: { promo_code: formData.code }
      });
      
      toast({
        title: editingPromo ? "Promo Code Updated" : "Promo Code Created",
        description: editingPromo 
          ? "Promo code has been updated successfully" 
          : "New promo code has been created successfully",
      });
      
      setShowAddModal(false);
      resetForm();
      fetchPromoCodes(); // Refresh data
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingPromo ? 'update' : 'create'} promo code`,
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_percent ? 'percent' : 'flat',
      discount_percent: promo.discount_percent || 10,
      discount_flat: promo.discount_flat || 50000,
      valid_from: promo.valid_from,
      valid_to: promo.valid_to,
      usage_limit: promo.usage_limit,
      target_audience: promo.target_audience,
      description: promo.description || ''
    });
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      try {
        const { error } = await supabase
          .from('promo_codes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Log audit action
        await supabase.from('audit_logs').insert({
          action: 'promo_deleted',
          description: `Promo code ${id} deleted`,
          metadata: { promo_id: id }
        });
        
        toast({
          title: "Promo Code Deleted",
          description: "Promo code has been deleted successfully",
        });
        
        fetchPromoCodes(); // Refresh data
      } catch (error) {
        console.error('Error deleting promo code:', error);
        toast({
          title: "Error",
          description: "Failed to delete promo code",
          variant: "destructive",
        });
      }
    }
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
          <h1 className="text-3xl font-bold">Promo Code Management</h1>
          <p className="text-muted-foreground">Create and manage promotional codes for customers</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowAddModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Promo Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Promo Codes</p>
                <p className="text-2xl font-bold">{promoCodes.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">
                  {promoCodes.filter(p => p.active).length}
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
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">
                  {promoCodes.reduce((sum, p) => sum + p.usage_count, 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Redemption</p>
                <p className="text-2xl font-bold">
                  {promoCodes.length > 0 
                    ? Math.round(promoCodes.reduce((sum, p) => sum + (p.usage_count / p.usage_limit * 100), 0) / promoCodes.length)
                    : 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search promo codes..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="new_users">New Users</SelectItem>
                  <SelectItem value="existing_users">Existing Users</SelectItem>
                  <SelectItem value="vip">VIP Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Creation Date</SelectItem>
                  <SelectItem value="usage_count">Usage Count</SelectItem>
                  <SelectItem value="valid_to">Expiry Date</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
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

      {/* Promo Code List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedPromos.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold font-mono">{promo.code}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(promo.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {promo.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusVariant(promo.active)}>
                        {getStatusText(promo.active)}
                      </Badge>
                      <Badge variant="secondary">
                        {getAudienceText(promo.target_audience)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {promo.discount_percent 
                        ? `${promo.discount_percent}% OFF` 
                        : formatINRFromPaise(promo.discount_flat || 0) + ' OFF'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {promo.usage_count}/{promo.usage_limit} used
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valid From</p>
                    <p className="font-medium">{new Date(promo.valid_from).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid To</p>
                    <p className="font-medium">{new Date(promo.valid_to).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(promo.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Redemption Rate</p>
                    <p className="font-medium">
                      {promo.usage_limit > 0 
                        ? Math.round((promo.usage_count / promo.usage_limit) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(promo.usage_count / promo.usage_limit) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Promo Code Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingPromo ? "Edit Promo Code" : "Add New Promo Code"}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  ✕
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Promo Code *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., WELCOME20"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(value) => setFormData({...formData, target_audience: value as any})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                      <SelectItem value="existing_users">Existing Users</SelectItem>
                      <SelectItem value="vip">VIP Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <Button
                    type="button"
                    variant={formData.discount_type === 'percent' ? 'default' : 'outline'}
                    onClick={() => setFormData({...formData, discount_type: 'percent'})}
                    className="justify-start"
                  >
                    Percentage Discount
                  </Button>
                  <Button
                    type="button"
                    variant={formData.discount_type === 'flat' ? 'default' : 'outline'}
                    onClick={() => setFormData({...formData, discount_type: 'flat'})}
                    className="justify-start"
                  >
                    Flat Discount
                  </Button>
                </div>
              </div>

              {formData.discount_type === 'percent' ? (
                <div>
                  <label className="text-sm font-medium">Discount Percentage *</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({...formData, discount_percent: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 20"
                    className="mt-1"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Flat Discount Amount *</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.discount_flat / 100}
                    onChange={(e) => setFormData({...formData, discount_flat: (parseInt(e.target.value) || 0) * 100})}
                    placeholder="e.g., 500"
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Amount in INR (will be converted to paise)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valid From *</label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid To *</label>
                  <Input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Usage Limit *</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value) || 0})}
                  placeholder="e.g., 100"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe this promo code..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </form>

            <div className="p-6 border-t">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit}>
                  {editingPromo ? "Update Promo Code" : "Create Promo Code"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PromoCodeManagement;