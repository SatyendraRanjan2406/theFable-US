import React, { useEffect } from 'react';
import { toast } from 'sonner';

const PaymentCancelled: React.FC = () => {
  useEffect(() => {
    // Show cancellation message
    toast.error('Payment was cancelled');
    
    // Store cancellation in localStorage for popup parent to detect
    localStorage.setItem('stripe_payment_cancelled', 'true');
    
    // Close the popup after a short delay
    setTimeout(() => {
      window.close();
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-yellow-500 text-6xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-4">Your payment was cancelled.</p>
        <p className="text-sm text-gray-500">This window will close automatically...</p>
      </div>
    </div>
  );
};

export default PaymentCancelled; 