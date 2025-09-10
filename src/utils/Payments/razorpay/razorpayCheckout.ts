/**
 * RazorPay Checkout Utility
 * 
 * This module provides RazorPay checkout functionality similar to Stripe checkout.
 * It handles opening RazorPay payments in popups and managing the checkout flow.
 */

import { toast } from "sonner";
import { 
  processRazorpayPayment,
  RazorpayPaymentRequest,
  RazorpayPaymentCallbacks,
  RazorpayPaymentResult
} from "./razorpayPaymentProcessor";

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

/**
 * Open RazorPay checkout in a popup window
 */
export const openRazorpayCheckoutInPopup = async (options: RazorpayCheckoutOptions): Promise<void> => {
  try {
    console.log(" Opening RazorPay checkout in popup with options:", options);
    
    const callbacks: RazorpayPaymentCallbacks = {
      onSuccess: (result: RazorpayPaymentResult) => {
        console.log(" RazorPay payment completed successfully:", result);
        // Store payment success in localStorage for popup communication
        localStorage.setItem("razorpay_payment_success", JSON.stringify(result));
        // Close popup if it exists
        if (window.opener) {
          window.close();
        }
      },
      onError: (error: string) => {
        console.error(" RazorPay payment failed:", error);
        localStorage.setItem("razorpay_payment_error", error);
        if (window.opener) {
          window.close();
        }
      },
      onCancel: () => {
        console.log(" RazorPay payment cancelled");
        localStorage.setItem("razorpay_payment_cancelled", "true");
        if (window.opener) {
          window.close();
        }
      }
    };

    const paymentRequest: RazorpayPaymentRequest = {
      amount: options.amount,
      currency: options.currency,
      storyId: options.storyId,
      guestName: options.guestName,
      guestEmail: options.guestEmail,
      guestPhone: options.guestPhone,
    };

    await processRazorpayPayment(paymentRequest, callbacks);
    
  } catch (error) {
    console.error(" Error opening RazorPay checkout in popup:", error);
    throw error;
  }
};

/**
 * Redirect to RazorPay Checkout (alternative to popup)
 */
export const redirectToRazorpayCheckout = async (options: RazorpayCheckoutOptions): Promise<void> => {
  try {
    console.log(" Starting RazorPay checkout redirect with options:", options);
    
    const callbacks: RazorpayPaymentCallbacks = {
      onSuccess: (result: RazorpayPaymentResult) => {
        console.log(" RazorPay payment completed successfully:", result);
        // Redirect to success page
        window.location.href = `/payment-success?order_id=${result.orderId}&payment_id=${result.paymentId}`;
      },
      onError: (error: string) => {
        console.error(" RazorPay payment failed:", error);
        // Redirect to error page
        window.location.href = `/payment-error?error=${encodeURIComponent(error)}`;
      },
      onCancel: () => {
        console.log(" RazorPay payment cancelled");
        // Redirect to cancelled page
        window.location.href = "/payment-cancelled";
      }
    };

    const paymentRequest: RazorpayPaymentRequest = {
      amount: options.amount,
      currency: options.currency,
      storyId: options.storyId,
      guestName: options.guestName,
      guestEmail: options.guestEmail,
      guestPhone: options.guestPhone,
    };

    await processRazorpayPayment(paymentRequest, callbacks);
    
  } catch (error) {
    console.error(" Error redirecting to RazorPay checkout:", error);
    throw error;
  }
};

/**
 * Handle RazorPay popup communication
 */
export const handleRazorpayPopupCommunication = (): void => {
  // Check for payment success
  const paymentSuccess = localStorage.getItem("razorpay_payment_success");
  if (paymentSuccess) {
    localStorage.removeItem("razorpay_payment_success");
    const result = JSON.parse(paymentSuccess);
    console.log(" RazorPay payment completed successfully:", result);
    
    // Trigger payment success callback
    window.dispatchEvent(new CustomEvent("razorpay-payment-success", {
      detail: result
    }));
  }

  // Check for payment error
  const paymentError = localStorage.getItem("razorpay_payment_error");
  if (paymentError) {
    localStorage.removeItem("razorpay_payment_error");
    console.error(" RazorPay payment failed:", paymentError);
    
    // Trigger payment error callback
    window.dispatchEvent(new CustomEvent("razorpay-payment-error", {
      detail: { error: paymentError }
    }));
  }

  // Check for payment cancellation
  const paymentCancelled = localStorage.getItem("razorpay_payment_cancelled");
  if (paymentCancelled) {
    localStorage.removeItem("razorpay_payment_cancelled");
    console.log(" RazorPay payment cancelled");
    
    // Trigger payment cancellation callback
    window.dispatchEvent(new CustomEvent("razorpay-payment-cancelled", {
      detail: {}
    }));
  }
};

/**
 * Setup RazorPay popup event listeners
 */
export const setupRazorpayPopupListeners = (): (() => void) => {
  const handlePaymentSuccess = (event: CustomEvent) => {
    console.log(" RazorPay payment success event received:", event.detail);
  };

  const handlePaymentError = (event: CustomEvent) => {
    console.error(" RazorPay payment error event received:", event.detail);
  };

  const handlePaymentCancelled = (event: CustomEvent) => {
    console.log(" RazorPay payment cancelled event received:", event.detail);
  };

  window.addEventListener("razorpay-payment-success", handlePaymentSuccess as EventListener);
  window.addEventListener("razorpay-payment-error", handlePaymentError as EventListener);
  window.addEventListener("razorpay-payment-cancelled", handlePaymentCancelled as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener("razorpay-payment-success", handlePaymentSuccess as EventListener);
    window.removeEventListener("razorpay-payment-error", handlePaymentError as EventListener);
    window.removeEventListener("razorpay-payment-cancelled", handlePaymentCancelled as EventListener);
  };
};
