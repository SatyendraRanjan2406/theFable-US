
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CharacterDetailsFormProps {
  characterName: string;
  characterAge: string;
  characterGender: string;
  onInputChange: (field: string, value: string) => void;
}

const CharacterDetailsForm: React.FC<CharacterDetailsFormProps> = ({
  characterName,
  characterAge,
  characterGender,
  onInputChange
}) => {
  const genders = [
    { value: 'male', label: 'Male', icon: '👦' },
    { value: 'female', label: 'Female', icon: '👧' }
  ];

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    // Allow empty string for typing
    if (value === '') {
      onInputChange('characterAge', '');
      return;
    }
    
    // Validate age range (0-18)
    if (numValue < 0) {
      toast.error('Age cannot be negative');
      onInputChange('characterAge', '0');
      return;
    }
    
    if (numValue > 18) {
      toast.error('Age must be 18 or younger for child-appropriate stories');
      onInputChange('characterAge', '18');
      return;
    }
    
    onInputChange('characterAge', value);
  };

  const testLocalStorage = () => {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('🔍 Current localStorage formData:', parsed);
      toast.success(`LocalStorage test: characterName = "${parsed.characterName}"`);
    } else {
      console.log('🔍 No formData in localStorage');
      toast.error('No formData found in localStorage');
    }
  };

  return (
    <div className="space-y-6">
      {/* Character Name */}
      <div className="space-y-2">
        <Label htmlFor="characterName" className="text-lg font-semibold text-gray-700">
          Character Name *
        </Label>
        <Input
          id="characterName"
          placeholder="Enter the name..."
          value={characterName}
          onChange={(e) => onInputChange('characterName', e.target.value)}
          className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
        />
   
      </div>

      {/* Character Age */}
      <div className="space-y-2">
        <Label htmlFor="characterAge" className="text-lg font-semibold text-gray-700">
          Character Age * (0-18 years)
        </Label>
        <Input
          id="characterAge"
          type="number"
          placeholder="How old is your character?"
          value={characterAge}
          onChange={handleAgeChange}
          className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
          min="0"
          max="18"
        />
        <p className="text-sm text-gray-500">
          Stories are designed to be age-appropriate for children and teens (0-18 years old)
        </p>
      </div>

      {/* Character Gender */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-gray-700">Character Gender *</Label>
        <Select value={characterGender} onValueChange={(value) => onInputChange('characterGender', value)}>
          <SelectTrigger className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl">
            <SelectValue placeholder="Select character gender..." />
          </SelectTrigger>
          <SelectContent>
            {genders.map((gender) => (
              <SelectItem key={gender.value} value={gender.value} className="text-lg">
                <span className="flex items-center gap-2">
                  <span>{gender.icon}</span>
                  {gender.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CharacterDetailsForm;
