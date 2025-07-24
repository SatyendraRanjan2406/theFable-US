import React from 'react';
import CharacterDetailsForm from './CharacterDetailsForm';
import PhotoUploadField from './PhotoUploadField';
import { toast } from 'sonner';

interface CuratedStory {
  id: string;
  title: string;
  thumbnail: string | null;
  min_age: number;
  max_age: number;
  gender: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_new: boolean;
  panels_count: number;
}

interface CuratedStoryFormProps {
  stories: CuratedStory[];
  selectedStory: CuratedStory | null;
  onStorySelect: (story: CuratedStory) => void;
  formData: {
    characterName: string;
    characterAge: string;
    characterGender: string;
    photo: File | null;
    cartoonImageUrl?: string | null;
    selectedPhotoForStory?: string | null;
  };
  onInputChange: (field: string, value: string) => void;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  onCartoonSelect?: (cartoonUrl: string) => void;
  onCartoonRemove?: () => void;
  onPhotoChosenForStory?: (photoUrl: string, isCartoon: boolean) => void;
  isCompressingPhoto?: boolean;
  onGenerateStory: () => void;
  isGenerating?: boolean;
}

const CuratedStoryForm: React.FC<CuratedStoryFormProps> = ({
  stories,
  selectedStory,
  onStorySelect,
  formData,
  onInputChange,
  onPhotoUpload,
  onPhotoRemove,
  onCartoonSelect,
  onCartoonRemove,
  onPhotoChosenForStory,
  isCompressingPhoto = false,
  onGenerateStory,
  isGenerating = false
}) => {

  const handleGenerateClick = () => {
    if (selectedStory) {
      // Check if user has selected a photo for the story
      if (!formData.selectedPhotoForStory) {
        toast.error('📸 Please select a photo for your story first! Click "📖 Use for Story" button to continue.');
        return;
      }
      
      // Call the curated story generation API
      onGenerateStory();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Create Your Curated Story
            </h1>
            <p className="text-sm opacity-90">
              Choose from our magical collection of pre-written adventures and make your child the hero of their own story
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Character Details */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👶</span>
              Character Details
            </h2>
            <CharacterDetailsForm
              characterName={formData.characterName}
              characterAge={formData.characterAge}
              characterGender={formData.characterGender}
              onInputChange={onInputChange}
            />
          </div>

          {/* Photo Upload */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📸</span>
              Upload Your Child's Photo
            </h2>
            <PhotoUploadField
              photo={formData.photo}
              onPhotoUpload={onPhotoUpload}
              onPhotoRemove={onPhotoRemove}
              isCompressing={isCompressingPhoto}
              cartoonImageUrl={formData.cartoonImageUrl}
              onCartoonSelect={onCartoonSelect}
              onCartoonRemove={onCartoonRemove}
              onPhotoChosenForStory={onPhotoChosenForStory}
            />
          </div>



          {/* Curated Stories Selection */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              Choose Your Story
            </h2>
            
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    selectedStory?.id === story.id
                      ? 'border-orange-500 bg-orange-50 shadow-xl scale-105 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                  }`}
                  onClick={() => onStorySelect(story)}
                >
                  {/* Story Thumbnail */}
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mb-3">
                    {story.thumbnail ? (
                      <img
                        src={story.thumbnail}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">📚</span>
                    )}
                  </div>

                  {/* Story Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className={`font-semibold text-sm flex-1 ${
                        selectedStory?.id === story.id ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {story.is_new && (
                          <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            NEW
                          </span>
                        )}
                        {selectedStory?.id === story.id && (
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Ages {story.min_age}-{story.max_age} • {story.panels_count} Panel{story.panels_count !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Selected Story Highlight Bar */}
                    {selectedStory?.id === story.id && (
                      <div className="pt-2 border-t border-orange-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-orange-700">✓ Selected</span>
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            Ready
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* No Stories Available Message */}
            {stories.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📖</div>
                <p className="text-gray-600 mb-4">No curated stories available at the moment</p>
                <p className="text-sm text-gray-500">Please try again later</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating || !selectedStory}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                isGenerating || !selectedStory
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white hover:from-[#D55A3A] hover:to-[#C026D6] shadow-lg'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Your Story...
                </div>
              ) : (
                'Create My Story!'
              )}
            </button>
            
            {!selectedStory && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Please select a story to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratedStoryForm;
