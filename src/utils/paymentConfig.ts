// Payment Configuration Utility
export type PaymentMode = 'stripe' | 'razorpay';

export interface PaymentConfig {
  mode: PaymentMode;
  isStripeEnabled: boolean;
  isRazorpayEnabled: boolean;
}

export const getPaymentMode = (): PaymentMode => {
  const mode = (import.meta.env.VITE_PAYMENT_MODE as PaymentMode) || 'razorpay';
  return mode;
};

export const isStripeEnabled = (): boolean => {
  return getPaymentMode() === 'stripe';
};

export const isRazorpayEnabled = (): boolean => {
  return getPaymentMode() === 'razorpay';
};

export const getPaymentConfig = (): PaymentConfig => {
  const mode = getPaymentMode();
  
  return {
    mode,
    isStripeEnabled: mode === 'stripe',
    isRazorpayEnabled: mode === 'razorpay',
  };
}; 