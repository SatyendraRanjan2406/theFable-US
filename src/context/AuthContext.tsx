import { useState, useEffect, useCallback, createContext, ReactNode } from 'react';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: () => void;
  logout: () => void;
  storyId: string | null;
  setStoryId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const logout = useCallback(() => {
    // Clean up all authentication-related localStorage items
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('login_success');
    setIsAuthenticated(false);
    setStoryId(null); // Clear story ID on logout
    toast.success('👋 Successfully logged out!');
  }, []);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken');
      console.log('🔐 AuthContext: Checking authentication, token exists:', !!token);
      setIsAuthenticated(!!token);
      setIsInitialized(true);
    };

    // Initialize immediately
    initializeAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        console.log('🔐 AuthContext: Storage change detected, updating authentication state');
        setIsAuthenticated(!!event.newValue);
      }
    };

    const handleAuthError = () => {
      console.log('🔐 AuthContext: Auth error event received, logging out');
      logout();
      toast.error('Your session has expired. Please log in again.');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout]);

  const login = useCallback(() => {
    // Logic to set token would be here, but for now we assume it's set elsewhere
    console.log('🔐 AuthContext: Login called, setting isAuthenticated to true');
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitialized, login, logout, storyId, setStoryId }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 