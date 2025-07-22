import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  TrendingUp, 
  Calendar,
  Star,
  Download,
  Eye,
  BarChart3,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SidePanel from '@/components/SidePanel';
import { useContact } from '@/context/ContactContext';
import Footer from '@/components/Footer';
import { BASE_URL } from '@/config/api';

interface DashboardStats {
  totalStories: number;
  paidStories: number;
  freeStories: number;
  totalPanels: number;
  thisMonthStories: number;
  averageRating: number;
}

interface Story {
  id: string;
  title: string;
  created_at: string;
  panels_count: number;
  is_paid: boolean;
  character_name?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    paidStories: 0,
    freeStories: 0,
    totalPanels: 0,
    thisMonthStories: 0,
    averageRating: 0
  });
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { openContactModal } = useContact();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [isAuthenticated, navigate]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/api/auth/stories/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stories = await response.json();
        
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const thisMonthStories = stories.filter((story: any) => {
          const storyDate = new Date(story.created_at);
          return storyDate.getMonth() === thisMonth && storyDate.getFullYear() === thisYear;
        });

        setStats({
          totalStories: stories.length,
          paidStories: stories.filter((s: any) => s.is_paid).length,
          freeStories: stories.filter((s: any) => !s.is_paid).length,
          totalPanels: stories.reduce((sum: number, s: any) => sum + s.panels_count, 0),
          thisMonthStories: thisMonthStories.length,
          averageRating: 4.5 // Mock data
        });

        // Set recent stories (last 5)
        setRecentStories(stories.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      title: 'Create New Story',
      description: 'Start a new adventure',
      action: () => navigate('/'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: BookOpen,
      title: 'View All Stories',
      description: 'Browse your collection',
      action: () => navigate('/stories-history'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Download,
      title: 'Download Stories',
      description: 'Export your favorites',
      action: () => navigate('/stories-history'),
      gradient: 'from-green-500 to-emerald-500'
    },
    // {
    //   icon: Eye,
    //   title: 'View Analytics',
    //   description: 'See your progress',
    //   action: () => navigate('/analytics'),
    //   gradient: 'from-orange-500 to-red-500'
    // }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SidePanel isOpen={isSidePanelOpen} onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)} />
      <div className="min-h-screen bg-[#FFFDF9]">
        {/* Header with Menu Button */}
        {/* <header className="bg-white shadow-sm border-b border-slate-200">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="p-2 text-[#8D4BE5] hover:text-[#6B21A8] hover:bg-purple-50">
                <Menu className="w-5 h-5" />
              </Button>
              <span className="text-xl font-bold text-[#8D4BE5]">StoryMaker</span>
            </div>
          </nav>
        </header> */}

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            {/* <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Dashboard</h1>
              <p className="text-[#555555]">Welcome back! Here's an overview of your story creation journey.</p>
            </div> */}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-[#555555]">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#333333]">Total Stories</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#8D4BE5]">{stats.totalStories}</div>
                  <p className="text-xs text-[#555555]">
                    +{stats.thisMonthStories} this month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#333333]">Paid Stories</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.paidStories}</div>
                  <p className="text-xs text-[#555555]">
                    Premium content
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#333333]">Total Panels</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPanels}</div>
                  <p className="text-xs text-[#555555]">
                    Across all stories
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#333333]">Average Rating</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.averageRating}</div>
                  <p className="text-xs text-[#555555]">
                    Out of 5 stars
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#333333]">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white hover:scale-105"
                    onClick={action.action}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2 text-[#333333]">{action.title}</h3>
                      <p className="text-sm text-[#555555]">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#333333]">Recent Activity</h2>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  {recentStories.length > 0 ? (
                    <div className="space-y-4">
                      {recentStories.map((story) => (
                        <div key={story.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                          <div className={`w-3 h-3 rounded-full ${story.is_paid ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#333333]">
                              {story.is_paid ? 'Story completed' : 'Story created'}: "{story.title}"
                              {story.character_name && ` (${story.character_name})`}
                            </p>
                            <p className="text-xs text-[#555555]">
                              {new Date(story.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-xs text-[#555555] bg-slate-100 px-2 py-1 rounded-full">
                            {story.panels_count} panels
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-[#555555] mb-4">No stories yet. Create your first story!</p>
                      <Button 
                        onClick={() => navigate('/')} 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Story
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#333333]">Tips & Tricks</h2>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#333333]">Use detailed character descriptions</p>
                        <p className="text-xs text-[#555555]">The more details you provide, the better your story illustrations will be.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#333333]">Try different genres</p>
                        <p className="text-xs text-[#555555]">Explore various story types to discover your creative potential.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#333333]">Save your work regularly</p>
                        <p className="text-xs text-[#555555]">Don't lose your progress - save your stories to your account.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#333333]">Need Help?</h2>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg hover:bg-purple-50 transition-colors">
                      <h4 className="font-medium mb-2 text-[#333333]">Story Creation</h4>
                      <p className="text-sm text-[#555555] mb-3">
                        Having trouble creating stories? We're here to help you get started.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0" 
                        size="sm" 
                        onClick={() => navigate('/')}
                      >
                        Create New Story
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg hover:bg-blue-50 transition-colors">
                      <h4 className="font-medium mb-2 text-[#333333]">Support</h4>
                      <p className="text-sm text-[#555555] mb-3">
                        Questions or need assistance? Our support team is ready to help.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0" 
                        size="sm" 
                        onClick={openContactModal}
                      >
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
      </div>
    </div>
    </>
  );
};

export default Dashboard; 