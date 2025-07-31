/**
 * Browser utilities for OAuth and popup handling
 * Provides cross-browser compatible OAuth popup monitoring
 */

// Browser detection
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  return {
    isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isEdge: /Edge/.test(userAgent),
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  };
};

// Safari detection
export const isSafari = (): boolean => {
  return getBrowserInfo().isSafari;
};

/**
 * Opens OAuth window with browser-specific optimizations
 */
export const openOAuthWindow = (url: string, windowName: string = 'oauth'): Window | null => {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isSafari) {
    console.log('🍎 Safari detected - using Safari-specific OAuth handling');
    console.log('🔗 OAuth URL:', url);
    
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
    
    console.log('🍎 Strategy 1 result:', { popup: !!popup, closed: popup?.closed });
    
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

/**
 * Sets up OAuth popup monitoring with multiple fallback strategies
 */
export const setupOAuthPopupMonitor = (
  popup: Window,
  onSuccess: () => void,
  onError?: () => void
): (() => void) => {
  const browserInfo = getBrowserInfo();
  console.log('👀 Setting up OAuth popup monitor');
  console.log('🍎 Safari detected:', browserInfo.isSafari);
  console.log('📊 Popup info:', {
    closed: popup.closed,
    typeofClosed: typeof popup.closed,
    hasOpener: !!window.opener
  });

  // Track if login was successful to prevent race conditions
  let loginSuccessful = false;

  if (browserInfo.isSafari) {
    console.log('🍎 Using Safari-specific OAuth monitoring');
    
    // Safari-specific monitoring: check for login success periodically
    const checkSuccess = setInterval(() => {
      const loginSuccess = localStorage.getItem('login_success');
      if (loginSuccess && !loginSuccessful) {
        clearInterval(checkSuccess);
        localStorage.removeItem('login_success');
        loginSuccessful = true;
        console.log('✅ Safari OAuth login successful (periodic check)');
        onSuccess();
      }
    }, 2000); // Check every 2 seconds

    // Also monitor popup close as backup
    const checkClosed = setInterval(() => {
      try {
        if (popup.closed || typeof popup.closed === 'undefined') {
          // Check for login success one more time, but only if not already successful
          if (!loginSuccessful) {
            const loginSuccess = localStorage.getItem('login_success');
            if (loginSuccess) {
              localStorage.removeItem('login_success');
              loginSuccessful = true;
              console.log('✅ Safari OAuth login successful (after close)');
              onSuccess();
            } else {
              console.log('❌ Safari OAuth login failed or incomplete');
              onError?.();
            }
          } else {
            console.log('✅ Safari OAuth login already successful, ignoring close event');
          }
        }
      } catch (error) {
        console.log('🔄 Safari popup monitoring error (likely new tab):', error);
      }
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(checkSuccess);
      clearInterval(checkClosed);
    };
  } else {
    // Standard popup monitoring for other browsers
    const checkClosed = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkClosed);
          const loginSuccess = localStorage.getItem('login_success');
          if (loginSuccess) {
            localStorage.removeItem('login_success');
            console.log('✅ OAuth login successful');
            onSuccess();
          } else {
            console.log('❌ OAuth login failed or incomplete');
            onError?.();
          }
        }
      } catch (error) {
        console.log('🔄 Popup monitoring error:', error);
      }
    }, 1000);

    return () => clearInterval(checkClosed);
  }
};

/**
 * Enhanced OAuth login handler with proper popup monitoring
 */
export const handleOAuthLogin = async (
  authorizationUrl: string,
  onSuccess: () => void,
  onError?: (error: string) => void
): Promise<(() => void) | void> => {
  const browserInfo = getBrowserInfo();
  console.log('🚀 Starting OAuth login with browser:', browserInfo);

  // Open OAuth window
  const popup = openOAuthWindow(authorizationUrl, 'google_oauth');
  
  if (!popup) {
    const errorMsg = browserInfo.isSafari 
      ? 'Safari blocked the popup. Please allow popups and try again.'
      : 'Popup blocked. Please allow popups for this site.';
    onError?.(errorMsg);
    return;
  }

  // Track if login was successful to prevent race conditions
  let loginSuccessful = false;

  // Method 1: Popup monitoring
  const cleanup = setupOAuthPopupMonitor(
    popup,
    () => {
      // Success callback
      if (!loginSuccessful) {
        loginSuccessful = true;
        // Small delay to ensure proper order of execution
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    },
    () => {
      // Error callback - only fire if login wasn't already successful
      if (!loginSuccessful) {
        onError?.('OAuth login was interrupted or failed.');
      }
    }
  );

  // Method 2: Storage event listener (backup)
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'login_success' && event.newValue && !loginSuccessful) {
      console.log('🔄 Storage event detected: OAuth login successful');
      loginSuccessful = true;
      localStorage.removeItem('login_success');
      // Small delay to ensure proper order of execution
      setTimeout(() => {
        onSuccess();
      }, 100);
      window.removeEventListener('storage', handleStorageChange);
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // Method 3: Safari-specific timeout fallback
  if (browserInfo.isSafari) {
    const safariTimeout = setTimeout(() => {
      const loginSuccess = localStorage.getItem('login_success');
      if (loginSuccess && !loginSuccessful) {
        loginSuccessful = true;
        localStorage.removeItem('login_success');
        console.log('✅ Safari OAuth login successful (timeout fallback)');
        // Small delay to ensure proper order of execution
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    }, 10000); // Check after 10 seconds

    // Return cleanup function that includes timeout
    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(safariTimeout);
    };
  }

  // Return cleanup function
  return () => {
    cleanup();
    window.removeEventListener('storage', handleStorageChange);
  };
}; 