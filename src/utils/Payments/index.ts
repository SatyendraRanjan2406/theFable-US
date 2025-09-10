// Payment Module - Main Export File
// This file provides a centralized export for all payment-related functionality

// API exports
export * from './api/paymentApi';

// Common utilities
export * from './common/paymentConfig';
export * from './common/paymentHandler';
export * from './common/paymentDebug';
export * from './common/unifiedPaymentHandler';
export * from './common/paymentProcessors';

// Stripe-specific exports
export * from './stripe/stripeCheckout';
export * from './stripe/stripePaymentProcessor';

// RazorPay-specific exports
export * from './razorpay/razorpayCheckout';
export * from './razorpay/razorpayPaymentProcessor';

// Re-export commonly used types and functions for convenience
export type { 
  CreateOrderRequest, 
  CreateOrderResponse, 
  PaymentVerificationRequest, 
  PaymentVerificationResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse
} from './api/paymentApi';

export type { 
  PaymentMode, 
  PaymentConfig 
} from './common/paymentConfig';

export type { 
  PaymentRequest, 
  PaymentResult 
} from './common/paymentHandler';

export type { 
  PaymentHandlerOptions 
} from './common/unifiedPaymentHandler';

export type { 
  StripeCheckoutOptions 
} from './stripe/stripeCheckout';

export type { 
  StripePaymentRequest, 
  StripePaymentResult 
} from './stripe/stripePaymentProcessor';

export type { 
  RazorpayCheckoutOptions 
} from './razorpay/razorpayCheckout';

export type { 
  RazorpayPaymentRequest, 
  RazorpayPaymentResult,
  RazorpayPaymentCallbacks
} from './razorpay/razorpayPaymentProcessor';

export type { 
  PaymentDebugInfo 
} from './common/paymentDebug';
