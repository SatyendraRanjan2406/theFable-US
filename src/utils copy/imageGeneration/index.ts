
import { ImageGenerationService } from './ImageGenerationService';

// Core exports
export * from './types';
export * from './ImageGenerationService';
export * from './cache/ImageCache';

// Provider factory and registry - explicit re-exports to avoid conflicts
export { globalProviderRegistry, providerRegistry, ProviderFactory, ProviderRegistryImpl } from './ProviderFactory';
export * from './providers';

// Utility functions
export * from './promptUtils';
export * from './characterUtils';

// Create a singleton instance for backward compatibility
const imageGenerationService = new ImageGenerationService();

// ENHANCED store for progressive image references and continuity
const panelContextCache = new Map<string, string>();
const panelImageCache = new Map<string, string>();
const storyStyleCache = new Map<string, string>();
const characterBaseImageCache = new Map<string, string>(); // Store the main character reference

// Backward compatibility functions
export const generateImageFromPanelText = async (
  panelText: string, 
  genre: string, 
  characterName?: string, 
  apiKey?: string, 
  hasCharacterPhoto: boolean = false, 
  panelIndex: number = 0, 
  characterPhoto?: File | string, // Accept File or URL string
  storyId?: string
): Promise<string> => {
  // Remove hardcoded limit - payment required logic should be handled at a higher level

  //console.log('=== PROGRESSIVE VISUAL CONTINUITY GENERATION START ===');
  //console.log('Panel text:', panelText);
  //console.log('Panel index:', panelIndex);
  //console.log('Genre:', genre);
  //console.log('Character:', characterName);
  //console.log('Has API key:', !!apiKey);
  //console.log('Has character photo:', hasCharacterPhoto);
  //console.log('Character photo available:', !!characterPhoto);
  //console.log('Story ID for progressive continuity:', storyId);
  
  if (!apiKey || apiKey.trim() === '') {
    //console.log('No API key provided, using fallback image');
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop';
  }
  
  // PROGRESSIVE context and style management
  const contextKey = `${storyId || 'default'}-${genre}-${characterName}`;
  const previousPanelContext = panelIndex > 0 ? panelContextCache.get(`${contextKey}-${panelIndex - 1}`) : undefined;
  const previousPanelImage = panelIndex > 0 ? panelImageCache.get(`${contextKey}-${panelIndex - 1}`) : undefined;
  const characterBaseImage = characterBaseImageCache.get(contextKey);
  const establishedStyle = storyStyleCache.get(contextKey);
  
  // Create detailed prompt optimized for progressive visual continuity
  let finalPrompt = `${panelText}, ${genre} storybook illustration, character ${characterName || 'child'}, panel ${panelIndex + 1}`;
  
  // ENHANCED: Add established style and progressive continuity
  if (establishedStyle && panelIndex > 0) {
    finalPrompt = `${finalPrompt}, MAINTAIN ESTABLISHED STYLE: ${establishedStyle}`;
  }
  if (previousPanelImage && panelIndex > 0) {
    finalPrompt = `${finalPrompt}, PROGRESSIVE CONTINUITY: Continue visual story from previous panel, maintain identical character appearance and environmental consistency`;
  }
  
  // Store current panel context for next panel's progressive continuity
  panelContextCache.set(`${contextKey}-${panelIndex}`, panelText.substring(0, 150));
  
  //console.log('=== SENDING PROGRESSIVE VISUAL CONTINUITY PROMPT TO API ===');
  
  let characterImageBase64 = '';
  if (hasCharacterPhoto && characterPhoto) {
    if (typeof characterPhoto === 'string') {
      // If it's a string, it might be a Base64 string already or a URL.
      // For simplicity, we assume if it's a string, it's a URL that the service can handle
      // or a pre-converted Base64 string. The service needs to be robust enough.
      // A better implementation would be to fetch the URL and convert to Base64 here if needed.
      // For now, let's see if the service can handle a URL or if it's already base64.
      // We'll check if it looks like a data URL and extract the base64 part.
      if (characterPhoto.startsWith('data:')) {
        characterImageBase64 = characterPhoto.split(',')[1];
      } else {
        // Assuming it's a raw URL or some other format the backend can handle.
        // Or perhaps it's already a base64 string without the prefix.
        // Let's pass it along. The service needs to be able to handle it.
        // A simple assumption for now: if not a data URL, it's either raw base64 or a URL.
        // This part of the logic might need to be more robust depending on what `characterPhoto` string contains.
        characterImageBase64 = characterPhoto; // Pass it directly
      }
    } else {
      // It's a File object, so convert it
      characterImageBase64 = await convertFileToBase64(characterPhoto);
    }
  }

  try {
    // Use the new service architecture
    const result = await imageGenerationService.generateStoryPanel(
      panelText,
      genre,
      characterName || 'child',
      apiKey,
      panelIndex,
      previousPanelImage,
      characterImageBase64,
      {
        style: 'storybook',
        width: 512,
        height: 512
      }
    );
    
    // Step 3: Store the generated image for the next panel to use as progressive reference
    panelImageCache.set(`${contextKey}-${panelIndex}`, result.imageUrl);
    //console.log(`Panel ${panelIndex} image stored for next panel's progressive reference`);
    
    //console.log('=== PROGRESSIVE VISUAL CONTINUITY GENERATION COMPLETE ===');
    return result.imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
};

// ENHANCED cache clearing with progressive reference management
export const clearVisualContinuityCache = (storyId?: string) => {
  if (storyId) {
    // Clear specific story cache including progressive references
    const keysToDelete = Array.from(panelContextCache.keys()).filter(key => key.startsWith(storyId));
    keysToDelete.forEach(key => {
      panelContextCache.delete(key);
      panelImageCache.delete(key);
      storyStyleCache.delete(key);
      characterBaseImageCache.delete(key);
    });
    //console.log('Cleared progressive reference cache for story:', storyId);
  } else {
    // Clear all cache including progressive references
    panelContextCache.clear();
    panelImageCache.clear();
    storyStyleCache.clear();
    characterBaseImageCache.clear();
    //console.log('Cleared all progressive reference caches');
  }
  
  // Also clear the service cache
  imageGenerationService.clearCache(storyId);
};

// Utility function to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Factory pattern convenience functions
export const createProvider = (type: string) => {
  return imageGenerationService.getAvailableProviders().includes(type) 
    ? imageGenerationService.generateImage({ prompt: '', apiKey: '' }, type as any)
    : null;
};

export const getAvailableProviders = () => {
  return imageGenerationService.getAvailableProviders();
};

export const getProviderInfo = (name: string) => {
  return imageGenerationService.getProviderInfo(name);
};

export const getAllProviderInfo = () => {
  return imageGenerationService.getAllProviderInfo();
};

// Export the service instance for advanced usage
export { imageGenerationService };
