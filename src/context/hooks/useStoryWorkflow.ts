import { useEffect } from 'react';
import { useWorkflowState, WorkflowStep } from './workflow/useWorkflowState';
import { useLoadingStates } from './workflow/useLoadingStates';
import { useStoryActions } from './workflow/useStoryActions';
import { useWorkflowNavigation } from './workflow/useWorkflowNavigation';

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

export const useStoryWorkflow = () => {
  const {
    currentStep,
    setCurrentStep,
    generatedOutline,
    setGeneratedOutline,
    finalOutline,
    setFinalOutline,
    generatedStory,
    setGeneratedStory,
    generatedTitle,
    setGeneratedTitle,
    confirmedStory,
    setConfirmedStory,
    hfApiKey,
    setHfApiKey
  } = useWorkflowState();

  useEffect(() => {
    const savedStep = localStorage.getItem('storyStep');
    if (savedStep && (savedStep === 'form' || savedStep === 'outline' || savedStep === 'final')) {
      setCurrentStep(savedStep as WorkflowStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('storyStep', currentStep);
  }, [currentStep]);

  // Debug logging for generatedStory
  //console.log('=== useStoryWorkflow DEBUG ===');
  //console.log('currentStep:', currentStep);
  //console.log('generatedStory:', generatedStory ? `${generatedStory.length} characters` : 'null');
  //console.log('generatedStory preview:', generatedStory?.substring(0, 100));

  const {
    isGeneratingOutline,
    setIsGeneratingOutline,
    isGeneratingStory,
    setIsGeneratingStory,
    isRegeneratingOutline,
    setIsRegeneratingOutline,
    isRegeneratingStory,
    setIsRegeneratingStory
  } = useLoadingStates();

  const {
    generateOutline,
    handleRegenerateOutline,
    handleRegenerateStory,
    handleConfirmOutline: originalHandleConfirmOutline
  } = useStoryActions({
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
  });

  const { handleBackToForm, handleBackToOutline } = useWorkflowNavigation(
    setCurrentStep,
    setGeneratedOutline,
    setGeneratedStory,
    setConfirmedStory
  );

  // Wrapper functions to maintain the same API
  const wrappedHandleRegenerateStory = (formData: FormData, openaiApiKey: string) => {
    handleRegenerateStory(formData, openaiApiKey, generatedStory);
  };

  const wrappedHandleConfirmOutline = (
    confirmedOutline: string, 
    apiKey: string, 
    characterReferenceId: string | undefined,
    formData: FormData
  ) => {
    return originalHandleConfirmOutline(confirmedOutline, apiKey, generatedStory, characterReferenceId, formData);
  };

  return {
    currentStep,
    setCurrentStep,
    generatedOutline,
    setGeneratedOutline,
    finalOutline,
    generatedStory,
    setGeneratedStory,
    generatedTitle,
    setGeneratedTitle,
    confirmedStory,
    hfApiKey,
    isGeneratingOutline,
    isGeneratingStory,
    isRegeneratingOutline,
    isRegeneratingStory,
    generateOutline,
    handleRegenerateOutline,
    handleConfirmOutline: wrappedHandleConfirmOutline,
    handleRegenerateStory: wrappedHandleRegenerateStory,
    handleBackToForm,
    handleBackToOutline
  };
};
