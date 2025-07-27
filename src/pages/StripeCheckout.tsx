import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'react-router-dom';

const StripeCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToStripe = async () => {
      try {
        const sessionId = searchParams.get('sessionId');
        
        if (!sessionId) {
          setError('No session ID provided');
          setLoading(false);
          return;
        }

        console.log('🔗 Redirecting to Stripe checkout with session ID:', sessionId);
        
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }

        const result = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });

        if (result.error) {
          console.error('❌ Stripe checkout error:', result.error);
          setError(result.error.message || 'Stripe checkout failed');
          setLoading(false);
        } else {
          console.log('✅ Stripe checkout redirect successful');
        }
      } catch (err) {
        console.error('❌ Error in Stripe checkout:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    redirectToStripe();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to Stripe Checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StripeCheckout; 