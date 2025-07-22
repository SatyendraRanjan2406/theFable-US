import { generateMinimaxImage } from './imageGeneration/apiClients';
import { fileToBase64, getSelectedCharacterImageBase64 } from './imageUtils';

export async function generateAllIllustrations({
  prompts,
  characterPhotoFile,
  selectedPhotoForStory,
  isCartoonSelectedForStory,
  maxPages = 4,
  onProgress,
  onError,
  storyId,
  panelTexts,
  isAuthenticated = false,
}: {
  prompts: string[];
  characterPhotoFile: File | null;
  selectedPhotoForStory?: string | null;
  isCartoonSelectedForStory?: boolean;
  maxPages?: number;
  onProgress?: (index: number, url: string) => void;
  onError?: (index: number, error: any) => void;
  storyId?: string;
  panelTexts?: string[];
  isAuthenticated?: boolean;
}): Promise<Array<{minimaxUrl: string, s3Url: string} | null>> {
  //console.log('Starting parallel image generation with progress tracking...');
  
  // Use selected photo for story (cartoon or original)
  const characterImageBase64 = await getSelectedCharacterImageBase64(
    selectedPhotoForStory || null,
    isCartoonSelectedForStory || false,
    characterPhotoFile
  );
  
  console.log('🎨 generateAllIllustrations using', isCartoonSelectedForStory ? 'cartoon' : 'original', 'photo');
  
  const finalPrompts = prompts.slice(0, maxPages);
  let generatedCount = 0;

  console.log('generateAllIllustrations - storyId:', storyId);
  console.log('generateAllIllustrations - isAuthenticated:', isAuthenticated);
  
  const imagePromises = finalPrompts.map((prompt, index) => {
    const options = {
      storyId,
      panelText: panelTexts?.[index],
      imagePrompt: prompt,
      panelNumber: index
    };
    //console.log(`Panel ${index} options:`, options);
    
    return generateMinimaxImage(
      prompt, 
      characterImageBase64,
      options,
      isAuthenticated
    )
      .then(imageUrls => {
        if (imageUrls && (imageUrls.minimaxUrl || imageUrls.s3Url)) {
          if (onProgress) {
            // Use S3 URL if available, otherwise use Minimax URL
            const displayUrl = imageUrls.s3Url || imageUrls.minimaxUrl;
            onProgress(index, displayUrl);
          }
          //console.log(`Successfully generated image ${index + 1}.`);
          return { index, imageUrls }; // Pass result to Promise.all
        }
        // This case should ideally not be reached if generateMinimaxImage throws on error
        throw new Error(`Image generation returned null or empty URLs for panel ${index + 1}`);
      })
      .catch(error => {
        console.error(`Failed to generate image ${index + 1}:`, error);
        
        // Provide more helpful error messages
        let userFriendlyError = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          userFriendlyError = 'Unable to connect to the image generation service. Please check your internet connection or try again later.';
        } else if (error.message.includes('Unauthorized')) {
          userFriendlyError = 'Authentication failed. Please refresh the page and try again.';
        }
        
        if (onError) {
          onError(index, new Error(userFriendlyError));
        }
        return { index, imageUrls: null }; // Ensure Promise.all doesn't reject
      });
  });

  const results = await Promise.all(imagePromises);

  // Create array preserving original indexes, with null for failed images
  const imagesWithFailures = results
    .sort((a, b) => a.index - b.index)
    .map(result => result.imageUrls);

  // Filter out failed results for success count tracking
  const successfulImages = results
    .filter(result => result.imageUrls !== null)
    .sort((a, b) => a.index - b.index)
    .map(result => result.imageUrls!);

  if (successfulImages.length === 0) {
    throw new Error('Unable to generate any images. Please check your internet connection and try again. If the problem persists, the image generation service may be temporarily unavailable.');
  }

  //console.log(`Parallel generation complete. Generated ${successfulImages.length} images, ${results.length - successfulImages.length} failed.`);
  return imagesWithFailures;
} 