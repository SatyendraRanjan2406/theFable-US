import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Sparkles, ArrowLeft, Gift, Star } from 'lucide-react';

interface StoryOutlineEditorProps {
  genre: string;
  storyOutline: string;
  message: string;
  onInputChange: (field: string, value: string) => void;
  onBackToCurated: () => void;
}

const StoryOutlineEditor: React.FC<StoryOutlineEditorProps> = ({
  genre,
  storyOutline,
  message,
  onInputChange,
  onBackToCurated
}) => {
  const genres = [
    { value: 'adventure', label: 'Adventure', icon: '🗺️' },
    { value: 'fairytale', label: 'Fairytale', icon: '🏰' },
    { value: 'humour', label: 'Humour', icon: '😄' },
    { value: 'mystery', label: 'Mystery', icon: '🔍' }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
            <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800">Input story details</h3>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-pink-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-blue-700 font-medium">Craft Your Perfect Adventure</p>
              <p className="text-sm text-blue-600">Write your own story outline and let our AI bring it to life!</p>
            </div>
          </div>
        </div>

        {/* Genre Selection */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-gray-700">Story Genre *</Label>
          <Select value={genre} onValueChange={(value) => onInputChange('genre', value)}>
            <SelectTrigger className="text-lg p-4 border-2 border-blue-200 focus:border-blue-500 rounded-xl">
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
            Story Outline *
              </Label>
          <Textarea
            id="storyOutline"
            placeholder="Describe the main plot points of your story... (e.g., 'The character discovers a magical portal and must save a kingdom from an evil wizard')"
            value={storyOutline}
            onChange={(e) => onInputChange('storyOutline', e.target.value)}
            className="text-lg p-4 border-2 border-blue-200 focus:border-blue-500 rounded-xl min-h-32"
            rows={4}
          />
          <p className="text-sm text-gray-500">
            Provide a detailed outline to guide the story generation. This will help create a more personalized adventure!
              </p>
            </div>



        <div className="text-center bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-3">
          <p className="text-blue-600 font-medium">
            🎁 Ready to create a gift that will inspire them to read and dream? Let's begin! ✨
                </p>
              </div>

        {/* Choose from Curated Stories Button */}
        <div className="flex items-center justify-center pt-4">
            <Button
              variant="outline"
            onClick={onBackToCurated}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Choose from Curated Stories
            </Button>
          </div>
        </CardContent>
      </Card>
  );
};

export default StoryOutlineEditor;
