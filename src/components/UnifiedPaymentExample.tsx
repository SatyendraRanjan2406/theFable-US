import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getPaymentMode } from '@/utils/paymentConfig';
import { createOrderWithCurrentMode } from '@/utils/unifiedPaymentApi';

interface UnifiedPaymentExampleProps {
  storyId?: string;
  amount: number;
  onPaymentSuccess: () => void;
}

const UnifiedPaymentExample: React.FC<UnifiedPaymentExampleProps> = ({
  storyId,
  amount,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState(getPaymentMode());

  const handlePayment = async () => {
    setIsProcessing(true);
    debugger
    try {
      // Create order using unified API
      const orderResponse = await createOrderWithCurrentMode(
        amount,
        'INR',
        storyId,
        'Guest User',
        'guest@example.com',
        '+1234567890'
      );

      console.log('Order created:', orderResponse);

      if (orderResponse.payment_mode === 'stripe') {
        // Handle Stripe payment
        toast.success('Stripe order created! Redirecting to payment...');
        // Here you would redirect to Stripe checkout or show Stripe Elements
      } else if (orderResponse.payment_mode === 'razorpay') {
        // Handle Razorpay payment (existing functionality)
        toast.success('Razorpay order created! Processing payment...');
        // Here you would use existing Razorpay payment flow
      }

      onPaymentSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Unified Payment Example</h3>
      
      <div className="mb-4">
        <p><strong>Current Payment Mode:</strong> {paymentMode}</p>
        <p><strong>Amount:</strong> ₹{amount}</p>
        {storyId && <p><strong>Story ID:</strong> {storyId}</p>}
      </div>

      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isProcessing ? 'Processing...' : `Pay with ${paymentMode}`}
      </Button>

      <div className="mt-4 text-sm text-gray-600">
        <p>This example shows how to use the unified payment API that supports both Stripe and Razorpay.</p>
        <p>Payment mode is determined by the VITE_PAYMENT_MODE environment variable.</p>
      </div>
    </div>
  );
};

export default UnifiedPaymentExample; 