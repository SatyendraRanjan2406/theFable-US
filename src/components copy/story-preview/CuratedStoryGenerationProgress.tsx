import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

interface CuratedStoryGenerationProgressProps {
  characterName: string;
  characterPhotoUrl?: string | null;
  selectedPhotoForStory?: string | null;
  isCartoonSelectedForStory?: boolean;
  onBackToForm: () => void;
  progress?: number;
  currentStep?: string;
  totalSteps?: number;
}

const CuratedStoryGenerationProgress: React.FC<CuratedStoryGenerationProgressProps> = ({
  characterName,
  characterPhotoUrl,
  selectedPhotoForStory,
  isCartoonSelectedForStory,
  onBackToForm,
  progress = 0,
  currentStep = "Generating personalized story...",
  totalSteps = 3
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={onBackToForm}
            variant="ghost"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Form
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Character Photo */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 mx-auto">
                {selectedPhotoForStory ? (
                  <img
                    src={selectedPhotoForStory}
                    alt={characterName}
                    className="w-full h-full object-cover"
                  />
                ) : characterPhotoUrl ? (
                  <img
                    src={characterPhotoUrl}
                    alt={characterName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <span className="text-2xl">👶</span>
                  </div>
                )}
              </div>
              {isCartoonSelectedForStory && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  🎨
                </div>
              )}
            </div>
          </div>

          {/* Loading Animation */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6">
                <div className="w-full h-full border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Creating Your Curated Story!
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            We're crafting a magical adventure starring <span className="font-semibold text-purple-600">{characterName}</span> just for you!
          </p>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3 text-green-600">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">Story template selected</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-green-600">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">Character details processed</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-purple-600">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${progress >= 3 ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}>
                {progress >= 3 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <BookOpen className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progress / totalSteps) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Step {progress} of {totalSteps}
            </p>
          </div>

          {/* Message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <p className="text-purple-700 font-medium">
              ✨ Our AI is weaving a magical tale where {characterName} becomes the hero of their own adventure! ✨
            </p>
            <p className="text-sm text-purple-600 mt-2">
              This usually takes just a few moments...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratedStoryGenerationProgress; 