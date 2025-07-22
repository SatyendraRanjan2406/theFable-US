import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onBackToForm?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onBackToForm }) => {
  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Be the Hero of your own story!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-600">Ready to Create Comic Magic?</h3>
            <p className="text-gray-500">
              Fill out the form and click "Create My Comic Story!" to see your personalized comic book come to life!
            </p>
          </div>
          {onBackToForm && (
            <Button
              onClick={onBackToForm}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-3"
            >
              <Home className="w-4 h-4 mr-2" />
              Start Your Story Journey
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
