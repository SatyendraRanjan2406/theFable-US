// Unified Payment Handler - manages both Stripe and Razorpay payments
import { createOrderWithCurrentMode, CreateOrderResponse, isStripeOrder, isRazorpayOrder } from './unifiedPaymentApi';
import { redirectToStripeCheckout } from './stripeCheckout';
import { getPaymentMode } from './paymentConfig';

export interface PaymentHandlerOptions {
  amount: number;
  currency?: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  onSuccess?: (response: CreateOrderResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export class UnifiedPaymentHandler {
  private options: PaymentHandlerOptions;

  constructor(options: PaymentHandlerOptions) {
    this.options = options;
  }

  async createOrder(): Promise<CreateOrderResponse> {
    try {
      debugger
      const response = await createOrderWithCurrentMode(
        this.options.amount,
        this.options.currency || 'INR',
        this.options.storyId,
        this.options.guestName,
        this.options.guestEmail,
        this.options.guestPhone
      );

      console.log('Order created successfully:', response);
      this.options.onSuccess?.(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      console.error('Error creating order:', error);
      this.options.onError?.(errorMessage);
      throw error;
    }
  }

  async processPayment(orderResponse: CreateOrderResponse): Promise<void> {
    debugger;
    try {
      if (isStripeOrder(orderResponse)) {
        await this.handleStripePayment(orderResponse);
      } else if (isRazorpayOrder(orderResponse)) {
        await this.handleRazorpayPayment(orderResponse);
      } else {
        throw new Error('Unknown payment mode');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      console.error('Error processing payment:', error);
      this.options.onError?.(errorMessage);
      throw error;
    }
  }

  private async handleStripePayment(orderResponse: any): Promise<void> {
    console.log('Processing Stripe payment with order:', orderResponse);
    
    // For Stripe, we can either:
    // 1. Redirect to Stripe Checkout (recommended for most cases)
    // 2. Use Stripe Elements for embedded payment form
    
    // Using redirect to checkout for simplicity
    await redirectToStripeCheckout(orderResponse);
  }

  private async handleRazorpayPayment(orderResponse: any): Promise<void> {
    console.log('Processing Razorpay payment with order:', orderResponse);
    
    // For Razorpay, we use the existing Razorpay integration
    // This should trigger the existing Razorpay payment flow
    // The existing Razorpay code will handle this
    
    // You can emit a custom event or call a callback to trigger existing Razorpay flow
    const event = new CustomEvent('razorpay-payment', {
      detail: {
        orderResponse,
        amount: this.options.amount,
        currency: this.options.currency || 'INR',
      }
    });
    window.dispatchEvent(event);
  }

  async initiatePayment(): Promise<void> {
    try {
      // Step 1: Create order
      const orderResponse = await this.createOrder();
      
      // Step 2: Process payment based on the order response
      await this.processPayment(orderResponse);
    } catch (error) {
      console.error('Payment initiation failed:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Payment failed');
    }
  }

  getCurrentPaymentMode(): string {
    return getPaymentMode();
  }
}

// Convenience function for quick payment initiation
export const initiateUnifiedPayment = async (options: PaymentHandlerOptions): Promise<void> => {
  const handler = new UnifiedPaymentHandler(options);
  await handler.initiatePayment();
}; 