import { BaseProvider } from './BaseProvider';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  ImageGenerationErrorCode
} from '../types';

export class HuggingFaceProvider extends BaseProvider {
  name = 'huggingface';
  model = 'black-forest-labs/FLUX.1-schnell';
  baseUrl = 'https://api-inference.huggingface.co/models';

  protected defaultOptions: Partial<ImageGenerationOptions> = {
    width: 512,
    height: 512,
    quality: 'standard',
    style: 'storybook',
    responseFormat: 'url',
    numInferenceSteps: 12,
    guidanceScale: 6.0
  };

  getSupportedOptions(): Partial<ImageGenerationOptions> {
    return {
      ...this.defaultOptions,
      // Note: These are supported ranges, not exact values
      width: 512, // Supports 512, 768, 1024
      height: 512, // Supports 512, 768, 1024
      numInferenceSteps: 12, // Supports 1-50
      guidanceScale: 6.0, // Supports 1.0-20.0
      seed: 0 // Supports 0-2147483647
    };
  }

  protected getDisplayName(): string {
    return 'HuggingFace';
  }

  protected getDescription(): string {
    return 'HuggingFace FLUX.1-schnell model for high-quality storybook illustrations with character consistency';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'text-to-image',
      'image-to-image',
      'character-reference',
      'storybook-style',
      'progressive-continuity'
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
      requestsPerMinute: 10,
      requestsPerHour: 100
    };
  }

  protected async preprocessRequest(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationRequest> {
    // Enhance prompt for storybook style if not already enhanced
    if (options.style === 'storybook' && !request.prompt.includes('STORYBOOK')) {
      request.prompt = this.enhancePromptForStorybook(request.prompt, request.referenceImage);
    }
    
    return request;
  }

  protected async generateImageInternal(
    request: ImageGenerationRequest, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    const url = `${this.baseUrl}/${this.model}`;
    
    const body: any = {
      inputs: request.prompt,
      parameters: {
        width: options.width,
        height: options.height,
        num_inference_steps: options.numInferenceSteps,
        guidance_scale: options.guidanceScale,
        seed: options.seed || Math.floor(Math.random() * 1000000)
      }
    };

    // Add reference image if provided (img2img)
    if (request.referenceImage) {
      body.inputs = {
        image: request.referenceImage,
        prompt: request.prompt
      };
      body.parameters.strength = 0.7; // Default strength for img2img
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
      
      throw this.createError(
        ImageGenerationErrorCode.INVALID_RESPONSE,
        `API error: ${response.status} - ${errorText}`,
        response.status >= 500
      );
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    return {
      imageUrl,
      metadata: {
        provider: this.name,
        model: this.model,
        generationTime: Date.now()
      }
    };
  }

  private enhancePromptForStorybook(prompt: string, referenceImage?: string): string {
    let enhancedPrompt = `${prompt}, MASTERPIECE STORYBOOK DIGITAL PAINTING with PROGRESSIVE VISUAL CONTINUITY, ABSOLUTE photographic facial accuracy maintained from reference, PERFECTLY CONSISTENT artistic style throughout entire story series, UNIFIED color palette and lighting across all panels, SEAMLESS progressive panel-to-panel visual flow with EXACT character likeness, PROFESSIONAL children's book illustration series with PERFECT photo resemblance consistency, IDENTICAL brushwork technique and character appearance progression, COHERENT lighting philosophy and atmospheric consistency with MAINTAINED facial recognition throughout story progression, FLUX style mastery with PHOTOGRAPHIC character accuracy, ZERO artistic or facial variation between sequential panels`;
    
    if (referenceImage) {
      enhancedPrompt += `, PROGRESSIVE REFERENCE CONTINUITY: Continue the visual story seamlessly from the previous panel, maintain EXACT same character appearance, preserve identical lighting conditions and environmental atmosphere, ensure smooth visual transition while advancing the story naturally, keep perfect character consistency and scene flow`;
    }
    
    return enhancedPrompt;
  }
} 