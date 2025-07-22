import { 
  ImageGenerationProvider, 
  ProviderFactory as IProviderFactory,
  ProviderRegistry,
  ProviderInfo,
  ImageGenerationError,
  ImageGenerationErrorCode
} from './types';

/**
 * Provider Factory implementing runtime polymorphism
 * Allows dynamic registration and creation of image generation providers
 */
export class ProviderFactory implements IProviderFactory {
  private providers: Map<string, ImageGenerationProvider> = new Map();
  private providerClasses: Map<string, new () => ImageGenerationProvider> = new Map();

  /**
   * Register a provider instance
   */
  registerProvider(name: string, provider: ImageGenerationProvider): void {
    this.providers.set(name.toLowerCase(), provider);
    //console.log(`Provider '${name}' registered successfully`);
  }

  /**
   * Register a provider class for lazy instantiation
   */
  registerProviderClass(name: string, providerClass: new () => ImageGenerationProvider): void {
    this.providerClasses.set(name.toLowerCase(), providerClass);
    //console.log(`Provider class '${name}' registered successfully`);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(name: string): void {
    const key = name.toLowerCase();
    this.providers.delete(key);
    this.providerClasses.delete(key);
    //console.log(`Provider '${name}' unregistered successfully`);
  }

  /**
   * Get a provider instance (creates if not exists)
   */
  getProvider(name: string): ImageGenerationProvider | null {
    const key = name.toLowerCase();
    
    // Check if provider instance exists
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }
    
    // Try to create from registered class
    if (this.providerClasses.has(key)) {
      try {
        const providerClass = this.providerClasses.get(key)!;
        const provider = new providerClass();
        this.providers.set(key, provider); // Cache the instance
        return provider;
      } catch (error) {
        console.error(`Failed to create provider '${name}':`, error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get all registered provider instances
   */
  getAllProviders(): Record<string, ImageGenerationProvider> {
    const result: Record<string, ImageGenerationProvider> = {};
    for (const [name, provider] of this.providers.entries()) {
      result[name] = provider;
    }
    return result;
  }

  /**
   * Get list of available provider names
   */
  getAvailableProviders(): string[] {
    const providers = new Set<string>();
    
    // Add registered instances
    for (const name of this.providers.keys()) {
      providers.add(name);
    }
    
    // Add registered classes
    for (const name of this.providerClasses.keys()) {
      providers.add(name);
    }
    
    return Array.from(providers);
  }

  /**
   * Create a new provider instance
   */
  createProvider(name: string): ImageGenerationProvider {
    const provider = this.getProvider(name);
    if (!provider) {
      throw {
        message: `Provider '${name}' not found`,
        code: ImageGenerationErrorCode.PROVIDER_UNAVAILABLE,
        provider: name,
        retryable: false
      } as ImageGenerationError;
    }
    return provider;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(name: string): boolean {
    const key = name.toLowerCase();
    return this.providers.has(key) || this.providerClasses.has(key);
  }

  /**
   * Get provider information
   */
  getProviderInfo(name: string): ProviderInfo | null {
    const provider = this.getProvider(name);
    return provider ? provider.getProviderInfo() : null;
  }

  /**
   * Get all provider information
   */
  getAllProviderInfo(): Record<string, ProviderInfo> {
    const result: Record<string, ProviderInfo> = {};
    for (const name of this.getAvailableProviders()) {
      const info = this.getProviderInfo(name);
      if (info) {
        result[name] = info;
      }
    }
    return result;
  }

  /**
   * Validate provider configuration
   */
  validateProvider(name: string): boolean {
    try {
      const provider = this.getProvider(name);
      if (!provider) return false;
      
      // Test basic provider interface
      const info = provider.getProviderInfo();
      return !!(info.name && info.model && info.baseUrl);
    } catch (error) {
      console.error(`Provider validation failed for '${name}':`, error);
      return false;
    }
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.providerClasses.clear();
    //console.log('All providers cleared');
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    totalProviders: number;
    instantiatedProviders: number;
    registeredClasses: number;
    availableProviders: string[];
  } {
    return {
      totalProviders: this.getAvailableProviders().length,
      instantiatedProviders: this.providers.size,
      registeredClasses: this.providerClasses.size,
      availableProviders: this.getAvailableProviders()
    };
  }
}

/**
 * Global provider registry singleton
 */
export const globalProviderRegistry = new ProviderFactory();

/**
 * Provider Registry interface implementation
 */
export class ProviderRegistryImpl implements ProviderRegistry {
  private factory: ProviderFactory;

  constructor(factory: ProviderFactory = globalProviderRegistry) {
    this.factory = factory;
  }

  register(name: string, providerClass: new () => ImageGenerationProvider): void {
    this.factory.registerProviderClass(name, providerClass);
  }

  create(name: string): ImageGenerationProvider {
    return this.factory.createProvider(name);
  }

  list(): string[] {
    return this.factory.getAvailableProviders();
  }

  has(name: string): boolean {
    return this.factory.isProviderAvailable(name);
  }

  getInfo(name: string): ProviderInfo | null {
    return this.factory.getProviderInfo(name);
  }
}

// Export the global registry instance
export const providerRegistry = new ProviderRegistryImpl(); 