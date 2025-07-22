
import { useState } from 'react';

export type WorkflowStep = 'form' | 'outline' | 'final';

export const useWorkflowState = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('form');
  const [generatedOutline, setGeneratedOutline] = useState<string>('');
  const [finalOutline, setFinalOutline] = useState<string>('');
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [confirmedStory, setConfirmedStory] = useState<string | null>(null);
  const [hfApiKey, setHfApiKey] = useState<string>(() => {
    return localStorage.getItem('huggingface-api-key') || '';
  });

  return {
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
  };
};
