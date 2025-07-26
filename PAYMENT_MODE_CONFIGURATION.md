# Payment Mode Configuration

This application now supports a unified payment system that can handle both Stripe and Razorpay payments through a single API endpoint.

## Environment Configuration

### Payment Mode Setting
```bash
# Set to 'stripe' to use Stripe payments
VITE_PAYMENT_MODE=stripe

# Set to 'razorpay' to use Razorpay payments (default)
VITE_PAYMENT_MODE=razorpay
```

### Required Environment Variables

**For Stripe:**
```bash
VITE_PAYMENT_MODE=stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**For Razorpay:**
```bash
VITE_PAYMENT_MODE=razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id_here
```

## Unified API Usage

### Create Order Endpoint

**Endpoint**: `POST /api/payments/create-order/`

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
    "razorpay_order_id": "order_1234567890abcdef",
    "amount": 10000,
    "currency": "inr",
    "stories_linked": 1,
    "story_id": "uuid-here",
    "story_updated": false,
    "previous_order_id": null,
    "non_logged_in_user_id": 123
}
```

## Frontend Implementation

### Using the Unified Payment API

```typescript
import { createOrderWithCurrentMode } from '@/utils/unifiedPaymentApi';
import { getPaymentMode } from '@/utils/paymentConfig';

// Create order with current payment mode
const orderResponse = await createOrderWithCurrentMode(
  amount,           // number
  'INR',           // currency
  storyId,         // optional story ID
  guestName,       // optional guest name
  guestEmail,      // optional guest email
  guestPhone       // optional guest phone
);

// Handle response based on payment mode
if (orderResponse.payment_mode === 'stripe') {
  // Handle Stripe payment
  const { stripe_client_secret } = orderResponse;
  // Use Stripe Elements or redirect to Stripe Checkout
} else {
  // Handle Razorpay payment
  const { razorpay_order_id } = orderResponse;
  // Use existing Razorpay payment flow
}
```

### Payment Mode Detection

```typescript
import { getPaymentMode, getPaymentConfig } from '@/utils/paymentConfig';

// Get current payment mode
const currentMode = getPaymentMode(); // 'stripe' or 'razorpay'

// Get full payment configuration
const config = getPaymentConfig();
console.log(config.mode);           // 'stripe' or 'razorpay'
console.log(config.isStripeEnabled); // boolean
console.log(config.isRazorpayEnabled); // boolean
```

## Key Features

- ✅ **Unified API**: Single endpoint for both payment providers
- ✅ **Environment-Based**: Easy switching between payment modes
- ✅ **No Breaking Changes**: Existing Razorpay functionality preserved
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Automatic Detection**: Payment mode determined by environment variables

## Migration Guide

### For Existing Razorpay Users

1. **No changes required** - Razorpay continues to work as before
2. **Optional**: Set `VITE_PAYMENT_MODE=razorpay` explicitly

### For New Stripe Users

1. Set environment variables:
   ```bash
   VITE_PAYMENT_MODE=stripe
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

2. Update payment flow to use unified API:
   ```typescript
   // Old way (Razorpay only)
   // const order = await createRazorpayOrder(amount);
   
   // New way (Unified)
   const order = await createOrderWithCurrentMode(amount, 'INR');
   ```

3. Handle response based on payment mode:
   ```typescript
   if (order.payment_mode === 'stripe') {
     // Stripe-specific handling
   } else {
     // Razorpay-specific handling
   }
   ```

## Backend Requirements

The backend needs to implement the unified `/api/payments/create-order/` endpoint that:

1. Accepts the `payment_mode` parameter
2. Creates orders for both Stripe and Razorpay
3. Returns the appropriate response format for each payment mode
4. Handles guest user information
5. Links orders to stories when `story_id` is provided 