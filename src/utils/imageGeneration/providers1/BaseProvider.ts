import { 
  ImageGenerationProvider, 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationError,
  ImageGenerationErrorCode,
  ProviderInfo
} from '../types';

export abstract class BaseProvider implements ImageGenerationProvider {
  abstract name: string;
  abstract model: string;
  abstract baseUrl: string;

  // Default options that can be overridden by subclasses
  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 512,
    height: 512,
    quality: 'standard',
    style: 'storybook',
    responseFormat: 'url'
  };

  // Template method pattern - subclasses implement specific parts
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Validate request
      this.validateRequest(request);
      
      // Merge options with defaults
      const options = this.mergeOptions(request.options);
      
      // Check if provider supports the requested options
      if (!this.isSupported(options)) {
        throw this.createError(
          ImageGenerationErrorCode.UNSUPPORTED_OPTIONS,
          `Provider ${this.name} does not support the requested options`
        );
      }

      // Preprocess request (can be overridden by subclasses)
      const processedRequest = await this.preprocessRequest(request, options);
      
      // Generate image using provider-specific implementation
      const response = await this.generateImageInternal(processedRequest, options);
      
      // Post-process response (can be overridden by subclasses)
      const processedResponse = await this.postprocessResponse(response, options);
      
      return {
        imageUrl: processedResponse.imageUrl,
        metadata: {
          provider: this.name,
          model: this.model,
          generationTime: Date.now(),
          ...processedResponse.metadata
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Default implementation for option support
  isSupported(options: ImageGenerationOptions): boolean {
    const supportedOptions = this.getSupportedOptions();
    
    // Check if all requested options are supported
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && !(key in supportedOptions)) {
        return false;
      }
    }
    
    return true;
  }

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return { ...this.defaultOptions };
  }

  // Get provider information - can be overridden by subclasses
  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: this.getDisplayName(),
      description: this.getDescription(),
      model: this.model,
      baseUrl: this.baseUrl,
      supportedFeatures: this.getSupportedFeatures(),
      defaultOptions: { ...this.defaultOptions },
      pricing: this.getPricing(),
      rateLimits: this.getRateLimits()
    };
  }

  // Abstract methods that subclasses must implement
  protected abstract generateImageInternal(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse>;

  // Optional methods that can be overridden by subclasses
  protected async preprocessRequest(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationRequest> {
    return request;
  }

  protected async postprocessResponse(
    response: ImageGenerationResponse, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    return response;
  }

  protected getDisplayName(): string {
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }

  protected getDescription(): string {
    return `${this.getDisplayName()} image generation provider using ${this.model}`;
  }

  protected getSupportedFeatures(): string[] {
    return ['text-to-image', 'image-generation'];
  }

  protected getPricing(): ProviderInfo['pricing'] {
    return undefined; // Override in subclasses if pricing info is available
  }

  protected getRateLimits(): ProviderInfo['rateLimits'] {
    return undefined; // Override in subclasses if rate limit info is available
  }

  // Utility methods
  protected validateRequest(request: ImageGenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw this.createError(
        ImageGenerationErrorCode.INVALID_REQUEST,
        'Prompt is required'
      );
    }

    if (!request.apiKey || request.apiKey.trim().length === 0) {
      throw this.createError(
        ImageGenerationErrorCode.API_KEY_MISSING,
        'API key is required'
      );
    }
  }

  protected mergeOptions(userOptions?: ImageGenerationOptions): ImageGenerationOptions {
    return {
      ...this.defaultOptions,
      ...userOptions
    } as ImageGenerationOptions;
  }

  protected async makeRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw this.createError(
          ImageGenerationErrorCode.TIMEOUT,
          'Request timeout',
          true
        );
      }
      throw this.createError(
        ImageGenerationErrorCode.NETWORK_ERROR,
        `Network error: ${error.message}`,
        true
      );
    }
  }

  protected createError(
    code: ImageGenerationErrorCode,
    message: string,
    retryable: boolean = false,
    details?: any
  ): ImageGenerationError {
    return {
      message,
      code,
      provider: this.name,
      retryable,
      details
    };
  }

  protected handleError(error: any): ImageGenerationError {
    // If it's already our error type, return it
    if (error.code && error.provider) {
      return error;
    }

    // Handle common error patterns
    if (error.message?.includes('API key')) {
      return this.createError(
        ImageGenerationErrorCode.API_KEY_MISSING,
        'Invalid or missing API key',
        false
      );
    }

    if (error.message?.includes('rate limit') || error.status === 429) {
      return this.createError(
        ImageGenerationErrorCode.RATE_LIMITED,
        'Rate limit exceeded',
        true
      );
    }

    if (error.message?.includes('quota') || error.status === 402) {
      return this.createError(
        ImageGenerationErrorCode.QUOTA_EXCEEDED,
        'Quota exceeded',
        false
      );
    }

    if (error.message?.includes('payment')) {
      return this.createError(
        ImageGenerationErrorCode.PAYMENT_REQUIRED,
        'Payment required',
        false
      );
    }

    // Default error
    return this.createError(
      ImageGenerationErrorCode.NETWORK_ERROR,
      error.message || 'Unknown error occurred',
      true
    );
  }
} 