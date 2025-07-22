import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Heart, Star, Gift } from 'lucide-react';
import FormFields from './FormFields';
import ProcessedImageDisplay from './ProcessedImageDisplay';
import { useAuth } from '@/hooks/useAuth';
import { trackStoryCreationStarted } from '@/utils/gtm';

interface StoryFormProps {
  formData: {
    characterName: string;
    characterAge: string;
    characterGender: string;
    photo: File | null;
    genre: string;
    bookType: string;
    message: string;
    storyOutline: string;
    cartoonImageUrl?: string | null;
  };
  onInputChange: (field: string, value: string) => void;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  onCartoonSelect?: (cartoonUrl: string) => void;
  onCartoonRemove?: () => void;
  onPhotoChosenForStory?: (photoUrl: string, isCartoon: boolean) => void;
  onGenerateStory: () => void;
  onLoginClick: () => void;
  isGenerating: boolean;
  isProcessingImage?: boolean;
  isCompressingPhoto?: boolean;
  buttonText?: string;
  processedImageUrl?: string | null;
}

const StoryForm: React.FC<StoryFormProps> = ({
  formData,
  onInputChange,
  onPhotoUpload,
  onPhotoRemove,
  onCartoonSelect,
  onCartoonRemove,
  onPhotoChosenForStory,
  onGenerateStory,
  onLoginClick,
  isGenerating,
  isProcessingImage = false,
  isCompressingPhoto = false,
  buttonText = "Create Their Special Story!",
  processedImageUrl
}) => {
  const { isAuthenticated } = useAuth();

  const handleGenerateClick = () => {
    if (true) {//isAuthenticated) {
      trackStoryCreationStarted('main_cta_button');

      onGenerateStory();
    } else {
      onLoginClick();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white">
          <CardTitle className="text-2xl flex items-center gap-3 justify-center">
            <Gift className="w-7 h-7" />
            <div className="text-center">
              <div className="text-2xl font-bold">Create Their Perfect Gift!</div>
              <div className="text-sm opacity-90 mt-1">A personalized story that sparks imagination & love for reading 📚</div>
            </div>
            <Star className="w-7 h-7" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* <div className="bg-gradient-to-r from-blue-50 to-pink-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-center text-blue-700 font-medium">
              📸 Upload their photo to make them the hero of their own adventure! 🦸‍♀️🦸‍♂️
              <br />
              <span className="text-sm text-blue-600">This special gift will encourage them to read more and activate their imagination!</span>
            </p>
          </div> */}

          <FormFields
            formData={formData}
            onInputChange={onInputChange}
            onPhotoUpload={onPhotoUpload}
            onPhotoRemove={onPhotoRemove}
            onCartoonSelect={onCartoonSelect}
            onCartoonRemove={onCartoonRemove}
            onPhotoChosenForStory={onPhotoChosenForStory}
            isCompressingPhoto={isCompressingPhoto}
          />

          {isProcessingImage && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3 text-purple-700 justify-center">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span className="font-medium">✨ Preparing their character for the adventure... ✨</span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating || isProcessingImage}
            className="w-full text-lg py-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                🎪 Crafting Their Special Story...
              </>
            ) : isProcessingImage ? (
              <>
                <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                🎨 Getting Their Character Ready...
              </>
            ) : (
              <>
                <BookOpen className="w-6 h-6 mr-3" />
                🚀 {buttonText}
              </>
            )}
          </Button>

          <div className="text-center bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-3">
            <p className="text-blue-600 font-medium">
              🎁 Ready to create a gift that will inspire them to read and dream? Let's begin! ✨
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processed Image Display */}
      {/* <ProcessedImageDisplay
        processedImageUrl={processedImageUrl}
        originalPhoto={formData.photo}
        characterName={formData.characterName}
        isProcessing={isProcessingImage}
      /> */}
    </div>
  );
};

export default StoryForm;
