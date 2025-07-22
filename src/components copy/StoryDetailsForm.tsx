
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StoryDetailsFormProps {
  genre: string;
  storyOutline: string;
  message: string;
  onInputChange: (field: string, value: string) => void;
}

const StoryDetailsForm: React.FC<StoryDetailsFormProps> = ({
  genre,
  storyOutline,
  message,
  onInputChange
}) => {
  const genres = [
    { value: 'adventure', label: 'Adventure', icon: '🗺️' },
    { value: 'fairytale', label: 'Fairytale', icon: '🏰' },
    { value: 'humour', label: 'Humour', icon: '😄' },
    { value: 'mystery', label: 'Mystery', icon: '🔍' }
  ];

  return (
    <div className="space-y-6">
      {/* Genre Selection */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-gray-700">Story Genre *</Label>
        <Select value={genre} onValueChange={(value) => onInputChange('genre', value)}>
          <SelectTrigger className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl">
            <SelectValue placeholder="Choose your genre..." />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre.value} value={genre.value} className="text-lg">
                <span className="flex items-center gap-2">
                  <span>{genre.icon}</span>
                  {genre.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Story Outline */}
      <div className="space-y-2">
        <Label htmlFor="storyOutline" className="text-lg font-semibold text-gray-700">
          Story Outline (Optional)
        </Label>
        <Textarea
          id="storyOutline"
          placeholder="Describe the main plot points of your story... (e.g., 'The character discovers a magical portal and must save a kingdom from an evil wizard')"
          value={storyOutline}
          onChange={(e) => onInputChange('storyOutline', e.target.value)}
          className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl min-h-32"
          rows={4}
        />
        <p className="text-sm text-gray-500">
          Provide a brief outline to guide the story generation. Leave blank for a default story.
        </p>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-lg font-semibold text-gray-700">
          Special Message (Optional)
        </Label>
        <Textarea
          id="message"
          placeholder="Any special message or lesson you'd like to include..."
          value={message}
          onChange={(e) => onInputChange('message', e.target.value)}
          className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl min-h-24"
          rows={3}
        />
      </div>
    </div>
  );
};

export default StoryDetailsForm;
