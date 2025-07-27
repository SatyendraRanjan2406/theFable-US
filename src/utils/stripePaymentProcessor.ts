// Stripe Payment Processor - Uses create-order API for guest users
import { loadStripe } from '@stripe/stripe-js';
// import { createOrderWithCurrentMode, StripeOrderResponse } from './unifiedPaymentApi';

// Load Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface StripePaymentRequest {
  amount: number;
  currency?: string;
  storyId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface StripePaymentResult {
  success: boolean;
  orderId: string;
  clientSecret: string;
  storyId?: string;
  error?: string;
}

// export const processStripePayment = async (request: StripePaymentRequest): Promise<StripePaymentResult> => {
//   try {
//     debugger;
//     // Create order using unified API
//     const orderResponse = await createOrderWithCurrentMode(
//       request.amount,
//       request.currency || 'INR',
//       request.storyId,
//       request.guestName,
//       request.guestEmail,
//       request.guestPhone
//     );

//     // Verify it's a Stripe order response
//     if (orderResponse.payment_mode !== 'stripe') {
//       throw new Error('Expected Stripe order response but got different payment mode');
//     }

//     const stripeOrder = orderResponse as StripeOrderResponse;

//     return {
//       success: true,
//       orderId: stripeOrder.stripe_order_id,
//       clientSecret: stripeOrder.stripe_client_secret,
//       storyId: stripeOrder.story_id,
//     };
//   } catch (error: any) {
//     console.error('Stripe payment processing error:', error);
//     return {
//       success: false,
//       orderId: '',
//       clientSecret: '',
//       error: error.message || 'Stripe payment failed',
//     };
//   }
// };



// export const redirectToStripeCheckout = async (request: StripePaymentRequest): Promise<void> => {
//   try {
//     debugger
//     // Create order using unified API
//     const orderResponse = await createOrderWithCurrentMode(
//       request.amount,
//       request.currency || 'INR',
//       request.storyId,
//       request.guestName,
//       request.guestEmail,
//       request.guestPhone
//     );

//     // Verify it's a Stripe order response
//     if (orderResponse.payment_mode !== 'stripe') {
//       throw new Error('Expected Stripe order response but got different payment mode');
//     }

//     const stripeOrder = orderResponse as StripeOrderResponse;

//     // Create checkout session using the order response
//     const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stripe/create-checkout-session`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//       },
//       body: JSON.stringify({
//         stripe_order_id: stripeOrder.stripe_order_id,
//         amount: stripeOrder.amount,
//         currency: stripeOrder.currency,
//         client_secret: stripeOrder.stripe_client_secret,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to create checkout session');
//     }

//     const { sessionUrl } = await response.json();

//     // Redirect to Stripe Checkout
//     if (sessionUrl) {
//       window.location.href = sessionUrl;
//     } else {
//       throw new Error('No checkout session URL received');
//     }
//   } catch (error: any) {
//     console.error('Error redirecting to Stripe checkout:', error);
//     throw error;
//   }
// }; 