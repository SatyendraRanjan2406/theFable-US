import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  CreditCard, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Plus,
  Calendar,
  User,
  Sparkles,
  Crown,
  Star,
  Home,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { BASE_URL } from '@/config/api';


interface Story {
  id: string;
  title: string;
  created_at: string;
  panels_count: number;
  is_paid: boolean;
  referred_curated_story_id?: string; // To differentiate curated stories
  character_name?: string; // For curated stories
  genre?: string; // For curated stories
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface SidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onLoginClick?: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onToggle, onLoginClick }) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch recent stories when history is expanded
  const fetchRecentStories = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingStories(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/api/auth/stories/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Take only the first 10 stories (to show both AI and curated)
        setRecentStories(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch recent stories:', error);
    } finally {
      setIsLoadingStories(false);
    }
  };

  const handleHistoryToggle = () => {
    if (!isHistoryExpanded) {
      fetchRecentStories();
    }
    setIsHistoryExpanded(!isHistoryExpanded);
  };

  const handleViewMoreStories = () => {
    if (!isAuthenticated) {
      onLoginClick?.();
      onToggle(); // Close panel
      return;
    }
    navigate('/stories-history');
    onToggle(); // Close panel after navigation
  };

  // Helper function to handle navigation with authentication check
  const handleNavigation = (path: string, callback?: () => void) => {
    if (!isAuthenticated && path !== '/') {
      onLoginClick?.();
      onToggle(); // Close panel
      return;
    }
    
    if (callback) {
      callback();
    } else {
      navigate(path);
    }
    onToggle(); // Close panel after navigation
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      onClick: () => {
        // If we're on the index page, trigger home navigation via localStorage
        if (location.pathname === '/') {
          localStorage.setItem('navigateToHome', 'true');
          // Force a re-render by dispatching a custom event
          window.dispatchEvent(new Event('storage'));
        } else {
          // Otherwise navigate to home page
          navigate('/');
        }
        // Close the side panel after navigation
        onToggle();
      },
      gradient: 'from-[#EC6B43] to-[#D946EF]'
    },
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      onClick: () => handleNavigation('/dashboard'),
      gradient: 'from-[#EC6B43] to-[#D946EF]'
    },
    {
      icon: History,
      label: 'History',
      path: '/history',
      onClick: () => {
        if (!isAuthenticated) {
          onLoginClick?.();
          onToggle(); // Close panel
          return;
        }
        handleHistoryToggle();
      },
      isExpandable: true,
      gradient: 'from-[#EC6B43] to-[#D946EF]'
    },
    // {
    //   icon: Settings,
    //   label: 'Settings',
    //   path: '/settings',
    //   onClick: () => navigate('/settings')
    // },
    {
      icon: CreditCard,
      label: 'Payments',
      path: '/payments',
      onClick: () => handleNavigation('/payments'),
      gradient: 'from-[#EC6B43] to-[#D946EF]'
    }
  ];

  return (
    <div className={`fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-[#FFFDF9] text-[#333333] font-poppins border-r border-slate-200 shadow-xl transition-transform duration-300 ease-in-out z-[9999] flex flex-col w-[300px] ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 text-[#8D4BE5] hover:text-[#6B21A8] hover:bg-purple-50 rounded-lg transition-all duration-200 bg-white border-0 shadow-none"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {navItems.map((item) => (
            <div key={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start h-12 rounded-xl transition-all duration-200 ${
                  isActive(item.path) 
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]` 
                    : 'hover:bg-purple-50 hover:shadow-md text-[#333333]'
                }`}
                onClick={item.onClick}
              >
                <div className={`p-1.5 rounded-lg ${isActive(item.path) ? 'bg-white/20' : 'bg-purple-100'}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="ml-3 font-medium">{item.label}</span>
                {item.isExpandable && (
                  <div className="ml-auto">
                    {isHistoryExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </Button>

              {/* Expandable History Content */}
              {item.isExpandable && isHistoryExpanded && (
                <div className="mt-3 ml-2 space-y-3">
                  {isLoadingStories ? (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 flex flex-col gap-3">
                          <Skeleton className="h-4 w-2/3 rounded-lg" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-16 rounded-lg" />
                            <Skeleton className="h-3 w-10 rounded-lg" />
                          </div>
                          <Skeleton className="h-3 w-20 rounded-lg" />
                        </div>
                      ))}
                    </>
                  ) : recentStories.length > 0 ? (
                    <>
                      {/* Separate AI and Curated Stories */}
                      {(() => {
                        const aiStories = recentStories.filter(story => !story.referred_curated_story_id);
                        const curatedStories = recentStories.filter(story => story.referred_curated_story_id);
                        
                        return (
                          <>
                            {/* AI Stories Section */}
                            {aiStories.length > 0 && (
                              <>
                                <div className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" />
                                  AI-Generated Stories
                                </div>
                                {aiStories.map((story, idx) => (
                                  <div
                                    key={`ai-${story.id}`}
                                    className="p-4 bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-sm border border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col gap-2 group hover:scale-[1.02]"
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        onLoginClick?.();
                                        onToggle(); // Close panel
                                        return;
                                      }
                                      navigate(`/?editStoryId=${story.id}`);
                                      onToggle(); // Close panel after navigation
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`p-2 rounded-lg ${story.is_paid ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}>
                                        <BookOpen className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-[#333333] truncate block group-hover:text-[#8D4BE5] transition-colors">
                                          {story.title}
                                        </span>
                                        {/* Full Name Display */}
                                        <div className="flex items-center gap-1 mt-1">
                                          <User className="w-3 h-3 text-purple-400" />
                                          <span className="text-xs text-purple-600 font-medium">
                                            {story.user?.first_name} {story.user?.last_name}
                                          </span>
                                          {story.is_paid && (
                                            <Crown className="w-3 h-3 text-yellow-500 ml-1" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-purple-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> 
                                        {formatDate(story.created_at)}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        story.panels_count > 0 
                                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200' 
                                          : 'bg-purple-100 text-purple-500'
                                      }`}>
                                        {story.panels_count} panels
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Curated Stories Section */}
                            {curatedStories.length > 0 && (
                              <>
                                <div className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-2">
                                  <Crown className="w-3 h-3" />
                                  Curated Stories
                                </div>
                                {curatedStories.map((story, idx) => (
                                  <div
                                    key={`curated-${story.id}`}
                                    className="p-4 bg-gradient-to-br from-white to-pink-50 rounded-xl shadow-sm border border-pink-200 cursor-pointer hover:shadow-lg transition-all duration-200 flex flex-col gap-2 group hover:scale-[1.02]"
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        onLoginClick?.();
                                        onToggle(); // Close panel
                                        return;
                                      }
                                      navigate(`/?editStoryId=${story.id}`);
                                      onToggle(); // Close panel after navigation
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`p-2 rounded-lg ${story.is_paid ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-pink-400 to-purple-400'}`}>
                                        <Crown className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-[#333333] truncate block group-hover:text-[#8D4BE5] transition-colors">
                                          {story.title}
                                        </span>
                                        {/* Character and Genre Display */}
                                        <div className="flex items-center gap-1 mt-1">
                                          <User className="w-3 h-3 text-pink-400" />
                                          <span className="text-xs text-pink-600 font-medium">
                                            {story.character_name} • {story.genre}
                                          </span>
                                          {story.is_paid && (
                                            <Crown className="w-3 h-3 text-yellow-500 ml-1" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-pink-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> 
                                        {formatDate(story.created_at)}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        story.panels_count > 0 
                                          ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border border-pink-200' 
                                          : 'bg-pink-100 text-pink-500'
                                      }`}>
                                        {story.panels_count} panels
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        );
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs mt-3 h-10 rounded-xl border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 transition-all duration-200"
                        onClick={handleViewMoreStories}
                      >
                        <Star className="w-3 h-3 mr-2" />
                        View More Stories
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-purple-600 text-center py-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-fit mx-auto mb-3">
                        <Sparkles className="w-5 h-5 text-[#8D4BE5]" />
                      </div>
                      <span className="block font-medium text-[#333333] mb-1">No stories yet</span>
                      <span className="text-xs">Start creating your first magical story!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section with gradient - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border border-purple-200">
          <div className="p-2 bg-gradient-to-r from-[#8D4BE5] to-[#D946EF] rounded-lg">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#333333]">
              {isAuthenticated ? 'Welcome back!' : 'Guest User'}
            </span>
            <div className="text-xs text-purple-600">
              {isAuthenticated ? 'Ready to create magic?' : 'Sign in to save stories'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel; 