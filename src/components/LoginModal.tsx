import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LoginForm from './LoginForm';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onOpenChange, onLoginSuccess }) => {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // When the 'login_success' item is set in another tab,
      // it means the OAuth flow was successful.
      if (event.key === 'login_success' && event.newValue) {
        toast.success('🎉 Login successful!');
        onLoginSuccess(); // This will close the modal
        // Clean up the storage item
        localStorage.removeItem('login_success');
      }
    };

    // Only listen for changes when the modal is open
    if (isOpen) {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen, onLoginSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔐 Secure Login
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 pt-2">
            Enter your phone number to receive a secure OTP code.
            <br />
            <span className="text-sm text-gray-500">Quick, secure, and hassle-free! 📱</span>
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal; 