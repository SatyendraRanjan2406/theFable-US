/**
 * Comprehensive Payment Processors - Callback Based
 * 
 * This module provides a clean callback-based payment processing system
 * that eliminates the need for dispatchEvent and event listeners.
 */

import { toast } from "sonner";
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleFailedPayment, 
  handleCancelledPayment,
  CreateOrderRequest, 
  CreateOrderResponse,
  PaymentVerificationRequest 
} from "../api/paymentApi";
import { 
  logPaymentFlow, 
  validateRazorpayResponse, 
  getPaymentTroubleshootingTips 
} from "./paymentDebug";
import { PaymentConfig } from "./paymentConfig";

// Declare Razorpay types and global
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

declare const Razorpay: new (options: RazorpayOptions) => RazorpayInstance;

// Payment processor interfaces
export interface PaymentProcessorCallbacks {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentProcessorOptions {
  storyId?: string;
  isAuthenticated: boolean;
  guestDetails?: GuestDetails;
  callbacks: PaymentProcessorCallbacks;
}

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
    await updatePaymentStatus(verificationResult.order_id || sessionId, "completed");

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
 * Update payment status in database
 */
export const updatePaymentStatus = async (orderId: string, status: string): Promise<void> => {
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
 * Process phone number for Indian mobile numbers
 */
export const processPhoneNumber = (phone: string): string => {
  let phoneNumber = phone.trim();
  
  // Remove any existing +91 prefix to avoid duplication
  if (phoneNumber.startsWith("+91")) {
    phoneNumber = phoneNumber.substring(3);
  }
  
  // Remove any leading zeros
  phoneNumber = phoneNumber.replace(/^0+/, "");
  
  // Validate that its a 10-digit Indian mobile number
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }
  
  // Add +91 prefix
  return "+91" + phoneNumber;
};

/**
 * Validate guest details
 */
export const validateGuestDetails = (guestDetails: GuestDetails): string | null => {
  if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
    return "Please fill in all guest details to proceed with payment.";
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(guestDetails.email)) {
    return "Please enter a valid email address.";
  }
  
  return null; // No validation errors
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
    
    // Create a simple popup window for Stripe checkout
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
          verifyStripePayment(orderDetails.stripe_session_id, callbacks);
        } else {
          // Payment was cancelled or failed
          callbacks.onCancel();
        }
      }
    }, 1000);
    
    console.log("✅ Stripe checkout opened in popup");
  } catch (error) {
    console.error("❌ Stripe payment error:", error);
    await handleFailedPayment(
      orderDetails.stripe_order_id || "unknown",
      "Stripe payment failed",
      undefined,
      error instanceof Error ? error.message : "Unknown error"
    );
    callbacks.onError(error instanceof Error ? error.message : "Stripe payment failed");
    toast.error("Stripe payment failed. Please try again.");
  }
};

/**
 * Handle Razorpay payment processing - Callback Based
 */
export const handleRazorpayPayment = async (
  orderDetails: CreateOrderResponse,
  options: PaymentProcessorOptions
): Promise<void> => {
  return new Promise((resolve) => {
    // Payment state tracking
    const paymentState = {
      cancelled: false,
      failed: false,
      dismissed: false,
      verified: false
    };

    const razorpayOptions: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      name: "Character Canvas Tales",
      description: "Unlock Premium Features",
      order_id: orderDetails.razorpay_order_id,
      handler: async function (response: RazorpayResponse) {
        try {
          const timestamp = new Date().toISOString();
          logPaymentFlow("Payment response received", response);
          console.log(`💰 [${timestamp}] Razorpay payment response received:`, response);
          
          // Add a small delay to allow cancellation/failure events to be processed first
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if payment was cancelled, failed, or modal was dismissed before proceeding
          if (paymentState.cancelled || paymentState.failed || paymentState.dismissed) {
            console.log("⚠️ Payment was cancelled, failed, or dismissed, skipping verification");
            return;
          }
          
          // Check if payment was already verified
          if (paymentState.verified) {
            console.log("⚠️ Payment already verified, skipping duplicate verification");
            return;
          }
          
          // Validate Razorpay response
          const validation = validateRazorpayResponse(response);
          if (!validation.valid) {
            console.error("❌ Invalid Razorpay response:", validation.issues);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Invalid payment response",
              undefined,
              `Validation failed: ${validation.issues.join(", ")}`
            );
            toast.error("Invalid payment response. Please try again.");
            options.callbacks.onError("Invalid payment response");
            return;
          }
          
          // Additional validation: Check if this looks like a real successful payment
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            console.error("❌ Missing payment ID or signature in response:", response);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Incomplete payment response",
              response.razorpay_payment_id,
              "Missing payment ID or signature"
            );
            toast.error("Incomplete payment response. Please try again.");
            options.callbacks.onError("Incomplete payment response");
            return;
          }
          
          // Verify the payment with the backend
          const verificationData: PaymentVerificationRequest = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };

          logPaymentFlow("Verifying payment with backend", verificationData);
          console.log("🔍 Payment verification request:", verificationData);

          // Verify razorpay payment
          const verificationResult = await verifyPayment(verificationData);
          console.log("📋 Payment verification response:", verificationResult);
          
          if (verificationResult.verified && verificationResult.status === "success") {
            // Prevent multiple payment success calls
            if (paymentState.verified) {
              console.log("⚠️ Payment already verified, skipping duplicate success call");
              return;
            }
            
            // Double-check cancellation/failure state before proceeding
            if (paymentState.cancelled || paymentState.failed || paymentState.dismissed) {
              console.log("⚠️ Payment was cancelled, failed, or dismissed after verification, skipping success handler");
              return;
            }
            
            console.log("✅ Payment verified successfully", verificationResult);
            logPaymentFlow("Payment verified successfully", verificationResult);
            console.log("🎉 PAYMENT SUCCESS - Starting image generation...");

            paymentState.verified = true;
            toast.success("Payment successful! Generating your premium illustrations...");
            
            // Final check before calling onPaymentSuccess
            const shouldProceed = !paymentState.cancelled && !paymentState.failed && !paymentState.dismissed;
            
            if (shouldProceed) {
              console.log("✅ Calling onPaymentSuccess - payment verified and not cancelled/failed/dismissed");
              
              // Use callback instead of dispatchEvent
              options.callbacks.onSuccess();
              resolve();
            } else {
              console.log("⚠️ Skipping onPaymentSuccess - payment was cancelled, failed, or modal dismissed");
              options.callbacks.onError("Payment was cancelled or failed");
              resolve();
            }
          } else {
            console.error("❌ PAYMENT VERIFICATION FAILED - NOT starting image generation:", verificationResult);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Payment verification failed",
              response.razorpay_payment_id,
              verificationResult.error_message || "Verification failed"
            );
            
            const tips = getPaymentTroubleshootingTips(verificationResult.error_message || "");
            console.error("💡 Troubleshooting tips:", tips);
            toast.error("Payment verification failed. Please contact support.");
            options.callbacks.onError("Payment verification failed");
            resolve();
          }
        } catch (error) {
          console.error("❌ Payment verification error:", error);
          await handleFailedPayment(
            orderDetails.razorpay_order_id,
            "Payment verification error",
            undefined,
            error instanceof Error ? error.message : "Unknown error"
          );
          
          const tips = getPaymentTroubleshootingTips(error instanceof Error ? error.message : "");
          console.error("💡 Troubleshooting tips:", tips);
          toast.error("Payment verification failed. Please contact support.");
          options.callbacks.onError(error instanceof Error ? error.message : "Payment verification error");
          resolve();
        }
      },
      modal: {
        ondismiss: async function() {
          console.log("❌ PAYMENT MODAL DISMISSED BY USER");
          paymentState.dismissed = true;
          paymentState.cancelled = true;
          await handleCancelledPayment(
            orderDetails.razorpay_order_id,
            undefined,
            "User closed payment modal"
          );
          toast.info("Payment was cancelled. You can try again anytime.");
          options.callbacks.onCancel();
          resolve();
        }
      },
      prefill: {
        name: options.isAuthenticated ? "User" : (options.guestDetails?.name || ""),
        email: options.isAuthenticated ? "user@example.com" : (options.guestDetails?.email || ""),
        contact: options.isAuthenticated ? "+919999999999" : (options.guestDetails?.phone || ""),
      },
      notes: {
        address: "Character Canvas Tales Corporate Office"
      },
      theme: {
        color: "#6B21A8"
      }
    };

    const rzp = new Razorpay(razorpayOptions);
    
    // Add error handling for payment failures
    rzp.on("payment.failed", async function (response: any) {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] PAYMENT FAILED EVENT:`, response);
      paymentState.cancelled = true;
      paymentState.failed = true;
      paymentState.dismissed = true;
      await handleFailedPayment(
        orderDetails.razorpay_order_id,
        "Payment failed",
        response.error?.metadata?.payment_id,
        response.error?.description || "Payment failed"
      );
      toast.error("Payment failed. Please try again or contact support.");
      options.callbacks.onError("Payment failed");
      resolve();
    });

    rzp.on("payment.cancelled", async function (response: any) {
      const timestamp = new Date().toISOString();
      console.log(`⚠️ [${timestamp}] PAYMENT CANCELLED EVENT:`, response);
      paymentState.cancelled = true;
      paymentState.dismissed = true;
      await handleCancelledPayment(
        orderDetails.razorpay_order_id,
        response.error?.metadata?.payment_id,
        "Payment was cancelled"
      );
      toast.info("Payment was cancelled. You can try again anytime.");
      options.callbacks.onCancel();
      resolve();
    });

    rzp.open();
  });
};

/**
 * Main payment processor function that handles both Stripe and RazorPay - Callback Based
 */
export const processPayment = async (
  paymentConfig: PaymentConfig & { amount: number; description: string; currency: string },
  options: PaymentProcessorOptions
): Promise<void> => {
  try {
    console.log("🚀 Starting payment process with config:", paymentConfig);
    console.log("📋 Payment options:", options);

    // Validate guest details for anonymous users
    if (!options.isAuthenticated && options.guestDetails) {
      const validationError = validateGuestDetails(options.guestDetails);
      if (validationError) {
        toast.error(validationError);
        options.callbacks.onError(validationError);
        return;
      }
      
      // Process phone number
      try {
        options.guestDetails.phone = processPhoneNumber(options.guestDetails.phone);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid phone number";
        toast.error(errorMessage);
        options.callbacks.onError(errorMessage);
        return;
      }
    }

    const orderRequest: CreateOrderRequest = {
      amount: paymentConfig.amount,
      description: paymentConfig.description,
      currency: paymentConfig.currency,
    };
    
    // Add story_id if available
    if (options.storyId) {
      orderRequest.story_id = options.storyId;
    }

    // Add guest details for anonymous users
    if (!options.isAuthenticated && options.guestDetails) {
      orderRequest.guest_name = options.guestDetails.name;
      orderRequest.guest_email = options.guestDetails.email;
      orderRequest.guest_phone = options.guestDetails.phone;
    }

    const orderDetails = await createPaymentOrder(orderRequest, options.isAuthenticated);

    console.log("📋 Order details received:", orderDetails);
    console.log("💳 Payment mode:", orderDetails.payment_mode);

    // Handle payment based on payment mode
    if (orderDetails.payment_mode === "stripe") {
      console.log("💳 Processing Stripe payment...", orderDetails);
      await handleStripePayment(orderDetails, options.callbacks);
    } else {
      console.log("💰 Processing Razorpay payment...", orderDetails);
      await handleRazorpayPayment(orderDetails, options);
    }

  } catch (error) {
    console.error("❌ Error creating payment order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment order";
    toast.error("Failed to create payment order. Please try again.");
    options.callbacks.onError(errorMessage);
  }
};
