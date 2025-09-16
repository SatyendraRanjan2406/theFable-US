import { useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';

const StripeCheckout = () => {
	useEffect(() => {
		const redirect = async () => {
			try {
				const params = new URLSearchParams(window.location.search);
				const sessionId = params.get('sessionId');
				if (!sessionId) {
					throw new Error('No session ID provided');
				}

				const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
				if (!stripe) {
					throw new Error('Failed to load Stripe');
				}

				const result = await stripe.redirectToCheckout({ sessionId });
				if (result.error) {
					throw new Error(result.error.message || 'Stripe checkout failed');
				}
			} catch {
				// No-op: errors will be surfaced elsewhere if needed
			}
		};

		redirect();
	}, []);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="text-center">
				<p className="text-lg">Redirecting to Stripe Checkout...</p>
			</div>
		</div>
	);
};

export default StripeCheckout; 