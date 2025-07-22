import { useState, useCallback } from 'react';
import { 
  ImageGenerationService, 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  ImageGenerationError,
  ProviderType 
} from '@/utils/imageGeneration';

interface UseDecoupledImageGenerationProps {
  defaultProvider?: ProviderType;
  fallbackProvider?: ProviderType;
  retryAttempts?: number;
  timeout?: number;
}

interface UseDecoupledImageGenerationReturn {
  // State
  isGenerating: boolean;
  generatedImage: string | null;
  error: ImageGenerationError | null;
  
  // Actions
  generateImage: (request: ImageGenerationRequest, provider?: ProviderType) => Promise<void>;
  generateCharacterImage: (
    characterName: string,
    genre: string,
    apiKey: string,
    characterImage?: string,
    options?: any
  ) => Promise<void>;
  generateStoryPanel: (
    panelText: string,
    genre: string,
    characterName: string,
    apiKey: string,
    panelIndex: number,
    previousPanelImage?: string,
    characterPhoto?: string,
    options?: any
  ) => Promise<void>;
  
  // Service management
  setProvider: (provider: ProviderType) => void;
  setFallbackProvider: (provider: ProviderType) => void;
  clearCache: (pattern?: string) => void;
  getCacheStats: () => { size: number; keys: string[] };
  
  // Service instance for advanced usage
  service: ImageGenerationService;
}

export const useDecoupledImageGeneration = ({
  defaultProvider = 'huggingface',
  fallbackProvider = 'minimax',
  retryAttempts = 3,
  timeout = 60000
}: UseDecoupledImageGenerationProps = {}): UseDecoupledImageGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<ImageGenerationError | null>(null);
  
  // Create service instance
  const [service] = useState(() => new ImageGenerationService({
    defaultProvider,
    fallbackProvider,
    retryAttempts,
    timeout
  }));

  const generateImage = useCallback(async (
    request: ImageGenerationRequest, 
    provider?: ProviderType
  ) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await service.generateImage(request, provider);
      setGeneratedImage(result.imageUrl);
    } catch (err) {
      setError(err as ImageGenerationError);
      console.error('Image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [service]);

  const generateCharacterImage = useCallback(async (
    characterName: string,
    genre: string,
    apiKey: string,
    characterImage?: string,
    options?: any
  ) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await service.generateCharacterImage(
        characterName,
        genre,
        apiKey,
        characterImage,
        options
      );
      setGeneratedImage(result.imageUrl);
    } catch (err) {
      setError(err as ImageGenerationError);
      console.error('Character image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [service]);

  const generateStoryPanel = useCallback(async (
    panelText: string,
    genre: string,
    characterName: string,
    apiKey: string,
    panelIndex: number,
    previousPanelImage?: string,
    characterPhoto?: string,
    options?: any
  ) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await service.generateStoryPanel(
        panelText,
        genre,
        characterName,
        apiKey,
        panelIndex,
        previousPanelImage,
        characterPhoto,
        options
      );
      setGeneratedImage(result.imageUrl);
    } catch (err) {
      setError(err as ImageGenerationError);
      console.error('Story panel generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [service]);

  const setProvider = useCallback((provider: ProviderType) => {
    service.setDefaultProvider(provider);
  }, [service]);

  const setFallbackProvider = useCallback((provider: ProviderType) => {
    service.setFallbackProvider(provider);
  }, [service]);

  const clearCache = useCallback((pattern?: string) => {
    service.clearCache(pattern);
  }, [service]);

  const getCacheStats = useCallback(() => {
    return service.getCacheStats();
  }, [service]);

  return {
    // State
    isGenerating,
    generatedImage,
    error,
    
    // Actions
    generateImage,
    generateCharacterImage,
    generateStoryPanel,
    
    // Service management
    setProvider,
    setFallbackProvider,
    clearCache,
    getCacheStats,
    
    // Service instance
    service
  };
}; 