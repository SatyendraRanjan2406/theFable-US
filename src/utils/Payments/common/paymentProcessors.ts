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
import { handleStripePayment } from "../stripe/stripe";
import { handleRazorpayPaymentFlow } from "../razorpay/razorpay";

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
 * Main payment processor function that handles both Stripe and RazorPay - Callback Based
 */
type PaymentInput = { amount: number; description: string; currency: string };

export const processPayment = async (
  paymentConfig: PaymentInput,
  options: PaymentProcessorOptions
): Promise<void> => {
  try {

    debugger;
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
    debugger;

    console.log("📋 Order details received:", orderDetails);
    console.log("💳 Payment mode:", orderDetails.payment_mode);

    // Handle payment based on payment mode
    if (orderDetails.payment_mode === "stripe") {
      await handleStripePayment(orderDetails, options.callbacks);
    } else {
      await handleRazorpayPaymentFlow(orderDetails, options.callbacks);
    }

  } catch (error) {
    console.error("❌ Error creating payment order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment order";
    toast.error("Failed to create payment order. Please try again.");
    options.callbacks.onError(errorMessage);
  }
};




