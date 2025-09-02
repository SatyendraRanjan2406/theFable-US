import { BASE_URL } from '@/config/api';
import { APP_CONFIG } from '@/config/app';

export interface CuratedStoryRequest {
  characterName: string;
  characterAge: string;
  characterGender: string;
  photoUrl?: string;
  curatedStoryId: string;
  curatedStoryTitle: string;
  userId?: string;
}

export interface CuratedStoryResponse {
  success: boolean;
  story_id?: string;
  story_content?: string;
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
  error?: string;
}

export const generateCuratedStory = async (requestData: CuratedStoryRequest): Promise<CuratedStoryResponse> => {
  try {
    console.log('🚀 Generating curated story with data:', requestData);
    console.log('🌍 Platform being sent:', APP_CONFIG.platform);
    
    const response = await fetch(`${BASE_URL}/api/auth/curated-stories/generate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character_name: requestData.characterName,
        character_age: parseInt(requestData.characterAge) || 8,
        character_gender: requestData.characterGender,
        photo_url: requestData.photoUrl || '',
        curated_story_id: requestData.curatedStoryId,
        curated_story_title: requestData.curatedStoryTitle,
        platform: APP_CONFIG.platform,
        ...(requestData.userId && { user_id: requestData.userId }), // Only include user_id if it exists
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Curated story generation response:', data);
    
    return {
      success: true,
      story_id: data.story_id,
      story_content: data.story_content,
      panels: data.panels || [],
    };
  } catch (error) {
    console.error('❌ Error generating curated story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate curated story',
    };
  }
}; 

// Fetch curated stories for home page display
export const fetchCuratedStories = async (): Promise<any[]> => {
  try {
    console.log('📚 Fetching curated stories with platform:', APP_CONFIG.platform);
    const response = await fetch(`${BASE_URL}/api/auth/curated-stories/?platform=${APP_CONFIG.platform}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📚 Fetched curated stories for home page:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching curated stories for home page:', error);
    throw error;
  }
};





// Regenerate a specific panel
export const regenerateCuratedPanel = async (panelId: string): Promise<any> => {
  try {
    console.log('🔄 Regenerating curated panel:', panelId);
    
    const response = await fetch(`${BASE_URL}/api/auth/panels/${panelId}/regenerate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Panel regeneration failed:', errorData);
      
      // Check for the specific backend error
      if (errorData.error && errorData.error.includes('_poll_facemint_task_with_retries')) {
        throw new Error('Panel regeneration is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Panel regeneration response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error regenerating curated panel:', error);
    throw error;
  }
}; 