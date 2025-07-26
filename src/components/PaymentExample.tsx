import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createOrder, createLoggedInUserOrder, createGuestUserOrder } from '@/utils/paymentApi';
import { getPaymentMode } from '@/utils/paymentConfig';

interface PaymentExampleProps {
  storyId?: string;
  amount: number;
  onPaymentSuccess: () => void;
}

const PaymentExample: React.FC<PaymentExampleProps> = ({
  storyId,
  amount,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState(getPaymentMode());
  const [guestName, setGuestName] = useState('John Doe');
  const [guestEmail, setGuestEmail] = useState('john@example.com');
  const [guestPhone, setGuestPhone] = useState('+1234567890');

  const isAuthenticated = !!localStorage.getItem('access_token');
  
  // Get currency based on payment mode
  const currency = paymentMode === 'stripe' ? 'USD' : 'INR';

  const handleLoggedInPayment = async () => {
    setIsProcessing(true);
    
    try {
      // For logged-in users - currency auto-set based on payment mode
      const orderResponse = await createLoggedInUserOrder(
        amount,
        storyId,
        'Storymaker Premium'
      );

      console.log('Logged-in user order created:', orderResponse);
      toast.success('Order created successfully!');
      
      // Handle payment based on payment mode
      if (orderResponse.payment_mode === 'stripe') {
        console.log('Stripe order:', {
          orderId: orderResponse.stripe_order_id,
          clientSecret: orderResponse.stripe_client_secret,
          currency: orderResponse.currency,
        });
        // Process Stripe payment
      } else {
        console.log('Razorpay order:', {
          orderId: orderResponse.razorpay_order_id,
          currency: orderResponse.currency,
        });
        // Process Razorpay payment
      }

      onPaymentSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestPayment = async () => {
    setIsProcessing(true);
    
    try {
      // For guest users - currency auto-set based on payment mode
      const orderResponse = await createGuestUserOrder(
        amount,
        guestName,
        guestEmail,
        guestPhone,
        storyId,
        'Storymaker Premium'
      );

      console.log('Guest user order created:', orderResponse);
      toast.success('Order created successfully!');
      
      // Handle payment based on payment mode
      if (orderResponse.payment_mode === 'stripe') {
        console.log('Stripe order:', {
          orderId: orderResponse.stripe_order_id,
          clientSecret: orderResponse.stripe_client_secret,
          currency: orderResponse.currency,
        });
        // Process Stripe payment
      } else {
        console.log('Razorpay order:', {
          orderId: orderResponse.razorpay_order_id,
          currency: orderResponse.currency,
        });
        // Process Razorpay payment
      }

      onPaymentSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Auto-detect authentication status - currency auto-set based on payment mode
      const orderResponse = await createOrder(
        amount,
        storyId,
        'Storymaker Premium',
        guestName,
        guestEmail,
        guestPhone
      );

      console.log('Auto-detected order created:', orderResponse);
      toast.success('Order created successfully!');
      
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
      <h3 className="text-lg font-semibold mb-4">Payment API Example</h3>
      
      <div className="mb-4">
        <p><strong>Current Payment Mode:</strong> {paymentMode} (from VITE_PAYMENT_MODE)</p>
        <p><strong>Currency:</strong> {currency} (auto-set based on payment mode)</p>
        <p><strong>Amount:</strong> {currency === 'USD' ? `$${amount}` : `₹${amount}`}</p>
        <p><strong>Authentication Status:</strong> {isAuthenticated ? 'Logged In' : 'Guest User'}</p>
        {storyId && <p><strong>Story ID:</strong> {storyId}</p>}
      </div>

      <div className="space-y-3">
        {isAuthenticated ? (
          <Button
            onClick={handleLoggedInPayment}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? 'Processing...' : 'Pay as Logged-in User'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Guest Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="email"
                placeholder="Guest Email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Guest Phone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            
            <Button
              onClick={handleGuestPayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Pay as Guest User'}
            </Button>
          </div>
        )}

        <Button
          onClick={handleAutoPayment}
          disabled={isProcessing}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isProcessing ? 'Processing...' : 'Auto-Detect & Pay'}
        </Button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Request Format (Currency Auto-Set):</strong></p>
        <div className="bg-gray-50 p-3 rounded text-xs">
          <p><strong>Logged-in User:</strong></p>
          <pre className="overflow-x-auto">
{`{
  "amount": ${amount}.00,
  "currency": "${currency}",  // ← Auto-set: USD for Stripe, INR for Razorpay
  "payment_mode": "${paymentMode}",
  "story_id": "${storyId || 'your-story-uuid-here'}",
  "description": "Storymaker Premium"
}`}
          </pre>
          
          <p className="mt-2"><strong>Guest User:</strong></p>
          <pre className="overflow-x-auto">
{`{
  "amount": ${amount}.00,
  "currency": "${currency}",  // ← Auto-set: USD for Stripe, INR for Razorpay
  "payment_mode": "${paymentMode}",
  "guest_name": "${guestName}",
  "guest_email": "${guestEmail}",
  "guest_phone": "${guestPhone}",
  "story_id": "${storyId || 'your-story-uuid-here'}",
  "description": "Storymaker Premium"
}`}
          </pre>
        </div>
        
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <p><strong>Currency Rules:</strong></p>
          <ul className="list-disc list-inside">
            <li>Stripe: USD (automatically set)</li>
            <li>Razorpay: INR (automatically set)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample; 