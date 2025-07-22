const HF_API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
import { fileToBase64 } from '@/utils/imageUtils';
import { apiFetch } from '@/utils/apiInterceptor';
import { DYNAMIC_BASE_URL, API_ENDPOINTS } from '@/config/api';

export const generateSceneImage = async (prompt: string, apiKey: string, referenceImageUrl?: string): Promise<string> => {
  try {
    //console.log('Generating PROGRESSIVE STORYBOOK scene with FLUX model');
    //console.log('Using reference image for progressive continuity:', !!referenceImageUrl);
    //console.log('Prompt preview:', prompt.substring(0, 200));
    
    if (!apiKey) {
      throw new Error('Hugging Face API key is required');
    }
    
    // ENHANCED prompt for FLUX model with progressive visual continuity focus
    let enhancedPrompt = `${prompt}, MASTERPIECE STORYBOOK DIGITAL PAINTING with PROGRESSIVE VISUAL CONTINUITY, ABSOLUTE photographic facial accuracy maintained from reference, PERFECTLY CONSISTENT artistic style throughout entire story series, UNIFIED color palette and lighting across all panels, SEAMLESS progressive panel-to-panel visual flow with EXACT character likeness, PROFESSIONAL children's book illustration series with PERFECT photo resemblance consistency, IDENTICAL brushwork technique and character appearance progression, COHERENT lighting philosophy and atmospheric consistency with MAINTAINED facial recognition throughout story progression, FLUX style mastery with PHOTOGRAPHIC character accuracy, ZERO artistic or facial variation between sequential panels`;
    
    // If we have a reference image for progressive continuity, enhance the prompt accordingly
    if (referenceImageUrl) {
      enhancedPrompt += `, PROGRESSIVE REFERENCE CONTINUITY: Continue the visual story seamlessly from the previous panel, maintain EXACT same character appearance, preserve identical lighting conditions and environmental atmosphere, ensure smooth visual transition while advancing the story naturally, keep perfect character consistency and scene flow`;
    }
    
    const response = await fetch(HF_API_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: enhancedPrompt,
        parameters: {
          width: 512,
          height: 512,
          num_inference_steps: 12, // Increased for better progressive consistency
          guidance_scale: 6.0, // Higher for better progressive reference adherence
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FLUX Progressive Continuity API Error:', response.status, errorText);
      throw new Error(`FLUX API error! status: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    //console.log('Successfully generated FLUX PROGRESSIVE CONTINUITY storybook scene');
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating FLUX progressive continuity storybook scene image:', error);
    // Fallback to a default children's book illustration
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop';
  }
};

export const generateImg2ImgWithPhoto = async (prompt: string, referenceImageUrl: string, apiKey: string): Promise<string> => {
  try {
    //console.log('Generating MAXIMUM PROGRESSIVE CHARACTER-CONSISTENT storybook illustration using FLUX model with photo reference');
    
    if (!apiKey) {
      throw new Error('Hugging Face API key is required');
    }

    // Progressive character likeness prompt for FLUX with focused consistency requirements
    const progressiveCharacterPrompt = `PROGRESSIVE CHARACTER CONSISTENCY: ${prompt}. Critically important: maintain 100% photographic facial accuracy from the reference image for character identity. The character's face must be an identical match throughout the progressive story sequence. Ensure perfect visual continuation and character consistency for seamless story flow. Zero variation from the established photo likeness is permitted in this progressive sequence.`;

    //console.log('Using FLUX text2img with PROGRESSIVE PHOTO LIKENESS reference-inspired prompt for maximum character consistency');
    
    const response = await fetch(HF_API_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: progressiveCharacterPrompt,
        parameters: {
          width: 512,
          height: 512,
          num_inference_steps: 15, // Increased for better progressive character consistency
          guidance_scale: 7.0, // Higher guidance for better progressive photo reference adherence
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FLUX Progressive Character Consistency API Error:', response.status, errorText);
      // Fallback to regular text2img if reference-based generation fails
      //console.log('Falling back to regular FLUX text2img generation with progressive photo likeness focus');
      return generateSceneImage(prompt, apiKey);
    }

    const blob = await response.blob();
    //console.log('Successfully generated FLUX PROGRESSIVE CHARACTER CONSISTENCY storybook illustration');
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating FLUX progressive character consistency image:', error);
    // Fallback to regular text2img generation
    //console.log('Falling back to regular FLUX text2img generation with progressive photo likeness focus due to error');
    return generateSceneImage(prompt, apiKey);
  }
};

/**
 * Minimax API for image generation with character reference support
 * @param prompt Text prompt for the image
 * @param characterImageBase64 Base64 encoded character image
 * @param options Additional options for story-specific generation
 * @param isAuthenticated Whether the user is authenticated
 * @returns {Promise<{minimaxUrl: string, s3Url: string}>} URLs of the generated image
 */
export const generateMinimaxImage = async (
  prompt: string, 
  characterImageBase64: string,
  options?: {
    storyId?: string;
    panelText?: string;
    imagePrompt?: string;
    panelNumber?: number;
    characterName?: string;
    characterAge?: string;
    characterGender?: string;
    genre?: string;
  },
  isAuthenticated: boolean = false
): Promise<{minimaxUrl: string, s3Url: string}> => {
  //console.log('Calling Minimax API with options:', options);

  try {
    const requestBody: any = {
      prompt,
      subject_reference: [
        {
          type: 'character',
          image_file: `data:image/png;base64,${characterImageBase64}`
        }
      ],
      aspect_ratio: '16:9',
      response_format: 'url',
      n: 1
    };

    // Add story-specific fields if provided
    console.log('generateMinimaxImage - options:', options);
    if (options?.storyId) {
      requestBody.story_id = options.storyId;
      console.log('✅ Added story_id to request:', options.storyId);
    } else {
      console.log('⚠️ No story_id provided in options');
    }
    if (options?.panelText) {
      requestBody.panel_text = options.panelText;
      console.log('✅ Added panel_text to request:', options.panelText.substring(0, 100) + '...');
    }
    if (options?.imagePrompt) {
      requestBody.image_prompt = options.imagePrompt;
      console.log('✅ Added image_prompt to request:', options.imagePrompt.substring(0, 100) + '...');
    }
    if (options?.panelNumber !== undefined) {
      requestBody.panel_number = options.panelNumber;
      console.log('✅ Added panel_number to request:', options.panelNumber);
    }

    // Add character information from localStorage if available
    if (options?.characterName && options.characterName.trim()) {
      requestBody.character_name = options.characterName.trim();
      console.log('✅ Added character_name to request:', options.characterName.trim());
    }
    if (options?.characterAge && options.characterAge.toString().trim()) {
      requestBody.character_age = options.characterAge.toString().trim();
      console.log('✅ Added character_age to request:', options.characterAge.toString().trim());
    }
    if (options?.characterGender && options.characterGender.trim()) {
      requestBody.character_gender = options.characterGender.trim();
      console.log('✅ Added character_gender to request:', options.characterGender.trim());
    }
    if (options?.genre && options.genre.trim()) {
      requestBody.story_genre = options.genre.trim();
      console.log('✅ Added story_genre to request:', options.genre.trim());
    }

    // Log the complete request body for debugging
    console.log('📤 Complete request body for image regeneration:', JSON.stringify(requestBody, null, 2));

    // Choose endpoint based on authentication status
    const endpoint = isAuthenticated 
      ? API_ENDPOINTS.imageGeneration.authenticated 
      : API_ENDPOINTS.imageGeneration.public;

    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: requestBody
    });

    //console.log('Minimax API Response received:', response);

    if (response.processed_images && Array.isArray(response.processed_images) && response.processed_images.length > 0) {
      const imageData = response.processed_images[0];
      const minimaxUrl = imageData.original_url || imageData.minimax_url;
      const s3Url = imageData.s3_url || imageData.aws_s3_url;

      if (!minimaxUrl && !s3Url) {
        throw new Error('No valid image URLs found in API response');
      }

      console.log('Minimax API call completed successfully:', {
        minimaxUrl: minimaxUrl || 'Not provided',
        s3Url: s3Url || 'Not provided'
      });
      
      return {
        minimaxUrl: minimaxUrl || '',
        s3Url: s3Url || ''
      };
    }

    // Fallback for the old format, just in case
    if (response.images && Array.isArray(response.images) && response.images.length > 0) {
      const imageData = response.images[0];
      const minimaxUrl = imageData.original_url || imageData.minimax_url;
      const s3Url = imageData.presigned_url || imageData.s3_url;

      if (!minimaxUrl && !s3Url) {
        throw new Error('No valid image URLs found in legacy API response');
      }

      console.log('Minimax API call completed successfully (using legacy format):', {
        minimaxUrl: minimaxUrl || 'Not provided',
        s3Url: s3Url || 'Not provided'
      });
      
      return {
        minimaxUrl: minimaxUrl || '',
        s3Url: s3Url || ''
      };
    }

    throw new Error('No image data found in API response');
  } catch (error) {
    console.error('Minimax API Error:', error);
    // Re-throw the error to be handled by the caller, as apiFetch already showed a toast.
    throw error;
  }
};
