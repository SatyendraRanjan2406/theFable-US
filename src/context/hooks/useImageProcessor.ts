
import { useState } from 'react';
import { toast } from 'sonner';
import { loadImage, removeBackground, combineCharacterWithScene } from '@/utils/imageProcessor';

export const useImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const processImage = async (file: File, genre: string) => {
    if (isProcessing) {
      //console.log('Already processing, skipping...');
      return;
    }
    
    setIsProcessing(true);
    setProcessedImageUrl(null);
    
    try {
      //console.log('Starting image processing pipeline...');
      toast.info('Creating your character image...');
      
      // Load the image
      const imageElement = await loadImage(file);
      //console.log('Image loaded successfully');
      
      // Quick processing with very short timeout
      toast.info('Processing character...');
      const characterBlob = await removeBackground(imageElement);
      //console.log('Character processed');
      
      // Combine with scene background
      toast.info('Adding scene background...');
      const finalImageUrl = await combineCharacterWithScene(characterBlob, genre);
      //console.log('Final image created');
      
      setProcessedImageUrl(finalImageUrl);
      toast.success('Character image ready!');
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try again.');
      setProcessedImageUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessedImage = () => {
    setProcessedImageUrl(null);
  };

  return {
    isProcessing,
    processedImageUrl,
    processImage,
    resetProcessedImage
  };
};
