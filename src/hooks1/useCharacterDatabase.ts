
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCharacterDatabase = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveCharacterImage = async (
    originalFilename: string,
    processedImageUrl: string,
    characterName: string,
    genre: string,
    promptUsed: string
  ) => {
    setIsSaving(true);
    try {
      //console.log('Saving character image to database...');
      
      const { data, error } = await supabase
        .from('character_images')
        .insert({
          original_filename: originalFilename,
          processed_image_url: processedImageUrl,
          character_name: characterName,
          genre: genre,
          prompt_used: promptUsed
        })
        .select('reference_id')
        .single();

      if (error) {
        console.error('Error saving character image:', error);
        throw error;
      }

      //console.log('Character image saved with reference ID:', data.reference_id);
      toast.success('Character image saved successfully!');
      return data.reference_id;
    } catch (error) {
      console.error('Failed to save character image:', error);
      toast.error('Failed to save character image');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const saveStory = async (
    characterImageReferenceId: string,
    title: string,
    content: string,
    genre: string,
    characterName: string,
    storyLength: number
  ) => {
    setIsSaving(true);
    try {
      //console.log('Saving story to database...');
      
      const { data, error } = await supabase
        .from('stories')
        .insert({
          character_image_reference_id: characterImageReferenceId,
          title: title,
          content: content,
          genre: genre,
          character_name: characterName,
          story_length: storyLength
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving story:', error);
        throw error;
      }

      //console.log('Story saved with ID:', data.id);
      toast.success('Story saved successfully!');
      return data.id;
    } catch (error) {
      console.error('Failed to save story:', error);
      toast.error('Failed to save story');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const saveStoryIllustration = async (
    storyId: string,
    characterImageReferenceId: string,
    panelIndex: number,
    panelText: string,
    illustrationUrl: string,
    promptUsed: string
  ) => {
    try {
      //console.log('Saving story illustration to database...');
      
      const { data, error } = await supabase
        .from('story_illustrations')
        .insert({
          story_id: storyId,
          character_image_reference_id: characterImageReferenceId,
          panel_index: panelIndex,
          panel_text: panelText,
          illustration_url: illustrationUrl,
          prompt_used: promptUsed
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving story illustration:', error);
        throw error;
      }

      //console.log('Story illustration saved with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to save story illustration:', error);
      throw error;
    }
  };

  return {
    isSaving,
    saveCharacterImage,
    saveStory,
    saveStoryIllustration
  };
};
