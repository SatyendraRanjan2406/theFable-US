
import { useState, useEffect } from 'react';
import { generateImageFromPanelText } from '@/utils/imageGeneration';
import { useImageCache } from './useImageGeneration/useImageCache';
import { usePanelProcessor } from './useImageGeneration/usePanelProcessor';
import { useSequentialGeneration } from './useImageGeneration/useSequentialGeneration';
import { UseImageGenerationProps } from './useImageGeneration/types';

export const useImageGeneration = ({
  story,
  characterName,
  characterPhoto,
  genre,
  hfApiKey
}: UseImageGenerationProps) => {
  // Create a consistent story ID for visual continuity tracking
  const storyId = story ? `story-${Date.now()}` : undefined;

  // Use image cache hook
  const {
    generatedImages,
    setGeneratedImages,
    loadingImages,
    setLoadingImages,
    imageGenerationComplete,
    setImageGenerationComplete,
    imageGenerationFailed,
    setImageGenerationFailed
  } = useImageCache(hfApiKey, characterPhoto, story);

  // Use panel processor hook
  const { totalPanels, panelTexts } = usePanelProcessor(story);

  // Use sequential generation hook
  useSequentialGeneration({
    panelTexts,
    hfApiKey,
    characterPhoto,
    characterName,
    genre,
    imageGenerationComplete,
    imageGenerationFailed,
    generatedImages,
    loadingImages,
    setGeneratedImages,
    setLoadingImages,
    setImageGenerationComplete,
    setImageGenerationFailed,
    storyId
  });

  // Check if all images are ready
  useEffect(() => {
    if (totalPanels > 0) {
      const generatedCount = Object.keys(generatedImages).length;
      const loadingCount = Object.values(loadingImages).filter(loading => loading).length;
      
      //console.log('Visual continuity image status check:', { generatedCount, totalPanels, loadingCount });
      
      if (generatedCount === totalPanels && loadingCount === 0) {
        //console.log('All visual continuity images generated successfully');
        setImageGenerationComplete(true);
        setImageGenerationFailed(false);
      }
    }
  }, [generatedImages, loadingImages, totalPanels]);

  const getSceneImage = async (panelText: string, genre: string, panelIndex: number): Promise<string> => {
    //console.log('=== GET VISUAL CONTINUITY SCENE IMAGE START ===');
    //console.log('Panel index:', panelIndex);
    
    // Always require API key - no fallback images
    if (!hfApiKey || hfApiKey.trim() === '') {
      throw new Error('Hugging Face API key is required for image generation');
    }
    
    // Use simplified image key
    const imageKey = `panel-${panelIndex}`;
    
    //console.log('Visual continuity image key:', imageKey);
    
    // Return cached image if available
    if (generatedImages[imageKey]) {
      //console.log('Returning cached visual continuity image for:', imageKey);
      return generatedImages[imageKey];
    }

    // If already loading, wait a bit and check again
    if (loadingImages[imageKey]) {
      //console.log('Image is loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (generatedImages[imageKey]) {
        return generatedImages[imageKey];
      }
    }

    // If still not available, generate it directly
    //console.log('Generating image directly for panel:', panelIndex);
    try {
      const imageUrl = await generateImageFromPanelText(
        panelText, 
        genre, 
        characterName, 
        hfApiKey, 
        !!characterPhoto, 
        panelIndex,
        characterPhoto || undefined,
        storyId
      );
      
      // Cache the generated image
      setGeneratedImages(prev => ({...prev, [imageKey]: imageUrl}));
      return imageUrl;
    } catch (error) {
      console.error('Failed to generate image directly:', error);
      throw error;
    }
  };

  return {
    generatedImages,
    loadingImages,
    imageGenerationComplete,
    imageGenerationFailed,
    totalPanels,
    getSceneImage
  };
};
