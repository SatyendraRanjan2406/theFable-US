// Core interfaces for image generation service architecture

export interface ImageGenerationRequest {
  prompt: string;
  apiKey: string;
  options?: ImageGenerationOptions;
  referenceImage?: string; // Base64 encoded image for img2img
  characterImage?: string; // Base64 encoded character reference
  // Story-specific fields for panel generation
  storyId?: string;
  panelText?: string;
  imagePrompt?: string;
  panelNumber?: number;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  aspectRatio?: string;
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid' | 'storybook' | 'realistic';
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  responseFormat?: 'url' | 'base64';
  [key: string]: any; // Allow provider-specific options
}

export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    provider: string;
    model: string;
    generationTime: number;
    [key: string]: any;
  };
}

export interface ImageGenerationError {
  message: string;
  code: ImageGenerationErrorCode;
  provider?: string;
  retryable: boolean;
  details?: any;
}

// Provider-specific interfaces
export interface ImageGenerationProvider {
  name: string;
  model: string;
  baseUrl: string;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  isSupported(options: ImageGenerationOptions): boolean;
  getSupportedOptions(): Partial<ImageGenerationOptions>;
  getProviderInfo(): ProviderInfo;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  model: string;
  baseUrl: string;
  supportedFeatures: string[];
  defaultOptions: Partial<ImageGenerationOptions>;
  pricing?: {
    perImage?: number;
    perToken?: number;
    currency?: string;
  };
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
  };
}

// Service configuration
export interface ImageGenerationServiceConfig {
  defaultProvider: string;
  providers: Record<string, ImageGenerationProvider>;
  fallbackProvider?: string;
  retryAttempts?: number;
  timeout?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

// Character-specific generation request
export interface CharacterImageGenerationRequest extends ImageGenerationRequest {
  characterName: string;
  genre: string;
  panelIndex?: number;
  storyId?: string;
  maintainConsistency?: boolean;
}

// Story panel generation request
export interface StoryPanelGenerationRequest extends ImageGenerationRequest {
  panelText: string;
  genre: string;
  characterName?: string;
  panelIndex: number;
  storyId?: string;
  previousPanelImage?: string;
  characterPhoto?: string;
}

// Cache interfaces
export interface ImageCacheEntry {
  imageUrl: string;
  timestamp: number;
  metadata: any;
}

export interface ImageCache {
  get(key: string): ImageCacheEntry | null;
  set(key: string, entry: ImageCacheEntry): void;
  clear(pattern?: string): void;
  has(key: string): boolean;
  size(): number;
  keys(): string[];
  cleanup(): void;
}

// Provider types - extensible enum-like structure
export type ProviderType = 'huggingface' | 'minimax' | 'openai' | 'hailuo' | 'custom' | string;

// Error codes
export enum ImageGenerationErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  UNSUPPORTED_OPTIONS = 'UNSUPPORTED_OPTIONS',
  TIMEOUT = 'TIMEOUT'
}

// Provider factory interfaces
export interface ProviderFactory {
  registerProvider(name: string, provider: ImageGenerationProvider): void;
  unregisterProvider(name: string): void;
  getProvider(name: string): ImageGenerationProvider | null;
  getAllProviders(): Record<string, ImageGenerationProvider>;
  getAvailableProviders(): string[];
  createProvider(name: string): ImageGenerationProvider;
  isProviderAvailable(name: string): boolean;
  getProviderInfo(name: string): ProviderInfo | null;
}

// Provider registry for runtime registration
export interface ProviderRegistry {
  register(name: string, providerClass: new () => ImageGenerationProvider): void;
  create(name: string): ImageGenerationProvider;
  list(): string[];
  has(name: string): boolean;
  getInfo(name: string): ProviderInfo | null;
} 