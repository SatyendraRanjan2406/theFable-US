import React, { useState } from 'react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { cleanPanelTextForDisplay } from '@/utils/textUtils';
import { generateMinimaxImage } from '@/utils/imageGeneration/apiClients';
import { fileToBase64 } from '@/utils/imageUtils';
import LoadingState from './story-preview/LoadingState';
import EmptyState from './story-preview/EmptyState';
import ImageGenerationProgress from './story-preview/ImageGenerationProgress';
import ErrorState from './story-preview/ErrorState';
import FinalPreview from './story-preview/FinalPreview';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateComicPDF } from '@/utils/pdfGenerator';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ChevronLeft } from 'lucide-react';

interface StoryPreviewProps {
  story: string | null;
  characterName: string;
  characterPhoto: string | null;
  genre: string;
  isGenerating: boolean;
  isRegenerating?: boolean;
  onBackToForm?: () => void;
  onRegenerateStory?: () => void;
  showBackButton?: boolean;
  hfApiKey?: string;
  images?: (string | null)[];
  characterPhotoFile?: File | null;
  onImagesUpdated?: (newImages: (string | null)[]) => void;
  onUpdatePanel: (index: number, newImageUrl: string) => void;
  onLockPanel: (index: number) => void;
  onUnlockPanel: (index: number) => void;
  lockedPanels: boolean[];
  onRetry?: () => void;
  onUnlockRequest?: () => void;
  onRegeneratePanelImage?: (index: number) => Promise<void>;
  regeneratingPanels?: { [key: number]: boolean };
  isGeneratingImages?: boolean;
  isCreatingMagic?: boolean;
  errorImages?: {[key: string]: boolean};
  title?: string; // NEW: story title
  storyId?: string; // NEW: story ID for edit mode
  panels?: any[]; // NEW: panels data from API for edit mode
  isPaid?: boolean; // NEW: payment status for edit mode

}

const StoryPreview: React.FC<StoryPreviewProps> = ({
  story,
  characterName,
  characterPhoto,
  genre,
  isGenerating,
  isRegenerating = false,
  onBackToForm,
  onRegenerateStory,
  showBackButton = false,
  hfApiKey = '',
  images,
  characterPhotoFile,
  onImagesUpdated,
  onUpdatePanel,
  onLockPanel,
  onUnlockPanel,
  lockedPanels,
  onRetry,
  onUnlockRequest,
  onRegeneratePanelImage,
  regeneratingPanels,
  isGeneratingImages,
  isCreatingMagic,
  errorImages,
  title,
  storyId,
  panels,
  isPaid,

}) => {
  // All state and logic is now lifted to Index.tsx or passed down.
  // This component now primarily acts as a router for different states.

  // if (isGenerating) {
  //   return <LoadingState isRegenerating={isRegenerating} />;
  // }

  if (!story) {
    return <EmptyState onBackToForm={onBackToForm} />;
  }

  // When the story is ready, we always show the final preview.
  return (
    <FinalPreview
      story={story}
      characterName={characterName}
      characterPhoto={characterPhoto}
      genre={genre}
      showBackButton={showBackButton}
      onBackToForm={onBackToForm}
      images={images}
      characterPhotoFile={characterPhotoFile}
      onUnlockRequest={onUnlockRequest}
      onRegeneratePanelImage={onRegeneratePanelImage}
      regeneratingPanels={regeneratingPanels}
      isGeneratingImages={isGeneratingImages}
      lockedPanels={lockedPanels}
      cleanPanelTextForDisplay={cleanPanelTextForDisplay}
      onRegenerateStory={onRegenerateStory}
      isRegenerating={isRegenerating}
      getSceneImage={async () => ''}
      loadingImages={{}}
      hfApiKey={hfApiKey}
      generatedImages={{}}
      onGenerateLockedImages={async () => {}}
      onRetryImage={onRegeneratePanelImage}
      errorImages={errorImages || {}}
      retryLoadingPanels={{}}
      isCreatingMagic={isCreatingMagic}
      title={title}
      storyId={storyId}
      panels={panels}
      isPaid={isPaid}
  
    />
  );
};

export default StoryPreview;
