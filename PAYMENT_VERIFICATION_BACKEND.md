# Payment Verification Backend Implementation

This document outlines the backend implementation required to fix the issue where order status is not updating to "paid" in the database after successful payment.

## Problem Statement

Currently, when a payment is successful on the frontend:
1. ✅ Razorpay payment completes successfully
2. ✅ Frontend receives payment success response
3. ✅ UI updates to show payment success
4. ❌ **Order status in database remains unchanged**
5. ❌ **No payment verification with backend**

## Required Backend Endpoints

### 1. Payment Verification Endpoint

**POST** `/api/payments/verify/`

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_order_id": "order_1234567890", 
  "razorpay_signature": "abc123def456..."
}
```

**Response:**
```json
{
  "verified": true,
  "status": "success",
  "order_id": "order_1234567890",
  "payment_id": "pay_1234567890",
  "amount": 4900,
  "currency": "INR",
  "error_message": null
}
```

### 2. Payment Status Check Endpoint

**GET** `/api/payments/status/{order_id}`

**Response:**
```json
{
  "verified": true,
  "status": "success",
  "order_id": "order_1234567890",
  "payment_id": "pay_1234567890",
  "amount": 4900,
  "currency": "INR"
}
```

## Backend Implementation Steps

### Step 1: Create Payment Verification Function

```python
# payments/views.py or similar

import razorpay
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def verify_payment(request):
    """
    Verify Razorpay payment and update order status
    """
    try:
        # Extract payment data from request
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': 'Missing required payment parameters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize Razorpay client
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        
        # Verify payment signature
        try:
            client.utility.verify_payment_signature({
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_order_id': razorpay_order_id,
                'razorpay_signature': razorpay_signature
            })
        except Exception as e:
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': f'Invalid payment signature: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get payment details from Razorpay
        try:
            payment = client.payment.fetch(razorpay_payment_id)
        except Exception as e:
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': f'Failed to fetch payment details: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check payment status
        if payment['status'] != 'captured':
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': f'Payment not captured. Status: {payment["status"]}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order status in database
        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id)
            order.status = 'paid'
            order.payment_id = razorpay_payment_id
            order.payment_status = 'completed'
            order.paid_at = timezone.now()
            order.save()
            
            # Update related story if exists
            if hasattr(order, 'story'):
                story = order.story
                story.is_paid = True
                story.payment_order_id = order.id
                story.save()
                
                # Update story panels to unlocked status
                story.panels.update(status='unlocked')
            
        except Order.DoesNotExist:
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': 'Order not found in database'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': f'Failed to update order status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Return success response
        return Response({
            'verified': True,
            'status': 'success',
            'order_id': razorpay_order_id,
            'payment_id': razorpay_payment_id,
            'amount': payment['amount'],
            'currency': payment['currency']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'verified': False,
            'status': 'failed',
            'error_message': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### Step 2: Create Payment Status Check Function

```python
@api_view(['GET'])
def get_payment_status(request, order_id):
    """
    Get payment status for an order
    """
    try:
        # Find order in database
        try:
            order = Order.objects.get(razorpay_order_id=order_id)
        except Order.DoesNotExist:
            return Response({
                'verified': False,
                'status': 'failed',
                'error_message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if payment is completed
        if order.status == 'paid' and order.payment_status == 'completed':
            return Response({
                'verified': True,
                'status': 'success',
                'order_id': order.razorpay_order_id,
                'payment_id': order.payment_id,
                'amount': order.amount,
                'currency': order.currency
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'verified': False,
                'status': 'pending',
                'order_id': order.razorpay_order_id,
                'error_message': 'Payment not completed'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'verified': False,
            'status': 'failed',
            'error_message': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### Step 3: Update URL Configuration

```python
# urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Existing endpoints
    path('create-order/', views.create_order, name='create_order'),
    
    # New payment verification endpoints
    path('verify/', views.verify_payment, name='verify_payment'),
    path('status/<str:order_id>/', views.get_payment_status, name='get_payment_status'),
]
```

### Step 4: Update Database Models (if needed)

```python
# models.py

from django.db import models
from django.utils import timezone

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    # Existing fields
    razorpay_order_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # New fields for payment tracking
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Guest user fields
    guest_name = models.CharField(max_length=255, null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)
    guest_phone = models.CharField(max_length=20, null=True, blank=True)
    non_logged_in_user_id = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.razorpay_order_id} - {self.status}"
```

### Step 5: Update Story Model (if needed)

```python
class Story(models.Model):
    # Existing fields
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_paid = models.BooleanField(default=False)
    payment_order_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Add relationship to Order
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    
    # ... other fields
```

## Database Migration

Create a migration to add the new fields:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Environment Variables

Add these to your `.env` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

## Testing

### Test Payment Verification

```bash
curl -X POST http://localhost:8000/api/payments/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_payment_id": "pay_test123",
    "razorpay_order_id": "order_test123",
    "razorpay_signature": "test_signature"
  }'
```

### Test Payment Status

```bash
curl -X GET http://localhost:8000/api/payments/status/order_test123
```

## Security Considerations

1. **Signature Verification**: Always verify Razorpay signatures to prevent fraud
2. **Idempotency**: Ensure payment verification is idempotent (can be called multiple times safely)
3. **Error Handling**: Proper error handling and logging
4. **Rate Limiting**: Implement rate limiting on verification endpoints
5. **Authentication**: Consider adding authentication for status check endpoint

## Monitoring

Add logging for payment verification:

```python
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def verify_payment(request):
    logger.info(f"Payment verification request: {request.data}")
    # ... verification logic
    logger.info(f"Payment verification result: {result}")
```

## Frontend Integration

The frontend is already updated to call these endpoints. The flow is now:

1. User makes payment → Razorpay
2. Payment successful → Frontend receives response
3. Frontend calls `/api/payments/verify/` → Backend verifies with Razorpay
4. Backend updates order status → Database updated
5. Frontend receives verification success → UI updates

## Rollback Plan

If issues occur:

1. **Temporary Fix**: Comment out verification call in frontend
2. **Database Fix**: Manually update order status in database
3. **Monitoring**: Check logs for verification failures

## Success Criteria

- ✅ Payment verification endpoint responds correctly
- ✅ Order status updates to "paid" in database
- ✅ Story `is_paid` field updates to `true`
- ✅ Story panels unlock after payment
- ✅ Frontend receives verification success
- ✅ No duplicate payments or double-charging 