# Payment Module

This module contains all payment-related functionality organized in a clean, modular structure.

## Structure

`
src/utils/Payments/
 api/                    # Payment API utilities
    paymentApi.ts      # Main payment API functions
    index.ts           # API module exports
 common/                 # Common payment utilities
    paymentConfig.ts   # Payment configuration
    paymentHandler.ts  # Basic payment handler
    paymentDebug.ts    # Payment debugging utilities
    unifiedPaymentHandler.ts # Unified payment handler
    index.ts           # Common module exports
 stripe/                 # Stripe-specific utilities
    stripeCheckout.ts  # Stripe checkout functionality
    stripePaymentProcessor.ts # Stripe payment processor
    index.ts           # Stripe module exports
 razorpay/              # Razorpay-specific utilities (future)
 index.ts               # Main module exports
`

## Usage

### Import from main module
`	ypescript
import { 
  createPaymentOrder, 
  verifyPayment, 
  getPaymentMode,
  redirectToStripeCheckout 
} from '@/utils/Payments';
`

### Import from specific modules
`	ypescript
// API functions
import { createPaymentOrder, verifyPayment } from '@/utils/Payments/api';

// Common utilities
import { getPaymentMode, logPaymentFlow } from '@/utils/Payments/common';

// Stripe-specific
import { redirectToStripeCheckout } from '@/utils/Payments/stripe';
`

## Key Features

- **Modular Structure**: Organized by functionality and payment provider
- **Type Safety**: Full TypeScript support with proper type definitions
- **Unified API**: Single import point for all payment functionality
- **Provider Support**: Stripe and Razorpay support
- **Debug Tools**: Built-in payment debugging and troubleshooting utilities
- **Error Handling**: Comprehensive error handling and status management

## Migration

All payment-related imports have been updated to use the new structure:
- @/utils/paymentApi  @/utils/Payments
- @/utils/paymentConfig  @/utils/Payments
- @/utils/stripeCheckout  @/utils/Payments
- etc.

The old files have been removed and all functionality is now available through the new organized structure.
