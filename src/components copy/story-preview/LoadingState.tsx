
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface LoadingStateProps {
  isRegenerating: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isRegenerating }) => {
  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="w-6 h-6 animate-spin" />
          {isRegenerating ? 'Regenerating Storybook Magic...' : 'Creating Storybook Magic...'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mx-auto mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
          <p className="text-lg text-purple-600 font-medium">
            {isRegenerating ? 'Redrawing your storybook adventure...' : 'Drawing your storybook adventure...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
