import { BaseProvider } from './BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '../types';

export class OpenAIProvider extends BaseProvider {
  name = 'openai';
  model = 'dall-e-3';
  baseUrl = 'https://api.openai.com/v1';

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 1024,
    height: 1024,
    quality: 'hd',
    style: 'natural',
    responseFormat: 'url'
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      width: 1024, // Supports 1024x1024, 1792x1024, 1024x1792
      height: 1024, // Supports 1024x1024, 1792x1024, 1024x1792
      quality: 'hd', // Supports 'standard' or 'hd'
      style: 'natural' // Supports 'natural' or 'vivid'
    };
  }

  protected getDisplayName(): string {
    return 'OpenAI';
  }

  protected getDescription(): string {
    return 'OpenAI DALL-E 3 model for high-quality, photorealistic image generation with natural and vivid styles';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'high-quality',
      'photorealistic',
      'natural-style',
      'vivid-style',
      'hd-quality'
    ];
  }

  protected getPricing(): any {
    return {
      perImage: 0.04, // DALL-E 3 pricing
      currency: 'USD'
    };
  }

  protected getRateLimits(): any {
    return {
      requestsPerMinute: 50,
      requestsPerHour: 1000
    };
  }

  protected async preprocessRequest(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationRequest> {
    // OpenAI has specific size requirements
    if (options.width && options.height) {
      const size = `${options.width}x${options.height}`;
      if (!['1024x1024', '1792x1024', '1024x1792'].includes(size)) {
        // Default to 1024x1024 if unsupported size
        options.width = 1024;
        options.height = 1024;
      }
    }
    
    return request;
  }

  protected async generateImageInternal(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    const url = `${this.baseUrl}/images/generations`;
    
    const body: any = {
      model: this.model,
      prompt: request.prompt,
      n: 1,
      size: `${options.width}x${options.height}`,
      quality: options.quality,
      style: options.style,
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
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      imageUrl = data.data[0].url;
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
        generationTime: Date.now()
      }
    };
  }
} 