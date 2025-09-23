/**
 * RazorPay Payment Processor - Callback Based
 * 
 * This module provides comprehensive RazorPay payment processing functionality
 * using callbacks instead of dispatchEvent for communication.
 * Also includes checkout utilities previously in razorpayCheckout.ts
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


// Define RazorPay types
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * RazorPay Checkout Utilities
 */
export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
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
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}


// Local validation for Razorpay handler response (moved from paymentDebug)
const validateRazorpayResponse = (response: any): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  if (!response) {
    issues.push("Response is null or undefined");
    return { valid: false, issues };
  }
  if (!response.razorpay_payment_id) {
    issues.push("Missing razorpay_payment_id");
  }
  if (!response.razorpay_order_id) {
    issues.push("Missing razorpay_order_id");
  }
  if (!response.razorpay_signature) {
    issues.push("Missing razorpay_signature");
  }
  return { valid: issues.length === 0, issues };
};


/**
 * Handle the complete RazorPay payment flow - Callback Based
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
          console.log(`💰 [${timestamp}] RazorPay payment response received:`, response);
          
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
        
          // Validate RazorPay response
          const validation = validateRazorpayResponse(response);
          debugger;
          if (!validation.valid) {
            console.error("❌ Invalid RazorPay response:", validation.issues);
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
            console.error("❌ Missing payment ID or signature in response:", response);
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

          console.log("🔍 RazorPay payment verification request:", verificationData);


          // Verify RazorPay payment
          const verificationResult = await verifyPayment(verificationData);



          console.log("📋 RazorPay payment verification response:", verificationResult);
          
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
            

            paymentState.verified = true;
            toast.success("Payment successful! Generating your premium illustrations...");
            
            // Final check before calling onPaymentSuccess
            const shouldProceed = !paymentState.cancelled && !paymentState.failed && !paymentState.dismissed;
            
            if (shouldProceed) {
              console.log("✅ Calling onSuccess - RazorPay payment verified and not cancelled/failed/dismissed");
             
              const result: RazorpayPaymentResult = {
                success: true,
                orderId: orderDetails.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                storyId: orderDetails.story_id
              };
              
              // Use callback instead of dispatchEvent
              callbacks.onSuccess();
              resolve(result);
            } else {
              console.log("⚠️ Skipping onSuccess - payment was cancelled, failed, or modal dismissed");
              callbacks.onError("Payment was cancelled or failed");
              resolve({
                success: false,
                orderId: orderDetails.razorpay_order_id,
                error: "Payment was cancelled or failed"
              });
            }
          } else {
            console.error("❌ RAZORPAY PAYMENT VERIFICATION FAILED - NOT starting image generation:", verificationResult);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              "Payment verification failed",
              response.razorpay_payment_id,
              verificationResult.error_message || "Verification failed"
            );
            
            toast.error("Payment verification failed. Please contact support.");
            callbacks.onError("Payment verification failed");
            resolve({
              success: false,
              orderId: orderDetails.razorpay_order_id,
              error: "Payment verification failed"
            });
          }
        } catch (error) {
          console.error("❌ RazorPay payment verification error:", error);
          await handleFailedPayment(
            orderDetails.razorpay_order_id,
            "Payment verification error",
            undefined,
            error instanceof Error ? error.message : "Unknown error"
          );
          
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
          console.log("❌ RAZORPAY PAYMENT MODAL DISMISSED BY USER");
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
      console.error(`❌ [${timestamp}] RAZORPAY PAYMENT FAILED EVENT:`, response);
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
      console.log(`⚠️ [${timestamp}] RAZORPAY PAYMENT CANCELLED EVENT:`, response);
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




