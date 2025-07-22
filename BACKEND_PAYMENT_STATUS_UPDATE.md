# Backend Payment Status Update Implementation

## Issue Description

The frontend is correctly calling payment status update functions, but cancelled and failed payments are still showing as "success" in the payment page. This indicates that the backend endpoint `/api/payments/update-status/` is either missing or not working properly.

## Required Backend Implementation

### 1. Create the Update Order Status Endpoint

**File**: `backend/payments/views.py` (or your Django views file)

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import PaymentOrder
from .serializers import PaymentOrderSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_status(request):
    """
    Update payment order status (paid, failed, cancelled, pending)
    """
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
        
        # Validate status values
        valid_statuses = ['paid', 'failed', 'cancelled', 'pending']
        if new_status not in valid_statuses:
            return Response({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
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
        
        # Add additional information for failed/cancelled payments
        if new_status in ['failed', 'cancelled']:
            if error_message:
                order.error_message = error_message
            if failure_reason:
                order.failure_reason = failure_reason
            if payment_id:
                order.razorpay_payment_id = payment_id
        
        # Set paid_at timestamp for successful payments
        if new_status == 'paid':
            order.paid_at = timezone.now()
            if payment_id:
                order.razorpay_payment_id = payment_id
        
        order.save()
        
        # Log the status update
        print(f"Order {order_id} status updated to {new_status}")
        if failure_reason:
            print(f"Failure reason: {failure_reason}")
        if error_message:
            print(f"Error message: {error_message}")
        
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

### 2. Update PaymentOrder Model

**File**: `backend/payments/models.py`

```python
from django.db import models
from django.utils import timezone

class PaymentOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled')
    ]
    
    razorpay_order_id = models.CharField(max_length=255, unique=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    description = models.TextField(blank=True)
    error_message = models.TextField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)
    
    # Guest user fields
    guest_name = models.CharField(max_length=255, null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)
    guest_phone = models.CharField(max_length=20, null=True, blank=True)
    non_logged_in_user_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.razorpay_order_id} - {self.status}"
```

### 3. Add URL Pattern

**File**: `backend/payments/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('create-order/', views.create_order, name='create_order'),
    path('verify/', views.verify_payment, name='verify_payment'),
    path('status/<str:order_id>/', views.get_payment_status, name='get_payment_status'),
    path('history/', views.payment_history, name='payment_history'),
    path('update-status/', views.update_order_status, name='update_order_status'),  # Add this line
]
```

### 4. Update Payment Verification to Handle Failed Status

**File**: `backend/payments/views.py` (update existing verify_payment view)

```python
@api_view(['POST'])
def verify_payment(request):
    """
    Verify payment and handle failed/cancelled status updates
    """
    try:
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        status_override = request.data.get('status')  # For failed/cancelled payments
        
        # If status override is provided (for failed/cancelled payments)
        if status_override in ['failed', 'cancelled']:
            try:
                order = PaymentOrder.objects.get(razorpay_order_id=razorpay_order_id)
                order.status = status_override
                order.updated_at = timezone.now()
                
                if razorpay_payment_id:
                    order.razorpay_payment_id = razorpay_payment_id
                
                error_message = request.data.get('error_message')
                if error_message:
                    order.error_message = error_message
                
                order.save()
                
                return Response({
                    'verified': False,
                    'status': status_override,
                    'order_id': razorpay_order_id,
                    'payment_id': razorpay_payment_id,
                    'error_message': error_message
                })
            except PaymentOrder.DoesNotExist:
                return Response({
                    'verified': False,
                    'status': 'failed',
                    'error_message': 'Order not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Normal payment verification logic (existing code)
        # ... your existing verification logic here
        
    except Exception as e:
        print(f"Payment verification error: {str(e)}")
        return Response({
            'verified': False,
            'status': 'failed',
            'error_message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 5. Create Database Migration

```bash
python manage.py makemigrations payments
python manage.py migrate
```

### 6. Test the Endpoint

Test the endpoint with curl:

```bash
# Test failed payment
curl -X POST http://localhost:8000/api/payments/update-status/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order_id": "order_1234567890",
    "status": "failed",
    "payment_id": "pay_1234567890",
    "error_message": "Payment verification failed",
    "failure_reason": "Payment failed"
  }'

# Test cancelled payment
curl -X POST http://localhost:8000/api/payments/update-status/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order_id": "order_1234567890",
    "status": "cancelled",
    "error_message": "Payment cancelled by user",
    "failure_reason": "Payment cancelled by user"
  }'
```

## Frontend Debugging

### 1. Check Browser Console

Look for these log messages:
- `🔄 Handling failed payment for order: order_1234567890`
- `✅ Failed payment status updated successfully`
- `❌ Failed to update failed payment status: [error details]`

### 2. Network Tab

Check the Network tab in browser dev tools for:
- Failed requests to `/api/payments/update-status/`
- 404 errors (endpoint not found)
- 500 errors (server errors)

### 3. Test Payment Scenarios

1. **Cancel Payment**: Close payment modal → Check console logs
2. **Failed Payment**: Use test card that fails → Check console logs
3. **Verification Failure**: Modify signature to be invalid → Check console logs

## Alternative Solutions

If the backend endpoint cannot be implemented immediately:

### 1. Use Existing Verification Endpoint

The frontend already tries to use the verification endpoint as a fallback. Ensure your verification endpoint can handle failed/cancelled status updates.

### 2. Manual Database Update

For immediate testing, manually update the database:

```sql
UPDATE payment_orders 
SET status = 'failed', 
    error_message = 'Payment failed', 
    failure_reason = 'Payment failed',
    updated_at = NOW()
WHERE razorpay_order_id = 'order_1234567890';
```

### 3. Webhook Integration

Implement Razorpay webhooks to automatically update payment status:

```python
@api_view(['POST'])
def razorpay_webhook(request):
    # Handle Razorpay webhook events
    # Update payment status based on webhook data
    pass
```

## Monitoring and Logging

Add comprehensive logging to track payment status updates:

```python
import logging

logger = logging.getLogger(__name__)

# In your update_order_status view
logger.info(f"Order {order_id} status updated to {new_status}")
if failure_reason:
    logger.warning(f"Payment failed for order {order_id}: {failure_reason}")
```

## Next Steps

1. **Implement the backend endpoint** `/api/payments/update-status/`
2. **Test with real payment scenarios**
3. **Monitor logs for any errors**
4. **Verify payment history shows correct status**
5. **Implement webhook handling for real-time updates** 