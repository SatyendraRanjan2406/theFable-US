import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BASE_URL } from '@/config/api';

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_paid: boolean;
  payment_order_id: string | null;
  panels_count: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

const StoriesHistory: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchStories();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm, filter]);

  const fetchStories = async () => {
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
        const data = await response.json();
        setStories(data);
      } else {
        toast.error('Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to fetch stories');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStories = () => {
    let filtered = stories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply payment filter
    if (filter === 'paid') {
      filtered = filtered.filter(story => story.is_paid);
    } else if (filter === 'unpaid') {
      filtered = filtered.filter(story => !story.is_paid);
    }

    setFilteredStories(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const handleEditStory = (storyId: string) => {
    console.log('🔗 Edit button clicked for story:', storyId);
    console.log('🔗 Navigating to:', `/?editStoryId=${storyId}`);
    navigate(`/?editStoryId=${storyId}`);
  };

  const handleDownloadStory = (story: Story) => {
    // Create a text file with the story content
    const blob = new Blob([story.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Story downloaded successfully!');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins ">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#8D4BE5] hover:text-[#6B21A8] transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#8D4BE5] mb-2">Stories History</h1>
          <p className="text-[#555555]">View and manage all your created stories</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#555555] w-4 h-4" />
              <Input
                placeholder="Search stories by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-[#8D4BE5] focus:ring-[#8D4BE5]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
              className={filter === 'all' ? 'bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white border-0' : 'border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white'}
            >
              All
            </Button>
            <Button
              variant={filter === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilter('paid')}
              size="sm"
              className={filter === 'paid' ? 'bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white border-0' : 'border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white'}
            >
              Paid
            </Button>
            <Button
              variant={filter === 'unpaid' ? 'default' : 'outline'}
              onClick={() => setFilter('unpaid')}
              size="sm"
              className={filter === 'unpaid' ? 'bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white border-0' : 'border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white'}
            >
              Unpaid
            </Button>
          </div>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-[#555555]">Loading stories...</div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[#8D4BE5] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#333333] mb-2">No stories found</h3>
            <p className="text-[#555555]">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start creating your first story!'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button 
                onClick={() => navigate('/')}
                className="mt-4 bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white border-0"
              >
                Create Your First Story
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-[#333333] line-clamp-2">
                      {story.title}
                    </CardTitle>
                    <Badge variant={story.is_paid ? "default" : "secondary"} className={story.is_paid ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" : "bg-gray-100 text-gray-700"}>
                      {story.is_paid ? 'Paid' : 'Free'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-[#555555] line-clamp-3">
                    {story.content.substring(0, 150)}...
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-[#555555]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(story.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{story.panels_count} panels</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStory(story.id)}
                      className="flex-1 border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStory(story.id)}
                      className="flex-1 border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadStory(story)}
                      className="border-[#8D4BE5] text-[#8D4BE5] hover:bg-[#8D4BE5] hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && stories.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-[#333333]">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8D4BE5]">{stories.length}</div>
                <div className="text-sm text-[#555555]">Total Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stories.filter(s => s.is_paid).length}
                </div>
                <div className="text-sm text-[#555555]">Paid Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#EC6B43]">
                  {stories.filter(s => !s.is_paid).length}
                </div>
                <div className="text-sm text-[#555555]">Free Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D946EF]">
                  {stories.reduce((sum, s) => sum + s.panels_count, 0)}
                </div>
                <div className="text-sm text-[#555555]">Total Panels</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StoriesHistory; 