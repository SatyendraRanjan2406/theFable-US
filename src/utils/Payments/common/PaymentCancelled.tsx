import { useEffect } from "react";
import { handleStripePaymentCancelledFromWindow } from "@/utils/Payments/common/paymentProcessors";

const PaymentCancelled = () => {
	useEffect(() => {
		handleStripePaymentCancelledFromWindow();
	}, []);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="text-center">
				<p className="text-lg">Payment cancelled. You can close this window.</p>
			</div>
		</div>
	);
};

export default PaymentCancelled; 