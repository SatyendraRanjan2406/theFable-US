import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { createPaymentOrder, verifyPayment, handleFailedPayment, handleCancelledPayment, CreateOrderRequest, PaymentVerificationRequest } from '@/utils/paymentApi';

import { useAuth } from '@/hooks/useAuth';
import LoginModal from './LoginModal';
import { logPaymentFlow, validateRazorpayResponse, getPaymentTroubleshootingTips } from '@/utils/paymentDebug';

// Define Razorpay type to avoid TypeScript errors
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

declare const Razorpay: new (options: RazorpayOptions) => RazorpayInstance;

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentCancellation?: () => void;
  isProcessing?: boolean;
  storyId?: string; // Story ID for linking payment to specific story
}

const PricingModal: React.FC<PricingModalProps> = ({ 
  open, 
  onClose, 
  onPaymentSuccess,
  onPaymentCancellation,
  isProcessing = false,
  storyId
}) => {
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false); // Track cancellation state
  const [paymentFailed, setPaymentFailed] = useState(false); // Track failure state
  const [modalDismissed, setModalDismissed] = useState(false); // Track if modal was dismissed
  
  // Use refs to track payment state that won't be affected by React state batching
  const paymentStateRef = useRef({
    cancelled: false,
    failed: false,
    dismissed: false,
    verified: false
  });

  // Debug function to track payment state changes
  const setPaymentCancelledWithLog = (value: boolean, reason: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] Setting paymentCancelled to ${value} - Reason: ${reason}`);
    setPaymentCancelled(value);
    paymentStateRef.current.cancelled = value;
  };

  // Debug function to track payment failure state changes
  const setPaymentFailedWithLog = (value: boolean, reason: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] Setting paymentFailed to ${value} - Reason: ${reason}`);
    setPaymentFailed(value);
    paymentStateRef.current.failed = value;
  };

  // Debug function to track modal dismissed state changes
  const setModalDismissedWithLog = (value: boolean, reason: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] Setting modalDismissed to ${value} - Reason: ${reason}`);
    setModalDismissed(value);
    paymentStateRef.current.dismissed = value;
  };

  // Debug function to track payment verified state changes
  const setPaymentVerifiedWithLog = (value: boolean, reason: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] Setting paymentVerified to ${value} - Reason: ${reason}`);
    setPaymentVerified(value);
    paymentStateRef.current.verified = value;
  };

  // Reset form state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setShowGuestForm(false);
      setGuestDetails({ name: '', email: '', phone: '' });
      setPaymentProcessing(false);
      setPaymentVerifiedWithLog(false, 'Modal opened - reset state');
      setPaymentCancelledWithLog(false, 'Modal opened - reset state');
      setPaymentFailedWithLog(false, 'Modal opened - reset state');
      setModalDismissedWithLog(false, 'Modal opened - reset state');
    }
  }, [open]);

  if (!open) return null;

  const handlePayment = async () => {
    // If user is not authenticated, show guest form first
    if (!isAuthenticated && !showGuestForm) {
      setShowGuestForm(true);
      return;
    }

    // Validate guest details for anonymous users
    let phoneNumber = '';
    if (!isAuthenticated) {
      if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
        toast.error('Please fill in all guest details to proceed with payment.');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestDetails.email)) {
        toast.error('Please enter a valid email address.');
        return;
      }
      
      // Basic phone validation and auto-add +91 prefix if not present
      phoneNumber = guestDetails.phone.trim();
      
      // Remove any existing +91 prefix to avoid duplication
      if (phoneNumber.startsWith('+91')) {
        phoneNumber = phoneNumber.substring(3);
      }
      
      // Remove any leading zeros
      phoneNumber = phoneNumber.replace(/^0+/, '');
      
      // Validate that it's a 10-digit Indian mobile number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        toast.error('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      
      // Add +91 prefix
      phoneNumber = '+91' + phoneNumber;
    }

    setPaymentProcessing(true);
    
    try {
      const orderRequest: CreateOrderRequest = {
        amount: 49.00,
        currency: "INR",
        description: "Storymaker Premium",
      };
      debugger;
      // Add story_id if available
      if (storyId) {
        orderRequest.story_id = storyId;
      }

      // Add guest details for anonymous users
      if (!isAuthenticated) {
        orderRequest.guest_name = guestDetails.name;
        orderRequest.guest_email = guestDetails.email;
        orderRequest.guest_phone = phoneNumber; // Use the processed phone number with +91 prefix
      }

      const orderDetails = await createPaymentOrder(orderRequest, isAuthenticated);



      const options = {
        key: orderDetails.razorpay_key_id,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        name: 'Character Canvas Tales',
        description: 'Unlock Premium Features',
        order_id: orderDetails.razorpay_order_id,
        handler: async function (response: RazorpayResponse) {
          try {
            const timestamp = new Date().toISOString();
            logPaymentFlow('Payment response received', response);
            console.log(`💰 [${timestamp}] Razorpay payment response received:`, response);
            console.log(`🔍 [${timestamp}] Current paymentCancelled state:`, paymentCancelled);
            console.log(`🔍 [${timestamp}] Current paymentFailed state:`, paymentFailed);
            console.log(`🔍 [${timestamp}] Current paymentVerified state:`, paymentVerified);
            console.log(`🔍 [${timestamp}] Current modalDismissed state:`, modalDismissed);
            
            // Add a small delay to allow cancellation/failure events to be processed first
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Re-check states after delay (using both state and ref for reliability)
            console.log(`🔍 [${timestamp}] After delay - paymentCancelled:`, paymentCancelled);
            console.log(`🔍 [${timestamp}] After delay - paymentFailed:`, paymentFailed);
            console.log(`🔍 [${timestamp}] After delay - modalDismissed:`, modalDismissed);
            console.log(`🔍 [${timestamp}] Ref state - cancelled:`, paymentStateRef.current.cancelled);
            console.log(`🔍 [${timestamp}] Ref state - failed:`, paymentStateRef.current.failed);
            console.log(`🔍 [${timestamp}] Ref state - dismissed:`, paymentStateRef.current.dismissed);
            
            // Check if payment was cancelled, failed, or modal was dismissed before proceeding
            // Use ref values for more reliable state checking
            if (paymentCancelled || paymentStateRef.current.cancelled) {
              console.log('❌ Payment was cancelled, skipping verification');
              return;
            }
            
            if (paymentFailed || paymentStateRef.current.failed) {
              console.log('❌ Payment was failed, skipping verification');
              return;
            }
            
            if (modalDismissed || paymentStateRef.current.dismissed) {
              console.log('❌ Modal was dismissed, skipping verification');
              return;
            }
            
            // Check if payment was already verified
            if (paymentVerified) {
              console.log('⚠️ Payment already verified, skipping duplicate verification');
              return;
            }
            
            // Validate Razorpay response
            const validation = validateRazorpayResponse(response);
            if (!validation.valid) {
              console.error('❌ Invalid Razorpay response:', validation.issues);
              await handleFailedPayment(
                orderDetails.razorpay_order_id,
                'Invalid payment response',
                undefined,
                `Validation failed: ${validation.issues.join(', ')}`
              );
              toast.error('Invalid payment response. Please try again.');
              return;
            }
            
            // Additional validation: Check if this looks like a real successful payment
            if (!response.razorpay_payment_id || !response.razorpay_signature) {
              console.error('❌ Missing payment ID or signature in response:', response);
              await handleFailedPayment(
                orderDetails.razorpay_order_id,
                'Incomplete payment response',
                response.razorpay_payment_id,
                'Missing payment ID or signature'
              );
              toast.error('Incomplete payment response. Please try again.');
              return;
            }
            
            // Verify the payment with the backend
            const verificationData: PaymentVerificationRequest = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            };

            logPaymentFlow('Verifying payment with backend', verificationData);
            console.log('🔍 Payment verification request:', verificationData);
            const verificationResult = await verifyPayment(verificationData);
            console.log('🔍 Payment verification response:', verificationResult);
            
            if (verificationResult.verified && verificationResult.status === 'success') {
              // Prevent multiple payment success calls
              if (paymentVerified) {
                console.log('⚠️ Payment already verified, skipping duplicate success call');
                return;
              }
              
              // Double-check cancellation/failure state before proceeding
              if (paymentCancelled) {
                console.log('❌ Payment was cancelled after verification, skipping success handler');
                return;
              }
              
              if (paymentFailed) {
                console.log('❌ Payment was failed after verification, skipping success handler');
                return;
              }
              
                          logPaymentFlow('Payment verified successfully', verificationResult);
            console.log('✅ PAYMENT SUCCESS - Starting image generation...');
            setPaymentVerifiedWithLog(true, 'Payment verification successful');
              toast.success('Payment successful! Generating your premium illustrations...');
              
              // Final check before calling onPaymentSuccess
              const shouldProceed = !paymentCancelled && !paymentFailed && !modalDismissed && 
                                   !paymentStateRef.current.cancelled && !paymentStateRef.current.failed && 
                                   !paymentStateRef.current.dismissed;
              
              if (shouldProceed) {
                console.log('✅ Calling onPaymentSuccess - payment verified and not cancelled/failed/dismissed');
                onPaymentSuccess();
                onClose();
              } else {
                console.log('❌ Skipping onPaymentSuccess - payment was cancelled, failed, or modal dismissed');
                console.log(`   - paymentCancelled: ${paymentCancelled}`);
                console.log(`   - paymentFailed: ${paymentFailed}`);
                console.log(`   - modalDismissed: ${modalDismissed}`);
                console.log(`   - ref.cancelled: ${paymentStateRef.current.cancelled}`);
                console.log(`   - ref.failed: ${paymentStateRef.current.failed}`);
                console.log(`   - ref.dismissed: ${paymentStateRef.current.dismissed}`);
              }
            } else {
              console.error('❌ PAYMENT VERIFICATION FAILED - NOT starting image generation:', verificationResult);
              await handleFailedPayment(
                orderDetails.razorpay_order_id,
                'Payment verification failed',
                response.razorpay_payment_id,
                verificationResult.error_message || 'Verification failed'
              );
              // Call the cancellation handler to reset frontend state
              onPaymentCancellation?.();
              const tips = getPaymentTroubleshootingTips(verificationResult.error_message || '');
              console.error('Troubleshooting tips:', tips);
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            await handleFailedPayment(
              orderDetails.razorpay_order_id,
              'Payment verification error',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Call the cancellation handler to reset frontend state
            onPaymentCancellation?.();
            const tips = getPaymentTroubleshootingTips(error instanceof Error ? error.message : '');
            console.error('Troubleshooting tips:', tips);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: async function() {
            console.log('❌ PAYMENT MODAL DISMISSED BY USER');
            setModalDismissedWithLog(true, 'User dismissed payment modal');
            setPaymentCancelledWithLog(true, 'User dismissed payment modal');
            await handleCancelledPayment(
              orderDetails.razorpay_order_id,
              undefined,
              'User closed payment modal'
            );
            // Call the cancellation handler to reset frontend state
            onPaymentCancellation?.();
            toast.info('Payment was cancelled. You can try again anytime.');
          }
        },
        prefill: orderDetails.prefill,
        notes: {
          address: 'Character Canvas Tales Corporate Office'
        },
        theme: {
          color: '#6B21A8'
        }
      };

      const rzp = new Razorpay(options);
      
      // Add error handling for payment failures
      rzp.on('payment.failed', async function (response: any) {
        const timestamp = new Date().toISOString();
        console.error(`❌ [${timestamp}] PAYMENT FAILED EVENT:`, response);
        setPaymentCancelledWithLog(true, 'Payment failed event');
        setPaymentFailedWithLog(true, 'Payment failed event');
        setModalDismissedWithLog(true, 'Payment failed event'); // Also mark as dismissed to prevent success handler
        await handleFailedPayment(
          orderDetails.razorpay_order_id,
          'Payment failed',
          response.error?.metadata?.payment_id,
          response.error?.description || 'Payment failed'
        );
        // Call the cancellation handler to reset frontend state
        onPaymentCancellation?.();
        toast.error('Payment failed. Please try again or contact support.');
      });

      rzp.on('payment.cancelled', async function (response: any) {
        const timestamp = new Date().toISOString();
        console.log(`❌ [${timestamp}] PAYMENT CANCELLED EVENT:`, response);
        setPaymentCancelledWithLog(true, 'Payment cancelled event');
        setModalDismissedWithLog(true, 'Payment cancelled event'); // Also mark as dismissed to prevent success handler
        await handleCancelledPayment(
          orderDetails.razorpay_order_id,
          response.error?.metadata?.payment_id,
          'Payment was cancelled'
        );
        // Call the cancellation handler to reset frontend state
        onPaymentCancellation?.();
        toast.info('Payment was cancelled. You can try again anytime.');
      });

      rzp.open();
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error('Failed to create payment order. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {showGuestForm ? 'Enter Your Details' : 'Unlock All Illustrations'}
        </h2>
        
        {showGuestForm ? (
          <>
            <p className="mb-6 text-center text-gray-600">
              Please provide your details to complete the payment process.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={guestDetails.name}
                  onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={guestDetails.phone}
                  onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="9876543210"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit mobile number (e.g., 9876543210)
                </p>
              </div>
            </div>
            <button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold mb-3 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePayment}
              disabled={paymentProcessing || isProcessing}
            >
              {paymentProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </button>
            {/* OR separator and Login button */}
            <div className="flex flex-col items-center my-2">
              <span className="text-gray-400 text-sm mb-1 font-semibold tracking-widest">OR</span>
              <button
                className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-2 rounded-lg font-semibold mb-3 hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
                onClick={() => setShowLoginModal(true)}
                type="button"
              >
                Login
              </button>
            </div>
            {/* Show the actual LoginModal */}
            {showLoginModal && (
              <LoginModal 
                isOpen={showLoginModal}
                onOpenChange={(open) => setShowLoginModal(open)}
                onLoginSuccess={() => {
                  setShowLoginModal(false);
                  setShowGuestForm(false); // Optionally close guest form after login
                }}
              />
            )}
            <button
              className="w-full text-gray-500 py-2 rounded-lg hover:bg-gray-100 transition-colors mb-3"
              onClick={() => setShowGuestForm(false)}
              disabled={paymentProcessing || isProcessing}
            >
              Back to Pricing
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-center">
              Get access to all premium illustrations and download your full storybook as a PDF!
            </p>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-3xl font-bold text-purple-600">₹49</span>
                <span className="text-xl text-gray-400 line-through">₹199</span>
              </div>
              <div className="text-sm text-orange-600 font-semibold">Limited Time Offer!</div>
              {/* <span className="text-gray-500">one-time</span> */}
            </div>
            {/* Features list - only show on main modal, not guest form */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>All premium illustrations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>High-quality PDF download</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>Character-consistent artwork</span>
              </div>
            </div>
            <button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold mb-3 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePayment}
              disabled={paymentProcessing || isProcessing}
            >
              {paymentProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                'Pay Now & Unlock All'
              )}
            </button>
          </>
        )}
        
        <button
          className="w-full text-gray-500 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
          disabled={paymentProcessing || isProcessing}
        >
          Cancel
        </button>
        
        {isProcessing && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Generating your premium illustrations...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingModal; 