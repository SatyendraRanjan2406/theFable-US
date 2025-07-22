/**
 * Authentication API utilities
 */

import { API_ENDPOINTS, API_CONFIG, DYNAMIC_BASE_URL } from '@/config/api';

export interface OTPGenerateRequest {
  phone_number?: string;
  email?: string;
}

export interface OTPVerifyRequest {
  phone_number?: string;
  email?: string;
  otp: string;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  detail?: string;
  message?: string;
}

/**
 * Generate OTP for phone number using the unified OTP endpoint
 */
export const generatePhoneOTP = async (phoneNumber: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🚀 Generating OTP for phone:', phoneNumber);
    console.log('📡 Using API endpoint:', API_ENDPOINTS.auth.generateEmailOTP);
    
    const response = await fetch(API_ENDPOINTS.auth.generateEmailOTP, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        phone_number: phoneNumber,
      }),
    });

    const data = await response.json();
    
    console.log('📱 Phone OTP API Response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || data.message || 'Failed to generate OTP' 
      };
    }
  } catch (error) {
    console.error('❌ Phone OTP Generation Error:', error);
    return { 
      success: false, 
      error: `Network error. Please check if the server is running on ${DYNAMIC_BASE_URL}` 
    };
  }
};

/**
 * Verify OTP for phone number using the unified OTP endpoint
 */
export const verifyPhoneOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    console.log('🔍 Verifying OTP for phone:', phoneNumber);
    console.log('📡 Using API endpoint:', API_ENDPOINTS.auth.verifyEmailOTP);
    
    const response = await fetch(API_ENDPOINTS.auth.verifyEmailOTP, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp: otp,
      }),
    });

    const data = await response.json();
    
    console.log('✅ Phone OTP Verify Response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || data.message || 'Invalid OTP' 
      };
    }
  } catch (error) {
    console.error('❌ Phone OTP Verification Error:', error);
    return { 
      success: false, 
      error: `Network error. Please check if the server is running on ${DYNAMIC_BASE_URL}` 
    };
  }
};

/**
 * Generate OTP for email using the same unified endpoint
 */
export const generateEmailOTP = async (email: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🚀 Generating OTP for email:', email);
    console.log('📡 Using API endpoint:', API_ENDPOINTS.auth.generateEmailOTP);
    
    const response = await fetch(API_ENDPOINTS.auth.generateEmailOTP, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        email: email,
      }),
    });

    const data = await response.json();
    
    console.log('📧 Email OTP API Response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || data.message || 'Failed to generate OTP' 
      };
    }
  } catch (error) {
    console.error('❌ Email OTP Generation Error:', error);
    return { 
      success: false, 
      error: `Network error. Please check if the server is running on ${DYNAMIC_BASE_URL}` 
    };
  }
};

/**
 * Verify OTP for email using the same unified endpoint
 */
export const verifyEmailOTP = async (email: string, otp: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    console.log('🔍 Verifying OTP for email:', email);
    console.log('📡 Using API endpoint:', API_ENDPOINTS.auth.verifyEmailOTP);
    
    const response = await fetch(API_ENDPOINTS.auth.verifyEmailOTP, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        email: email,
        otp: otp,
      }),
    });

    const data = await response.json();
    
    console.log('✅ Email OTP Verify Response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || data.message || 'Invalid OTP' 
      };
    }
  } catch (error) {
    console.error('❌ Email OTP Verification Error:', error);
    return { 
      success: false, 
      error: `Network error. Please check if the server is running on ${DYNAMIC_BASE_URL}` 
    };
  }
};

/**
 * Test function to verify API connectivity with phone number
 */
export const testOTPAPI = async (testPhoneNumber: string = '+1234567890'): Promise<void> => {
  console.log('🧪 Testing OTP API with phone:', testPhoneNumber);
  console.log('🌐 Base URL:', DYNAMIC_BASE_URL);
  console.log('📡 API Endpoint:', API_ENDPOINTS.auth.generateEmailOTP);
  console.log('📋 CURL Command:', `curl -X POST ${API_ENDPOINTS.auth.generateEmailOTP} \\
  -H 'Content-Type: application/json' \\
  -d '{"phone_number": "${testPhoneNumber}"}'`);
  
  const result = await generatePhoneOTP(testPhoneNumber);
  
  if (result.success) {
    console.log('✅ OTP API Test: SUCCESS');
    console.log('📱 Response:', result.data);
  } else {
    console.log('❌ OTP API Test: FAILED');
    console.log('💥 Error:', result.error);
  }
  
  return;
};

/**
 * Initiates Google SSO login flow.
 * This function sends a POST request to the backend, which should respond
 * with an authorization URL for Google's OAuth page.
 */
export const initiateGoogleSSO = async (): Promise<{ success: boolean; authorizationUrl?: string; error?: string }> => {
  try {
    console.log('🚀 Initiating Google SSO login');
    const response = await fetch(API_ENDPOINTS.auth.googleSSO, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({}), // Empty body as per the curl example
    });

    const data = await response.json();

    if (response.ok && data.authorization_url) {
      console.log('✅ Received authorization URL from backend:', data.authorization_url);
      return { success: true, authorizationUrl: data.authorization_url };
    } else {
      const errorMessage = data.detail || 'Backend did not provide an authorization_url.';
      console.error('❌ Google SSO Initiation Error:', errorMessage, data);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('❌ Network error during Google SSO initiation:', error);
    return { 
      success: false, 
      error: `Network error. Please check if the server is running on ${DYNAMIC_BASE_URL}` 
    };
  }
};

/**
 * Sends the authorization code and state from Google to the backend to be exchanged for a token.
 */
export const handleGoogleCallback = async (code: string, state: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    console.log('🤝 Sending authorization code and state to backend');
    console.log('📡 API Endpoint:', API_ENDPOINTS.auth.googleCallback);
    console.log('🔑 Code length:', code?.length || 0);
    console.log('🔑 State length:', state?.length || 0);
    
    const requestBody = { code, state };
    console.log('📤 Request body:', requestBody);
    
    const response = await fetch(API_ENDPOINTS.auth.googleCallback, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
      console.log('📡 Response data:', data);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      const textResponse = await response.text();
      console.log('📡 Raw response text:', textResponse);
      return { 
        success: false, 
        error: `Invalid JSON response from server: ${textResponse.substring(0, 200)}`
      };
    }

    if (response.ok) {
      console.log('✅ Successfully exchanged code for token:', data);
      return { success: true, data };
    } else {
      const errorMessage = data.detail || data.message || 'Failed to exchange authorization code for token.';
      console.error('❌ Callback Error:', errorMessage, data);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('❌ Network error during callback handling:', error);
    return { 
      success: false, 
      error: `Network error during callback handling: ${error}`
    };
  }
}; 