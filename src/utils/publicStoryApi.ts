// Public Story API functions for unauthenticated users

import { BASE_URL } from "@/config/api";

export interface PublicStorySaveRequest {
  title: string;
  content: string;
  character: string;
  age: number;
  name: string;
  gender: string;
  photo_url: string;
  story_genre: string;
  outline: string;
  message: string;
}

export interface PublicStorySaveResponse {
  success: boolean;
  id?: string;
  story_id?: string; // Keep for backward compatibility
  message?: string;
  panels?: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface PublicImageGenerationRequest {
  prompt: string;
  aspect_ratio: string;
  n: number;
}

export interface PublicImageGenerationResponse {
  success: boolean;
  image_url?: string;
  error?: string;
}

/**
 * Save story for unauthenticated users
 */
export const savePublicStory = async (storyData: PublicStorySaveRequest): Promise<PublicStorySaveResponse> => {
  try {
    console.log('💾 Saving public story:', storyData);
    
    const response = await fetch(`${BASE_URL}/api/auth/public/stories/list/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to save public story:', response.status, errorData);
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('✅ Public story saved successfully:', data);
    
    return {
      success: true,
      id: data.id,
      story_id: data.story_id || data.id, // Use id as fallback for story_id
      panels: data.panels,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Error saving public story:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generate image for a specific panel (unauthenticated flow)
 */
export const generatePublicPanelImage = async (
  storyId: string,
  panelId: string,
  imageData: PublicImageGenerationRequest
): Promise<PublicImageGenerationResponse> => {
  try {
    console.log('🎨 Generating public panel image:', { storyId, panelId, imageData });
    debugger
    const response = await fetch(`${BASE_URL}/api/auth/panels/${panelId}/generate-image/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to generate public panel image:', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('✅ Public panel image generated successfully:', data);
    
    return {
      success: true,
      image_url: data.image_url,
    };
  } catch (error) {
    console.error('❌ Error generating public panel image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 