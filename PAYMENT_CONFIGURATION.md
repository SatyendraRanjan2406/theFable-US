# Payment Configuration

This document explains how to configure payment amounts and currencies via environment variables.

## Environment Variables

Add these variables to your `.env` file to customize payment settings:

```bash
# Payment Configuration
VITE_PAYMENT_AMOUNT=5.00
VITE_PAYMENT_ORIGINAL_PRICE=199.00
VITE_PAYMENT_CURRENCY=INR
```

## Configuration Options

### Payment Amount (`VITE_PAYMENT_AMOUNT`)
- **Type**: Number (decimal)
- **Default**: `5.00`
- **Description**: The actual amount customers will pay
- **Example**: `5.00`, `49.99`, `10.50`

### Original Price (`VITE_PAYMENT_ORIGINAL_PRICE`)
- **Type**: Number (decimal)
- **Default**: `199.00`
- **Description**: The original/crossed-out price shown for comparison
- **Example**: `199.00`, `299.99`, `150.00`

### Payment Currency (`VITE_PAYMENT_CURRENCY`)
- **Type**: String (3-letter currency code)
- **Default**: `INR`
- **Description**: The currency for payments
- **Supported**: `INR`, `USD`, `EUR`, etc.

## Usage in Code

The payment configuration is accessed through centralized helpers:

```typescript
import { 
  getPaymentConfig, 
  getFormattedPaymentAmount, 
  getFormattedOriginalPrice 
} from '@/config/app';

// Get payment configuration object
const paymentConfig = getPaymentConfig();
// Returns: { amount: 5.00, currency: 'INR', description: 'Storymaker Premium' }

// Get formatted payment amount
const formattedAmount = getFormattedPaymentAmount();
// Returns: "₹5.00" (for INR) or "$5.00" (for USD)

// Get formatted original price
const formattedOriginal = getFormattedOriginalPrice();
// Returns: "₹199.00" (for INR) or "$199.00" (for USD)
```

## Example Configurations

### Indian Rupees (INR)
```bash
VITE_PAYMENT_AMOUNT=49.00
VITE_PAYMENT_ORIGINAL_PRICE=199.00
VITE_PAYMENT_CURRENCY=INR
```
**Display**: ₹49.00 ~~₹199.00~~

### US Dollars (USD)
```bash
VITE_PAYMENT_AMOUNT=4.99
VITE_PAYMENT_ORIGINAL_PRICE=19.99
VITE_PAYMENT_CURRENCY=USD
```
**Display**: $4.99 ~~$19.99~~

### Euro (EUR)
```bash
VITE_PAYMENT_AMOUNT=4.50
VITE_PAYMENT_ORIGINAL_PRICE=18.00
VITE_PAYMENT_CURRENCY=EUR
```
**Display**: €4.50 ~~€18.00~~

## Currency Formatting

The system automatically formats amounts based on currency:

| Currency | Symbol | Format Example |
|----------|--------|----------------|
| INR | ₹ | ₹5.00 |
| USD | $ | $5.00 |
| EUR | € | €5.00 |
| Other | None | 5.00 CURRENCY |

## Integration with Payment Gateways

The configured amount is automatically used for:

1. **Razorpay Orders**: Amount sent to Razorpay API
2. **Stripe Payments**: Amount sent to Stripe API
3. **UI Display**: Price shown in pricing modal
4. **Backend API**: Amount sent to payment creation endpoint

## Validation

The configuration includes validation to:
- Ensure amounts are valid numbers
- Provide fallback values if environment variables are missing
- Handle currency formatting automatically
- Prevent negative or zero amounts

## Troubleshooting

### Amount Not Updating
1. Check that environment variables are set correctly
2. Restart the development server after changing `.env`
3. Verify the variable names match exactly

### Currency Not Displaying
1. Ensure `VITE_PAYMENT_CURRENCY` is set to a supported currency
2. Check that the currency code is in uppercase (e.g., `INR`, not `inr`)

### Payment Gateway Errors
1. Verify the amount format matches gateway requirements
2. Check that the currency is supported by your payment gateway
3. Ensure amounts are within acceptable ranges

## Security Considerations

- **Environment Variables**: Keep sensitive payment information in environment variables
- **Validation**: Always validate amounts on both frontend and backend
- **Currency Consistency**: Ensure currency matches between frontend and backend
- **Decimal Precision**: Be aware of currency-specific decimal precision requirements 