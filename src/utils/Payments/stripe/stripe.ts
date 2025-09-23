import { toast } from "sonner";
import type { CreateOrderResponse } from "../api/paymentApi";
import type { PaymentProcessorCallbacks } from "../common/paymentProcessors";
import { loadStripe } from '@stripe/stripe-js';

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
 * Open Stripe Checkout in a popup window - Callback Based
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
            
            // Use callback instead of dispatchEvent
            if (options.callbacks) {
              options.callbacks.onSuccess();
            }
          } else {
            // Payment was cancelled or failed
            if (options.callbacks) {
              options.callbacks.onCancel();
            }
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

                // Use callback instead of dispatchEvent
                if (options.callbacks) {
                  options.callbacks.onSuccess();
                }
              } else {
                // Payment was cancelled or failed
                if (options.callbacks) {
                  options.callbacks.onCancel();
                }
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
                
                // Use callback instead of dispatchEvent
                if (options.callbacks) {
                  options.callbacks.onSuccess();
                }
              } else {
                // Payment was cancelled or failed
                if (options.callbacks) {
                  options.callbacks.onCancel();
                }
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
                
                // Use callback instead of dispatchEvent
                if (options.callbacks) {
                  options.callbacks.onSuccess();
                }
              } else {
                // Payment was cancelled or failed
                if (options.callbacks) {
                  options.callbacks.onCancel();
                }
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
    if (options.callbacks) {
      options.callbacks.onError(error instanceof Error ? error.message : 'Stripe checkout failed');
    }
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout using session ID or checkout URL - Callback Based
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
        if (options.callbacks) {
          options.callbacks.onError(result.error.message || 'Stripe checkout failed');
        }
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
        if (options.callbacks) {
          options.callbacks.onError('Failed to create checkout session');
        }
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
          if (options.callbacks) {
            options.callbacks.onError(result.error.message || 'Stripe checkout failed');
          }
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
          if (options.callbacks) {
            options.callbacks.onError(result.error.message || 'Stripe checkout failed');
          }
          throw new Error(result.error.message || 'Stripe checkout failed');
        }
        
        console.log('✅ Stripe checkout redirect successful');
        return;
      } else {
        console.warn('⚠️ No checkout_url, checkout_session_id, or sessionId in response:', sessionData);
        const error = 'No checkout session received from backend';
        if (options.callbacks) {
          options.callbacks.onError(error);
        }
        throw new Error(error);
      }
    }

    const error = 'No session ID or order ID provided for Stripe checkout';
    if (options.callbacks) {
      options.callbacks.onError(error);
    }
    throw new Error(error);
  } catch (error) {
    console.error('❌ Error in Stripe checkout:', error);
    if (options.callbacks && !(error as any).message?.includes('callbacks')) {
      options.callbacks.onError(error instanceof Error ? error.message : 'Stripe checkout failed');
    }
    throw error;
  }
};


const updatePaymentStatusApi = async (orderId: string, status: string): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/update-status/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        status: status
      }),
    });

    if (!response.ok) {
      console.warn("⚠️ Failed to update payment status in database");
    } else {
      console.log("✅ Payment status updated in database");
    }
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
  }
};

/**
 * Verify Stripe payment with backend - Callback Based
 */
export const verifyStripePayment = async (
  sessionId: string, 
  callbacks: PaymentProcessorCallbacks
): Promise<void> => {
  try {
    console.log("🔍 Verifying Stripe payment with session ID:", sessionId);
    
    // Call backend to verify the payment
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/verify-checkout-session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        session_id: sessionId
      }),
    });

    if (!response.ok) {
      throw new Error("Payment verification failed");
    }

    const verificationResult = await response.json();
    console.log("✅ Stripe payment verification successful:", verificationResult);

    // Update payment status in database
    await updatePaymentStatusApi(verificationResult.order_id || sessionId, "completed");

    // Use callback instead of dispatchEvent
    toast.success("Payment successful! Generating your story...");
    callbacks.onSuccess();
    
  } catch (error) {
    console.error("❌ Stripe payment verification failed:", error);
    toast.error("Payment verification failed. Please contact support.");
    callbacks.onError(error instanceof Error ? error.message : "Stripe verification failed");
  }
};

/**
 * Handle Stripe payment processing - Callback Based
 */
export const handleStripePayment = async (
  orderDetails: CreateOrderResponse,
  callbacks: PaymentProcessorCallbacks
): Promise<void> => {
  try {
    console.log("💳 Processing Stripe payment:", orderDetails);

    // If no session id is present, create one via backend and open popup using helper
    if (!orderDetails.stripe_session_id) {
      console.log("⚠️ No Stripe session ID on order. Creating checkout session via backend...");
      await openStripeCheckoutInPopup({
        orderId: orderDetails.stripe_order_id,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        storyId: orderDetails.story_id,
        clientSecret: orderDetails.stripe_client_secret,
        callbacks,
      });
      return;
    }
    
    // Create a simple popup window for Stripe checkout using existing session
    const checkoutUrl = `${window.location.origin}/stripe-checkout?sessionId=${orderDetails.stripe_session_id}`;
    const popup = window.open(checkoutUrl, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
    
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
          
          // Use callback instead of dispatchEvent
          verifyStripePayment(orderDetails.stripe_session_id!, callbacks);
        } else {
          // Payment was cancelled or failed
          callbacks.onCancel();
        }
      }
    }, 1000);
    
    console.log("✅ Stripe checkout opened in popup");
  } catch (error) {
    console.error("❌ Stripe payment error:", error);
    callbacks.onError(error instanceof Error ? error.message : "Stripe payment failed");
    toast.error("Stripe payment failed. Please try again.");
  }
}; 

/**
 * Verify Stripe payment from current window URL and close window
 */
export const verifyStripePaymentFromWindow = async (): Promise<void> => {
  try {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      toast.error("No Stripe session ID found");
      return;
    }

    console.log("🔍 Verifying Stripe payment with session ID:", sessionId);

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/verify-checkout-session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        session_id: sessionId
      }),
    });

    if (!response.ok) {
      throw new Error("Payment verification failed");
    }

    const result = await response.json();
    console.log("✅ Stripe payment verification successful:", result);

    // Persist success signal for parent window polling
    localStorage.setItem("stripe_payment_success", "true");

    toast.success("Payment successful!");

    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error("❌ Stripe payment verification failed:", error);
    toast.error("Payment verification failed. Please contact support.");

    setTimeout(() => {
      window.close();
    }, 3000);
  }
};

/**
 * Handle Stripe payment cancellation from popup window
 */
export const handleStripePaymentCancelledFromWindow = (): void => {
  try {
    toast.error("Payment was cancelled");
    localStorage.setItem("stripe_payment_cancelled", "true");
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    setTimeout(() => {
      window.close();
    }, 2000);
  }
};

 