
import { useEffect } from 'react';
import { generateImageFromPanelText, clearVisualContinuityCache } from '@/utils/imageGeneration';
import { PanelText, ImageCache, LoadingState } from './types';

interface UseSequentialGenerationProps {
  panelTexts: PanelText[];
  hfApiKey: string;
  characterPhoto: string | null;
  characterName: string;
  genre: string;
  imageGenerationComplete: boolean;
  imageGenerationFailed: boolean;
  generatedImages: ImageCache;
  loadingImages: LoadingState;
  setGeneratedImages: React.Dispatch<React.SetStateAction<ImageCache>>;
  setLoadingImages: React.Dispatch<React.SetStateAction<LoadingState>>;
  setImageGenerationComplete: React.Dispatch<React.SetStateAction<boolean>>;
  setImageGenerationFailed: React.Dispatch<React.SetStateAction<boolean>>;
  storyId?: string;
}

export const useSequentialGeneration = ({
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
}: UseSequentialGenerationProps) => {

  // Clear progressive visual continuity cache when starting new story generation
  useEffect(() => {
    if (panelTexts.length > 0 && hfApiKey && !imageGenerationComplete && !imageGenerationFailed) {
      //console.log('Clearing progressive visual continuity cache for new story generation');
      clearVisualContinuityCache(storyId);
    }
  }, [storyId]);

  // Start PROGRESSIVE sequential image generation for maximum visual continuity
  useEffect(() => {
    if (panelTexts.length > 0 && hfApiKey && !imageGenerationComplete && !imageGenerationFailed) {
      //console.log('Starting PROGRESSIVE SEQUENTIAL visual continuity generation for', panelTexts.length, 'panels');
      generateAllImagesProgressively();
    }
  }, [panelTexts, hfApiKey, characterPhoto]);

  const generateAllImagesProgressively = async () => {
    if (!hfApiKey || hfApiKey.trim() === '') {
      //console.log('No API key - setting failed state');
      setImageGenerationFailed(true);
      return;
    }

    //console.log('=== PROGRESSIVE SEQUENTIAL VISUAL CONTINUITY GENERATION START ===');
    //console.log('This will create Panel 0 first (character base), then use it progressively for all subsequent panels');
    
    // Generate images PROGRESSIVELY to maintain MAXIMUM visual continuity with each panel building on the previous
    for (let i = 0; i < panelTexts.length; i++) {
      const panel = panelTexts[i];
      const imageKey = `panel-${panel.index}`;
      
      // Skip if already generated or loading
      if (generatedImages[imageKey] || loadingImages[imageKey]) {
        //console.log('Skipping panel', panel.index, '- already processed');
        continue;
      }

      if (i === 0) {
        //console.log(`STEP 1: Creating CHARACTER BASE IMAGE for panel ${panel.index} - this will be the foundation for all subsequent panels`);
      } else {
        //console.log(`STEP ${i + 1}: Generating PROGRESSIVE CONTINUATION image ${i + 1}/${panelTexts.length} for panel ${panel.index} using previous panel as reference`);
      }
      
      setLoadingImages(prev => ({...prev, [imageKey]: true}));
      
      try {
        // Generate image with PROGRESSIVE visual continuity - each panel uses the previous as reference
        const imageUrl = await generateImageFromPanelText(
          panel.text, 
          genre, 
          characterName, 
          hfApiKey, 
          !!characterPhoto, 
          panel.index,
          characterPhoto || undefined,
          storyId
        );
        
        if (i === 0) {
          //console.log(`Successfully created CHARACTER BASE IMAGE for panel ${panel.index} - this will ensure consistency throughout the story`);
        } else {
          //console.log(`Successfully generated PROGRESSIVE CONTINUATION image ${i + 1}/${panelTexts.length} for panel ${panel.index}`);
        }
        
        setGeneratedImages(prev => ({...prev, [imageKey]: imageUrl}));
        setLoadingImages(prev => ({...prev, [imageKey]: false}));
        
        // PROGRESSIVE delay between generations to ensure proper sequencing and reference processing
        if (i < panelTexts.length - 1) {
          //console.log('Waiting before next progressive generation to ensure reference image is processed...');
          await new Promise(resolve => setTimeout(resolve, 4000)); // Increased delay for better progressive processing
        }
        
      } catch (error) {
        console.error(`Failed to generate PROGRESSIVE CONTINUATION image ${i + 1}/${panelTexts.length} for panel ${panel.index}:`, error);
        setLoadingImages(prev => ({...prev, [imageKey]: false}));
        setImageGenerationFailed(true);
        return; // Stop on first failure
      }
    }
    
    //console.log('=== PROGRESSIVE SEQUENTIAL VISUAL CONTINUITY GENERATION COMPLETE ===');
    //console.log('All panels have been generated with progressive visual continuity from Panel 0 base through the entire story');
    setImageGenerationComplete(true);
  };
};
