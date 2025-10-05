import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar, 
  Download, 
  Eye,
  CreditCard,
  Wallet,
  PiggyBank,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatINRFromPaise } from '@/utils/currency';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  payment_method: string;
  related_booking?: string;
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  cash_flow: number;
  pending_payments: number;
  overdue_payments: number;
}

const FinancialManagement: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    cash_flow: 0,
    pending_payments: 0,
    overdue_payments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRecords: FinancialRecord[] = [
        {
          id: '1',
          type: 'income',
          category: 'Car Rental',
          amount: 1500000, // in paise
          description: 'Booking #1234 - Hyundai Creta',
          date: '2025-09-25',
          status: 'completed',
          payment_method: 'Credit Card',
          related_booking: '1234'
        },
        {
          id: '2',
          type: 'expense',
          category: 'Maintenance',
          amount: 250000, // in paise
          description: 'Oil change and servicing',
          date: '2025-09-24',
          status: 'completed',
          payment_method: 'Bank Transfer'
        },
        {
          id: '3',
          type: 'income',
          category: 'Car Rental',
          amount: 1200000, // in paise
          description: 'Booking #1235 - Maruti Swift',
          date: '2025-09-23',
          status: 'completed',
          payment_method: 'UPI',
          related_booking: '1235'
        },
        {
          id: '4',
          type: 'expense',
          category: 'Insurance',
          amount: 800000, // in paise
          description: 'Annual insurance premium',
          date: '2025-09-22',
          status: 'completed',
          payment_method: 'Bank Transfer'
        },
        {
          id: '5',
          type: 'income',
          category: 'Car Rental',
          amount: 1800000, // in paise
          description: 'Booking #1236 - Toyota Innova',
          date: '2025-09-21',
          status: 'pending',
          payment_method: 'Cash',
          related_booking: '1236'
        },
        {
          id: '6',
          type: 'expense',
          category: 'Fuel',
          amount: 120000, // in paise
          description: 'Fuel refill for fleet',
          date: '2025-09-20',
          status: 'completed',
          payment_method: 'Credit Card'
        }
      ];

      const mockSummary: FinancialSummary = {
        total_revenue: 4500000, // in paise
        total_expenses: 1170000, // in paise
        net_profit: 3330000, // in paise
        cash_flow: 2850000, // in paise
        pending_payments: 1800000, // in paise
        overdue_payments: 500000 // in paise
      };

      setRecords(mockRecords);
      setSummary(mockSummary);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter records based on selections
  const filteredRecords = useMemo(() => {
    let filtered = records;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(record => record.category === categoryFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }
    
    return filtered;
  }, [records, categoryFilter, typeFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return Array.from(new Set(records.map(record => record.category)));
  }, [records]);

  // Get type badge variant
  const getTypeVariant = (type: string) => {
    return type === 'income' ? 'default' : 'destructive';
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'default';
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
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Track revenue, expenses, and financial performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900">{formatINRFromPaise(summary.total_revenue)}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-700">+12.5% from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-900">{formatINRFromPaise(summary.total_expenses)}</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-700">-3.2% from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <CreditCard className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Net Profit</p>
                  <p className="text-3xl font-bold text-blue-900">{formatINRFromPaise(summary.net_profit)}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-700">+8.7% from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <PiggyBank className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cash Flow</p>
                  <p className="text-2xl font-bold">{formatINRFromPaise(summary.cash_flow)}</p>
                  <div className="flex items-center mt-1">
                    <Wallet className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">Positive</span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-full">
                  <Wallet className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{formatINRFromPaise(summary.pending_payments)}</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 text-yellow-600 mr-1" />
                    <span className="text-sm text-yellow-600">3 pending</span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-full">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold">{formatINRFromPaise(summary.overdue_payments)}</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600">1 overdue</span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-full">
                  <TrendingDown className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Financial Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{record.description}</p>
                        {record.related_booking && (
                          <p className="text-sm text-muted-foreground">Booking #{record.related_booking}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{record.category}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getTypeVariant(record.type)}>
                        {record.type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3 mr-1 inline" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-1 inline" />
                        )}
                        {record.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {record.type === 'income' ? '+' : '-'}
                      {formatINRFromPaise(record.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Expense chart visualization</p>
                <p className="text-sm text-muted-foreground mt-1">Interactive chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Income vs expenses chart</p>
                <p className="text-sm text-muted-foreground mt-1">Interactive chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialManagement;