# OAuth Callback Debugging Guide

## Problem

In Chrome, the OAuth login is showing:
1. **"Login Failed: Failed to exchange authorization code for token"** (error message)
2. **"Google login successful"** (success message)

This suggests the OAuth callback is failing at the backend level but then somehow succeeding later.

## Root Cause Analysis

The issue is likely one of these:

1. **Backend Server Not Running**: The callback endpoint is not reachable
2. **Wrong Callback Endpoint**: The backend expects a different URL
3. **CORS Issues**: The callback request is being blocked
4. **State Mismatch**: The state parameter doesn't match what the backend expects
5. **Invalid Authorization Code**: The code has expired or is invalid
6. **Backend Configuration Issue**: Google OAuth settings mismatch

## Enhanced Debugging Implemented

### 1. **Backend Connectivity Test** (`src/pages/OAuthCallbackPage.tsx`)

Added a health check to verify backend is reachable:

```typescript
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
```

### 2. **Enhanced Error Logging** (`src/utils/authApi.ts`)

Added comprehensive error logging:

```typescript
console.log('🤝 Sending authorization code and state to backend');
console.log('🔗 Callback URL:', API_ENDPOINTS.auth.googleCallback);
console.log('📋 Request payload:', { code: code.substring(0, 10) + '...', state });
console.log('🌐 Backend base URL:', DYNAMIC_BASE_URL);

console.log('📡 Response status:', response.status);
console.log('📡 Response status text:', response.statusText);
console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

// Log specific error details
if (data.detail) console.error('❌ Detail:', data.detail);
if (data.message) console.error('❌ Message:', data.message);
if (data.error) console.error('❌ Error:', data.error);
```

### 3. **JSON Response Handling**

Added robust JSON parsing to handle malformed responses:

```typescript
let data;
try {
  data = await response.json();
  console.log('📄 Response data:', data);
} catch (jsonError) {
  console.error('❌ Failed to parse JSON response:', jsonError);
  const textResponse = await response.text();
  console.log('📄 Raw response text:', textResponse);
  return { 
    success: false, 
    error: `Invalid response from server: ${response.status} ${response.statusText}`
  };
}
```

## Debugging Steps

### **Step 1: Check Browser Console**

Open Chrome Developer Tools (F12) and look for these logs:

```
🔄 Processing OAuth callback: { code: true, state: true, authError: null, errorDescription: null }
🔍 Testing backend connectivity to: http://localhost:8000
✅ Backend health check status: 200
🤝 Exchanging authorization code for token...
🔗 Callback URL: http://localhost:8000/api/sso/google/api-callback/
📋 Request payload: { code: "4/0AfJohX...", state: "abc123" }
🌐 Backend base URL: http://localhost:8000
📡 Response status: 400
📡 Response status text: Bad Request
❌ Callback Error: Invalid authorization code
```

### **Step 2: Check Backend Status**

1. **Verify backend is running**:
   ```bash
   curl http://localhost:8000/api/health/
   ```

2. **Check if callback endpoint exists**:
   ```bash
   curl -X POST http://localhost:8000/api/sso/google/api-callback/ \
     -H "Content-Type: application/json" \
     -d '{"code":"test","state":"test"}'
   ```

### **Step 3: Check Google OAuth Configuration**

1. **Verify callback URL in Google Console**:
   - Should be: `http://localhost:8080/oauth/callback`
   - Not: `http://localhost:8000/oauth/callback`

2. **Check client ID and secret**:
   - Ensure they match what's configured in the backend

### **Step 4: Check Backend Logs**

Look for these in your backend server logs:
- OAuth callback requests
- Token exchange attempts
- Error messages

## Common Issues and Solutions

### **Issue 1: Backend Not Running**
**Symptoms**: Network error, health check fails
**Solution**: Start the backend server

### **Issue 2: Wrong Callback URL**
**Symptoms**: 404 error, "Endpoint not found"
**Solution**: Check Google OAuth console configuration

### **Issue 3: CORS Issues**
**Symptoms**: CORS error in console
**Solution**: Configure CORS in backend to allow frontend domain

### **Issue 4: State Mismatch**
**Symptoms**: "Invalid state parameter"
**Solution**: Check state generation and validation

### **Issue 5: Expired Authorization Code**
**Symptoms**: "Invalid authorization code"
**Solution**: Authorization codes expire quickly, retry login

### **Issue 6: Backend Configuration**
**Symptoms**: Various backend errors
**Solution**: Check backend OAuth configuration

## Expected Console Output

### **Successful OAuth Flow:**
```
🔄 Processing OAuth callback: { code: true, state: true, authError: null, errorDescription: null }
🔍 Testing backend connectivity to: http://localhost:8000
✅ Backend health check status: 200
🤝 Exchanging authorization code for token...
🔗 Callback URL: http://localhost:8000/api/sso/google/api-callback/
📋 Request payload: { code: "4/0AfJohX...", state: "abc123" }
🌐 Backend base URL: http://localhost:8000
📡 Response status: 200
📄 Response data: { access: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...", refresh: "..." }
✅ Successfully exchanged code for token
✅ Token exchange successful
🎉 Google login successful!
```

### **Failed OAuth Flow:**
```
🔄 Processing OAuth callback: { code: true, state: true, authError: null, errorDescription: null }
🔍 Testing backend connectivity to: http://localhost:8000
❌ Backend health check failed: TypeError: Failed to fetch
🤝 Exchanging authorization code for token...
❌ Network error during callback handling: TypeError: Failed to fetch
❌ Login Failed: Backend server is not reachable
```

## Testing Checklist

### **Pre-Test Setup:**
- [ ] Backend server running on correct port
- [ ] Frontend running on correct port
- [ ] Chrome Developer Tools open
- [ ] Console cleared for clean logs

### **Test Steps:**
1. [ ] Click "Continue with Google"
2. [ ] Complete OAuth flow in new tab
3. [ ] Check console for backend connectivity test
4. [ ] Check console for callback request details
5. [ ] Check console for response status and data
6. [ ] Verify only success message appears

### **Expected Results:**
- ✅ Backend health check passes
- ✅ Callback request succeeds (200 status)
- ✅ Only success message appears
- ✅ No error messages

## Files Modified

1. **`src/pages/OAuthCallbackPage.tsx`**
   - Added backend connectivity test
   - Enhanced error handling
   - Added detailed logging

2. **`src/utils/authApi.ts`**
   - Added comprehensive error logging
   - Added JSON response handling
   - Enhanced error messages

## Next Steps

If the issue persists after these enhancements:

1. **Check backend logs** - Look for specific error messages
2. **Verify Google OAuth settings** - Check callback URLs and credentials
3. **Test backend endpoints** - Use curl to test API directly
4. **Check network connectivity** - Ensure frontend can reach backend
5. **Review CORS configuration** - Ensure backend allows frontend requests

The enhanced debugging should reveal exactly what's causing the OAuth callback failure! 🔍 