
import { useState, useEffect } from 'react';
import { clearVisualContinuityCache } from '@/utils/imageGeneration';
import { ImageCache, LoadingState } from './types';

export const useImageCache = (hfApiKey: string, characterPhoto: string | null, story: string | null) => {
  const [generatedImages, setGeneratedImages] = useState<ImageCache>({});
  const [loadingImages, setLoadingImages] = useState<LoadingState>({});
  const [imageGenerationComplete, setImageGenerationComplete] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);

  // Clear images when API key or character photo changes
  useEffect(() => {
    //console.log('Clearing images cache and visual continuity cache due to API key or photo change');
    setGeneratedImages({});
    setLoadingImages({});
    setImageGenerationComplete(false);
    setImageGenerationFailed(false);
    // Clear the visual continuity cache as well
    clearVisualContinuityCache();
  }, [hfApiKey, characterPhoto, story]);

  return {
    generatedImages,
    setGeneratedImages,
    loadingImages,
    setLoadingImages,
    imageGenerationComplete,
    setImageGenerationComplete,
    imageGenerationFailed,
    setImageGenerationFailed
  };
};
