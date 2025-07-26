// Unified Payment Handler - Processes payments for both Stripe and Razorpay
import { getPaymentMode } from './paymentConfig';
import { createOrderWithCurrentMode, CreateOrderResponse } from './unifiedPaymentApi';
import { processStripeCheckout } from './stripeCheckout';

export interface PaymentRequest {
  amount: number;
  currency?: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentMode: 'stripe' | 'razorpay';
  orderId: string;
  storyId?: string;
  error?: string;
}

export const processPayment = async (paymentRequest: PaymentRequest): Promise<PaymentResult> => {
  try {
    const paymentMode = getPaymentMode();
    
    if (paymentMode === 'stripe') {
      // Process Stripe payment
      const result = await processStripeCheckout(
        paymentRequest.amount,
        paymentRequest.currency || 'INR',
        paymentRequest.storyId,
        paymentRequest.guestName,
        paymentRequest.guestEmail,
        paymentRequest.guestPhone
      );

      return {
        success: true,
        paymentMode: 'stripe',
        orderId: result.orderId,
        storyId: result.storyId,
      };
    } else {
      // Process Razorpay payment (existing functionality)
      const orderResponse = await createOrderWithCurrentMode(
        paymentRequest.amount,
        paymentRequest.currency || 'INR',
        paymentRequest.storyId,
        paymentRequest.guestName,
        paymentRequest.guestEmail,
        paymentRequest.guestPhone
      );

      if (orderResponse.payment_mode !== 'razorpay') {
        throw new Error('Expected Razorpay order response but got different payment mode');
      }

      return {
        success: true,
        paymentMode: 'razorpay',
        orderId: orderResponse.razorpay_order_id,
        storyId: orderResponse.story_id,
      };
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      paymentMode: getPaymentMode(),
      orderId: '',
      error: error.message || 'Payment failed',
    };
  }
};

export const getCurrentPaymentMode = (): 'stripe' | 'razorpay' => {
  return getPaymentMode();
}; 