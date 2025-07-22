
import { useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDatabase } from './useCharacterDatabase';

export const useCharacterImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [characterReferenceId, setCharacterReferenceId] = useState<string | null>(null);
  
  const { saveCharacterImage } = useCharacterDatabase();

  const processCharacterImage = async (
    imageFile: File,
    characterName: string,
    genre: string,
    apiKey: string,
    customPrompt?: string
  ) => {
    if (isProcessing) {
      //console.log('Already processing, skipping...');
      return null;
    }
    
    if (!apiKey) {
      //console.log('No Hugging Face API key provided, skipping image processing');
      return null;
    }
    
    setIsProcessing(true);
    setProcessedImageUrl(null);
    setCharacterReferenceId(null);
    
    try {
      //console.log('Starting enhanced storybook character illustration processing with FLUX model...');
      
      toast.info('Creating storybook-style character illustration...');

      // Create enhanced storybook character illustration prompt for FLUX
      const storybookPrompt = customPrompt || 
        `Beautiful children's book character illustration of ${characterName}, storybook-style digital painting, soft watercolor textures, whimsical magical atmosphere, professional children's book art quality, detailed hand-drawn artwork style, warm color palette, gentle lighting, expressive character design, ${genre} story character, enchanted storybook aesthetic, masterpiece illustration quality, child-friendly magical content, authentic children's book art style, consistent character design for storytelling`;

      //console.log('Calling FLUX API for enhanced storybook character illustration...');
      const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: storybookPrompt,
          parameters: {
            width: 512,
            height: 512,
            num_inference_steps: 4,
            guidance_scale: 3.5
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FLUX API error:', response.status, errorText);
        throw new Error(`FLUX API error: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const processedImageUrl = URL.createObjectURL(blob);
      
      //console.log('Enhanced storybook character illustration created successfully with FLUX');
      setProcessedImageUrl(processedImageUrl);
      
      // Save to database
      try {
        const referenceId = await saveCharacterImage(
          imageFile.name,
          processedImageUrl,
          characterName,
          genre,
          storybookPrompt
        );
        setCharacterReferenceId(referenceId);
        //console.log('Character image saved to database with reference ID:', referenceId);
      } catch (dbError) {
        console.error('Failed to save to database, but image processing succeeded:', dbError);
        // Continue anyway since image processing worked
      }
      
      toast.success('Storybook character illustration created successfully!');
      
      return { 
        processed_image_url: processedImageUrl,
        reference_id: characterReferenceId
      };
      
    } catch (error) {
      console.error('Error processing character image:', error);
      toast.error('Failed to create storybook character illustration. Please try again.');
      setProcessedImageUrl(null);
      setCharacterReferenceId(null);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessedImage = () => {
    setProcessedImageUrl(null);
    setCharacterReferenceId(null);
  };

  return {
    isProcessing,
    processedImageUrl,
    characterReferenceId,
    processCharacterImage,
    resetProcessedImage
  };
};
