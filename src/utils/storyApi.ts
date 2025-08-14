import { BASE_URL, API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';

// New interface for the simple story save API
export interface SimpleStorySaveRequest {
  title: string;
  content: string;
  character?: string;
  age?: number;
  name?: string;
  gender?: string;
  photo_url?: string;
  story_genre?: string;
  outline?: string;
  message?: string;
}

export interface SimpleStorySaveResponse {
  success: boolean;
  story_id?: string;
  message: string;
  // Full API response fields
  id?: string;
  title?: string;
  content?: string;
  is_paid?: boolean;
  payment_order_id?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  panels_count?: number;
  panels_created?: number;
  panels?: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    status: string;
    created_at: string;
  }>;
}

// Interface for guest user story save request
export interface GuestStorySaveRequest {
  title: string;
  content: string;
  character?: string;
  age?: number;
  gender?: string;
  non_logged_in_user_id: string;
  panels: {
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    status: string;
    minimax_image_url?: string;
    aws_s3_image_url?: string;
  }[];
}

export interface GuestStorySaveResponse {
  success: boolean;
  story_id?: string;
  message: string;
  id?: string;
  title?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  panels_count?: number;
}

export interface StoryPanel {
  panel_index: number;
  panel_text: string;
  image_url: string | null;
  prompt_used?: string;
}

export interface SaveStoryRequest {
  story_id?: string; // Optional for updates
  character_name: string;
  character_age: string;
  character_gender: string;
  genre: string;
  story_text: string;
  character_photo_url?: string;
  panels: StoryPanel[];
}

export interface SaveStoryResponse {
  success: boolean;
  story_id: string;
  message: string;
  panels_saved: number;
}

/**
 * Dummy API call to save story and panels to database
 * This is a placeholder implementation that shows the expected data structure
 */
export const saveStoryPanels = async (storyData: SaveStoryRequest): Promise<SaveStoryResponse> => {
  try {
    console.log('💾 Saving story panels to database...', {
      story_id: storyData.story_id,
      character_name: storyData.character_name,
      total_panels: storyData.panels.length,
      panels_with_images: storyData.panels.filter(p => p.image_url).length,
      panels_without_images: storyData.panels.filter(p => !p.image_url).length
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dummy API call - replace with actual endpoint
  

    // const result = await response.json();
    
    // toast.success(`✅ Story saved! ${result.panels_saved} panels stored in database`);
    
    // return result;
  } catch (error) {
    console.error('❌ Error saving story panels:', error);
    
    // For development, still simulate success
    console.log('📝 Dummy API: Simulating successful save due to network error');
    
    toast.success(`✅ Story saved! ${storyData.panels.length} panels stored (simulated)`);
    
    return {
      success: true,
      story_id: storyData.story_id || `story_${Date.now()}`,
      message: 'Story and panels saved successfully (simulated)',
      panels_saved: storyData.panels.length
    };
  }
};

/**
 * Save story to database using the new API endpoint
 * This function saves the story before image generation
 */
export const saveStoryToDatabase = async (
  title: string, 
  content: string,
  character?: string,
  age?: number,
  name?: string,
  gender?: string,
  photo_url?: string,
  story_genre?: string,
  outline?: string,
  message?: string
): Promise<SimpleStorySaveResponse> => {
  try {
    console.log('💾 Saving story to database...', { 
      title, 
      contentLength: content.length,
      character,
      age,
      name,
      gender,
      photo_url,
      story_genre,
      outline,
      message
    });

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const requestBody: SimpleStorySaveRequest = {
      title,
      content,
      character,
      age,
      name,
      gender,
      photo_url,
      story_genre,
      outline,
      message
    };

    const response = await fetch(API_ENDPOINTS.auth.stories, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to homepage
        console.log('🔒 Unauthorized (401) - redirecting to homepage');
        window.location.href = '/';
        throw new Error('Unauthorized - redirected to homepage');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Story saved successfully:', result);
    console.log('📊 API Response structure:', {
      hasPanels: !!result.panels,
      panelsLength: result.panels?.length || 0,
      panelsCount: result.panels_count,
      panelsCreated: result.panels_created,
      samplePanel: result.panels?.[0]
    });
    
    toast.success('✅ Story saved to database!');
    
    return {
      success: true,
      story_id: result.id, // Use the actual story ID from the API response
      message: result.message || 'Story saved successfully',
      // Include full response data
      id: result.id,
      title: result.title,
      content: result.content,
      is_paid: result.is_paid,
      payment_order_id: result.payment_order_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      user: result.user,
      panels_count: result.panels_count,
      panels_created: result.panels_created,
      panels: result.panels // Include the panels array from the API response
    };
  } catch (error) {
    console.error('❌ Error saving story to database:', error);
    
    toast.error(`Failed to save story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save story'
    };
  }
};

/**
 * Save story for guest users using the public API endpoint
 * This function saves the story with the non_logged_in_user_id from the payment order
 */
export const saveGuestStoryToDatabase = async (
  title: string,
  content: string,
  nonLoggedInUserId: string,
  character?: string,
  age?: number,
  gender?: string,
  minimaxImageUrls?: (string | null)[], // Array of Minimax image URLs for each panel
  s3ImageUrls?: (string | null)[] // Array of S3 image URLs for each panel
): Promise<GuestStorySaveResponse> => {
  try {
    console.log('💾 Saving guest story to database...', { 
      title, 
      contentLength: content.length,
      nonLoggedInUserId,
      character,
      age,
      gender,
      minimaxImageUrls,
      s3ImageUrls,
      totalMinimaxUrls: minimaxImageUrls?.filter(url => url !== null).length || 0,
      totalS3Urls: s3ImageUrls?.filter(url => url !== null).length || 0
    });

    // Extract panels from story content
    const panelMatches = content.match(/Panel \d+:[^]*?(?=Panel \d+:|$)/g);
    const panels = panelMatches ? panelMatches.map((panelText, index) => {
      const minimaxUrl = minimaxImageUrls?.[index];
      const s3Url = s3ImageUrls?.[index];
      const panelData: any = {
        panel_number: index + 1,
        panel_text: panelText.replace(/Panel \d+:\s*/, '').trim(),
        image_prompt: `Character illustration for: ${panelText.replace(/Panel \d+:\s*/, '').trim().substring(0, 100)}...`,
        status: 'locked' // All panels start as locked for guest users
      };
      
      // Add image URLs - always include both fields
      panelData.minimax_image_url = minimaxUrl || null;
      panelData.aws_s3_image_url = s3Url || null;
      
      return panelData;
    }) : [];

    const requestBody: GuestStorySaveRequest = {
      title,
      content,
      character,
      age: age ? parseInt(age.toString()) : undefined,
      gender,
      non_logged_in_user_id: nonLoggedInUserId,
      panels
    };

    console.log('📤 Request body for guest story save:', {
      title: requestBody.title,
      contentLength: requestBody.content.length,
      character: requestBody.character,
      age: requestBody.age,
      gender: requestBody.gender,
      non_logged_in_user_id: requestBody.non_logged_in_user_id,
      totalPanels: requestBody.panels.length,
      panelsWithMinimaxUrls: requestBody.panels.filter(p => p.minimax_image_url).length,
      panelsWithS3Urls: requestBody.panels.filter(p => p.aws_s3_image_url).length,
      samplePanel: requestBody.panels[0]
    });

    // Log the actual JSON being sent
    const requestJson = JSON.stringify(requestBody, null, 2);
    console.log('📤 Full JSON request body:', requestJson);

    const response = await fetch(API_ENDPOINTS.auth.publicStories, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Guest story saved successfully:', result);
    
    toast.success('✅ Story saved to database!');
    
    return {
      success: true,
      story_id: result.id,
      message: result.message || 'Story saved successfully',
      id: result.id,
      title: result.title,
      content: result.content,
      created_at: result.created_at,
      updated_at: result.updated_at,
      panels_count: result.panels_count
    };
  } catch (error) {
    console.error('❌ Error saving guest story to database:', error);
    
    toast.error(`Failed to save story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save story'
    };
  }
};

/**
 * Extract panels from story text
 */
export const extractPanelsFromStory = (storyText: string): Omit<StoryPanel, 'image_url'>[] => {
  const panelMatches = storyText.match(/Panel \d+:[^]*?(?=Panel \d+:|$)/g);
  
  if (!panelMatches) {
    return [];
  }

  return panelMatches.map((panelText, index) => ({
    panel_index: index,
    panel_text: panelText.replace(/Panel \d+:\s*/, '').trim(),
    prompt_used: `Character illustration for: ${panelText.replace(/Panel \d+:\s*/, '').trim().substring(0, 100)}...`
  }));
}; 

/**
 * Save panels in bulk to database using the bulk panels API endpoint
 * This function is called when story is divided into panels and each panel details are ready
 */
export const savePanelsInBulk = async (
  storyId: string,
  panels: Array<{
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
  }>
): Promise<{
  success: boolean;
  created_panels: Array<{
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
  updated_panels: any[];
  total_created: number;
  total_updated: number;
  errors: any[];
}> => {
  try {
    console.log('💾 Saving panels in bulk to database...', {
      storyId,
      totalPanels: panels.length,
      panelsWithMinimaxUrls: panels.filter(p => p.minimax_image_url).length,
      panelsWithS3Urls: panels.filter(p => p.aws_s3_image_url).length
    });

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const requestBody = {
      panels: panels
    };

    console.log('📤 Bulk panels request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${BASE_URL}/api/auth/stories/${storyId}/panels/bulk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to homepage
        console.log('🔒 Unauthorized (401) - redirecting to homepage');
        window.location.href = '/';
        return 
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Panels saved in bulk successfully:', result);
    
    toast.success(`✅ ${result.total_created} panels saved to database!`);
    
    return result;
  } catch (error) {
    console.error('❌ Error saving panels in bulk:', error);
    
    toast.error(`Failed to save panels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    throw error;
  }
}; 

/**
 * Generate or regenerate image for a specific panel using panel ID
 * @param panelId The ID of the panel to generate image for
 * @param aspectRatio The aspect ratio for the image (default: "16:9")
 * @param n Number of images to generate (default: 1)
 * @returns Promise with the generation result
 */
export const generatePanelImage = async (
  panelId: string,
  aspectRatio: string = "16:9",
  n: number = 1,
  panelText?: string,
  panelNumber?: number,
  characterImageBase64?: string,
  characterImageType?: string
): Promise<{
  success: boolean;
  message: string;
  image_url?: string;
  error?: string;
  panel_id?: string;
  panel_number?: number;
  status?: string;
  minimax_image_url?: string;
  aws_s3_image_url?: string;
}> => {
  try {
    const token = localStorage.getItem('authToken');
    // if (!token) {
    //   throw new Error('No authentication token found');
    // }

    // Use panel text if provided, otherwise use a generic prompt
    const prompt = panelText ? 
      `Character illustration for: ${panelText.substring(0, 200)}...` : 
      `Character illustration for panel ${panelId}`;

          console.log(`🎨 Generating image for panel ${panelId} with aspect ratio ${aspectRatio}`);
      console.log(`📝 Using prompt: ${prompt}`);
      console.log(`🔢 Panel number: ${panelNumber}`);
      if (characterImageType) {
        console.log(`🖼️ Character image type: ${characterImageType}`);
      }

    // Prepare request body
    const requestBody: any = {
      prompt: prompt,
      aspect_ratio: aspectRatio,
      n: n
    };

    // Add panel_number if provided
    if (panelNumber !== undefined) {
      requestBody.panel_number = panelNumber;
    }
    debugger
    // Add subject_reference if character image is provided
    if (characterImageBase64) {
      // Determine the data URL prefix based on the file type
      let dataUrlPrefix = "data:image/jpeg;base64,";
      
      // Check if the base64 string already has a data URL prefix
      if (characterImageBase64.startsWith('data:')) {
        // If it already has a prefix, use it as is
        dataUrlPrefix = "";
      } else if (characterImageType) {
        // Use the provided file type to determine the correct MIME type
        const mimeType = characterImageType.toLowerCase();
        if (mimeType.includes('png')) {
          dataUrlPrefix = "data:image/png;base64,";
        } else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) {
          dataUrlPrefix = "data:image/jpeg;base64,";
        } else if (mimeType.includes('webp')) {
          dataUrlPrefix = "data:image/webp;base64,";
        } else if (mimeType.includes('gif')) {
          dataUrlPrefix = "data:image/gif;base64,";
        } else {
          // Default to JPEG for unknown types
          dataUrlPrefix = "data:image/jpeg;base64,";
        }
      }
      
      requestBody.subject_reference = [
        {
          type: "character",
          image_file: dataUrlPrefix + characterImageBase64
        }
      ];
    }

    console.log('📤 Request body:', {
      prompt: requestBody.prompt,
      aspect_ratio: requestBody.aspect_ratio,
      n: requestBody.n,
      panel_number: requestBody.panel_number,
      has_subject_reference: !!requestBody.subject_reference,
      subject_reference_type: requestBody.subject_reference?.[0]?.type,
      image_file_prefix: requestBody.subject_reference?.[0]?.image_file?.substring(0, 30) + '...'
    });

    const response = await fetch(`${BASE_URL}/api/auth/panels/${panelId}/generate-image/`, {
      method: 'POST',
      headers: {
        // 'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Image generation successful for panel ${panelId}:`, data);
    
    // Extract the best available image URL from the response
    let imageUrl = null;
    
    // Prefer S3 URL for better reliability, fallback to Minimax URL
    if (data.aws_s3_image_url) {
      imageUrl = data.aws_s3_image_url;
    } else if (data.minimax_image_url) {
      imageUrl = data.minimax_image_url;
    } else if (data.processed_images && data.processed_images.length > 0) {
      // Fallback to processed_images array
      const processedImage = data.processed_images[0];
      imageUrl = processedImage.s3_url || processedImage.original_url;
    }
    
    if (!imageUrl) {
      throw new Error('No valid image URL found in API response');
    }
    
    return {
      success: true,
      message: data.message || 'Image generated successfully',
      image_url: imageUrl,
      panel_id: data.panel_id,
      panel_number: data.panel_number,
      status: data.status,
      minimax_image_url: data.minimax_image_url,
      aws_s3_image_url: data.aws_s3_image_url
    };
  } catch (error) {
    console.error(`❌ Failed to generate image for panel ${panelId}:`, error);
    return {
      success: false,
      message: 'Failed to generate image',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 