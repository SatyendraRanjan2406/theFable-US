import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { handleGoogleCallback } from '@/utils/authApi';
import { useAuth } from '@/hooks/useAuth';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Set up periodic success check
    const successCheck = setInterval(() => {
      const loginSuccess = localStorage.getItem('login_success');
      if (loginSuccess && !isSuccess) {
        console.log('✅ Periodic check: Login successful, closing window');
        setIsSuccess(true);
        setError(null);
        setShowError(false);
        localStorage.removeItem('login_success');
        setTimeout(() => window.close(), 1000);
      }
    }, 500);

    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const authError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('🔄 Processing OAuth callback:', { 
        code: !!code, 
        state: !!state, 
        authError, 
        errorDescription 
      });

      // Check if login was already successful (from another tab)
      const loginSuccess = localStorage.getItem('login_success');
      if (loginSuccess) {
        console.log('✅ Login already successful, closing window');
        setIsSuccess(true);
        setTimeout(() => window.close(), 1000);
        return;
      }

      if (authError) {
        const fullError = `${authError}: ${errorDescription}`;
        setError(fullError);
        toast.error(`Google Login Failed: ${errorDescription || authError}`);
        // Consider closing the window or redirecting after a delay
        setTimeout(() => window.close(), 5000);
        return;
      }

      if (code && state) {
        setIsProcessing(true);
        setError(null); // Clear any previous errors
        
        try {
          // Test backend connectivity first
          const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          console.log('🔍 Testing backend connectivity to:', backendUrl);
          
          try {
            const healthCheck = await fetch(`${backendUrl}/api/health/`, { 
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Backend health check status:', healthCheck.status);
          } catch (error) {
            console.error('❌ Backend health check failed:', error);
            console.error('❌ This might explain the OAuth callback failure');
          }
          
          // Add a small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const result = await handleGoogleCallback(code, state);
          
          if (result.success && result.data) {
            console.log('✅ OAuth callback successful, storing tokens');
            
            // Set success state immediately to prevent error display
            setIsSuccess(true);
            setError(null);
            
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
            
            console.log('✅ Login success signal sent, closing window');
            
            // Add a small delay before closing to ensure the success message is processed
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            console.error('❌ OAuth callback failed:', result.error);
            if (!isProcessing) return; // Don't set error if we're no longer processing
            setError(result.error || 'Failed to finalize login.');
            // Delay showing the error to prevent brief flash
            setTimeout(() => {
              if (!isSuccess) {
                setShowError(true);
                toast.error(`Login Failed: ${result.error}`);
              }
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Error processing OAuth callback:', error);
          if (!isProcessing) return; // Don't set error if we're no longer processing
          setError('An unexpected error occurred during login.');
          // Delay showing the error to prevent brief flash
          setTimeout(() => {
            if (!isSuccess) {
              setShowError(true);
              toast.error('Login Failed: Unexpected error occurred.');
            }
          }, 2000);
        } finally {
          setIsProcessing(false);
        }
      } else {
        console.error('❌ Missing OAuth parameters:', { code: !!code, state: !!state });
        // Only show error if we're not in a successful OAuth flow
        if (!isSuccess) {
          setError('Authorization code or state not found in callback URL.');
          toast.error('Login Failed: Missing required parameters in callback.');
        }
      }
    };

    processCallback();

    // Cleanup function
    return () => {
      clearInterval(successCheck);
    };
  }, [searchParams, login, isProcessing, isSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        {isSuccess ? (
          <div className="p-6 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">✅ Login Successful!</h2>
            <p className="mb-4">You have been successfully logged in.</p>
            <p className="text-sm">This window will close automatically.</p>
          </div>
        ) : error && showError && !isProcessing && !isSuccess ? (
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
            {isProcessing && (
              <p className="text-sm text-gray-500 mt-2">Processing authentication...</p>
            )}
            {/* Always show loading state during OAuth processing to prevent error flash */}
            {!isSuccess && (
              <p className="text-sm text-gray-500 mt-2">Please do not close this window...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage; 