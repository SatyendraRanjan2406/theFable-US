import { 
  ImageGenerationProvider, 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationServiceConfig,
  ImageGenerationError,
  ImageGenerationErrorCode,
  ProviderType
} from './types';
import { globalProviderRegistry } from './ProviderFactory';
import { InMemoryImageCache } from './cache/ImageCache';

export class ImageGenerationService {
  private config: ImageGenerationServiceConfig;
  private cache: InMemoryImageCache;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff delays

  constructor(config: Partial<ImageGenerationServiceConfig> = {}) {
    this.config = {
      defaultProvider: 'huggingface',
      providers: {},
      fallbackProvider: 'minimax',
      retryAttempts: 3,
      timeout: 60000,
      enableCaching: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      ...config
    };

    this.cache = new InMemoryImageCache();
    
    // Use global provider registry if no providers specified
    if (Object.keys(this.config.providers).length === 0) {
      this.initializeFromRegistry();
    }
  }

  private initializeFromRegistry(): void {
    // Get all available providers from the global registry
    const availableProviders = globalProviderRegistry.getAvailableProviders();
    
    for (const providerName of availableProviders) {
      try {
        const provider = globalProviderRegistry.getProvider(providerName);
        if (provider) {
          this.config.providers[providerName] = provider;
        }
      } catch (error) {
        console.warn(`Failed to initialize provider '${providerName}':`, error);
      }
    }
    
    //console.log('Initialized providers from registry:', Object.keys(this.config.providers));
  }

  async generateImage(
    request: ImageGenerationRequest, 
    providerType?: ProviderType
  ): Promise<ImageGenerationResponse> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(request, providerType);
    
    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        //console.log('Returning cached image result');
        return {
          imageUrl: cachedResult.imageUrl,
          metadata: cachedResult.metadata
        };
      }
    }

    // Determine provider to use
    const provider = this.getProvider(providerType || this.config.defaultProvider as ProviderType);
    
    // Try with retries and fallbacks
    let lastError: ImageGenerationError | null = null;
    
    // Try primary provider with retries
    for (let attempt = 0; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        //console.log(`Attempting image generation with ${provider.name} (attempt ${attempt + 1})`);
        
        const result = await this.generateWithProvider(provider, request);
        
        // Cache the successful result if enabled
        if (this.config.enableCaching) {
          this.cache.set(cacheKey, {
            imageUrl: result.imageUrl,
            timestamp: Date.now(),
            metadata: result.metadata
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as ImageGenerationError;
        console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
        
        // If not retryable or last attempt, break
        if (!lastError.retryable || attempt === this.config.retryAttempts!) {
          break;
        }
        
        // Wait before retry
        await this.delay(this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1]);
      }
    }

    // Try fallback provider if available and different from primary
    if (this.config.fallbackProvider && 
        this.config.fallbackProvider !== provider.name) {
      try {
        //console.log(`Trying fallback provider: ${this.config.fallbackProvider}`);
        
        const fallbackProvider = this.getProvider(this.config.fallbackProvider as ProviderType);
        const result = await this.generateWithProvider(fallbackProvider, request);
        
        // Cache the successful result if enabled
        if (this.config.enableCaching) {
          this.cache.set(cacheKey, {
            imageUrl: result.imageUrl,
            timestamp: Date.now(),
            metadata: result.metadata
          });
        }
        
        return result;
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
        // Continue to throw the original error
      }
    }

    // All attempts failed
    throw lastError || new Error('Image generation failed');
  }

  private async generateWithProvider(
    provider: ImageGenerationProvider, 
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const result = await provider.generateImage(request);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: ImageGenerationErrorCode.TIMEOUT,
          provider: provider.name,
          retryable: true
        } as ImageGenerationError;
      }
      
      throw error;
    }
  }

  private getProvider(providerType: ProviderType): ImageGenerationProvider {
    // First check local providers
    const localProvider = this.config.providers[providerType];
    if (localProvider) {
      return localProvider;
    }
    
    // Then check global registry
    const registryProvider = globalProviderRegistry.getProvider(providerType);
    if (registryProvider) {
      return registryProvider;
    }
    
    throw {
      message: `Provider '${providerType}' not found`,
      code: ImageGenerationErrorCode.PROVIDER_UNAVAILABLE,
      provider: providerType,
      retryable: false
    } as ImageGenerationError;
  }

  private generateCacheKey(
    request: ImageGenerationRequest, 
    providerType?: ProviderType
  ): string {
    const provider = providerType || this.config.defaultProvider;
    const optionsHash = JSON.stringify(request.options || {});
    const promptHash = btoa(request.prompt).substring(0, 20);
    
    return `${provider}-${promptHash}-${optionsHash}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for service management
  addProvider(name: string, provider: ImageGenerationProvider): void {
    this.config.providers[name] = provider;
  }

  removeProvider(name: string): void {
    delete this.config.providers[name];
  }

  setDefaultProvider(name: string): void {
    if (!this.getProvider(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.config.defaultProvider = name;
  }

  setFallbackProvider(name: string): void {
    if (!this.getProvider(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.config.fallbackProvider = name;
  }

  clearCache(pattern?: string): void {
    this.cache.clear(pattern);
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: this.cache.keys()
    };
  }

  // Convenience methods for specific use cases
  async generateCharacterImage(
    characterName: string,
    genre: string,
    apiKey: string,
    characterImage?: string,
    options?: any
  ): Promise<ImageGenerationResponse> {
    const prompt = this.createCharacterPrompt(characterName, genre);
    
    return this.generateImage({
      prompt,
      apiKey,
      options: {
        width: 512,
        height: 512,
        style: 'storybook',
        ...options
      },
      characterImage
    });
  }

  async generateStoryPanel(
    panelText: string,
    genre: string,
    characterName: string,
    apiKey: string,
    panelIndex: number,
    previousPanelImage?: string,
    characterPhoto?: string,
    options?: any
  ): Promise<ImageGenerationResponse> {
    const prompt = this.createStoryPanelPrompt(
      panelText,
      genre,
      characterName,
      panelIndex,
      previousPanelImage
    );
    
    return this.generateImage({
      prompt,
      apiKey,
      options: {
        width: 512,
        height: 512,
        style: 'storybook',
        ...options
      },
      referenceImage: previousPanelImage,
      characterImage: characterPhoto
    });
  }

  private createCharacterPrompt(characterName: string, genre: string): string {
    return `Beautiful storybook character illustration of ${characterName}, ${genre} style, children's book art, digital painting, soft colors, friendly expression, high quality`;
  }

  private createStoryPanelPrompt(
    panelText: string,
    genre: string,
    characterName: string,
    panelIndex: number,
    previousPanelImage?: string
  ): string {
    let prompt = `${panelText}, ${genre} storybook illustration, character ${characterName}, panel ${panelIndex + 1}`;
    
    if (previousPanelImage) {
      prompt += `, continue visual story from previous panel, maintain identical character appearance and environmental consistency`;
    }
    
    return prompt;
  }

  // Provider information methods
  getAvailableProviders(): string[] {
    const localProviders = Object.keys(this.config.providers);
    const registryProviders = globalProviderRegistry.getAvailableProviders();
    return [...new Set([...localProviders, ...registryProviders])];
  }

  getProviderInfo(name: string) {
    return globalProviderRegistry.getProviderInfo(name);
  }

  getAllProviderInfo() {
    return globalProviderRegistry.getAllProviderInfo();
  }
} 