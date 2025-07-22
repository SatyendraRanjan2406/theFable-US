
import { toast } from 'sonner';
import { generateStoryOutline } from '@/utils/outlineGenerator';
import { generateStoryContent } from '@/utils/storyGenerator';
import { generateStoryWithOpenAI } from '@/utils/openaiStoryGenerator';

interface FormData {
  characterName: string;
  characterAge: string;
  characterGender: string;
  photo: File | null;
  genre: string;
  bookType: string;
  message: string;
  storyOutline: string;
}

interface StoryRegenerationParams {
  setGeneratedStory: (story: string | null) => void;
  setGeneratedTitle: (title: string) => void; // NEW: story title
  setIsRegeneratingStory: (loading: boolean) => void;
  setFinalOutline: (outline: string) => void;
  setConfirmedStory: (story: string | null) => void;
}

export const useStoryRegeneration = ({
  setGeneratedStory,
  setGeneratedTitle,
  setIsRegeneratingStory,
  setFinalOutline,
  setConfirmedStory
}: StoryRegenerationParams) => {

  const handleRegenerateStory = async (formData: FormData, openaiApiKey: string, generatedStory: string | null) => {
    setIsRegeneratingStory(true);
    
    try {
      // Generate completely new outline and story
      const newOutline = generateStoryOutline(
        formData.characterName,
        formData.characterAge,
        formData.characterGender,
        formData.genre,
        formData.message,
        '',
        10
      );
      setFinalOutline(newOutline);
      
      let newStory: string;
      let storySource = 'template-based';
      
      if (openaiApiKey) {
        try {
          const result = await generateStoryWithOpenAI({
            characterName: formData.characterName,
            characterAge: formData.characterAge,
            characterGender: formData.characterGender,
            genre: formData.genre,
            storyOutline: newOutline,
            message: formData.message,
            pages: 10
          }, openaiApiKey);
          newStory = result.story; // Extract story from the object
          setGeneratedTitle(result.title); // Set the generated title
          storySource = 'AI-powered';
        } catch (openaiError) {
          console.error('OpenAI regeneration failed:', openaiError);
          setIsRegeneratingStory(false);
          toast.error('Failed to regenerate AI story. Please check your OpenAI API key and try again.');
          return; // STOP - don't fallback to template
        }
      } else {
        newStory = await generateStoryContent(
          newOutline,
          10,
          formData.characterName, 
          formData.genre,
          'comic',
          formData.message,
          formData.characterAge,
          formData.characterGender,
          ''
        );
      }
      
      setGeneratedStory(newStory);
      setConfirmedStory(newStory);
      setIsRegeneratingStory(false);
      
      toast.success(`Your story has been regenerated with a completely new ${storySource} storyline!`);
    } catch (error) {
      console.error('Error regenerating story:', error);
      setIsRegeneratingStory(false);
      toast.error('Failed to regenerate story. Please try again.');
    }
  };

  return {
    handleRegenerateStory
  };
};
