# Failed Payment Handling & Order Status Updates

## Overview

This document outlines the implementation for properly handling failed payments and updating order status in the backend. The system now includes comprehensive error handling for various payment failure scenarios.

## Frontend Implementation

### 1. Payment API Utilities (`src/utils/paymentApi.ts`)

#### New Functions Added:

```typescript
// Update order status in backend
export const updateOrderStatus = async (
  updateData: UpdateOrderStatusRequest
): Promise<UpdateOrderStatusResponse>

// Handle failed payment and update order status
export const handleFailedPayment = async (
  orderId: string,
  failureReason: string,
  paymentId?: string,
  errorMessage?: string
): Promise<void>
```

#### Interface Definitions:

```typescript
export interface UpdateOrderStatusRequest {
  order_id: string;
  status: 'paid' | 'failed' | 'cancelled' | 'pending';
  payment_id?: string;
  error_message?: string;
  failure_reason?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order_id: string;
  updated_status: string;
}
```

### 2. Pricing Modal Updates (`src/components/PricingModal.tsx`)

#### Enhanced Error Handling:

1. **Invalid Payment Response**: Updates order status when Razorpay response validation fails
2. **Payment Verification Failure**: Updates order status when backend verification fails
3. **Payment Modal Dismissal**: Updates order status when user cancels payment
4. **Payment Failure Events**: Handles Razorpay `payment.failed` and `payment.cancelled` events

#### Event Handlers:

```typescript
// Payment failed event
rzp.on('payment.failed', async function (response: any) {
  await handleFailedPayment(
    orderDetails.razorpay_order_id,
    'Payment failed',
    response.error?.metadata?.payment_id,
    response.error?.description || 'Payment failed'
  );
});

// Payment cancelled event
rzp.on('payment.cancelled', async function (response: any) {
  await handleFailedPayment(
    orderDetails.razorpay_order_id,
    'Payment cancelled',
    response.error?.metadata?.payment_id,
    'Payment was cancelled'
  );
});
```

## Backend API Requirements

### 1. Update Order Status Endpoint

**Endpoint**: `POST /api/payments/update-status/`

**Request Body**:
```json
{
  "order_id": "order_1234567890",
  "status": "failed",
  "payment_id": "pay_1234567890",
  "error_message": "Payment verification failed",
  "failure_reason": "Payment failed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order_id": "order_1234567890",
  "updated_status": "failed"
}
```

### 2. Backend Implementation Example (Django)

```python
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_status(request):
    try:
        order_id = request.data.get('order_id')
        new_status = request.data.get('status')
        payment_id = request.data.get('payment_id')
        error_message = request.data.get('error_message')
        failure_reason = request.data.get('failure_reason')
        
        # Validate required fields
        if not order_id or not new_status:
            return Response({
                'success': False,
                'message': 'Order ID and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the order
        try:
            order = PaymentOrder.objects.get(razorpay_order_id=order_id)
        except PaymentOrder.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update order status
        order.status = new_status
        order.updated_at = timezone.now()
        
        # Add additional information for failed payments
        if new_status == 'failed':
            order.error_message = error_message
            order.failure_reason = failure_reason
            if payment_id:
                order.razorpay_payment_id = payment_id
        
        order.save()
        
        # Log the status update
        print(f"Order {order_id} status updated to {new_status}")
        if failure_reason:
            print(f"Failure reason: {failure_reason}")
        
        return Response({
            'success': True,
            'message': 'Order status updated successfully',
            'order_id': order_id,
            'updated_status': new_status
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error updating order status: {str(e)}")
        return Response({
            'success': False,
            'message': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 3. Database Model Updates

Ensure your PaymentOrder model includes these fields:

```python
# models.py
class PaymentOrder(models.Model):
    razorpay_order_id = models.CharField(max_length=255, unique=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled')
        ],
        default='pending'
    )
    error_message = models.TextField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_orders'
```

## Payment Failure Scenarios Handled

### 1. User Cancels Payment
- **Trigger**: User closes payment modal
- **Action**: Updates order status to 'cancelled'
- **User Feedback**: "Payment was cancelled. You can try again anytime."

### 2. Payment Method Fails
- **Trigger**: Razorpay `payment.failed` event
- **Action**: Updates order status to 'failed'
- **User Feedback**: "Payment failed. Please try again or contact support."

### 3. Payment Verification Fails
- **Trigger**: Backend verification returns failure
- **Action**: Updates order status to 'failed'
- **User Feedback**: "Payment verification failed. Please contact support."

### 4. Invalid Payment Response
- **Trigger**: Razorpay response validation fails
- **Action**: Updates order status to 'failed'
- **User Feedback**: "Invalid payment response. Please try again."

## Testing Failed Payment Scenarios

### 1. Test Payment Cancellation
```javascript
// In browser console, simulate modal dismissal
const rzp = new Razorpay(options);
rzp.on('payment.cancelled', function(response) {
  console.log('Payment cancelled:', response);
});
```

### 2. Test Payment Failure
```javascript
// Use Razorpay test cards that fail
// Card: 4111 1111 1111 1111 (Visa)
// CVV: 123
// Expiry: Any future date
// Result: Payment will fail
```

### 3. Test Invalid Response
```javascript
// Modify the payment handler to simulate invalid response
handler: function(response) {
  // Simulate invalid response
  response.razorpay_signature = 'invalid_signature';
  // This should trigger validation failure
}
```

## Monitoring and Debugging

### 1. Console Logging
All payment events are logged with detailed information:
- Payment creation
- Payment response validation
- Backend verification
- Status updates
- Error messages

### 2. Payment Debug Utilities
Use the debug utilities to troubleshoot payment issues:
```javascript
import { debugPaymentStatus, createPaymentDebugReport } from '@/utils/paymentDebug';

// Debug specific order
const debugInfo = await debugPaymentStatus('order_1234567890');

// Create comprehensive debug report
const report = await createPaymentDebugReport('order_1234567890');
```

### 3. Backend Logging
Ensure your backend logs all payment status updates:
```python
import logging

logger = logging.getLogger(__name__)

# In your update_order_status view
logger.info(f"Order {order_id} status updated to {new_status}")
if failure_reason:
    logger.warning(f"Payment failed for order {order_id}: {failure_reason}")
```

## Security Considerations

### 1. Authentication
- All payment endpoints should require authentication
- Validate user ownership of orders
- Implement rate limiting

### 2. Data Validation
- Validate all input fields
- Sanitize error messages
- Prevent SQL injection

### 3. Error Handling
- Don't expose sensitive information in error messages
- Log errors for debugging
- Return appropriate HTTP status codes

## Troubleshooting Common Issues

### 1. Order Status Not Updating
- Check if the update endpoint is accessible
- Verify authentication is working
- Check backend logs for errors

### 2. Payment Events Not Firing
- Ensure Razorpay script is loaded properly
- Check browser console for JavaScript errors
- Verify event handler registration

### 3. Backend Verification Fails
- Check Razorpay webhook configuration
- Verify signature verification logic
- Ensure proper error handling

## Next Steps

1. **Implement Backend Endpoint**: Create the `/api/payments/update-status/` endpoint
2. **Update Database Schema**: Add required fields to PaymentOrder model
3. **Test Failure Scenarios**: Test all payment failure paths
4. **Monitor Production**: Set up monitoring for payment failures
5. **User Communication**: Implement email notifications for failed payments 