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

interface OutlineActionsParams {
  setGeneratedOutline: (outline: string) => void;
  setGeneratedStory: (story: string | null) => void;
  setGeneratedTitle: (title: string) => void; // NEW: story title
  setCurrentStep: (step: 'form' | 'outline' | 'final') => void;
  setIsGeneratingOutline: (loading: boolean) => void;
  setIsRegeneratingOutline: (loading: boolean) => void;
}

export const useOutlineActions = ({
  setGeneratedOutline,
  setGeneratedStory,
  setGeneratedTitle,
  setCurrentStep,
  setIsGeneratingOutline,
  setIsRegeneratingOutline
}: OutlineActionsParams) => {
  
  const generateOutline = async (formData: FormData, openaiApiKey?: string) => {
    if (!formData.characterName || !formData.characterAge || !formData.genre || !formData.characterGender) {
      toast.error('Please fill in all required fields');
      return;
    }

    //console.log('=== DEBUG: generateOutline called ===');
    //console.log('openaiApiKey provided:', openaiApiKey ? 'YES' : 'NO');
    //console.log('openaiApiKey length:', openaiApiKey?.length);
    //console.log('openaiApiKey preview:', openaiApiKey?.substring(0, 20) + '...');

    setIsGeneratingOutline(true);
    
    try {
      //console.log('=== GENERATING STORY CONTENT ===');
      
      // First generate the outline
      const outline = generateStoryOutline(
        formData.characterName,
        formData.characterAge,
        formData.characterGender,
        formData.genre,
        formData.message,
        formData.storyOutline,
        5
      );
      setGeneratedOutline(outline);
      
      // Now generate the actual story content
      let actualStory: string;
      let storySource = 'template-based';
      //console.log('=== generateOutline openaiApiKey11', openaiApiKey);
      // Try OpenAI first if API key is provided
      if (openaiApiKey) {
        try {
          //console.log('Generating story with OpenAI...');
          //console.log('API Key being used:', openaiApiKey.substring(0, 20) + '...');
          const result = await generateStoryWithOpenAI({
            characterName: formData.characterName,
            characterAge: formData.characterAge,
            characterGender: formData.characterGender,
            genre: formData.genre,
            storyOutline: outline,
            message: formData.message,
            pages: 10
          }, openaiApiKey);
          actualStory = result.story; // Extract story from the object
          setGeneratedTitle(result.title); // Set the generated title
          storySource = 'AI-powered';
          //console.log('OpenAI story generated successfully');
        } catch (openaiError) {
          console.error('OpenAI generation failed:', openaiError);
          setIsGeneratingOutline(false);
          toast.error('Failed to generate AI story. Please check your OpenAI API key and try again.');
          return; // STOP - don't fallback to template
        }
      } else {
        //console.log('Generating story with template...');
        actualStory = await generateStoryContent(
          outline,
          5,
          formData.characterName, 
          formData.genre,
          'comic',
          formData.message,
          formData.characterAge,
          formData.characterGender,
          ''
        );
      }
      
      //console.log('Generated story content length:', actualStory.length);
      //console.log('Story preview:', actualStory.substring(0, 200));
      
      //console.log('=== SETTING GENERATED STORY ===');
      //console.log('About to call setGeneratedStory with:', actualStory ? 'story content' : 'null');
      setGeneratedStory(actualStory);
      //console.log('setGeneratedStory called successfully');
      
      //console.log('=== SETTING CURRENT STEP ===');
      setCurrentStep('outline');
      //console.log('setCurrentStep called successfully');
      
      setIsGeneratingOutline(false);
      //console.log('setIsGeneratingOutline(false) called successfully');
      
      toast.success(`Your ${storySource} story has been generated! Review it below.`);
      //console.log('=== STORY GENERATION COMPLETE ===');
    } catch (error) {
      console.error('Error generating story:', error);
      setIsGeneratingOutline(false);
      toast.error('Failed to generate story. Please try again.');
    }
  };

  const handleRegenerateOutline = async (formData: FormData, openaiApiKey?: string) => {
    setIsRegeneratingOutline(true);
    
    try {
      // Generate new outline and story content
      const newOutline = generateStoryOutline(
        formData.characterName,
        formData.characterAge,
        formData.characterGender,
        formData.genre,
        formData.message,
        '',
        5
      );
      setGeneratedOutline(newOutline);
      
      // Generate new story content
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
          setIsRegeneratingOutline(false);
          toast.error('Failed to regenerate AI story. Please check your OpenAI API key and try again.');
          return; // STOP - don't fallback to template
        }
      } else {
        newStory = await generateStoryContent(
          newOutline,
          5,
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
      setIsRegeneratingOutline(false);
      
      toast.success(`New ${storySource} story regenerated!`);
    } catch (error) {
      console.error('Error regenerating story:', error);
      setIsRegeneratingOutline(false);
      toast.error('Failed to regenerate story. Please try again.');
    }
  };

  return {
    generateOutline,
    handleRegenerateOutline
  };
};
