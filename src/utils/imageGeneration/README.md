# Image Generation Service - Factory Pattern with Runtime Polymorphism

A comprehensive, decoupled image generation service that supports multiple providers through a factory pattern with runtime polymorphism. This implementation allows you to easily add new providers without modifying existing code.

## 🏗️ Architecture Overview
 
```
┌─────────────────────────────────────────────────────────────┐
│                    Factory Pattern Architecture             │
├─────────────────────────────────────────────────────────────┤
│  ProviderFactory (Singleton)                               │
│  ├── registerProvider() - Runtime registration             │
│  ├── getProvider() - Lazy instantiation                    │
│  ├── createProvider() - Factory method                     │
│  └── getAvailableProviders() - Discovery                   │
├─────────────────────────────────────────────────────────────┤
│  BaseProvider (Abstract)                                   │
│  ├── Template Method Pattern                               │
│  ├── Common functionality                                  │
│  └── Provider-specific hooks                               │
├─────────────────────────────────────────────────────────────┤
│  Concrete Providers                                        │
│  ├── HuggingFaceProvider                                   │
│  ├── MinimaxProvider                                       │
│  ├── OpenAIProvider                                        │
│  ├── HailuoProvider                                        │
│  └── CustomProvider (Example)                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ImageGenerationService, providerRegistry } from '@/utils/imageGeneration';

// Create service with default providers
const service = new ImageGenerationService();

// Generate image with default provider (HuggingFace)
const result = await service.generateImage({
  prompt: 'A beautiful sunset over mountains',
  apiKey: 'your-api-key',
  options: {
    width: 512,
    height: 512,
    style: 'storybook'
  }
});

//console.log('Generated image:', result.imageUrl);
```

### Provider Selection

```typescript
// Use specific provider
const result = await service.generateImage(
  {
    prompt: 'A magical forest',
    apiKey: 'your-api-key'
  },
  'openai' // Specify provider
);

// Switch default provider
service.setDefaultProvider('minimax');
service.setFallbackProvider('hailuo');
```

## 🏭 Factory Pattern Usage

### Runtime Provider Registration

```typescript
import { providerRegistry, CustomProvider } from '@/utils/imageGeneration';

// Register a new provider at runtime
providerRegistry.register('my-custom-provider', CustomProvider);

// Now you can use it
const customProvider = providerRegistry.create('my-custom-provider');
const result = await customProvider.generateImage({
  prompt: 'Custom prompt',
  apiKey: 'custom-api-key'
});
```

### Provider Discovery

```typescript
// Get all available providers
const availableProviders = providerRegistry.list();
//console.log('Available providers:', availableProviders);
// Output: ['huggingface', 'minimax', 'openai', 'hailuo', 'my-custom-provider']

// Check if provider is available
const isAvailable = providerRegistry.has('openai');
//console.log('OpenAI available:', isAvailable); // true

// Get provider information
const info = providerRegistry.getInfo('huggingface');
//console.log('HuggingFace info:', info);
```

### Provider Information

```typescript
const info = providerRegistry.getInfo('huggingface');
//console.log(info);
// Output:
// {
//   name: 'huggingface',
//   displayName: 'HuggingFace',
//   description: 'HuggingFace FLUX.1-schnell model for high-quality storybook illustrations',
//   model: 'black-forest-labs/FLUX.1-schnell',
//   baseUrl: 'https://api-inference.huggingface.co/models',
//   supportedFeatures: ['text-to-image', 'image-to-image', 'character-reference', 'storybook-style'],
//   defaultOptions: { width: 512, height: 512, style: 'storybook' },
//   pricing: { perImage: 0.001, currency: 'USD' },
//   rateLimits: { requestsPerMinute: 10, requestsPerHour: 100 }
// }
```

## 🔧 Adding New Providers

### Step 1: Create Provider Class

```typescript
import { BaseProvider } from '@/utils/imageGeneration/providers/BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '@/utils/imageGeneration/types';

export class MyCustomProvider extends BaseProvider {
  name = 'mycustom';
  model = 'my-model-v1';
  baseUrl = 'https://api.mycustom.com/v1';

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 512,
    height: 512,
    quality: 'standard',
    style: 'storybook',
    responseFormat: 'url'
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      width: 512, // Supports 512, 768, 1024
      height: 512, // Supports 512, 768, 1024
      customParameter: 'default-value' // Custom option
    };
  }

  protected getDisplayName(): string {
    return 'My Custom Provider';
  }

  protected getDescription(): string {
    return 'My custom image generation provider with special features';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'custom-features',
      'special-processing'
    ];
  }

  protected getPricing(): any {
    return {
      perImage: 0.003,
      currency: 'USD'
    };
  }

  protected getRateLimits(): any {
    return {
      requestsPerMinute: 15,
      requestsPerHour: 150
    };
  }

  protected async generateImageInternal(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    const url = `${this.baseUrl}/generate`;
    
    const body: any = {
      model: this.model,
      prompt: request.prompt,
      width: options.width,
      height: options.height,
      custom_parameter: options.customParameter,
      response_format: 'url'
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw this.createError(
        ImageGenerationErrorCode.INVALID_RESPONSE,
        `API error: ${response.status} - ${errorText}`,
        response.status >= 500
      );
    }

    const data = await response.json();
    
    return {
      imageUrl: data.image_url,
      metadata: {
        provider: this.name,
        model: this.model,
        generationTime: Date.now()
      }
    };
  }
}
```

### Step 2: Register Provider

```typescript
import { providerRegistry } from '@/utils/imageGeneration';
import { MyCustomProvider } from './MyCustomProvider';

// Register the provider
providerRegistry.register('mycustom', MyCustomProvider);

// Verify registration
//console.log('Available providers:', providerRegistry.list());
// Output: ['huggingface', 'minimax', 'openai', 'hailuo', 'mycustom']
```

### Step 3: Use the Provider

```typescript
// Use directly
const customProvider = providerRegistry.create('mycustom');
const result = await customProvider.generateImage({
  prompt: 'A beautiful landscape',
  apiKey: 'my-api-key',
  options: {
    customParameter: 'enhanced-quality'
  }
});

// Or use through service
const service = new ImageGenerationService();
const result = await service.generateImage(
  {
    prompt: 'A beautiful landscape',
    apiKey: 'my-api-key'
  },
  'mycustom'
);
```

## 🎯 Advanced Features

### Provider-Specific Options

```typescript
// Each provider can support different options
const huggingfaceResult = await service.generateImage({
  prompt: 'A magical forest',
  apiKey: 'hf-api-key',
  options: {
    numInferenceSteps: 20,
    guidanceScale: 7.5,
    seed: 12345
  }
}, 'huggingface');

const openaiResult = await service.generateImage({
  prompt: 'A magical forest',
  apiKey: 'openai-api-key',
  options: {
    quality: 'hd',
    style: 'vivid'
  }
}, 'openai');
```

### Automatic Fallback

```typescript
const service = new ImageGenerationService({
  defaultProvider: 'huggingface',
  fallbackProvider: 'minimax',
  retryAttempts: 3
});

// If HuggingFace fails, it will automatically try Minimax
const result = await service.generateImage({
  prompt: 'A magical forest',
  apiKey: 'hf-api-key'
});
```

### Caching

```typescript
const service = new ImageGenerationService({
  enableCaching: true,
  cacheTTL: 30 * 60 * 1000 // 30 minutes
});

// First call generates the image
const result1 = await service.generateImage(request);

// Second call with same parameters returns cached result
const result2 = await service.generateImage(request); // Instant!

// Clear cache
service.clearCache();
```

### Error Handling

```typescript
try {
  const result = await service.generateImage(request);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    //console.log('Rate limited, will retry later');
  } else if (error.code === 'PAYMENT_REQUIRED') {
    //console.log('Payment required');
  } else if (error.retryable) {
    //console.log('Retryable error:', error.message);
  } else {
    console.error('Fatal error:', error.message);
  }
}
```

## 🔄 Runtime Polymorphism Examples

### Dynamic Provider Selection

```typescript
const providers = ['huggingface', 'minimax', 'openai', 'hailuo'];
const selectedProvider = providers[Math.floor(Math.random() * providers.length)];

const result = await service.generateImage(request, selectedProvider);
//console.log(`Used provider: ${result.metadata.provider}`);
```

### Provider Comparison

```typescript
async function compareProviders(prompt: string, apiKeys: Record<string, string>) {
  const results: Record<string, any> = {};
  
  for (const providerName of providerRegistry.list()) {
    if (apiKeys[providerName]) {
      try {
        const startTime = Date.now();
        const result = await service.generateImage(
          { prompt, apiKey: apiKeys[providerName] },
          providerName
        );
        const endTime = Date.now();
        
        results[providerName] = {
          imageUrl: result.imageUrl,
          generationTime: endTime - startTime,
          metadata: result.metadata
        };
      } catch (error) {
        results[providerName] = { error: error.message };
      }
    }
  }
  
  return results;
}

const comparison = await compareProviders('A magical forest', {
  huggingface: 'hf-key',
  openai: 'openai-key',
  minimax: 'minimax-key'
});
```

### Plugin-Style Provider Loading

```typescript
// Load providers dynamically based on configuration
const loadProvidersFromConfig = (config: any) => {
  config.providers.forEach((providerConfig: any) => {
    if (providerConfig.enabled) {
      // Import provider dynamically
      import(`./providers/${providerConfig.name}Provider`)
        .then(module => {
          const ProviderClass = module[`${providerConfig.name}Provider`];
          providerRegistry.register(providerConfig.name, ProviderClass);
          //console.log(`Loaded provider: ${providerConfig.name}`);
        })
        .catch(error => {
          console.warn(`Failed to load provider ${providerConfig.name}:`, error);
        });
    }
  });
};

const config = {
  providers: [
    { name: 'huggingface', enabled: true },
    { name: 'openai', enabled: true },
    { name: 'custom', enabled: false }
  ]
};

loadProvidersFromConfig(config);
```

## 📊 Provider Statistics

```typescript
import { globalProviderRegistry } from '@/utils/imageGeneration';

const stats = globalProviderRegistry.getStats();
//console.log(stats);
// Output:
// {
//   totalProviders: 4,
//   instantiatedProviders: 2,
//   registeredClasses: 4,
//   availableProviders: ['huggingface', 'minimax', 'openai', 'hailuo']
// }
```

## 🎨 React Hook Integration

```typescript
import { useDecoupledImageGeneration } from '@/hooks/useDecoupledImageGeneration';

const MyComponent = () => {
  const {
    isGenerating,
    generatedImage,
    error,
    generateImage,
    setProvider,
    getAvailableProviders
  } = useDecoupledImageGeneration({
    defaultProvider: 'huggingface',
    fallbackProvider: 'minimax'
  });

  const handleProviderChange = (provider: string) => {
    setProvider(provider as any);
  };

  const handleGenerate = async () => {
    await generateImage({
      prompt: 'A beautiful sunset',
      apiKey: 'your-api-key'
    });
  };

  return (
    <div>
      <select onChange={(e) => handleProviderChange(e.target.value)}>
        {getAvailableProviders().map(provider => (
          <option key={provider} value={provider}>
            {provider}
          </option>
        ))}
      </select>
      
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </button>
      
      {generatedImage && <img src={generatedImage} alt="Generated" />}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};
```

## 🔧 Configuration

### Service Configuration

```typescript
const service = new ImageGenerationService({
  defaultProvider: 'huggingface',
  fallbackProvider: 'minimax',
  retryAttempts: 3,
  timeout: 30000,
  enableCaching: true,
  cacheTTL: 30 * 60 * 1000
});
```

### Provider-Specific Configuration

```typescript
// Register provider with custom configuration
const customHuggingFace = new HuggingFaceProvider();
customHuggingFace.setCustomConfig({
  model: 'custom-model',
  baseUrl: 'https://custom-api.com'
});

providerRegistry.register('custom-hf', customHuggingFace);
```

## 🚀 Benefits of This Architecture

1. **Runtime Polymorphism**: Add providers without recompiling
2. **Factory Pattern**: Centralized provider creation and management
3. **Extensibility**: Easy to add new providers
4. **Type Safety**: Full TypeScript support
5. **Error Handling**: Comprehensive error management
6. **Caching**: Built-in intelligent caching
7. **Fallback**: Automatic provider fallback
8. **Discovery**: Runtime provider discovery
9. **Information**: Rich provider metadata
10. **Testing**: Easy to mock and test

## 🎯 Use Cases

- **Multi-Provider Applications**: Use different providers for different use cases
- **Plugin Systems**: Load providers dynamically
- **A/B Testing**: Compare different providers
- **Cost Optimization**: Choose providers based on cost
- **Quality Optimization**: Choose providers based on quality requirements
- **Reliability**: Automatic fallback for high availability

This factory pattern implementation provides a robust, extensible, and maintainable solution for multi-provider image generation! 🎨✨ 