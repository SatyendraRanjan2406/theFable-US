# Stripe Checkout Implementation

## Overview

This document outlines the changes made to implement proper Stripe Checkout integration that opens in a new tab/popup window.

## Frontend Changes Made

### 1. Updated Payment API Interface
- **File**: `src/utils/paymentApi.ts`
- **Change**: Added `stripe_session_id?: string` to `CreateOrderResponse` interface
- **Purpose**: To receive session ID from backend for Stripe Checkout

### 2. Created Stripe Checkout Utilities
- **File**: `src/utils/stripeCheckout.ts`
- **Features**:
  - `redirectToStripeCheckout()`: Redirects to Stripe Checkout in same window
  - `openStripeCheckoutInNewTab()`: Opens Stripe Checkout in new tab/popup
  - Proper error handling and logging

### 3. Updated Pricing Modal
- **File**: `src/components/PricingModal.tsx`
- **Changes**:
  - Uses new Stripe checkout utilities
  - Tries to open in new tab first, falls back to same window
  - Removed manual URL construction (which was causing the error)

### 4. Created Stripe Checkout Page
- **File**: `src/pages/StripeCheckout.tsx`
- **Purpose**: Handles redirecting to Stripe when opened in new tab
- **Route**: `/stripe-checkout?sessionId=cs_test_...`

## Backend Requirements

### 1. Update Create Order Response
Your `/api/payments/create-order/` endpoint should return:

```json
{
  "payment_mode": "stripe",
  "stripe_order_id": "pi_3Rp2SXDCwVvGhYNW0qTxs6ii",
  "stripe_session_id": "cs_test_...",  // ← ADD THIS FIELD
  "amount": 49.00,
  "currency": "USD",
  "stories_linked": 1,
  "story_id": "your-story-uuid",
  "story_updated": true
}
```

### 2. Create Checkout Session Endpoint
Your `/api/payments/stripe/create-checkout-session` endpoint should:

```python
# Example Python/Django implementation
import stripe
from django.http import JsonResponse

def create_checkout_session(request):
    try:
        data = json.loads(request.body)
        stripe_order_id = data.get('stripe_order_id')
        amount = data.get('amount')
        currency = data.get('currency')
        story_id = data.get('story_id')
        
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {
                        'name': 'Storymaker Premium',
                    },
                    'unit_amount': int(amount * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{request.build_absolute_uri("/")}?success=true&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{request.build_absolute_uri("/")}?canceled=true',
            metadata={
                'stripe_order_id': stripe_order_id,
                'story_id': story_id,
            }
        )
        
        return JsonResponse({
            'sessionId': session.id,
            'success': True
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'success': False
        }, status=400)
```

### 3. Environment Variables
Make sure these are set in your backend:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Frontend Environment Variables

Add to your `.env` file:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
VITE_PAYMENT_MODE=stripe  # or 'razorpay'
```

## How It Works

1. **User clicks "Pay Now"** → `handlePayment()` in PricingModal
2. **Create Order** → Calls `/api/payments/create-order/` with `payment_mode: "stripe"`
3. **Backend Response** → Returns `stripe_session_id: "cs_test_..."`
4. **Frontend** → Calls `openStripeCheckoutInNewTab()` with session ID
5. **New Tab Opens** → `/stripe-checkout?sessionId=cs_test_...`
6. **Stripe Checkout Page** → Loads and redirects to Stripe using `stripe.redirectToCheckout()`
7. **User Completes Payment** → Stripe redirects back to success/cancel URL

## Error Handling

The implementation includes comprehensive error handling:

- **New Tab Blocked**: Falls back to same window
- **Session Creation Failed**: Shows error message
- **Stripe Load Failed**: Shows error with close button
- **Network Errors**: Proper error logging and user feedback

## Testing

1. Set `VITE_PAYMENT_MODE=stripe` in your frontend `.env`
2. Ensure backend returns `stripe_session_id` in create-order response
3. Test payment flow - should open Stripe Checkout in new tab
4. Test fallback - block popups to test same-window redirect

## Troubleshooting

### "Failed to execute 'atob' on 'Window'"
- **Cause**: Trying to construct Stripe Checkout URL manually
- **Fix**: Use `stripe.redirectToCheckout()` with session ID

### "No session ID received"
- **Cause**: Backend not returning `stripe_session_id`
- **Fix**: Update backend to include session ID in response

### "Stripe failed to load"
- **Cause**: Missing or invalid `VITE_STRIPE_PUBLISHABLE_KEY`
- **Fix**: Set correct Stripe publishable key in environment

### "Checkout session creation failed"
- **Cause**: Backend `/api/payments/stripe/create-checkout-session` endpoint not working
- **Fix**: Implement the endpoint as shown above 