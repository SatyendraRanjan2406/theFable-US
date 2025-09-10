import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    const verifyStripePayment = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        toast.error('No Stripe session ID found');
        setVerifying(false);
        return;
      }

      try {
        console.log('🔍 Verifying Stripe payment with session ID:', sessionId);
        
        // Call backend to verify the payment
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/verify-checkout-session/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            session_id: sessionId
          }),
        });

        if (!response.ok) {
          throw new Error('Payment verification failed');
        }

        const result = await response.json();
        console.log('✅ Stripe payment verification successful:', result);
        
        setVerificationResult(result);
        
        // Store success in localStorage for popup parent to detect
        localStorage.setItem('stripe_payment_success', 'true');
        
        // Show success message
        toast.success('Payment successful!');
        
        // Close the popup after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Stripe payment verification failed:', error);
        toast.error('Payment verification failed. Please contact support.');
        setVerifying(false);
        
        // Close the popup after error
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    verifyStripePayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we verify your payment.</p>
        </div>
      </div>
    );
  }

  if (verificationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your payment has been verified and processed.</p>
          <p className="text-sm text-gray-500">This window will close automatically...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">✗</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Verification Failed</h2>
        <p className="text-gray-600 mb-4">There was an issue verifying your payment.</p>
        <p className="text-sm text-gray-500">Please contact support if you believe this is an error.</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;