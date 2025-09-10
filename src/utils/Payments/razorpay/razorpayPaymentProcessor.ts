/**
 * RazorPay Payment Processor
 * 
 * This module provides comprehensive RazorPay payment processing functionality
 * similar to the Stripe implementation. It handles order creation, payment
 * processing, verification, and error handling for RazorPay payments.
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
} from "../common/paymentDebug";

// Define RazorPay types
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

// RazorPay payment request interface
export interface RazorpayPaymentRequest {
  amount: number;
  currency?: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

// RazorPay payment result interface
export interface RazorpayPaymentResult {
  success: boolean;
  orderId: string;
  paymentId?: string;
  storyId?: string;
  error?: string;
}

// RazorPay payment processor callbacks
export interface RazorpayPaymentCallbacks {
  onSuccess: (result: RazorpayPaymentResult) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

/**
 * Process RazorPay payment with comprehensive error handling
 */
export const processRazorpayPayment = async (
  request: RazorpayPaymentRequest,
  callbacks: RazorpayPaymentCallbacks
): Promise<RazorpayPaymentResult> => {
  try {
    console.log(" Processing RazorPay payment request:", request);
    
    // Create payment order
    const orderRequest: CreateOrderRequest = {
      amount: request.amount,
      currency: request.currency || "INR",
      story_id: request.storyId,
      description: "Storymaker Premium",
    };

    // Add guest details if provided
    if (request.guestName && request.guestEmail && request.guestPhone) {
      orderRequest.guest_name = request.guestName;
      orderRequest.guest_email = request.guestEmail;
      orderRequest.guest_phone = request.guestPhone;
    }

    const orderDetails = await createPaymentOrder(orderRequest, !request.guestName);
    
    console.log(" RazorPay order details received:", orderDetails);

    // Verify it's a RazorPay order response
    if (orderDetails.payment_mode !== "razorpay") {
      throw new Error("Expected RazorPay order response but got different payment mode");
    }

    // Process the RazorPay payment
    const result = await handleRazorpayPaymentFlow(orderDetails, callbacks);
    
    return result;
  } catch (error: any) {
    console.error(" RazorPay payment processing error:", error);
    const errorMessage = error.message || "RazorPay payment failed";
    callbacks.onError(errorMessage);
    
    return {
      success: false,
      orderId: "",
      error: errorMessage,
    };
  }
};

/**
 * Handle the complete RazorPay payment flow
 */
export const handleRazorpayPaymentFlow = async (
  orderDetails: CreateOrderResponse,
  callbacks: RazorpayPaymentCallbacks
): Promise<RazorpayPaymentResult> => {
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
          logPaymentFlow("RazorPay payment response received", response);
          console.log(` [${timestamp}] RazorPay payment response received:`, response);
          
          // Add a small delay to allow cancellation/failure events to be processed first
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if payment was cancelled, failed, or modal was dismissed before proceeding
          if (paymentState.cancelled || paymentState.failed || paymentState.dismissed) {
            console.log(" Payment was cancelled, failed, or dismissed, skipping verification");
            return;
          }
          
          // Check if payment was already verified
          if (paymentState.verified) {
            console.log(" Payment already verified, skipping duplicate verification");
            return;
          }
          
          // Validate RazorPay response
          const validation = validateRazorpayResponse(response);
          if (!validation.valid) {
            console.error(" Invalid RazorPay response:", validation.issues);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Invalid payment response",
              undefined,
              `Validation failed: ${validation.issues.join(", ")}`
            );
            toast.error("Invalid payment response. Please try again.");
            callbacks.onError("Invalid payment response");
            resolve({
              success: false,
              orderId: orderDetails.razorpay_order_id,
              error: "Invalid payment response"
            });
            return;
          }
          
          // Additional validation: Check if this looks like a real successful payment
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            console.error(" Missing payment ID or signature in response:", response);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Incomplete payment response",
              response.razorpay_payment_id,
              "Missing payment ID or signature"
            );
            toast.error("Incomplete payment response. Please try again.");
            callbacks.onError("Incomplete payment response");
            resolve({
              success: false,
              orderId: orderDetails.razorpay_order_id,
              error: "Incomplete payment response"
            });
            return;
          }
          
          // Verify the payment with the backend
          const verificationData: PaymentVerificationRequest = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };

          logPaymentFlow("Verifying RazorPay payment with backend", verificationData);
          console.log(" RazorPay payment verification request:", verificationData);

          // Verify RazorPay payment
          const verificationResult = await verifyPayment(verificationData);

          console.log(" RazorPay payment verification response:", verificationResult);
          
          if (verificationResult.verified && verificationResult.status === "success") {
            // Prevent multiple payment success calls
            if (paymentState.verified) {
              console.log(" Payment already verified, skipping duplicate success call");
              return;
            }
            
            // Double-check cancellation/failure state before proceeding
            if (paymentState.cancelled || paymentState.failed || paymentState.dismissed) {
              console.log(" Payment was cancelled, failed, or dismissed after verification, skipping success handler");
              return;
            }
            
            console.log(" RazorPay payment verified successfully", verificationResult);
            logPaymentFlow("RazorPay payment verified successfully", verificationResult);
            console.log(" RAZORPAY PAYMENT SUCCESS - Starting image generation...");

            paymentState.verified = true;
            toast.success("Payment successful! Generating your premium illustrations...");
            
            // Final check before calling onPaymentSuccess
            const shouldProceed = !paymentState.cancelled && !paymentState.failed && !paymentState.dismissed;
            
            if (shouldProceed) {
              console.log(" Calling onSuccess - RazorPay payment verified and not cancelled/failed/dismissed");
             
              const result: RazorpayPaymentResult = {
                success: true,
                orderId: orderDetails.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                storyId: orderDetails.story_id
              };
              
              callbacks.onSuccess(result);
              
              // Dispatch custom payment success event
              window.dispatchEvent(new CustomEvent("razorpay-payment-success", {
                detail: { 
                  orderId: orderDetails.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  result
                }
              }));
              
              resolve(result);
            } else {
              console.log(" Skipping onSuccess - payment was cancelled, failed, or modal dismissed");
              callbacks.onError("Payment was cancelled or failed");
              resolve({
                success: false,
                orderId: orderDetails.razorpay_order_id,
                error: "Payment was cancelled or failed"
              });
            }
          } else {
            console.error(" RAZORPAY PAYMENT VERIFICATION FAILED - NOT starting image generation:", verificationResult);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Payment verification failed",
              response.razorpay_payment_id,
              verificationResult.error_message || "Verification failed"
            );
            
            const tips = getPaymentTroubleshootingTips(verificationResult.error_message || "");
            console.error("Troubleshooting tips:", tips);
            toast.error("Payment verification failed. Please contact support.");
            callbacks.onError("Payment verification failed");
            resolve({
              success: false,
              orderId: orderDetails.razorpay_order_id,
              error: "Payment verification failed"
            });
          }
        } catch (error) {
          console.error("RazorPay payment verification error:", error);
          await handleFailedPayment(
            orderDetails.razorpay_order_id,
            "Payment verification error",
            undefined,
            error instanceof Error ? error.message : "Unknown error"
          );
          
          const tips = getPaymentTroubleshootingTips(error instanceof Error ? error.message : "");
          console.error("Troubleshooting tips:", tips);
          toast.error("Payment verification failed. Please contact support.");
          callbacks.onError(error instanceof Error ? error.message : "Payment verification error");
          resolve({
            success: false,
            orderId: orderDetails.razorpay_order_id,
            error: error instanceof Error ? error.message : "Payment verification error"
          });
        }
      },
      modal: {
        ondismiss: async function() {
          console.log(" RAZORPAY PAYMENT MODAL DISMISSED BY USER");
          paymentState.dismissed = true;
          paymentState.cancelled = true;
          await handleCancelledPayment(
            orderDetails.razorpay_order_id,
            undefined,
            "User closed RazorPay payment modal"
          );
          toast.info("Payment was cancelled. You can try again anytime.");
          callbacks.onCancel();
          resolve({
            success: false,
            orderId: orderDetails.razorpay_order_id,
            error: "Payment cancelled by user"
          });
        }
      },
      prefill: {
        name: "User",
        email: "user@example.com",
        contact: "+919999999999",
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
      console.error(` [${timestamp}] RAZORPAY PAYMENT FAILED EVENT:`, response);
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
      callbacks.onError("Payment failed");
      resolve({
        success: false,
        orderId: orderDetails.razorpay_order_id,
        error: "Payment failed"
      });
    });

    rzp.on("payment.cancelled", async function (response: any) {
      const timestamp = new Date().toISOString();
      console.log(` [${timestamp}] RAZORPAY PAYMENT CANCELLED EVENT:`, response);
      paymentState.cancelled = true;
      paymentState.dismissed = true;
      await handleCancelledPayment(
        orderDetails.razorpay_order_id,
        response.error?.metadata?.payment_id,
        "Payment was cancelled"
      );
      toast.info("Payment was cancelled. You can try again anytime.");
      callbacks.onCancel();
      resolve({
        success: false,
        orderId: orderDetails.razorpay_order_id,
        error: "Payment cancelled by user"
      });
    });

    rzp.open();
  });
};

/**
 * Setup RazorPay payment success event listener
 */
export const setupRazorpayPaymentListener = (
  callbacks: RazorpayPaymentCallbacks
): (() => void) => {
  const handleRazorpayPaymentSuccess = (event: CustomEvent) => {
    console.log(" RazorPay payment success event received:", event.detail);
    const { result } = event.detail;
    callbacks.onSuccess(result);
  };

  window.addEventListener("razorpay-payment-success", handleRazorpayPaymentSuccess as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener("razorpay-payment-success", handleRazorpayPaymentSuccess as EventListener);
  };
};

/**
 * Create RazorPay order for authenticated users
 */
export const createRazorpayOrder = async (
  amount: number,
  storyId?: string,
  description?: string
): Promise<RazorpayPaymentResult> => {
  const callbacks: RazorpayPaymentCallbacks = {
    onSuccess: (result) => console.log("RazorPay order created successfully:", result),
    onError: (error) => console.error("RazorPay order creation failed:", error),
    onCancel: () => console.log("RazorPay order creation cancelled")
  };

  return processRazorpayPayment(
    {
      amount,
      currency: "INR",
      storyId,
    },
    callbacks
  );
};

/**
 * Create RazorPay order for guest users
 */
export const createRazorpayGuestOrder = async (
  amount: number,
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  storyId?: string,
  description?: string
): Promise<RazorpayPaymentResult> => {
  const callbacks: RazorpayPaymentCallbacks = {
    onSuccess: (result) => console.log("RazorPay guest order created successfully:", result),
    onError: (error) => console.error("RazorPay guest order creation failed:", error),
    onCancel: () => console.log("RazorPay guest order creation cancelled")
  };

  return processRazorpayPayment(
    {
      amount,
      currency: "INR",
      storyId,
      guestName,
      guestEmail,
      guestPhone,
    },
    callbacks
  );
};
