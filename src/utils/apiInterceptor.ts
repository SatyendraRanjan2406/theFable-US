// src/utils/apiInterceptor.ts

import { toast } from 'sonner';

interface ApiFetchOptions extends RequestInit {
  body?: any;
}

/**
 * A wrapper around the native fetch API that automatically handles:
 * - Adding the Authorization header for authenticated requests.
 * - Stringifying the request body.
 * - Handling 401 Unauthorized errors by dispatching a global event.
 * - Parsing JSON responses and handling non-JSON responses gracefully.
 * - Throwing errors for non-ok responses.
 */
export const apiFetch = async (url: string, options: ApiFetchOptions = {}) => {
  try {
    const token = localStorage.getItem('authToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header only if token exists (for authenticated users)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    console.log('🔐 API Interceptor: Response status:', response);
    if (response.status === 401) {
      // Unauthorized. Dispatch a global event for the AuthProvider to handle.
      // This decouples the API layer from the authentication state management.
      window.dispatchEvent(new CustomEvent('auth-error'));
      
      // Throw an error to stop the promise chain of the calling function.
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      // Try to parse error details from the response body, otherwise throw a generic error.
      const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
      const errorMessage = errorData.detail || errorData.message || 'API request failed';
      
      // The interceptor now handles showing the error toast.
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    }
    
    // Handle responses that might not have a body (e.g., 204 No Content).
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return; // No content to parse.
    }

    return response.json();
  } catch (error: any) {
    console.error('API Interceptor Error:', error);
        
    // Don't show a toast for auth errors, as the AuthProvider already does.
    if (error.message !== 'Unauthorized') {
        toast.error(error.message || 'An unexpected network error occurred.');
    }
    
    // Re-throw the error so the calling component's .catch() and .finally() can run.
    throw error;
  }
}; 