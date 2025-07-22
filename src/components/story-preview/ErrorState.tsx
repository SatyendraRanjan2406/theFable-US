import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  onRetry?: () => void;
  onBackToForm?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry, onBackToForm }) => {
  const handleAction = onRetry || onBackToForm;
  const buttonText = onRetry ? 'Try Again' : 'Start Over';

  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          AI Generation Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mx-auto flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-600">Image generation stopped due to API error</h3>
            <div className="text-gray-600 space-y-2">
              <p>The AI image generation failed. This could be due to:</p>
              <ul className="text-left text-sm space-y-1 max-w-md mx-auto">
                <li>• Invalid or expired Hugging Face API key</li>
                <li>• Insufficient API credits</li>
                <li>• Rate limiting or quota exceeded</li>
                <li>• Network connectivity issues</li>
              </ul>
              <p className="text-sm mt-4">Please check your Hugging Face API key and try again.</p>
            </div>
            {handleAction && (
              <Button onClick={handleAction} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {buttonText}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorState;
