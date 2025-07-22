
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

interface ConfirmActionsParams {
  setFinalOutline: (outline: string) => void;
  setConfirmedStory: (story: string | null) => void;
  setCurrentStep: (step: 'form' | 'outline' | 'final') => void;
  setHfApiKey: (key: string) => void;
}

export const useConfirmActions = ({
  setFinalOutline,
  setConfirmedStory,
  setCurrentStep,
  setHfApiKey
}: ConfirmActionsParams) => {

  const handleConfirmOutline = async (
    confirmedOutline: string, 
    hfApiKey: string, 
    existingGeneratedStory: string | null, 
    characterReferenceId: string | undefined,
    formData: FormData
  ) => {
    //console.log('Confirming outline and proceeding to illustration generation...');
    //console.log('Has existing story:', !!existingGeneratedStory);
    //console.log('HF API key provided:', !!hfApiKey);
    
    // Set the confirmed outline and HF API key
    setFinalOutline(confirmedOutline);
    setHfApiKey(hfApiKey);
    
    // If we already have a generated story, use it directly for illustrations
    if (existingGeneratedStory) {
      //console.log('Using existing generated story for illustrations');
      setConfirmedStory(existingGeneratedStory);
      setCurrentStep('final');
      return;
    }
    
    // If no existing story, this shouldn't happen in the normal flow
    // but handle it gracefully
    console.warn('No existing story found, this is unexpected in the confirm flow');
    setConfirmedStory(null);
    setCurrentStep('final');
  };

  return {
    handleConfirmOutline
  };
};
