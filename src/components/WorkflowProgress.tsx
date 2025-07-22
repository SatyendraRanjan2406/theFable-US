import React from 'react';

type WorkflowStep = 'form' | 'outline' | 'final';

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ currentStep }) => {
  return (
    <div className="flex justify-center mt-8">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className={`flex items-center ${currentStep === 'form' ? 'text-purple-600' : currentStep === 'outline' || currentStep === 'final' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${currentStep === 'form' ? 'bg-purple-600 text-white' : currentStep === 'outline' || currentStep === 'final' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Form</span>
        </div>
        <div className={`h-0.5 w-8 sm:w-16 ${currentStep === 'outline' || currentStep === 'final' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${currentStep === 'outline' ? 'text-purple-600' : currentStep === 'final' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${currentStep === 'outline' ? 'bg-purple-600 text-white' : currentStep === 'final' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Outline</span>
        </div>
        <div className={`h-0.5 w-8 sm:w-16 ${currentStep === 'final' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${currentStep === 'final' ? 'text-purple-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${currentStep === 'final' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Comic</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;
