import { BaseProvider } from './BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '../types';

export class HailuoProvider extends BaseProvider {
  name = 'hailuo';
  model = 'realistic-vision-v5';
  baseUrl = 'https://api.hailuo.io';

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 512,
    height: 512,
    quality: 'standard',
    style: 'realistic',
    responseFormat: 'base64',
    numInferenceSteps: 20,
    guidanceScale: 7.5
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      width: 512, // Supports 512, 768, 1024
      height: 512, // Supports 512, 768, 1024
      numInferenceSteps: 20, // Supports 1-50
      guidanceScale: 7.5, // Supports 1.0-20.0
      seed: 0 // Supports 0-2147483647
    };
  }

  protected getDisplayName(): string {
    return 'Hailuo';
  }

  protected getDescription(): string {
    return 'Hailuo Realistic Vision model for photorealistic image generation with character reference support';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'image-to-image',
      'character-reference',
      'photorealistic',
      'realistic-style'
    ];
  }

  protected getPricing(): any {
    return {
      perImage: 0.001, // Approximate cost per image
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
    const url = `${this.baseUrl}/api/v1/generation`;
    
    const body: any = {
      model: this.model,
      prompt: request.prompt,
      width: options.width,
      height: options.height,
      num_inference_steps: options.numInferenceSteps,
      guidance_scale: options.guidanceScale,
      seed: options.seed || Math.floor(Math.random() * 1000000),
      response_format: 'base64'
    };

    // Add reference image if provided (img2img)
    if (request.referenceImage) {
      body.init_image = request.referenceImage;
      body.strength = 0.7; // Default strength for img2img
    }

    // Add character reference if provided
    if (request.characterImage) {
      body.controlnet_input = request.characterImage;
      body.controlnet_type = 'character_reference';
    }

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
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const base64Image = data.images[0];
      imageUrl = `data:image/png;base64,${base64Image}`;
    } else {
      throw this.createError(
        ImageGenerationErrorCode.INVALID_RESPONSE,
        'No image data found in API response',
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