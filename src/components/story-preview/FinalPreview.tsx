import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ComicBook from '../ComicBook';
import StoryActions from '../StoryActions';
import { useSearchParams } from 'react-router-dom';

interface FinalPreviewProps {
  story: string;
  characterName: string;
  characterPhoto: string | null;
  genre: string;
  showBackButton: boolean;
  onBackToForm?: () => void;
  getSceneImage: (text: string, genre: string, index: number) => Promise<string>;
  loadingImages: {[key: string]: boolean};
  hfApiKey: string;
  cleanPanelTextForDisplay: (text: string) => string;
  generatedImages: {[key: string]: string};
  onRegenerateStory?: () => void;
  isRegenerating?: boolean;
  images?: (string | null)[];
  characterPhotoFile?: File | null;
  onGenerateLockedImages?: () => Promise<void>;
  onRetryImage?: (index: number) => void;
  errorImages?: {[key: string]: boolean};
  retryLoadingPanels?: {[key: string]: boolean};
  onUnlockRequest?: () => void;
  onRegeneratePanelImage?: (index: number) => Promise<void>;
  regeneratingPanels?: { [key: number]: boolean };
  isGeneratingImages?: boolean;
  lockedPanels?: boolean[];
  isCreatingMagic?: boolean;
  title?: string; // NEW: story title
  storyId?: string; // NEW: story ID for edit mode
  panels?: any[]; // NEW: panels data from API for edit mode
  isPaid?: boolean; // NEW: payment status for edit mode
}

const FinalPreview: React.FC<FinalPreviewProps> = ({
  story,
  characterName,
  characterPhoto,
  genre,
  showBackButton,
  onBackToForm,
  getSceneImage,
  loadingImages,
  hfApiKey,
  cleanPanelTextForDisplay,
  generatedImages,
  onRegenerateStory,
  isRegenerating,
  images,
  characterPhotoFile,
  onGenerateLockedImages,
  onRetryImage,
  errorImages = {},
  retryLoadingPanels = {},
  onUnlockRequest,
  onRegeneratePanelImage,
  regeneratingPanels,
  isGeneratingImages,
  lockedPanels,
  isCreatingMagic,
  title,
  storyId,
  panels,
  isPaid,
}) => {
  const genreEmojis = {
    adventure: '🗺️',
    fairytale: '🏰',
    romance: '💕',
    humour: '😄'
  };

  const genreColors = {
    adventure: 'from-green-400 via-emerald-400 to-teal-500',
    fairytale: 'from-purple-400 via-pink-400 to-rose-500',
    romance: 'from-pink-400 via-rose-400 to-red-400',
    humour: 'from-yellow-400 via-orange-400 to-red-400'
  };

  

  return (
    <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-fit rounded-2xl overflow-hidden">
      <CardHeader className={`bg-gradient-to-r ${genreColors[genre as keyof typeof genreColors] || 'from-purple-500 to-pink-500'} text-white`}>
        <CardTitle className="text-2xl flex items-center gap-3 justify-center">
          <span className="text-3xl">{genreEmojis[genre as keyof typeof genreEmojis] || '📖'}</span>
          <div className="text-center">
            <div className="text-2xl font-bold">{title || `${characterName}'s Amazing Story!`}</div>
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full mt-1 inline-block">
              {genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure
            </div>
          </div>
          <span className="text-3xl">✨</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Back button */}
        {showBackButton && onBackToForm && (
          <Button
            onClick={onBackToForm}
            variant="outline"
            className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-3"
          >
            ← {storyId ? 'Back to Stories' : 'Create Another Story'}
          </Button>
        )}

        {/* Success message */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <p className="text-center text-green-700 font-medium">
            🎉 Your personalized story is ready! 🎉
            {characterPhoto ? (
              <>
                <br />
                <span className="text-sm">✨ Your photo has been magically transformed into story illustrations! ✨</span>
              </>
            ) : (
              <>
                <br />
                <span className="text-sm">🌟 Beautiful illustrations created just for your story! 🌟</span>
              </>
            )}
          </p>
        </div>

        {/* Free vs Premium message */}
        {images && images.length > 2 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                🎨 Your Storybook Preview
              </h3>
              <p className="text-sm text-blue-600 mb-3">
                You have <span className="font-bold text-green-600">2 free illustrations</span> and{' '}
                <span className="font-bold text-purple-600">4 premium illustrations</span> to unlock!
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Free (2)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Premium (4)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Character Photo Display */}
        {characterPhoto && (
          <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="relative inline-block">
              <img
                src={characterPhoto}
                alt={characterName}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                <span className="text-xl">⭐</span>
              </div>
            </div>
            <p className="text-lg font-bold text-purple-700 mt-3">Starring: {characterName}!</p>
            <p className="text-sm text-green-600 mt-2 font-medium">
              🎭 You're the main character in this amazing adventure! 🎭
            </p>
          </div>
        )}

        {/* Story Content */}
        <ComicBook
          story={story}
          genre={genre}
          characterPhoto={characterPhoto}
          characterName={characterName}
          getSceneImage={getSceneImage}
          loadingImages={loadingImages}
          openaiApiKey={hfApiKey}
          cleanPanelTextForDisplay={cleanPanelTextForDisplay}
          onRestartForm={onBackToForm}
          images={images}
          characterPhotoFile={characterPhotoFile}
          onGenerateLockedImages={onGenerateLockedImages}
          onRetryImage={onRetryImage}
          errorImages={errorImages}
          retryLoadingPanels={retryLoadingPanels}
          onUnlockRequest={onUnlockRequest}
          onRegenerate={onRegeneratePanelImage}
          regeneratingPanels={regeneratingPanels}
          isGeneratingImages={isGeneratingImages}
          lockedPanels={lockedPanels}
          isCreatingMagic={isCreatingMagic}
          title={title}
          panels={panels}
          isPaid={isPaid}
        />

        {/* Action Buttons */}
        <StoryActions
          story={story}
          characterName={characterName}
          characterPhoto={characterPhoto}
          genre={genre}
          generatedImages={images || generatedImages}
          onRegenerateStory={onRegenerateStory}
          isRegenerating={isRegenerating}
          lockedPanels={lockedPanels}
          onUnlockRequest={onUnlockRequest}
          title={title}
          panels={panels}
          isPaid={isPaid}
        />

        <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
          <p className="text-lg text-purple-600 font-medium">
            🌈 Every child deserves to be the hero of their own amazing story! 🌈
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Share your story with friends and family! 📚✨
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalPreview;
