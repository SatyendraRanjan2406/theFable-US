# Unified Payment System

This application now supports both Stripe and Razorpay payment methods through a unified API endpoint. The payment mode is configured via environment variables.

## Environment Configuration

### Payment Mode
```bash
# Set to 'stripe' or 'razorpay'
VITE_PAYMENT_MODE=razorpay
```

### Stripe Configuration (when VITE_PAYMENT_MODE=stripe)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

### Razorpay Configuration (when VITE_PAYMENT_MODE=razorpay)
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_here
```

## API Integration

### Create Order Endpoint
**URL**: `POST /api/payments/create-order/`

**Request Body**:
```json
{
    "amount": 100.00,
    "currency": "INR",
    "payment_mode": "stripe",  // or "razorpay"
    "story_id": "uuid-optional",
    "guest_name": "John Doe",  // required for anonymous users
    "guest_email": "john@example.com",  // required for anonymous users
    "guest_phone": "+1234567890"  // optional
}
```

**Response for Stripe**:
```json
{
    "payment_mode": "stripe",
    "stripe_order_id": "pi_1234567890abcdef",
    "stripe_client_secret": "pi_1234567890abcdef_secret_abcdef1234567890",
    "amount": 10000,
    "currency": "inr",
    "stories_linked": 1,
    "story_id": "uuid-here",
    "story_updated": false,
    "previous_order_id": null,
    "non_logged_in_user_id": 123
}
```

**Response for Razorpay**:
```json
{
    "payment_mode": "razorpay",
    "razorpay_order_id": "order_ABC123DEF456",
    "amount": 10000,
    "currency": "inr",
    "stories_linked": 1,
    "story_id": "uuid-here",
    "story_updated": false,
    "previous_order_id": null,
    "non_logged_in_user_id": 123
}
```

## Frontend Usage

### Using the Unified Payment Handler

```typescript
import { initiateUnifiedPayment } from '@/utils/unifiedPaymentHandler';

const handlePayment = async () => {
  const paymentOptions = {
    amount: 100,
    currency: 'INR',
    storyId: 'story-uuid',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    onSuccess: (response) => {
      console.log('Order created:', response);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    },
    onCancel: () => {
      console.log('Payment cancelled');
    },
  };

  await initiateUnifiedPayment(paymentOptions);
};
```

### Using the Payment Handler Class

```typescript
import { UnifiedPaymentHandler } from '@/utils/unifiedPaymentHandler';

const handler = new UnifiedPaymentHandler({
  amount: 100,
  currency: 'INR',
  storyId: 'story-uuid',
  onSuccess: (response) => {
    console.log('Payment successful:', response);
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  },
});

// Create order and process payment
await handler.initiatePayment();
```

## Components

### Payment Configuration
- `src/utils/paymentConfig.ts` - Payment mode configuration
- `src/utils/unifiedPaymentApi.ts` - Unified API for creating orders
- `src/utils/unifiedPaymentHandler.ts` - Payment processing logic
- `src/utils/stripeCheckout.ts` - Stripe-specific checkout handling

### Example Components
- `src/components/UnifiedPaymentExample.tsx` - Example usage

## Features

- ✅ **Environment-Based Configuration**: Easy to switch between payment providers
- ✅ **Unified API**: Single endpoint for both payment methods
- ✅ **Type Safety**: Full TypeScript support
- ✅ **No Breaking Changes**: Existing Razorpay code remains unchanged
- ✅ **Automatic Mode Detection**: Based on environment variables
- ✅ **Error Handling**: Comprehensive error handling for both payment methods

## Payment Flow

1. **Environment Check**: App reads `VITE_PAYMENT_MODE` from environment
2. **Order Creation**: Calls `/api/payments/create-order/` with payment mode
3. **Payment Processing**: 
   - **Stripe**: Redirects to Stripe Checkout or uses Stripe Elements
   - **Razorpay**: Uses existing Razorpay integration
4. **Success/Failure Handling**: Callbacks for payment completion

## Backend Requirements

### For Stripe
- `POST /api/payments/create-order/` - Create order with Stripe payment intent
- `POST /api/payments/stripe/create-checkout-session` - Create Stripe checkout session

### For Razorpay
- Existing Razorpay endpoints remain unchanged
- The unified order endpoint will handle Razorpay order creation

## Migration Guide

### From Existing Razorpay Implementation

1. **Add Environment Variable**:
   ```bash
   VITE_PAYMENT_MODE=razorpay
   ```

2. **Update Payment Calls**:
   ```typescript
   // Old way
   // ... existing Razorpay code ...

   // New way
   import { initiateUnifiedPayment } from '@/utils/unifiedPaymentHandler';
   
   await initiateUnifiedPayment({
     amount: 100,
     storyId: 'story-uuid',
     onSuccess: (response) => {
       // Handle success
     },
     onError: (error) => {
       // Handle error
     },
   });
   ```

3. **Existing Razorpay Code**: Remains unchanged and will continue to work

### To Enable Stripe

1. **Update Environment**:
   ```bash
   VITE_PAYMENT_MODE=stripe
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

2. **No Code Changes Required**: The same payment calls will automatically use Stripe 