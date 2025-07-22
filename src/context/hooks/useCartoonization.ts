import { useState, useCallback } from 'react';
import { uploadImageToS3, validateImageFile, compressImageForUpload } from '@/utils/s3Upload';
import { toast } from 'sonner';
import { BASE_URL } from '@/config/api';

export interface CartoonTemplate {
  id: string;
  name: string;
  preview?: string;
  preview_image_url?: string;
  previewUrl?: string;
  imageUrl?: string;
  thumbnail?: string;
  description?: string;
}

export interface CartoonizationCache {
  [templateId: string]: string; // templateId -> generated image URL
}

export const useCartoonization = () => {
  const [templates, setTemplates] = useState<CartoonTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCache, setGenerationCache] = useState<CartoonizationCache>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/fotor/templates/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }

      const data = await response.json();
      console.log('Templates API response:', data);
      
      // Process templates to ensure we have preview URLs
      const processedTemplates = Array.isArray(data) ? data : (data.templates || []);
      const templatesWithPreviews = processedTemplates.map((template: any) => ({
        id: template.template_id,
        name: template.name || template.title || `Template ${template.template_id}`,
        description: template.description,
        preview: template.preview_image_url || template.preview || template.previewUrl || template.imageUrl || template.thumbnail,
        preview_image_url: template.preview_image_url,
        previewUrl: template.preview_image_url || template.previewUrl || template.imageUrl || template.thumbnail || template.preview,
      }));
      
      console.log('Processed templates:', templatesWithPreviews);
      setTemplates(templatesWithPreviews);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setIsLoadingTemplates(false);
    }
      }, []);

  // Poll task status every 3 seconds until we get a valid resultUrl
  const pollTaskStatus = useCallback(async (taskId: string): Promise<string> => {
    const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)
    let attempts = 0;

    const poll = async (): Promise<string> => {
      try {
        const response = await fetch(`${BASE_URL}/api/fotor/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Task status check failed: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Task status response:', responseData);

        // Check if the API response is successful
        if (responseData.code !== "000") {
          throw new Error(responseData.msg || 'API error');
        }

        const data = responseData.data;
        const status = data.status;
        const resultUrl = data.resultUrl;

        // Status 1 means success/completed - but only if we have a valid resultUrl
        if (status === 1 && resultUrl && resultUrl.trim() !== '') {
          toast.success('Cartoon generated successfully!');
          return resultUrl;
        } else if (status === -1 || status === 3) {
          // Status -1 or 3 typically means failed
          throw new Error(data.error || data.msg || responseData.msg || 'Task failed');
        } else if (status === 0 || status === 2 || status === 1) {
          // Status 0, 2 means processing/pending
          // Status 1 with empty/null resultUrl also means still processing
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Task timeout - took too long to complete');
          }
          
          // Continue polling after 7 seconds
          await new Promise(resolve => setTimeout(resolve, 7000));
          return poll(); // Recursive call
        } else {
          throw new Error(`Unknown task status: ${status}`);
        }
      } catch (error) {
        throw error;
      }
    };

    return poll();
  }, []);

  const generateCartoonImage = useCallback(async (
    templateId: string, 
    userImageUrl: string,
    strength: number = 0.5
  ): Promise<string | null> => {
    // Check cache first
    if (generationCache[templateId]) {
      return generationCache[templateId];
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Use the pre-uploaded S3 URL directly
      console.log('Using pre-uploaded S3 URL for cartoonization:', userImageUrl);

      // Extract format from the S3 URL
      const getImageFormat = (url: string): string => {
        const urlWithoutQuery = url.split('?')[0]; // Remove query parameters
        const extension = urlWithoutQuery.split('.').pop()?.toLowerCase();
        
        // Map common extensions to supported formats
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            return 'jpg';
          case 'png':
            return 'png';
          case 'webp':
            return 'webp';
          default:
            return 'jpg'; // Default fallback
        }
      };

      const imageFormat = getImageFormat(userImageUrl);
      console.log('Detected image format:', imageFormat, 'from URL:', userImageUrl);

      // Step 4: Create task with your local API
      toast.info('Creating cartoon generation task...');
      const response = await fetch(`${BASE_URL}/api/fotor/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: "",
          template_id: templateId,
          negative_prompt: "",
          user_image_url: userImageUrl,
          strength: strength,
          format: imageFormat
        }),
      });

       if (!response.ok) {
         const errorText = await response.text();
         console.error('Task creation error:', response.status, errorText);
         throw new Error(`Failed to create task: ${response.status} - ${errorText}`);
       }

       const taskData = await response.json();
       console.log('Task creation response:', taskData);
       
       const taskId = taskData.task_id;

       if (!taskId) {
         throw new Error('No task ID returned from API');
       }

       // Step 5: Poll for task completion until we get a valid resultUrl
       toast.info('Processing cartoon style... This may take a moment.');
       const generatedImageUrl = await pollTaskStatus(taskId);

       if (generatedImageUrl) {
         // Cache the result
         setGenerationCache(prev => ({
           ...prev,
           [templateId]: generatedImageUrl
         }));
         return generatedImageUrl;
       } else {
         throw new Error('No result URL received from task');
       }
    } catch (err) {
      console.error('Error generating cartoon:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cartoon');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [generationCache, pollTaskStatus]);

  const getCachedImage = useCallback((templateId: string): string | null => {
    return generationCache[templateId] || null;
  }, [generationCache]);

  const clearCache = useCallback(() => {
    setGenerationCache({});
  }, []);

  return {
    templates,
    isLoadingTemplates,
    isGenerating,
    error,
    generationCache,
    fetchTemplates,
    generateCartoonImage,
    getCachedImage,
    clearCache,
  };
}; 