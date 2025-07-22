
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Image as ImageIcon, Wand2, Palette } from 'lucide-react';

interface ProcessedImageDisplayProps {
  processedImageUrl: string | null;
  originalPhoto: File | null;
  characterName: string;
  isProcessing: boolean;
}

const ProcessedImageDisplay: React.FC<ProcessedImageDisplayProps> = ({
  processedImageUrl,
  originalPhoto,
  characterName,
  isProcessing
}) => {
  // Show component if we have a photo, are processing, or have a processed image
  if (!originalPhoto && !processedImageUrl && !isProcessing) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center justify-center gap-2">
            {processedImageUrl ? <Palette className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            Storybook Character Preview
          </h3>
          
          <div className="space-y-4">
            {/* Character Photo Display */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">
                {isProcessing ? 'Creating Storybook Character Illustration...' : processedImageUrl ? 'Enhanced Storybook Character' : 'Your Character Photo'}
              </p>
              <div className="relative">
                {isProcessing ? (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-purple-200 flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                      <p className="text-purple-600 font-medium">Creating storybook character...</p>
                      <p className="text-sm text-purple-500">Professional children's book illustration</p>
                    </div>
                  </div>
                ) : (processedImageUrl || originalPhoto) ? (
                  <div className="relative">
                    <img
                      src={processedImageUrl || URL.createObjectURL(originalPhoto!)}
                      alt={characterName ? `Character ${characterName}` : 'Character preview'}
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-200 mx-auto"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        // If processed image fails, try original
                        if (processedImageUrl && originalPhoto) {
                          (e.target as HTMLImageElement).src = URL.createObjectURL(originalPhoto);
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      {processedImageUrl ? (
                        <>
                          <Palette className="w-3 h-3" />
                          Storybook Style
                        </>
                      ) : (
                        <>
                          📸 Original
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <p>No photo uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {processedImageUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium text-sm">
                🎨 Storybook character illustration ready for your adventure!
              </p>
            </div>
          )}
          
          {originalPhoto && !processedImageUrl && !isProcessing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-medium text-sm">
                📸 Photo uploaded! Fill in character details to create a storybook-style illustration.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessedImageDisplay;
