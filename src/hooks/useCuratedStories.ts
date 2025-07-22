
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CuratedStory {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string;
  icon_name: string;
  story_content: string;
}

export const useCuratedStories = () => {
  const [stories, setStories] = useState<CuratedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCuratedStories = async () => {
      try {
        //console.log('Fetching curated stories from database...');
        
        const { data, error } = await supabase
          .from('curated_stories')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching curated stories:', error);
          throw error;
        }

        //console.log('Fetched curated stories:', data);
        setStories(data || []);
      } catch (err) {
        console.error('Failed to fetch curated stories:', err);
        setError('Failed to load curated stories');
        toast.error('Failed to load curated stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCuratedStories();
  }, []);

  const getStoryBySlug = (slug: string) => {
    return stories.find(story => story.slug === slug);
  };

  return {
    stories,
    isLoading,
    error,
    getStoryBySlug
  };
};
