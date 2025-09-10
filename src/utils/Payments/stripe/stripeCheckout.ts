// Stripe Checkout Utility
import { loadStripe } from '@stripe/stripe-js';
import { PaymentProcessorCallbacks } from '../common';

// Load Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface StripeCheckoutOptions {
  sessionId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  storyId?: string;
  clientSecret?: string;
  callbacks?: PaymentProcessorCallbacks;
}

/**
 * Open Stripe Checkout in a popup window
 */
export const openStripeCheckoutInPopup = async (options: StripeCheckoutOptions) => {
  try {
    console.log('🔗 Opening Stripe checkout in popup with options:', options);
    
    // If we have a session ID, use it directly
    if (options.sessionId) {
      // Create a simple page that redirects to Stripe
      const redirectUrl = `${window.location.origin}/stripe-checkout?sessionId=${options.sessionId}`;
      const popup = window.open(redirectUrl, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }
      
      // Monitor popup for closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          console.log('✅ Stripe checkout popup closed');
          
          // Check for payment success in localStorage
          const paymentSuccess = localStorage.getItem('stripe_payment_success');



          
          if (paymentSuccess) {

            
            localStorage.removeItem('stripe_payment_success');
            console.log('✅ Stripe payment completed successfully');

            debugger;
            // Trigger payment success callback
            window.dispatchEvent(new CustomEvent('stripe-payment-success', {
              detail: { sessionId: options.sessionId }
            }));
          }
        }
      }, 1000);
      
      console.log('✅ Stripe checkout opened in popup');
      return;
    }
    
    // If no session ID, create one first
    if (options.orderId) {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          stripe_order_id: options.orderId,
          amount: options.amount,
          currency: options.currency,
          story_id: options.storyId,
          client_secret: options.clientSecret,
        }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('📡 Checkout session response for popup:', sessionData);
        
        if (sessionData.checkout_url) {
          // Backend returned a checkout URL - open directly in popup
          console.log('🔗 Opening Stripe checkout URL in popup:', sessionData.checkout_url);
          const popup = window.open(sessionData.checkout_url, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
          
          if (!popup) {
            throw new Error('Failed to open popup. Please allow popups for this site.');
          }
          
          // Monitor popup for closure
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              console.log('✅ Stripe checkout popup closed');
              
              // Check for payment success in localStorage
              const paymentSuccess = localStorage.getItem('stripe_payment_success');
              if (paymentSuccess) {
                localStorage.removeItem('stripe_payment_success');
                console.log('✅ Stripe payment completed successfully');

                debugger;
                // Trigger payment success callback
                window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                  detail: { sessionId: sessionData.checkout_session_id || sessionData.sessionId }
                }));
              }
            }
          }, 1000);
          
          console.log('✅ Stripe checkout opened in popup');
          return;
        } else if (sessionData.checkout_session_id) {
          // Backend returned a session ID - create redirect page in popup
          const redirectUrl = `${window.location.origin}/stripe-checkout?sessionId=${sessionData.checkout_session_id}`;
          const popup = window.open(redirectUrl, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
          
          if (!popup) {
            throw new Error('Failed to open popup. Please allow popups for this site.');
          }
          
          // Monitor popup for closure
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              console.log('✅ Stripe checkout popup closed');
              
              // Check for payment success in localStorage
              const paymentSuccess = localStorage.getItem('stripe_payment_success');
              if (paymentSuccess) {
                localStorage.removeItem('stripe_payment_success');
                console.log('✅ Stripe payment completed successfully');
                // Trigger payment success callback
                window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                  detail: { sessionId: sessionData.checkout_session_id }
                }));
              }
            }
          }, 1000);
          
          console.log('✅ Stripe checkout opened in popup');
          return;
        } else if (sessionData.sessionId) {
          // Fallback: Backend returned a sessionId (old format)
          const redirectUrl = `${window.location.origin}/stripe-checkout?sessionId=${sessionData.sessionId}`;
          const popup = window.open(redirectUrl, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
          
          if (!popup) {
            throw new Error('Failed to open popup. Please allow popups for this site.');
          }
          
          // Monitor popup for closure
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              console.log('✅ Stripe checkout popup closed');
              
              // Check for payment success in localStorage
              const paymentSuccess = localStorage.getItem('stripe_payment_success');
              if (paymentSuccess) {
                localStorage.removeItem('stripe_payment_success');
                console.log('✅ Stripe payment completed successfully');
                // Trigger payment success callback
                options.callbacks?.onSuccess();
                // window.dispatchEvent(new CustomEvent('stripe-payment-success', {
                //   detail: { sessionId: sessionData.sessionId }
                // }));
              }
            }
          }, 1000);
          
          console.log('✅ Stripe checkout opened in popup');

          return;
        }
      }
    }
    
    throw new Error('Failed to create Stripe checkout session for popup');
  } catch (error) {
    console.error('❌ Error opening Stripe checkout in popup:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout using session ID or checkout URL
 * This is the recommended approach for Stripe Checkout
 */
export const redirectToStripeCheckout = async (options: StripeCheckoutOptions) => {
  try {
    console.log('🔗 Starting Stripe checkout with options:', options);
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // If we have a session ID, use it directly
    if (options.sessionId) {
      console.log('🔗 Using provided session ID:', options.sessionId);
      
      const result = await stripe.redirectToCheckout({
        sessionId: options.sessionId,
      });
      
      if (result.error) {
        console.error('❌ Stripe checkout error:', result.error);
        throw new Error(result.error.message || 'Stripe checkout failed');
      }
      
      console.log('✅ Stripe checkout redirect successful');
      return;
    }

    // If no session ID, try to create one via backend
    if (options.orderId) {
      console.log('⚠️ No session ID provided, creating checkout session...');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          stripe_order_id: options.orderId,
          amount: options.amount,
          currency: options.currency,
          story_id: options.storyId,
          client_secret: options.clientSecret,
        }),
      });

      console.log('📡 Checkout session response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Checkout session creation failed:', errorText);
        throw new Error('Failed to create checkout session');
      }

      const sessionData = await response.json();
      console.log('📡 Checkout session response:', sessionData);
      
      // Handle the new backend response format
      if (sessionData.checkout_url) {
        // Backend returned a checkout URL - redirect directly
        console.log('🔗 Redirecting to Stripe Checkout URL:', sessionData.checkout_url);
        window.location.href = sessionData.checkout_url;
        return;
      } else if (sessionData.checkout_session_id) {
        // Backend returned a session ID - use Stripe.js redirect
        console.log('🔗 Redirecting to Stripe Checkout with created session ID:', sessionData.checkout_session_id);
        
        const result = await stripe.redirectToCheckout({
          sessionId: sessionData.checkout_session_id,
        });
        
        if (result.error) {
          console.error('❌ Stripe checkout error:', result.error);
          throw new Error(result.error.message || 'Stripe checkout failed');
        }
        
        console.log('✅ Stripe checkout redirect successful');
        return;
      } else if (sessionData.sessionId) {
        // Fallback: Backend returned a sessionId (old format)
        console.log('🔗 Redirecting to Stripe Checkout with created session ID:', sessionData.sessionId);
        
        const result = await stripe.redirectToCheckout({
          sessionId: sessionData.sessionId,
        });
        
        if (result.error) {
          console.error('❌ Stripe checkout error:', result.error);
          throw new Error(result.error.message || 'Stripe checkout failed');
        }
        
        console.log('✅ Stripe checkout redirect successful');
        return;
      } else {
        console.warn('⚠️ No checkout_url, checkout_session_id, or sessionId in response:', sessionData);
        throw new Error('No checkout session received from backend');
      }
    }

    throw new Error('No session ID or order ID provided for Stripe checkout');
  } catch (error) {
    console.error('❌ Error in Stripe checkout:', error);
    throw error;
  }
};