import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCuratedStories } from '@/hooks/useCuratedStories';
import StoryPreview from './StoryPreview';
import { HF_API_KEY } from './ApiConfiguration';

interface CuratedStoryFormProps {
  selectedStory: {
    title: string;
    outline: string;
    genre: string;
    slug: string;
  };
  onBack: () => void;
}

const CuratedStoryForm: React.FC<CuratedStoryFormProps> = ({
  selectedStory,
  onBack
}) => {
  const [formData, setFormData] = useState({
    characterName: '',
    characterAge: '',
    photo: null as File | null
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);

  const { getStoryBySlug } = useCuratedStories();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Please select a photo smaller than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      toast.success('Photo uploaded successfully!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.characterName.trim()) {
      toast.error('Please enter a character name');
      return;
    }
    
    if (!formData.characterAge.trim()) {
      toast.error('Please enter the character age');
      return;
    }
    
    const age = parseInt(formData.characterAge);
    if (isNaN(age) || age < 0 || age > 14) {
      toast.error('Please enter a valid age between 0 and 14');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get the full story content from the database
      const storyData = getStoryBySlug(selectedStory.slug);
      
      if (!storyData) {
        toast.error('Story not found');
        return;
      }

      // Replace placeholder character name with actual name in the story
      let personalizedStory = storyData.story_content.replace(/\[CHARACTER_NAME\]/g, formData.characterName);
      
      // Set the generated story directly from database - Hugging Face API will handle image generation
      setGeneratedStory(personalizedStory);
      toast.success('Your personalized story has been created!');
      
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // If story is generated, show the preview
  if (generatedStory) {
    return (
      <StoryPreview
        story={generatedStory}
        characterName={formData.characterName}
        characterPhoto={formData.photo ? URL.createObjectURL(formData.photo) : null}
        genre={selectedStory.genre}
        isGenerating={false}
        isRegenerating={false}
        onBackToForm={() => {
          setGeneratedStory(null);
        }}

        showBackButton={true}
        onUpdatePanel={() => {}}
        onLockPanel={() => {}}
        onUnlockPanel={() => {}}
        lockedPanels={[]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stories
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          Create Your Character for "{selectedStory.title}"
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Tell us about your character
          </CardTitle>
          <p className="text-center text-gray-600">
            We'll use this information to create your personalized {selectedStory.genre} story
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name *</Label>
              <Input
                id="characterName"
                type="text"
                placeholder="Enter your character's name"
                value={formData.characterName}
                onChange={(e) => handleInputChange('characterName', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterAge">Character Age *</Label>
              <Input
                id="characterAge"
                type="number"
                placeholder="Enter age (0-14)"
                min="0"
                max="14"
                value={formData.characterAge}
                onChange={(e) => handleInputChange('characterAge', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Character Photo (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="photo" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {formData.photo ? formData.photo.name : 'Click to upload a photo of your character'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: 5MB
                  </p>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Your Story...
                </>
              ) : (
                'Create My Story!'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuratedStoryForm;
