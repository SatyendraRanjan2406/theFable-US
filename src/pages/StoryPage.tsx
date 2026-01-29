import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NavigationBar from '@/components/NavigationBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BASE_URL } from '@/config/api';
import { apiFetch } from '@/utils/apiInterceptor';

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_paid: boolean;
  panels_count: number;
}

const StoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchStory();
    // eslint-disable-next-line
  }, [id, isAuthenticated]);

  const fetchStory = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`${BASE_URL}/api/auth/stories/${id}/`);
      setStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
      navigate('/stories-history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar
        isAuthenticated={isAuthenticated}
        onLoginClick={() => navigate('/')}
        onLogout={logout}
        onMenuToggle={() => navigate('/dashboard')}
      />
      <div className="max-w-3xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/stories-history')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stories History
        </Button>
        {isLoading ? (
          <div className="text-center text-gray-500 py-20">Loading story...</div>
        ) : story ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold mb-2">{story.title}</h1>
            <div className="text-xs text-gray-400 mb-4">
              Created: {new Date(story.created_at).toLocaleString()} | {story.panels_count} panels
            </div>
            <div className="prose max-w-none text-gray-800 whitespace-pre-line">
              {story.content}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">Story not found.</div>
        )}
      </div>
    </div>
  );
};

export default StoryPage; 