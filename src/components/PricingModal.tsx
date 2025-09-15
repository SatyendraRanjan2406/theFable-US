import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  processPayment, 
  PaymentProcessorOptions,
  PaymentProcessorCallbacks,
  GuestDetails
} from "@/utils/Payments/common/paymentProcessors";
import { PaymentConfig } from "@/utils/Payments/common/paymentConfig";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import { getPaymentConfig, getFormattedPaymentAmount, getFormattedOriginalPrice } from "@/config/app";

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
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: "",
    email: "",
    phone: ""
  });
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (open) {
      setShowGuestForm(false);
      setGuestDetails({ name: "", email: "", phone: "" });
      setPaymentProcessing(false);
    }
  }, [open]);

  if (!open) return null;

  const handlePayment = async () => {
    // If user is not authenticated, show guest form first
    if (!isAuthenticated && !showGuestForm) {
      setShowGuestForm(true);
      return;
    }

    setPaymentProcessing(true);
    
    try {
      const paymentConfig = getPaymentConfig();

      // Create callbacks for payment processing
      const callbacks: PaymentProcessorCallbacks = {
        onSuccess: () => {
          console.log("🎉 Payment success callback triggered");
          setPaymentProcessing(false);
          onPaymentSuccess();
          onClose();
        },
        onError: (error: string) => {
          console.error("❌ Payment error:", error);
          setPaymentProcessing(false);
          onPaymentCancellation?.();
        },
        onCancel: () => {
          console.log("⚠️ Payment cancelled");
          setPaymentProcessing(false);
          onPaymentCancellation?.();
        }
      };

      const options: PaymentProcessorOptions = {
        storyId,
        isAuthenticated,
        guestDetails: !isAuthenticated ? guestDetails : undefined,
        callbacks
      };

      // Process payment with callbacks
      await processPayment(paymentConfig, options);

    } catch (error) {
      console.error("❌ Error processing payment:", error);
      toast.error("Failed to process payment. Please try again.");
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">

        <h2 className="text-2xl font-bold mb-4 text-center">
          {showGuestForm ? "Enter Your Details" : "Unlock All Illustrations"}
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
                "Proceed to Payment"
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
                <span className="text-3xl font-bold text-purple-600">{getFormattedPaymentAmount()}</span>
                <span className="text-xl text-gray-400 line-through">{getFormattedOriginalPrice()}</span>
              </div>
              <div className="text-sm text-orange-600 font-semibold">Limited Time Offer!</div>
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
                "Pay Now & Unlock All"
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
