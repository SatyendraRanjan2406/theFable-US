/**
 * Payment API utilities
 * 
 * This module handles payment order creation for both authenticated and anonymous users.
 * 
 * @example
 * // For authenticated users
 * const orderData = {
 *   amount: 49.00,
 *   currency: "INR",
 *   description: "Premium features"
 * };
 * const response = await createPaymentOrder(orderData, true);
 * 
 * @example
 * // For anonymous users
 * const orderData = {
 *   amount: 49.00,
 *   currency: "INR",
 *   guest_name: "John Doe",
 *   guest_email: "john.doe@example.com",
 *   guest_phone: "+919876543210"
 * };
 * const response = await createPaymentOrder(orderData, false);
 */

import { apiFetch } from '@/utils/apiInterceptor';
import { API_ENDPOINTS } from '@/config/api';
import { getPaymentMode } from '../common/paymentConfig';

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  payment_mode?: 'stripe' | 'razorpay';
  story_id?: string;
  description?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export interface CreateOrderResponse {
  payment_mode: 'stripe' | 'razorpay';
  stripe_order_id?: string;
  stripe_client_secret?: string;
  stripe_session_id?: string; // Add session ID for Stripe Checkout
  razorpay_order_id?: string;
  prefill?:{
    name: string;
    email: string;
    contact: string;
  };
  amount: number;
  currency: string;
  stories_linked: number;
  story_id?: string;
  story_updated: boolean;
  previous_order_id?: string;
  non_logged_in_user_id?: number;
  razorpay_key_id?: string;
}

export interface PaymentVerificationRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  status: 'success' | 'failed' | 'pending';
  order_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  error_message?: string;
}

export interface UpdateOrderStatusRequest {
  order_id: string;
  status: 'paid' | 'failed' | 'cancelled' | 'pending';
  payment_id?: string;
  error_message?: string;
  failure_reason?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order_id: string;
  updated_status: string;
}

/**
 * Create a payment order for both authenticated and anonymous users
 * For authenticated users: Only amount and currency are required
 * For anonymous users: Guest details (name, email, phone) are also required
 */
export const createPaymentOrder = async (
  orderData: CreateOrderRequest,
  isAuthenticated: boolean = false
): Promise<CreateOrderResponse> => {
  // Get payment mode from environment configuration
  const paymentMode = getPaymentMode();
  
  // Set currency based on payment mode
  const currency = paymentMode === 'stripe' ? 'USD' : 'INR';
  
  // Validate required fields based on authentication status
  if (!isAuthenticated) {
    if (!orderData.guest_name || !orderData.guest_email || !orderData.guest_phone) {
      throw new Error('Guest name, email, and phone are required for anonymous users');
    }
  }

  // Build request body with payment_mode automatically from config
  const requestBody: CreateOrderRequest = {
    amount: orderData.amount,
    currency: currency, // Auto-set based on payment mode: USD for Stripe, INR for Razorpay
    payment_mode: paymentMode, // Automatically picked from VITE_PAYMENT_MODE
  };

  // Add story_id if provided
  if (orderData.story_id) {
    requestBody.story_id = orderData.story_id;
  }

  // Add description if provided
  if (orderData.description) {
    requestBody.description = orderData.description;
  }

  // Add guest details for anonymous users
  if (!isAuthenticated) {
    requestBody.guest_name = orderData.guest_name;
    requestBody.guest_email = orderData.guest_email;
    requestBody.guest_phone = orderData.guest_phone;
  }

  console.log('Creating payment order with mode:', paymentMode);
  console.log('Currency set to:', currency);
  console.log('Request body:', requestBody);
  console.log('Is authenticated:', isAuthenticated);

  try {
    const response = await apiFetch(API_ENDPOINTS.payments.createOrder, {
      method: 'POST',
      body: requestBody,
    });

    if (!response) {
      throw new Error('Failed to retrieve order details.');
    }
    debugger
    console.log('Order created successfully:', response);
    return response;
  } catch (error) {
    console.error('Payment order creation failed:', error);
    throw error;
  }
};

/**
 * Verify a payment with the backend
 * This should be called after the payment is completed to verify the transaction
 * and update the order status in the database
 */
export const verifyPayment = async (
  verificationData: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> => {
  try {
    console.log('🔍 verifyPayment called with:', verificationData);
    console.log('🔍 API_ENDPOINTS.payments.verifyPayment:', API_ENDPOINTS.payments.verifyPayment);
    console.log('🔍 Full API_ENDPOINTS.payments:', API_ENDPOINTS.payments);
    
    const response = await apiFetch(API_ENDPOINTS.payments.verifyPayment, {
      method: 'POST',
      body: verificationData,
    });

    if (!response) {
      throw new Error('Failed to verify payment.');
    }

    return response;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

/**
 * Get payment status from the backend
 * This can be used to check the status of a payment without verification
 */
export const getPaymentStatus = async (
  orderId: string
): Promise<PaymentVerificationResponse> => {
  try {
    const response = await apiFetch(`${API_ENDPOINTS.payments.getPaymentStatus}/${orderId}`, {
      method: 'GET',
    });

    if (!response) {
      throw new Error('Failed to get payment status.');
    }

    return response;
  } catch (error) {
    console.error('Failed to get payment status:', error);
    throw error;
  }
};

/**
 * Update order status in the backend
 * This is used to update the status when payments fail or are cancelled
 */
export const updateOrderStatus = async (
  updateData: UpdateOrderStatusRequest
): Promise<UpdateOrderStatusResponse> => {
  try {
    console.log('🔄 Updating order status:', updateData);
    
    const response = await apiFetch(API_ENDPOINTS.payments.updateOrderStatus, {
      method: 'POST',
      body: updateData,
    });

    if (!response) {
      throw new Error('Failed to update order status.');
    }

    console.log('✅ Order status updated successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to update order status:', error);
    throw error;
  }
};

/**
 * Handle failed payment and update order status
 * This should be called when a payment fails or is cancelled
 */
export const handleFailedPayment = async (
  orderId: string,
  failureReason: string,
  paymentId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    console.log('🔄 Handling failed payment for order:', orderId);
    
    const updateData: UpdateOrderStatusRequest = {
      order_id: orderId,
      status: 'failed',
      payment_id: paymentId,
      error_message: errorMessage,
      failure_reason: failureReason
    };

      await updateOrderStatus(updateData);

      
    console.log('✅ Failed payment status updated successfully');
  } catch (error) {
    console.error('❌ Failed to update failed payment status:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        orderId,
        failureReason,
        paymentId,
        errorMessage
      });
    }
    
    // Try alternative approach - update via verification endpoint with failed status
    try {
      console.log('🔄 Trying alternative status update method...');
      const verificationData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId || '',
        razorpay_signature: '',
        status: 'failed',
        error_message: errorMessage || failureReason
      };
      
      // This might work if the backend handles failed payments differently
      await apiFetch(API_ENDPOINTS.payments.verifyPayment, {
        method: 'POST',
        body: verificationData,
      });
      console.log('✅ Alternative status update successful');
    } catch (altError) {
      console.error('❌ Alternative status update also failed:', altError);
    }
    
    // Don't throw error to prevent breaking the UI flow
  }
};

/**
 * Handle cancelled payment and update order status
 * This should be called when a payment is cancelled by the user
 */
export const handleCancelledPayment = async (
  orderId: string,
  paymentId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    console.log('🔄 Handling cancelled payment for order:', orderId);
    
    const updateData: UpdateOrderStatusRequest = {
      order_id: orderId,
      status: 'cancelled',
      payment_id: paymentId,
      error_message: errorMessage,
      failure_reason: 'Payment cancelled by user'
    };

    await updateOrderStatus(updateData);
    console.log('✅ Cancelled payment status updated successfully');
  } catch (error) {
    console.error('❌ Failed to update cancelled payment status:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        orderId,
        paymentId,
        errorMessage
      });
    }
    
    // Try alternative approach - update via verification endpoint with cancelled status
    try {
      console.log('🔄 Trying alternative status update method for cancelled payment...');
      const verificationData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId || '',
        razorpay_signature: '',
        status: 'cancelled',
        error_message: errorMessage || 'Payment cancelled by user'
      };
      
      // This might work if the backend handles cancelled payments differently
      await apiFetch(API_ENDPOINTS.payments.verifyPayment, {
        method: 'POST',
        body: verificationData,
      });
      console.log('✅ Alternative cancelled status update successful');
    } catch (altError) {
      console.error('❌ Alternative cancelled status update also failed:', altError);
    }
    
    // Don't throw error to prevent breaking the UI flow
  }
}; 

// Helper functions for creating payment orders

export const createLoggedInUserOrder = async (
  amount: number,
  storyId?: string,
  description?: string
): Promise<CreateOrderResponse> => {
  const paymentMode = getPaymentMode();
  const currency = paymentMode === 'stripe' ? 'USD' : 'INR';
  
  return createPaymentOrder(
    {
      amount,
      currency,
      story_id: storyId,
      description: description || 'Storymaker Premium',
    },
    true // isAuthenticated = true
  );
};

export const createGuestUserOrder = async (
  amount: number,
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  storyId?: string,
  description?: string
): Promise<CreateOrderResponse> => {
  const paymentMode = getPaymentMode();
  const currency = paymentMode === 'stripe' ? 'USD' : 'INR';
  
  return createPaymentOrder(
    {
      amount,
      currency,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      story_id: storyId,
      description: description || 'Storymaker Premium',
    },
    false // isAuthenticated = false
  );
};

// Convenience function that automatically detects authentication status
export const createOrder = async (
  amount: number,
  storyId?: string,
  description?: string,
  guestName?: string,
  guestEmail?: string,
  guestPhone?: string
): Promise<CreateOrderResponse> => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (isAuthenticated) {
    return createLoggedInUserOrder(amount, storyId, description);
  } else {
    if (!guestName || !guestEmail || !guestPhone) {
      throw new Error('Guest name, email, and phone are required for non-authenticated users');
    }
    return createGuestUserOrder(amount, guestName, guestEmail, guestPhone, storyId, description);
  }
}; 
