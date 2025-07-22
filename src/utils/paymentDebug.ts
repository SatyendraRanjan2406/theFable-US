/**
 * Payment Debug Utilities
 * 
 * This module provides utilities for debugging payment issues and
 * ensuring proper payment verification flow.
 */

import { getPaymentStatus } from './paymentApi';

export interface PaymentDebugInfo {
  orderId: string;
  paymentId?: string;
  status: 'pending' | 'paid' | 'failed' | 'success' | 'unknown';
  verified: boolean;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Debug payment status and provide detailed information
 */
export const debugPaymentStatus = async (orderId: string): Promise<PaymentDebugInfo> => {
  try {
    console.log('🔍 Debugging payment status for order:', orderId);
    
    const result = await getPaymentStatus(orderId);
    
    const debugInfo: PaymentDebugInfo = {
      orderId,
      paymentId: result.payment_id,
      status: result.status,
      verified: result.verified,
      errorMessage: result.error_message,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Payment debug info:', debugInfo);
    
    if (!result.verified) {
      console.warn('⚠️ Payment verification failed:', result.error_message);
    } else {
      console.log('✅ Payment verified successfully');
    }
    
    return debugInfo;
  } catch (error) {
    console.error('❌ Error debugging payment status:', error);
    
    return {
      orderId,
      status: 'unknown',
      verified: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check if payment verification is working properly
 */
export const checkPaymentVerificationHealth = async (): Promise<{
  healthy: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];
  
  try {
    // Test with a dummy order ID to check if endpoint is accessible
    await getPaymentStatus('test_order_123');
    issues.push('Payment status endpoint should return 404 for non-existent orders');
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log('✅ Payment status endpoint is working correctly');
    } else {
      issues.push(`Payment status endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    healthy: issues.length === 0,
    issues
  };
};

/**
 * Log payment flow for debugging
 */
export const logPaymentFlow = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [${timestamp}] Payment Flow - ${step}:`, data || '');
};

/**
 * Validate payment response from Razorpay
 */
export const validateRazorpayResponse = (response: any): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (!response) {
    issues.push('Response is null or undefined');
    return { valid: false, issues };
  }
  
  if (!response.razorpay_payment_id) {
    issues.push('Missing razorpay_payment_id');
  }
  
  if (!response.razorpay_order_id) {
    issues.push('Missing razorpay_order_id');
  }
  
  if (!response.razorpay_signature) {
    issues.push('Missing razorpay_signature');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Get payment troubleshooting tips based on error
 */
export const getPaymentTroubleshootingTips = (error: string): string[] => {
  const tips: string[] = [];
  
  if (error.includes('signature')) {
    tips.push('Check if Razorpay webhook secret is configured correctly');
    tips.push('Verify that the payment signature is being generated properly');
  }
  
  if (error.includes('404')) {
    tips.push('Order not found in database - check if order was created properly');
    tips.push('Verify the order ID is correct');
  }
  
  if (error.includes('network')) {
    tips.push('Check internet connection');
    tips.push('Verify API endpoint is accessible');
  }
  
  if (error.includes('verification')) {
    tips.push('Payment verification failed - check Razorpay dashboard');
    tips.push('Verify payment was actually captured by Razorpay');
  }
  
  if (error.includes('cancelled') || error.includes('dismissed')) {
    tips.push('Payment was cancelled by user - this is normal behavior');
    tips.push('User can retry payment anytime');
  }
  
  if (error.includes('failed')) {
    tips.push('Payment failed - check if payment method is valid');
    tips.push('Verify sufficient funds are available');
    tips.push('Check if payment method supports the transaction');
  }
  
  if (error.includes('Invalid payment response')) {
    tips.push('Payment response validation failed');
    tips.push('Check if Razorpay integration is working properly');
  }
  
  if (tips.length === 0) {
    tips.push('Check browser console for more detailed error information');
    tips.push('Contact support with the error details');
  }
  
  return tips;
};

/**
 * Create a payment debug report
 */
export const createPaymentDebugReport = async (orderId: string): Promise<string> => {
  const debugInfo = await debugPaymentStatus(orderId);
  const healthCheck = await checkPaymentVerificationHealth();
  
  const report = `
=== Payment Debug Report ===
Timestamp: ${new Date().toISOString()}
Order ID: ${orderId}

Payment Status:
- Status: ${debugInfo.status}
- Verified: ${debugInfo.verified}
- Payment ID: ${debugInfo.paymentId || 'N/A'}
- Error: ${debugInfo.errorMessage || 'None'}

System Health:
- Healthy: ${healthCheck.healthy}
- Issues: ${healthCheck.issues.length > 0 ? healthCheck.issues.join(', ') : 'None'}

Troubleshooting Tips:
${getPaymentTroubleshootingTips(debugInfo.errorMessage || '').map(tip => `- ${tip}`).join('\n')}

=== End Report ===
  `;
  
  console.log(report);
  return report;
}; 