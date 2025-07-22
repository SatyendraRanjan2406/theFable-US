import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { handleGoogleCallback } from '@/utils/authApi';
import { useAuth } from '@/hooks/useAuth';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const authError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (authError) {
        const fullError = `${authError}: ${errorDescription}`;
        setError(fullError);
        toast.error(`Google Login Failed: ${errorDescription || authError}`);
        // Consider closing the window or redirecting after a delay
        setTimeout(() => window.close(), 5000);
        return;
      }

      if (code && state) {
        const result = await handleGoogleCallback(code, state);
        if (result.success && result.data) {
          // Store tokens in localStorage and update auth state
          if (result.data.access) {
            localStorage.setItem('authToken', result.data.access);
          }
          if (result.data.refresh) {
            localStorage.setItem('refreshToken', result.data.refresh);
          }
          // The AuthProvider will automatically pick up the new tokens.
          login();
          
          // Signal to the main tab that login was successful
          localStorage.setItem('login_success', Date.now().toString());
          
          // Close the popup window
          window.close();
        } else {
          setError(result.error || 'Failed to finalize login.');
          toast.error(`Login Failed: ${result.error}`);
        }
      } else {
        setError('Authorization code or state not found in callback URL.');
        toast.error('Login Failed: Missing required parameters in callback.');
      }
    };

    processCallback();
  }, [searchParams, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        {error ? (
          <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
            <p className="mb-4">There was a problem logging you in.</p>
            <pre className="text-sm bg-red-50 p-2 rounded text-left whitespace-pre-wrap">
              Error: {error}
            </pre>
            <p className="mt-4 text-sm">This window will close automatically.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Finalizing Login...
            </h2>
            <p className="text-gray-600">Please wait, we're securely signing you in.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage; 