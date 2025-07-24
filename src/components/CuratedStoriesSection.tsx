import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Heart, Globe, Sparkles } from 'lucide-react';
import { useCuratedStories } from '@/hooks/useCuratedStories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CuratedStoriesSectionProps {
  onStorySelect: (story: { title: string; story_content: string; genre: string; slug: string }) => void;
}

const CuratedStoriesSection: React.FC<CuratedStoriesSectionProps> = ({ onStorySelect }) => {
  const { stories, isLoading, error } = useCuratedStories();
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'rocket':
        return <Rocket className="w-8 h-8 text-blue-500" />;
      case 'heart':
        return <Heart className="w-8 h-8 text-red-500" />;
      case 'globe':
        return <Globe className="w-8 h-8 text-green-500" />;
      default:
        return <Sparkles className="w-8 h-8 text-purple-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading curated stories...</p>
      </div>
    );
  }

  if (error || stories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No curated stories available at the moment.</p>
      </div>
    );
  }

  const openComingSoonModal = () => {
    setIsComingSoonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* <div className="grid md:grid-cols-3 gap-6">
        {stories.map((story) => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                {getIcon(story.icon_name || 'sparkles')}
              </div>
              <CardTitle className="text-xl">{story.title}</CardTitle>
              <CardDescription className="text-sm">
                {story.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {story.genre}
                  </span>
                </div>
                <Button 
                  onClick={() => onStorySelect({
                    title: story.title,
                    story_content: story.story_content,
                    genre: story.genre,
                    slug: story.slug
                  })}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                >
                  Choose This Story
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      <AlertDialog open={isComingSoonModalOpen} onOpenChange={setIsComingSoonModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Coming Soon!
            </AlertDialogTitle>
            <AlertDialogDescription>
              This feature is currently under development. We're working hard to bring you exciting new pre-made adventures. Please check back later!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CuratedStoriesSection;
