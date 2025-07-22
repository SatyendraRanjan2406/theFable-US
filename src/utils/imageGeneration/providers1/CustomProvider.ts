import { BaseProvider } from './BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '../types';

/**
 * Example Custom Provider demonstrating how to add new providers
 * This shows the runtime polymorphism pattern in action
 */
export class CustomProvider extends BaseProvider {
  name = 'custom';
  model = 'custom-model-v1';
  baseUrl = 'https://api.custom-provider.com/v1';

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 512,
    height: 512,
    quality: 'standard',
    style: 'storybook',
    responseFormat: 'url',
    customParameter: 'default-value'
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      width: 512, // Supports 512, 768, 1024
      height: 512, // Supports 512, 768, 1024
      customParameter: 'default-value' // Custom provider-specific option
    };
  }

  protected getDisplayName(): string {
    return 'Custom Provider';
  }

  protected getDescription(): string {
    return 'Custom image generation provider for demonstration purposes';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'custom-features',
      'demonstration'
    ];
  }

  protected getPricing(): any {
    return {
      perImage: 0.005,
      currency: 'USD'
    };
  }

  protected getRateLimits(): any {
    return {
      requestsPerMinute: 5,
      requestsPerHour: 50
    };
  }

  protected async preprocessRequest(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationRequest> {
    // Custom preprocessing logic
    if (options.customParameter) {
      request.prompt = `${request.prompt} [Custom: ${options.customParameter}]`;
    }
    
    return request;
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

    // Add custom provider-specific logic
    if (request.characterImage) {
      body.character_reference = request.characterImage;
    }

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${this.name} API Error:`, response.status, errorText);
      
      if (response.status === 429) {
        throw this.createError(
          ImageGenerationErrorCode.RATE_LIMITED,
          'Rate limit exceeded',
          true
        );
      }
      
      if (response.status === 402) {
        throw this.createError(
          ImageGenerationErrorCode.PAYMENT_REQUIRED,
          'Payment required',
          false
        );
      }
      
      throw this.createError(
        ImageGenerationErrorCode.INVALID_RESPONSE,
        `API error: ${response.status} - ${errorText}`,
        response.status >= 500
      );
    }

    const data = await response.json();
    //console.log(`${this.name} API Response:`, data);
    
    let imageUrl: string;
    if (data.image_url) {
      imageUrl = data.image_url;
    } else if (data.data?.url) {
      imageUrl = data.data.url;
    } else {
      throw this.createError(
        ImageGenerationErrorCode.INVALID_RESPONSE,
        'No image URL found in API response',
        false
      );
    }

    return {
      imageUrl,
      metadata: {
        provider: this.name,
        model: this.model,
        generationTime: Date.now(),
        customMetadata: data.metadata || {}
      }
    };
  }

  protected async postprocessResponse(
    response: ImageGenerationResponse, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    // Custom post-processing logic
    if (options.customParameter) {
      response.metadata.customProcessing = `Processed with ${options.customParameter}`;
    }
    
    return response;
  }
}

/**
 * Example of how to register a custom provider at runtime
 */
export const registerCustomProvider = () => {
  // Import the registry
  const { providerRegistry } = require('../ProviderFactory');
  
  // Register the custom provider
  providerRegistry.register('custom', CustomProvider);
  
  //console.log('Custom provider registered successfully');
  //console.log('Available providers:', providerRegistry.list());
};

/**
 * Example of how to use the custom provider
 */
export const useCustomProvider = async () => {
  const { getProvider } = require('./index');
  
  try {
    // Get the custom provider
    const customProvider = getProvider('custom');
    
    // Use it to generate an image
    const result = await customProvider.generateImage({
      prompt: 'A beautiful sunset over mountains',
      apiKey: 'your-api-key',
      options: {
        width: 512,
        height: 512,
        customParameter: 'enhanced-quality'
      }
    });
    
    //console.log('Custom provider result:', result);
    return result;
  } catch (error) {
    console.error('Custom provider error:', error);
    throw error;
  }
}; 