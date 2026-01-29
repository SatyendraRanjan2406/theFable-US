import { toast } from "sonner";
import type { CreateOrderResponse } from "../api/paymentApi";
import type { PaymentProcessorCallbacks } from "../common/paymentProcessors";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');



/**
 * Handle Stripe payment processing - Callback Based
 */
export const handleStripePayment = async (
  orderDetails: CreateOrderResponse,
  callbacks: PaymentProcessorCallbacks
): Promise<void> => {
  try {
    console.log("💳 Processing Stripe payment:", orderDetails);

    // If no session id is present, create one directly here and open popup
    if (!orderDetails.stripe_session_id) {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          stripe_order_id: orderDetails.stripe_order_id,
          amount: orderDetails.amount,
          currency: orderDetails.currency,
          story_id: orderDetails.story_id,
          client_secret: orderDetails.stripe_client_secret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe checkout session');
      }

      const sessionData = await response.json();
      console.log('📡 Checkout session response:', sessionData);

      // Prefer direct checkout URL if provided
      if (sessionData.checkout_url) {
        const popup = window.open(sessionData.checkout_url, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
        if (!popup) {
          throw new Error('Failed to open popup. Please allow popups for this site.');
        }
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            const paymentSuccess = localStorage.getItem('stripe_payment_success');
            if (paymentSuccess) {
              localStorage.removeItem('stripe_payment_success');
              verifyStripePayment(sessionData.checkout_session_id, callbacks);
              callbacks.onSuccess();
            } else {
              callbacks.onCancel();
            }
          }
        }, 1000);
        console.log('✅ Stripe checkout opened in popup');
        return;
      }

      // If we received a session id, open redirect page and verify on success
      // const createdSessionId = sessionData.checkout_session_id || sessionData.sessionId;
      // if (createdSessionId) {
      //   const redirectUrl = `${window.location.origin}/stripe-checkout?sessionId=${createdSessionId}`;
      //   const popup = window.open(redirectUrl, 'stripe-checkout', 'width=500,height=600,scrollbars=yes,resizable=yes');
      //   if (!popup) {
      //     throw new Error('Failed to open popup. Please allow popups for this site.');
      //   }
      //   const checkClosed = setInterval(() => {
      //     if (popup.closed) {
      //       clearInterval(checkClosed);
      //       const paymentSuccess = localStorage.getItem('stripe_payment_success');
      //       if (paymentSuccess) {
      //         localStorage.removeItem('stripe_payment_success');
      //         verifyStripePayment(createdSessionId, callbacks);
      //       } else {
      //         callbacks.onCancel();
      //       }
      //     }
      //   }, 1000);
      //   console.log('✅ Stripe checkout opened in popup');
      //   return;
      // }

      throw new Error('Failed to create Stripe checkout session');
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
