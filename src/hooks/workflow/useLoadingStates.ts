
import { useState } from 'react';

export const useLoadingStates = () => {
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isRegeneratingOutline, setIsRegeneratingOutline] = useState(false);
  const [isRegeneratingStory, setIsRegeneratingStory] = useState(false);

  return {
    isGeneratingOutline,
    setIsGeneratingOutline,
    isGeneratingStory,
    setIsGeneratingStory,
    isRegeneratingOutline,
    setIsRegeneratingOutline,
    isRegeneratingStory,
    setIsRegeneratingStory
  };
};
