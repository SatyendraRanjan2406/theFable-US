import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  processPayment,
  PaymentProcessorOptions,
  PaymentProcessorCallbacks,
  GuestDetails
} from "@/utils/Payments/common/paymentProcessors";
import { getPaymentMode, getPaymentConfig } from "@/utils/Payments/common/paymentConfig";
import { 
  openStripeCheckoutInPopup,
  redirectToStripeCheckout
} from "@/utils/Payments/stripe/stripeCheckout";
import { 
  openRazorpayCheckoutInPopup,
  redirectToRazorpayCheckout
} from "@/utils/Payments/razorpay/razorpayCheckout";
import {
  processRazorpayPayment,
  RazorpayPaymentCallbacks,
  RazorpayPaymentResult
} from "@/utils/Payments/razorpay/razorpayPaymentProcessor";

interface PaymentExampleProps {
  storyId?: string;
  amount: number;
  onPaymentSuccess: () => void;
}

const PaymentExample: React.FC<PaymentExampleProps> = ({
  storyId,
  amount,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState(getPaymentMode());
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: "John Doe",
    email: "john@example.com",
    phone: "+919876543210"
  });

  const isAuthenticated = !!localStorage.getItem("authToken");
  
  // Get currency based on payment mode
  const currency = paymentMode === "stripe" ? "USD" : "INR";

  // Unified payment processing (recommended approach)
  const handleUnifiedPayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentConfig = {
        ...getPaymentConfig(),
        amount,
        description: "Storymaker Premium",
        currency
      };
      
      const callbacks: PaymentProcessorCallbacks = {
        onSuccess: () => {
          console.log(" Payment successful!");
          toast.success("Payment successful!");
          onPaymentSuccess();
        },
        onError: (error: string) => {
          console.error(" Payment error:", error);
          toast.error(`Payment failed: ${error}`);
        },
        onCancel: () => {
          console.log(" Payment cancelled");
          toast.info("Payment was cancelled");
        }
      };

      const options: PaymentProcessorOptions = {
        storyId,
        isAuthenticated,
        guestDetails: !isAuthenticated ? guestDetails : undefined,
        callbacks
      };

      await processPayment(paymentConfig, options);

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stripe-specific payment processing
  const handleStripePayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentConfig = {
        ...getPaymentConfig(),
        amount,
        description: "Storymaker Premium",
        currency
      };
      
      const callbacks: PaymentProcessorCallbacks = {
        onSuccess: () => {
          console.log(" Stripe payment successful!");
          toast.success("Stripe payment successful!");
          onPaymentSuccess();
        },
        onError: (error: string) => {
          console.error(" Stripe payment error:", error);
          toast.error(`Stripe payment failed: ${error}`);
        },
        onCancel: () => {
          console.log(" Stripe payment cancelled");
          toast.info("Stripe payment was cancelled");
        }
      };

      const options: PaymentProcessorOptions = {
        storyId,
        isAuthenticated,
        guestDetails: !isAuthenticated ? guestDetails : undefined,
        callbacks
      };

      await processPayment(paymentConfig, options);

    } catch (error) {
      console.error("Stripe payment error:", error);
      toast.error(error instanceof Error ? error.message : "Stripe payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // RazorPay-specific payment processing
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      const callbacks: RazorpayPaymentCallbacks = {
        onSuccess: (result: RazorpayPaymentResult) => {
          console.log(" RazorPay payment successful!", result);
          toast.success("RazorPay payment successful!");
          onPaymentSuccess();
        },
        onError: (error: string) => {
          console.error(" RazorPay payment error:", error);
          toast.error(`RazorPay payment failed: ${error}`);
        },
        onCancel: () => {
          console.log(" RazorPay payment cancelled");
          toast.info("RazorPay payment was cancelled");
        }
      };

      const paymentRequest = {
        amount,
        currency: "INR",
        storyId,
        guestName: !isAuthenticated ? guestDetails.name : undefined,
        guestEmail: !isAuthenticated ? guestDetails.email : undefined,
        guestPhone: !isAuthenticated ? guestDetails.phone : undefined,
      };

      await processRazorpayPayment(paymentRequest, callbacks);

    } catch (error) {
      console.error("RazorPay payment error:", error);
      toast.error(error instanceof Error ? error.message : "RazorPay payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stripe checkout in popup
  const handleStripePopup = async () => {
    try {
      await openStripeCheckoutInPopup({
        sessionId: "dummy_session_id",
        orderId: "dummy_order_id",
        amount,
        currency,
        storyId,
        clientSecret: "dummy_client_secret"
      });
    } catch (error) {
      console.error("Stripe popup error:", error);
      toast.error("Failed to open Stripe popup");
    }
  };

  // RazorPay checkout in popup
  const handleRazorpayPopup = async () => {
    try {
      await openRazorpayCheckoutInPopup({
        orderId: "dummy_order_id",
        amount,
        currency: "INR",
        storyId,
        guestName: !isAuthenticated ? guestDetails.name : undefined,
        guestEmail: !isAuthenticated ? guestDetails.email : undefined,
        guestPhone: !isAuthenticated ? guestDetails.phone : undefined,
      });
    } catch (error) {
      console.error("RazorPay popup error:", error);
      toast.error("Failed to open RazorPay popup");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Payment API Examples</h3>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p><strong>Current Payment Mode:</strong> {paymentMode} (from VITE_PAYMENT_MODE)</p>
        <p><strong>Currency:</strong> {currency} (auto-set based on payment mode)</p>
        <p><strong>Amount:</strong> {currency === "USD" ? `$${amount}` : `₹${amount}`}</p>
        <p><strong>Authentication:</strong> {isAuthenticated ? "Logged In" : "Guest User"}</p>
      </div>

      <div className="space-y-4">
        {/* Unified Payment (Recommended) */}
        <div className="border p-4 rounded-lg">
          <h4 className="font-medium mb-2"> Unified Payment (Recommended)</h4>
          <p className="text-sm text-gray-600 mb-3">
            Uses the unified payment processor that automatically handles both Stripe and RazorPay based on configuration.
          </p>
          <Button
            onClick={handleUnifiedPayment}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Process Unified Payment"}
          </Button>
        </div>

        {/* Stripe-specific Payment */}
        <div className="border p-4 rounded-lg">
          <h4 className="font-medium mb-2"> Stripe Payment</h4>
          <p className="text-sm text-gray-600 mb-3">
            Direct Stripe payment processing with comprehensive error handling.
          </p>
          <Button
            onClick={handleStripePayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? "Processing..." : "Process Stripe Payment"}
          </Button>
        </div>

        {/* RazorPay-specific Payment */}
        <div className="border p-4 rounded-lg">
          <h4 className="font-medium mb-2"> RazorPay Payment</h4>
          <p className="text-sm text-gray-600 mb-3">
            Direct RazorPay payment processing with comprehensive error handling.
          </p>
          <Button
            onClick={handleRazorpayPayment}
            disabled={isProcessing}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {isProcessing ? "Processing..." : "Process RazorPay Payment"}
          </Button>
        </div>

        {/* Popup Examples */}
        <div className="border p-4 rounded-lg">
          <h4 className="font-medium mb-2"> Popup Examples</h4>
          <p className="text-sm text-gray-600 mb-3">
            Open payment checkouts in popup windows.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleStripePopup}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Stripe Popup
            </Button>
            <Button
              onClick={handleRazorpayPopup}
              disabled={isProcessing}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              RazorPay Popup
            </Button>
          </div>
        </div>
      </div>

      {/* Guest Details Form */}
      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-3">Guest Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={guestDetails.name}
                onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={guestDetails.email}
                onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={guestDetails.phone}
                onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Code Examples */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Code Examples</h4>
        <div className="text-sm space-y-2">
          <div>
            <strong>Unified Payment:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
{`await processPayment(paymentConfig, options);`}
            </pre>
          </div>
          <div>
            <strong>Stripe Payment:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
{`await processPayment(paymentConfig, options);`}
            </pre>
          </div>
          <div>
            <strong>RazorPay Payment:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
{`await processRazorpayPayment(paymentRequest, callbacks);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample;
