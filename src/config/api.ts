/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Environment-based configuration
export const getApiBaseUrl = (): string => {
    // Check if we're in production, staging, etc.
    const env = import.meta.env.VITE_ENVIRONMENT || 'production';
    
    console.log('🔧 getApiBaseUrl called with env:', env);
    console.log('🔧 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    
    let baseUrl: string;
    
    switch (env) {
      case 'production':
        baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.srujana.solutions';
        break;
      case 'staging':
        baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://staging-api.yourdomain.com';
        break;
      case 'development':
      default:
        baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        break;
    }
    
    console.log('🔧 Final baseUrl:', baseUrl);
    return baseUrl;
  };
  
// Base URL for the authentication API
export const BASE_URL = getApiBaseUrl()

// Auth API endpoints
export const API_ENDPOINTS = {
  auth: {
    generateEmailOTP: `${BASE_URL}/api/auth/otp/generate/`,
    verifyEmailOTP: `${BASE_URL}/api/auth/otp/verify/`,
    // SSO endpoints
    googleSSO: `${BASE_URL}/api/sso/google/login/`,
    googleCallback: `${BASE_URL}/api/sso/google/api-callback/`,
    // Stories endpoint
    stories: `${BASE_URL}/api/auth/stories/`,
    // Public stories endpoint for guest users
    publicStories: `${BASE_URL}/api/auth/public/stories/`,
  },
  payments: {
    createOrder: `${BASE_URL}/api/payments/create-order/`,
    history: `${BASE_URL}/api/payments/history/`,
    verifyPayment: `${BASE_URL}/api/payments/verify/`,
    getPaymentStatus: `${BASE_URL}/api/payments/status`,
    updateOrderStatus: `${BASE_URL}/api/payments/update-status/`,
  },
  // Image generation endpoints
  imageGeneration: {
    authenticated: `${BASE_URL}/api/auth/min-max/generate/`,
    public: `${BASE_URL}/api/auth/public/min-max/generate/`,
  },
  // Add other API endpoints here as needed
  // story: {
  //   generate: `${BASE_URL}/api/story/generate/`,
  //   images: `${BASE_URL}/api/story/images/`,
  // },
};

// API configuration settings
export const API_CONFIG = {
  timeout: 60000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Use environment-based URL if available, otherwise fallback to BASE_URL
export const DYNAMIC_BASE_URL = getApiBaseUrl();

// Debug logging for API configuration
console.log('🔧 API Configuration Debug:', {
  BASE_URL,
  DYNAMIC_BASE_URL,
  payments: API_ENDPOINTS.payments,
  verifyPayment: API_ENDPOINTS.payments.verifyPayment
});

// Validate that all endpoints are properly constructed
Object.entries(API_ENDPOINTS.payments).forEach(([key, value]) => {
  if (!value || value.includes('undefined')) {
    console.error(`❌ Invalid API endpoint for ${key}:`, value);
  } else {
    console.log(`✅ Valid API endpoint for ${key}:`, value);
  }
}); 