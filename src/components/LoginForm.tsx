import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { toast } from 'sonner';
import { generatePhoneOTP, verifyPhoneOTP, generateEmailOTP, verifyEmailOTP } from '@/utils/authApi';
import { initiateGoogleSSO } from '@/utils/authApi';
import { handleOAuthLogin } from '@/utils/browserUtils';

const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email'); // Default to email
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSSOLoading(true);
    setError(null);

    const result = await initiateGoogleSSO();

    if (result.success && result.authorizationUrl) {
      // Use enhanced OAuth login handler with proper popup monitoring
      await handleOAuthLogin(
        result.authorizationUrl,
        () => {
          // Success callback
          toast.success('🎉 Google login successful!');
          onLoginSuccess();
        },
        (errorMessage) => {
          // Error callback
          setError(errorMessage);
          toast.error(`Google Login Failed: ${errorMessage}`);
        }
      );
    } else {
      const errorMessage = result.error || 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Google Login Failed: ${errorMessage}`);
    }

    // Reset loading state
    setIsSSOLoading(false);
  };

  const handleGenerateOtp = async () => {
    setError(null);
    let validation;
    if (loginMethod === 'email') {
      validation = emailSchema.safeParse(contact);
    } else {
      validation = phoneSchema.safeParse(contact);
    }

    if (!validation.success) {
      setError(`Invalid ${loginMethod}. ${loginMethod === 'phone' ? 'Please use format: +1234567890' : ''}`);
      return;
    }

    setIsLoading(true);
    try {
      if (loginMethod === 'phone') {
        // Use the centralized phone OTP utility
        const result = await generatePhoneOTP(contact);
        
        if (result.success) {
          setIsOtpSent(true);
          toast.success(`📱 OTP sent to ${contact}!`);
        } else {
          setError(result.error || 'Failed to send OTP.');
          toast.error('Failed to send OTP');
        }
      } else {
        // Use the centralized email OTP utility
        const result = await generateEmailOTP(contact);
        
        if (result.success) {
          setIsOtpSent(true);
          toast.success(`📧 OTP sent to ${contact}!`);
        } else {
          setError(result.error || 'Failed to send OTP.');
          toast.error('Failed to send OTP');
        }
      }
    } catch (err) {
      console.error('OTP generation error:', err);
      setError('Network error. Please check if the server is running.');
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) {
        setError('OTP must be 6 digits.');
        return;
    }
    setIsLoading(true);
    try {
      if (loginMethod === 'phone') {
        // Use the centralized phone OTP verification utility
        const result = await verifyPhoneOTP(contact, otp);
        
        if (result.success && result.data) {
          //console.log('Login successful!');
          if (result.data.access) {
            localStorage.setItem('authToken', result.data.access);
          }
          if (result.data.refresh) {
            localStorage.setItem('refreshToken', result.data.refresh);
          }
          toast.success('🎉 Login successful!');
          onLoginSuccess();
        } else {
          setError(result.error || 'Invalid OTP.');
          toast.error('Invalid OTP');
        }
      } else {
        // Use the centralized email OTP verification utility
        const result = await verifyEmailOTP(contact, otp);
        
        if (result.success && result.data) {
          //console.log('Login successful!');
          if (result.data.access) {
            localStorage.setItem('authToken', result.data.access);
          }
          if (result.data.refresh) {
            localStorage.setItem('refreshToken', result.data.refresh);
          }
          toast.success('🎉 Login successful!');
          onLoginSuccess();
        } else {
          setError(result.error || 'Invalid OTP.');
          toast.error('Invalid OTP');
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please try again.');
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onTabChange = (value: string) => {
    setLoginMethod(value as 'email' | 'phone');
    setContact('');
    setOtp('');
    setError(null);
    setIsOtpSent(false);
  };

  return (
    <div className="space-y-6">
      {/* SSO Login Options - Primary */}
      <div className="space-y-3">
        <Button
          onClick={handleGoogleLogin}
          disabled={isSSOLoading || isLoading}
          variant="outline"
          className="w-full h-12 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 font-medium"
        >
          {isSSOLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Connecting to Google...
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-gray-500 font-medium">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Email OTP Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            placeholder="user@example.com" 
            disabled={isOtpSent || isLoading} 
            className="h-12 focus:border-purple-500"
          />
        </div>

        {isOtpSent && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="otp">Enter 6-Digit OTP</Label>
            <Input 
              id="otp" 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
              placeholder="123456" 
              disabled={isLoading} 
              maxLength={6} 
              className="h-12 text-center tracking-[0.5em] focus:border-purple-500 text-lg font-mono"
            />
            <p className="text-xs text-gray-500 text-center">Check your email for the verification code</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="mt-6">
        {!isOtpSent ? (
          <Button 
            onClick={handleGenerateOtp} 
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" 
            disabled={isLoading || !contact.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending OTP...
              </div>
            ) : (
              '📧 Send OTP to Email'
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleVerifyOtp} 
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" 
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              '🔓 Verify & Login'
            )}
          </Button>
        )}
      </div>
      
      {isOtpSent && (
        <div className="space-y-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setIsOtpSent(false); setError(null); setOtp(''); }} 
            className="w-full text-purple-600 hover:text-purple-800 border-purple-200 hover:bg-purple-50"
          >
            ← Use different email
          </Button>
          <Button 
            variant="link" 
            size="sm" 
            onClick={handleGenerateOtp} 
            className="w-full text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            Didn't receive OTP? Resend
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoginForm; 