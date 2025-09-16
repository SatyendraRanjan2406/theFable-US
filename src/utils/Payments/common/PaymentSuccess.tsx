import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { verifyStripePaymentFromWindow } from "@/utils/Payments/common/paymentProcessors";

const PaymentSuccess = () => {
	const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

	useEffect(() => {
		verifyStripePaymentFromWindow()
			.then(() => setStatus("success"))
			.catch(() => setStatus("error"));
	}, []);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="text-center space-y-4">
				<h1 className="text-2xl font-bold">{status === "verifying" ? "Verifying your payment..." : status === "success" ? "Payment successful!" : "Payment verification failed"}</h1>
				<Link to="/" className="text-indigo-600 underline">Return to Home</Link>
			</div>
		</div>
	);
};

export default PaymentSuccess; 