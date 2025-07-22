import { BaseProvider } from './BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '../types';
import { BASE_URL } from '@/config/api';

export class MinimaxProvider extends BaseProvider {
  name = 'minimax';
  model = 'image-01';
  // baseUrl = `${BASE_URL}/api/auth/min-max`;
  baseUrl = `${BASE_URL}/api/auth/min-max`;

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 1024,
    height: 1024,
    quality: 'standard',
    style: 'storybook',
    responseFormat: 'url',
    aspectRatio: '16:9'
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      aspectRatio: '16:9', // Supports various aspect ratios
      quality: 'standard' // Supports standard quality
    };
  }

  protected getDisplayName(): string {
    return 'Minimax';
  }

  protected getDescription(): string {
    return 'Minimax image-01 model for high-resolution images with aspect ratio control and character reference support';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'character-reference',
      'aspect-ratio-control',
      'high-resolution',
      'prompt-optimization'
    ];
  }

  protected getPricing(): any {
    return {
      perImage: 0.002, // Approximate cost per image
      currency: 'USD'
    };
  }

  protected getRateLimits(): any {
    return {
      requestsPerMinute: 20,
      requestsPerHour: 200
    };
  }

  protected async preprocessRequest(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationRequest> {
    // Minimax has specific prompt requirements
    if (options.style === 'storybook' && !request.prompt.includes('children')) {
      request.prompt = this.enhancePromptForStorybook(request.prompt);
    }
    
    return request;
  }

  protected async generateImageInternal(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    const url = `${this.baseUrl}/generate/`;
    
    const body: any = {
      prompt: request.prompt,
      aspect_ratio: options.aspectRatio || '16:9',
      response_format: 'url',
      n: 1
    };

    // Add story-specific fields if provided
    if (request.storyId) {
      body.story_id = request.storyId;
    }
    if (request.panelText) {
      body.panel_text = request.panelText;
    }
    if (request.imagePrompt) {
      body.image_prompt = request.imagePrompt;
    }
    if (request.panelNumber !== undefined) {
      body.panel_number = request.panelNumber;
    }

    // Add character reference if provided
    if (request.characterImage) {
      body.subject_reference = [
        {
          type: 'character',
          image_file: `data:image/png;base64,${request.characterImage}`
        }
      ];
    }

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'csrftoken=BEHBuOOCE57gPnVVHv15JUe2th1lcyQ2'
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
      // Use presigned_url if available, otherwise fall back to original_url
      const imageData = data.images[0];
      imageUrl = imageData.presigned_url || imageData.original_url;
      
      if (imageData.presigned_url) {
        //console.log(`${this.name}: Using presigned URL for PDF generation`);
      } else if (imageData.original_url) {
        //console.log(`${this.name}: Using original URL (presigned URL not available)`);
      }
      
      if (!imageUrl) {
        throw this.createError(
          ImageGenerationErrorCode.INVALID_RESPONSE,
          'No valid image URL found in API response',
          false
        );
      }
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
        generationTime: Date.now(),
        n: data.total_images,
        message: data.message
      }
    };
  }

  private enhancePromptForStorybook(prompt: string): string {
    return `${prompt}, beautiful illustration, children's book style, cartoon style, friendly and colorful, high quality digital art`;
  }
} 