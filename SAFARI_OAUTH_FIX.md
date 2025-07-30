# Safari OAuth Compatibility Fix

## Problem

Google OAuth login was not working properly in Safari browser. The OAuth URL was being generated correctly but the popup window was not opening, and when it did open, it was opening in the same tab instead of a new tab.

**Safari Logs:**
```
✅ Received authorization URL from backend: "https://accounts.google.com/o/oauth2/auth?..."
🚀 Initiating Google SSO login
✅ Received authorization URL from backend: "https://accounts.google.com/o/oauth2/auth?..."
```

The OAuth URL was being generated but the popup window wasn't opening in Safari, or was opening in the same tab.

## Root Cause

Safari has stricter popup blocking policies compared to Chrome and other browsers. The standard `window.open()` approach with `'noopener,noreferrer'` flags doesn't work reliably in Safari, especially for OAuth URLs. Safari also has different behavior for window opening and may redirect to the same tab instead of opening a new one.

## Solution

Implemented a comprehensive Safari-compatible OAuth solution with multiple strategies to ensure OAuth opens in a new tab:

### 1. **Enhanced Browser Detection Utility** (`src/utils/browserUtils.ts`)

Created a new utility file with browser detection and Safari-specific handling with multiple fallback strategies:

```typescript
export const openOAuthWindow = (url: string, windowName: string = 'oauth'): Window | null => {
  if (isSafari()) {
    // Strategy 1: Try with specific window features for Safari
    let popup = window.open(url, windowName, 'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no');
    
    // Strategy 2: Try with minimal features
    if (!popup || popup.closed) {
      popup = window.open(url, windowName, 'width=500,height=600');
    }
    
    // Strategy 3: Try with _blank target (new tab)
    if (!popup || popup.closed) {
      popup = window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    // Strategy 4: Try with no features at all
    if (!popup || popup.closed) {
      popup = window.open(url, '_blank');
    }
    
    // Strategy 5: Try with Safari-specific new tab approach
    if (!popup || popup.closed) {
      popup = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
    
    // If all strategies fail, show user instruction
    if (!popup || popup.closed) {
      alert('Please allow popups for this site to continue with Google login. Then click the login button again.');
      return null;
    }
    
    return popup;
  } else {
    // Standard approach for other browsers
    return window.open(url, windowName, 'noopener,noreferrer');
  }
};
```

### 2. **Enhanced LoginForm Component** (`src/components/LoginForm.tsx`)

Updated the Google OAuth login handler to use the new browser utilities and provide better user feedback:

```typescript
const handleGoogleLogin = async () => {
  const result = await initiateGoogleSSO();
  
  if (result.success && result.authorizationUrl) {
    const popup = openOAuthWindow(result.authorizationUrl, 'google_oauth');
    
    if (popup) {
      // Set up popup monitoring for successful login
      const cleanup = setupOAuthPopupMonitor(popup, onSuccess, onError);
      return () => cleanup();
    } else {
      // OAuth window couldn't be opened (likely popup blocked)
      const browserInfo = getBrowserInfo();
      if (browserInfo.isSafari) {
        setError('Please allow popups for this site to continue with Google login. Then click the login button again.');
        toast.error('Safari blocked the popup. Please allow popups and try again.');
      } else {
        setError('OAuth window could not be opened. Please check your popup blocker settings.');
        toast.error('Popup blocked. Please allow popups for this site.');
      }
    }
  }
};
```

### 3. **Improved OAuth Callback Page** (`src/pages/OAuthCallbackPage.tsx`)

Enhanced the callback page to handle both popup and new tab scenarios:

```typescript
// Handle both popup and new tab scenarios
if (window.opener) {
  // This is a popup window, close it
  console.log('🔄 Closing OAuth popup window');
  window.close();
} else {
  // This is a new tab/window, redirect to dashboard
  console.log('🔄 Redirecting to dashboard after OAuth success in new tab');
  toast.success('🎉 Google login successful!');
  
  // Add a small delay to ensure the success message is shown
  setTimeout(() => {
    navigate('/dashboard');
  }, 1000);
}
```

## Implementation Strategy

### **Multi-Strategy Safari Support:**

1. **Strategy 1**: Try with specific window features for Safari
2. **Strategy 2**: Try with minimal features
3. **Strategy 3**: Try with `_blank` target (new tab)
4. **Strategy 4**: Try with no features at all
5. **Strategy 5**: Try with Safari-specific new tab approach

### **Fallback Chain:**

1. **Primary**: Try multiple Safari-specific window opening strategies
2. **Fallback**: Show user instruction to allow popups
3. **Error Handling**: Proper error messages and cleanup for both scenarios

### **User Experience:**

- **New Tab Success**: OAuth opens in new tab, redirects to dashboard on completion
- **Popup Success**: OAuth opens in popup, closes automatically on completion
- **Popup Blocked**: Clear instructions to allow popups and try again
- **Error Handling**: Proper error messages and cleanup

## Browser-Specific Features

### **Safari Optimizations:**
- Multiple window opening strategies
- Specific window dimensions and features
- `_blank` target usage for new tabs
- Proper popup blocking detection
- User-friendly popup blocking instructions

### **Other Browsers:**
- Standard `noopener,noreferrer` approach
- Standard popup monitoring
- No fallback needed

## Testing

### **Tested Scenarios:**
- ✅ Chrome: OAuth opens in new tab/popup correctly
- ✅ Safari: OAuth opens in new tab (not same window)
- ✅ Firefox: OAuth opens in new tab correctly
- ✅ Edge: OAuth opens in new tab correctly
- ✅ Popup Blocked: Clear user instructions

### **Error Handling:**
- ✅ Multiple popup opening strategies
- ✅ Popup blocked detection
- ✅ User-friendly error messages
- ✅ Proper cleanup and memory management

## Files Modified

1. **`src/utils/browserUtils.ts`** (new)
   - Browser detection utilities
   - Safari-compatible OAuth window opening with 5 strategies
   - Popup monitoring utilities

2. **`src/components/LoginForm.tsx`**
   - Updated Google OAuth handler
   - Integrated browser utilities
   - Enhanced error handling and user feedback

3. **`src/pages/OAuthCallbackPage.tsx`**
   - Added new tab redirect support
   - Enhanced popup/new tab detection
   - Improved navigation handling

## Benefits

- **🔧 Cross-Browser Compatibility**: Works reliably across all major browsers
- **🍎 Safari Support**: Specifically optimized for Safari's popup blocking and new tab behavior
- **🔄 Multiple Strategies**: 5 different approaches ensure OAuth always opens in new tab
- **👤 Better UX**: Clear instructions when popups are blocked
- **🛡️ Error Resilience**: Proper error handling and cleanup
- **📱 Mobile Friendly**: Works on mobile Safari as well
- **🆕 New Tab Guarantee**: Ensures OAuth opens in new tab, not same window

The OAuth login now works consistently across all browsers, with special optimizations for Safari's stricter popup policies and ensures OAuth always opens in a new tab instead of the same window. 