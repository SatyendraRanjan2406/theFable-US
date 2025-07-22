
import { useOutlineActions } from './actions/outlineActions';
import { useStoryRegeneration } from './actions/storyActions';
import { useConfirmActions } from './actions/confirmActions';

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

interface StoryActionsParams {
  setGeneratedOutline: (outline: string) => void;
  setGeneratedStory: (story: string | null) => void;
  setGeneratedTitle: (title: string) => void; // NEW: story title
  setCurrentStep: (step: 'form' | 'outline' | 'final') => void;
  setIsGeneratingOutline: (loading: boolean) => void;
  setIsRegeneratingOutline: (loading: boolean) => void;
  setIsRegeneratingStory: (loading: boolean) => void;
  setFinalOutline: (outline: string) => void;
  setConfirmedStory: (story: string | null) => void;
  setHfApiKey: (key: string) => void;
}

export const useStoryActions = ({
  setGeneratedOutline,
  setGeneratedStory,
  setGeneratedTitle,
  setCurrentStep,
  setIsGeneratingOutline,
  setIsRegeneratingOutline,
  setIsRegeneratingStory,
  setFinalOutline,
  setConfirmedStory,
  setHfApiKey
}: StoryActionsParams) => {
  
  const {
    generateOutline,
    handleRegenerateOutline
  } = useOutlineActions({
    setGeneratedOutline,
    setGeneratedStory,
    setGeneratedTitle,
    setCurrentStep,
    setIsGeneratingOutline,
    setIsRegeneratingOutline
  });

  const {
    handleRegenerateStory
  } = useStoryRegeneration({
    setGeneratedStory,
    setIsRegeneratingStory,
    setFinalOutline,
    setConfirmedStory,
    setGeneratedTitle
  });

  const {
    handleConfirmOutline: originalHandleConfirmOutline
  } = useConfirmActions({
    setFinalOutline,
    setConfirmedStory,
    setCurrentStep,
    setHfApiKey
  });

  // Wrapper to maintain backward compatibility while adding the formData parameter
  const handleConfirmOutline = (
    confirmedOutline: string, 
    apiKey: string, 
    generatedStory: string | null, 
    characterReferenceId: string | undefined,
    formData: FormData
  ) => {
    return originalHandleConfirmOutline(confirmedOutline, apiKey, generatedStory, characterReferenceId, formData);
  };

  return {
    generateOutline,
    handleRegenerateOutline,
    handleRegenerateStory,
    handleConfirmOutline
  };
};
