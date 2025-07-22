import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';

interface NavigationBarProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ isAuthenticated, onLoginClick, onLogout, onMenuToggle }) => {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button variant="ghost" size="sm" onClick={onMenuToggle} className="p-2">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link to="/" className="text-2xl font-bold text-gray-800">
            StoryMaker
          </Link>
        </div>
        <div>
          {isAuthenticated ? (
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button variant="outline" onClick={onLoginClick}>
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default NavigationBar; 