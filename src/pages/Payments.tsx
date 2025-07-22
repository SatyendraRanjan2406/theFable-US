import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Receipt,
  Clock,
  XCircle,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '@/utils/apiInterceptor';
import { API_ENDPOINTS } from '@/config/api';
import SidePanel from '@/components/SidePanel';
import { useContact } from '@/context/ContactContext';
import Footer from '@/components/Footer';

interface PaymentHistoryItem {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  description: string;
  created_at: string;
  paid_at?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  non_logged_in_user_id?: string;
}

interface PaymentHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentHistoryItem[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { openContactModal } = useContact();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchPaymentHistory();
  }, [isAuthenticated, navigate, pagination.currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching payment history for page:', pagination.currentPage);
      
      const response = await apiFetch(
        `${API_ENDPOINTS.payments.history}?page=${pagination.currentPage}&page_size=${pagination.pageSize}`,
        { method: 'GET' }
      );

      if (!response) {
        throw new Error('Failed to fetch payment history');
      }

      const data: PaymentHistoryResponse = response;
      
      setPayments(data.results);
      
      // Calculate pagination info
      const totalPages = Math.ceil(data.count / pagination.pageSize);
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalItems: data.count
      }));

      console.log('Payment history loaded:', {
        count: data.count,
        results: data.results.length,
        currentPage: pagination.currentPage
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPayments = async () => {
    setIsRefreshing(true);
    await fetchPaymentHistory();
    setIsRefreshing(false);
    toast.success('Payment history refreshed');
  };

  // Auto-refresh payment history when component mounts or when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh when user returns to the tab/window
      fetchPaymentHistory();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Convert from paise to rupees
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-blue-600" />;
    }
  };

  const handleDownloadInvoice = (payment: PaymentHistoryItem) => {
    // TODO: Implement invoice download
    toast.info('Invoice download feature coming soon!');
  };

  const handleViewDetails = (payment: PaymentHistoryItem) => {
    // TODO: Implement payment details view
    toast.info('Payment details view coming soon!');
  };



  const getPaymentSummary = () => {
    const totalPaid = payments.filter(p => p.status === 'paid').length;
    const totalPending = payments.filter(p => p.status === 'pending').length;
    const totalFailed = payments.filter(p => p.status === 'failed').length;
    const totalAmount = payments
      .filter(p => p.status === 'paid' && typeof p.amount === 'number' && !isNaN(p.amount))
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPaid,
      totalPending,
      totalFailed,
      totalAmount: totalAmount || 0
    };
  };

  if (!isAuthenticated) {
    return null;
  }

  const summary = getPaymentSummary();

  return (
    <>
      <SidePanel isOpen={isSidePanelOpen} onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)} />
      <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins">
        {/* Header with Menu Button */}
        {/* <header className="bg-white shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
              <span className="text-xl font-bold text-gray-800">StoryMaker</span>
            </div>
          </nav>
        </header> */}

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#8D4BE5] mb-2">Payment History</h1>
                  <p className="text-[#555555]">View and manage your payment transactions</p>
                </div>
                <Button 
                  onClick={refreshPayments} 
                  disabled={isRefreshing}
                  variant="outline"
                  className="border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#555555]">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalPaid}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#555555]">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.totalPending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#555555]">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{summary.totalFailed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#555555]">Total Amount</p>
                  <p className="text-2xl font-bold text-[#8D4BE5]">
                    {formatCurrency(summary.totalAmount, 'INR')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#8D4BE5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="bg-white shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-[#333333]">Payment History</span>
              <div className="text-sm text-[#555555]">
                Showing {payments.length} of {pagination.totalItems} payments
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#555555]" />
                  <span className="text-[#555555]">Loading payment history...</span>
                </div>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                      payment.status === 'paid' 
                        ? 'bg-green-50 border-green-200 shadow-sm' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === 'paid' 
                          ? 'bg-green-100' 
                          : payment.status === 'pending'
                          ? 'bg-yellow-100'
                          : payment.status === 'failed'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{payment.description}</p>
                          {payment.status === 'paid' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-[#555555]">
                          <span>Order: {payment.razorpay_order_id}</span>
                          {payment.razorpay_payment_id && (
                            <span>Payment: {payment.razorpay_payment_id}</span>
                          )}
                          <span>{formatDate(payment.created_at)}</span>
                        </div>
                        {payment.guest_name && (
                          <p className="text-xs text-[#555555]">
                            Guest: {payment.guest_name} ({payment.guest_email})
                          </p>
                        )}
                        {payment.status === 'failed' && (
                          <p className="text-xs text-red-500 mt-1">
                            <span className="font-medium">Failed:</span> Payment could not be processed
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                        {getStatusBadge(payment.status)}
                        {payment.paid_at && (
                          <p className="text-xs text-[#555555] mt-1">
                            Paid: {formatDate(payment.paid_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-[#8D4BE5] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#333333] mb-2">No Payment History</h3>
                <p className="text-[#555555] mb-4">You haven't made any payments yet.</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Story
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-[#555555]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 bg-white shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#333333]">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="font-medium mb-2 text-[#333333]">Payment Issues</h4>
              <p className="text-sm text-[#555555] mb-3">
                Having trouble with a payment? Check the status and contact support if needed.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openContactModal}
                className="border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        </div>
      </div>
      
      {/* Footer */}
      <Footer />
      </div>
    </>
  );
};

export default Payments; 