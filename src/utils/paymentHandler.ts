// Unified Payment Handler - Processes payments for both Stripe and Razorpay
import { getPaymentMode } from './paymentConfig';

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

export const getCurrentPaymentMode = (): 'stripe' | 'razorpay' => {
  return getPaymentMode();
}; 