import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";

interface PaymentConfirmedModalProps {
  open: boolean;
  onClose: () => void;
}

const PaymentConfirmedModal: React.FC<PaymentConfirmedModalProps> = ({
  open,
  onClose,
}) => {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scaleUp relative">

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="text-green-500 w-16 h-16 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Payment Confirmed
        </h2>

        {/* Message */}
        <p className="text-gray-700 mb-2">
          Your payment has been processed successfully 🎉
        </p>
        
        <p className="text-gray-600 mb-6 flex justify-center items-center gap-2">
          <Mail className="w-5 h-5 text-purple-500" />
          Check your email for confirmation & PDF receipt.
        </p>


        <Link to="/">
          <button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-md hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all duration-200"
            onClick={onClose}
          >
            OK, Got it
          </button>
        </Link>


      </div>
    </div>
  );
};

export default PaymentConfirmedModal;
