// Unified Payment Handler - manages both Stripe and Razorpay payments
import { getPaymentMode } from './paymentConfig';
import { CreateOrderResponse } from '../api/paymentApi';
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

  // async createOrder(): Promise<CreateOrderResponse> {
  //   try {
  //     debugger
  //     const response = await createOrderWithCurrentMode(
  //       this.options.amount,
  //       this.options.currency || 'INR',
  //       this.options.storyId,
  //       this.options.guestName,
  //       this.options.guestEmail,
  //       this.options.guestPhone
  //     );

  //     console.log('Order created successfully:', response);
  //     this.options.onSuccess?.(response);
  //     return response;
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
  //     console.error('Error creating order:', error);
  //     this.options.onError?.(errorMessage);
  //     throw error;
  //   }
  // }


  // async initiatePayment(): Promise<void> {
  //   try {
  //     // Step 1: Create order
  //     const orderResponse = await this.createOrder();
      
  //     // Step 2: Process payment based on the order response
  //     await this.processPayment(orderResponse);
  //   } catch (error) {
  //     console.error('Payment initiation failed:', error);
  //     this.options.onError?.(error instanceof Error ? error.message : 'Payment failed');
  //   }
  // }

  getCurrentPaymentMode(): string {
    return getPaymentMode();
  }
}

// // Convenience function for quick payment initiation
// export const initiateUnifiedPayment = async (options: PaymentHandlerOptions): Promise<void> => {
//   const handler = new UnifiedPaymentHandler(options);
//   await handler.initiatePayment();
// }; 
