import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { trackPhotosRegenerated } from '@/utils/gtm';

interface ComicPanelProps {
  // Panel data from database (preferred)
  panelData?: {
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  // Individual panel props for direct access
  panelText?: string;
  imagePrompt?: string;
  panelIndex: number;
  genre: string;
  characterPhoto: string | null;
  characterName: string;
  getSceneImage: (text: string, genre: string, index: number) => Promise<string>;
  isLoading: boolean;
  openaiApiKey: string;
  cleanPanelTextForDisplay: (text: string) => string;
  onRestartForm?: () => void;
  imageUrl?: string | null;
  isLocked?: boolean;
  characterPhotoFile?: File | null;
  onUnlockClick?: () => void;
  onRetry?: () => void;
  viewMode?: 'grid' | 'split';
  errorImages?: {[key: string]: boolean} | {[key: number]: boolean};
  retryLoadingPanels?: {[key: string]: boolean};
  onRegenerate?: (index: number, panelId?: string) => void;
  isRegenerating?: boolean;
  isCreatingMagic?: boolean;
  isError?: boolean;
  onClick?: () => void;
  isPaid?: boolean; // Payment status for edit mode
}

const ComicPanel: React.FC<ComicPanelProps> = ({ 
  panelData,
  panelText, 
  imagePrompt,
  panelIndex, 
  genre, 
  characterPhoto, 
  characterName, 
  getSceneImage, 
  isLoading, 
  openaiApiKey, 
  cleanPanelTextForDisplay,
  onRestartForm,
  imageUrl,
  isLocked,
  characterPhotoFile,
  onUnlockClick,
  onRetry,
  viewMode,
  errorImages,
  retryLoadingPanels,
  onRegenerate,
  isRegenerating,
  isCreatingMagic,
  onClick,
  isPaid = false
}) => {
  const [sceneImage, setSceneImage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    // Reset image load failure state when imageUrl changes
    setImageLoadFailed(false);
    
    // If we have a provided imageUrl, use it directly
    if (imageUrl) {
      setSceneImage(imageUrl);
      setImageLoading(false);
      return;
    }
    
    // If we have panel data with image URLs, use them
    if (panelData) {
      const panelImageUrl = panelData.aws_s3_image_url || panelData.minimax_image_url;
      if (panelImageUrl) {
        setSceneImage(panelImageUrl);
        setImageLoading(false);
        return;
      }
    }
    
    // If panel is locked, don't load image
    if (isLocked) {
      setImageLoading(false);
      return;
    }
    
    // No image available and not locked - set loading to false
    setImageLoading(false);
  }, [imageUrl, isLocked, panelIndex, panelData]);

  // Get cleaned text for display - use panel data if available, otherwise fall back to panelText
  const displayText = cleanPanelTextForDisplay(panelData?.panel_text || panelText || '');
  
  // Get image prompt - use panel data if available, otherwise fall back to imagePrompt prop
  const currentImagePrompt = panelData?.image_prompt || imagePrompt || '';
  
  // Debug logging for panel data
  if (panelData) {
    console.log(`🎭 ComicPanel ${panelIndex} - Panel Data:`, {
      id: panelData.id,
      panel_number: panelData.panel_number,
      panel_text: panelData.panel_text?.substring(0, 50) + '...',
      image_prompt: panelData.image_prompt?.substring(0, 50) + '...',
      has_minimax_url: !!panelData.minimax_image_url,
      has_s3_url: !!panelData.aws_s3_image_url,
      status: panelData.status
    });
  }
  
  // Check if we should show locked state - only if locked AND no image available
  const hasImage = imageUrl || sceneImage || (panelData && (panelData.aws_s3_image_url || panelData.minimax_image_url));
  const shouldShowLocked = isLocked && !hasImage;
  
  // Check if we should show "Generate Image" button - when paid but no image available
  const shouldShowGenerateImage = !isLocked && !hasImage;
  
  // Debug logging for edit mode
  if (panelIndex === 0) {
    console.log('🎭 ComicPanel 0 Debug:', {
      isLocked,
      isPaid,
      hasImage: !!hasImage,
      shouldShowLocked,
      shouldShowGenerateImage,
      hasImageUrl: !!imageUrl,
      hasSceneImage: !!sceneImage,
      hasPanelData: !!panelData,
      panelDataImageUrls: panelData ? {
        s3: !!panelData.aws_s3_image_url,
        minimax: !!panelData.minimax_image_url
      } : null,
      imageUrl,
      sceneImage,
      panelDataImageUrl: panelData ? (panelData.aws_s3_image_url || panelData.minimax_image_url) : null
    });
  }
  

  
  // Check if we should show "Creating magic" - when isCreatingMagic is true, panel is unlocked, and no image exists
  const hasErrorState = (errorImages && (errorImages[panelIndex] || errorImages[panelIndex.toString()])) || imageLoadFailed;
  const shouldShowCreatingMagic = isCreatingMagic && !isLocked && !hasImage && !isRegenerating && !hasErrorState;
  
  // Debug logging for isCreatingMagic flag
  if (panelIndex === 0) {
    console.log('🎭 ComicPanel 0 - isCreatingMagic Debug:', {
      isCreatingMagic,
      isLocked,
      hasImage: !!hasImage,
      isRegenerating,
      hasErrorState,
      shouldShowCreatingMagic
    });
  }
  

  return (
    <div 
      className={`border-2 border-gray-400 rounded-lg p-3 bg-gray-50 ${
        viewMode === 'split' ? 'min-h-[400px]' : 'min-h-[200px]'
      } ${onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
      onClick={onClick}
    >
      {/* Scene Image */}
      <div className={`relative rounded-lg mb-3 overflow-hidden border-2 border-dashed border-gray-300 bg-white ${
        viewMode === 'split' ? 'h-80' : 'h-64'
      }`}>
        {shouldShowLocked ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Premium Content</h3>
            <p className="text-sm text-gray-600 mb-3">
              Unlock this illustration to see your story come to life!
            </p>
            <button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium" 
              onClick={(e) => {
                e.stopPropagation();
                onUnlockClick?.();
              }}
            >
              🔓 Unlock Now
            </button>
          </div>
        ) : (isLoading || imageLoading || isRegenerating || shouldShowCreatingMagic || (retryLoadingPanels && retryLoadingPanels[panelIndex])) ? (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">
              {shouldShowCreatingMagic 
                ? 'Creating magic for you...'
                : isRegenerating 
                ? 'Good things take time...'
                : retryLoadingPanels && retryLoadingPanels[panelIndex] 
                ? 'Retrying image generation...' 
                : (characterPhoto ? 'Generating character-consistent image ...' : 'Generating image ...')
              }
            </span>
          </div>
        ) : hasErrorState ? (
          <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-red-600 font-medium mb-2">
              {imageLoadFailed ? "Failed to load image" : "Failed to generate image"}
            </p>
            {onRegenerate && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setImageLoadFailed(false); // Reset the failed state when retrying
                  onRegenerate(panelIndex, panelData?.id);
                }}
                className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Image
              </button>
            )}
          </div>
        ) : hasImage && !imageLoadFailed ? (
          <img 
            src={imageUrl || sceneImage || (panelData && (panelData.aws_s3_image_url || panelData.minimax_image_url))}
            alt={`Scene for: ${displayText}`}
            className="w-full h-full object-contain"
            onLoad={() => console.log('Character-consistent image successfully displayed for panel:', panelIndex)}
            onError={(e) => {
              setImageLoadFailed(true);
            }}
          />
        ) : shouldShowGenerateImage ? (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium mb-2">No image available</p>
            {onRegenerate && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  trackPhotosRegenerated('regenerate_on_no_image_available_state_for_panel '+panelIndex);
                  onRegenerate(panelIndex, panelData?.id);
                }}
                className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Generate Image
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium mb-2">No image available</p>
          </div>
        )}
        
        {/* Refresh button */}
        {hasImage && !imageLoadFailed && onRegenerate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageLoadFailed(false); // Reset failed state when regenerating
              onRegenerate(panelIndex, panelData?.id);
            }}
            className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-black/75 transition-colors"
            aria-label="Regenerate image"
            disabled={isRegenerating}
          >
            <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        {/* AI indicator with character consistency info */}
        {!imageLoading && !isLoading && !(retryLoadingPanels && retryLoadingPanels[panelIndex]) && hasImage && !imageLoadFailed && (
          <div className="absolute top-1 right-1">
            <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded">
              {characterPhoto ? 'Character Consistent' : 'AI Generated'}
            </div>
          </div>
        )}
        
        {/* Lock indicator for locked panels */}
        {shouldShowLocked && (
          <div className="absolute top-1 right-1">
            <div className="bg-gray-500/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Premium
            </div>
          </div>
        )}
      </div>
      
      {/* Panel text */}
      <div className={`text-sm bg-white rounded border p-3 ${
        viewMode === 'split' ? 'text-base' : ''
      }`}>
        <p className="text-gray-700 leading-relaxed">{displayText}</p>
        
        {/* Debug info - show panel data when available */}
        {/* {panelData && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
            <div className="font-semibold mb-1">📊 Panel Data:</div>
            <div><strong>ID:</strong> {panelData.id.substring(0, 8)}...</div>
            <div><strong>Number:</strong> {panelData.panel_number}</div>
            <div><strong>Status:</strong> {panelData.status}</div>
            {currentImagePrompt && (
              <div className="mt-1">
                <strong>Image Prompt:</strong> {currentImagePrompt.substring(0, 60)}...
              </div>
            )}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ComicPanel;
