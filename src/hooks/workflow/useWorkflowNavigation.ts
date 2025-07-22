
export const useWorkflowNavigation = (
  setCurrentStep: (step: 'form' | 'outline' | 'final') => void,
  setGeneratedOutline: (outline: string) => void,
  setGeneratedStory: (story: string | null) => void,
  setConfirmedStory: (story: string | null) => void
) => {
  const handleBackToForm = () => {
    setCurrentStep('form');
    setGeneratedOutline('');
    setGeneratedStory(null);
    setConfirmedStory(null);
  };

  const handleBackToOutline = () => {
    setCurrentStep('outline');
  };

  return {
    handleBackToForm,
    handleBackToOutline
  };
};
