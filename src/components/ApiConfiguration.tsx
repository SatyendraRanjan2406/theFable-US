// Instead, export the API keys from environment variables
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
export const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;

// Optionally, export a default function/component that just returns null or a message
const ApiConfiguration = () => null;
export default ApiConfiguration;

