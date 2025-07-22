
import { pipeline, env } from '@huggingface/transformers';
import { resizeImageIfNeeded, createCircularCrop } from './imageUtils';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    //console.log('Starting ultra-fast background removal...');
    
    // Much shorter timeout - if it doesn't work in 3 seconds, use fallback
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Background removal timeout')), 3000);
    });
    
    const processPromise = (async () => {
      // Use the smallest, fastest model available
      const segmenter = await pipeline(
        'image-segmentation', 
        'Xenova/segformer-b0-finetuned-ade-512-512', // Smallest model
        { 
          device: 'wasm',
          dtype: 'q8' // Quantized for speed
        }
      );
      
      // Convert HTMLImageElement to canvas with very small size
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Force very small size for ultra-fast processing
      const maxSize = 128;
      const scale = Math.min(maxSize / imageElement.naturalWidth, maxSize / imageElement.naturalHeight);
      canvas.width = Math.round(imageElement.naturalWidth * scale);
      canvas.height = Math.round(imageElement.naturalHeight * scale);
      
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      //console.log(`Ultra-fast processing ${canvas.width}x${canvas.height} image`);
      
      // Very low quality for maximum speed
      const imageData = canvas.toDataURL('image/jpeg', 0.3);
      
      // Process with the model
      const result = await segmenter(imageData);
      
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }
      
      // Simple mask application
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      outputCtx.drawImage(canvas, 0, 0);
      
      const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
      const data = outputImageData.data;
      
      // Quick mask application
      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }
      
      outputCtx.putImageData(outputImageData, 0, 0);
      
      return new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/png',
          0.5
        );
      });
    })();
    
    // Race between processing and timeout
    return await Promise.race([processPromise, timeoutPromise]) as Blob;
    
  } catch (error) {
    console.error('Background removal failed, using simple crop:', error);
    // Always fallback to simple circular crop
    return createCircularCrop(imageElement);
  }
};
