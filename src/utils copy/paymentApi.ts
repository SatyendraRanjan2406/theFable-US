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

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  // Guest user fields (required for anonymous users)
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  // Optional fields
  description?: string;
  story_id?: string; // Story ID for linking payment to specific story
}

export interface CreateOrderResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  // For guest users, this field will be included in the response
  non_logged_in_user_id?: string;
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
  // Validate required fields based on authentication status
  if (!isAuthenticated) {
    if (!orderData.guest_name || !orderData.guest_email || !orderData.guest_phone) {
      throw new Error('Guest name, email, and phone are required for anonymous users');
    }
  }
  debugger;
  const requestBody: CreateOrderRequest = {
    amount: orderData.amount,
    currency: orderData.currency,
  };

  // Add guest details for anonymous users
  if (!isAuthenticated) {
    requestBody.guest_name = orderData.guest_name;
    requestBody.guest_email = orderData.guest_email;
    requestBody.guest_phone = orderData.guest_phone;
  }

  // Add optional description if provided
  if (orderData.description) {
    requestBody.description = orderData.description;
  }

  // Add story_id if provided
  if (orderData.story_id) {
    requestBody.story_id = orderData.story_id;
  }

  try {
    const response = await apiFetch(API_ENDPOINTS.payments.createOrder, {
      method: 'POST',
      body: requestBody,
    });

    if (!response) {
      throw new Error('Failed to retrieve order details.');
    }

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