
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
    
    // Allow empty string for typing
    if (value === '') {
      onInputChange('characterAge', '');
      return;
    }
    
    // Strictly validate: only allow digits 0-9
    if (!/^\d+$/.test(value)) {
      // If non-numeric characters are entered, don't update the state
      // This prevents Safari from accepting letters/special chars
      return;
    }
    
    const numValue = parseInt(value);
    
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

  // Additional handler to prevent non-numeric input on keydown
  const handleAgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, and navigation keys
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
      return;
    }
    
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }
    
    // Allow: numbers 0-9
    if (e.keyCode >= 48 && e.keyCode <= 57) {
      return;
    }
    
    // Allow: numpad numbers 0-9
    if (e.keyCode >= 96 && e.keyCode <= 105) {
      return;
    }
    
    // Prevent all other keys (letters, special characters, etc.)
    e.preventDefault();
  };

  // Handle paste events to filter out non-numeric content
  const handleAgePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Only allow numeric content
    if (/^\d+$/.test(pastedText)) {
      const currentValue = characterAge;
      const newValue = currentValue + pastedText;
      
      // Validate the combined value
      const numValue = parseInt(newValue);
      if (numValue >= 0 && numValue <= 18) {
        onInputChange('characterAge', newValue);
      }
    }
  };

  // Helper function to show feedback for invalid input attempts
  const showInvalidInputFeedback = () => {
    if (characterAge && !/^\d+$/.test(characterAge)) {
      toast.error('Please enter only numbers (0-18) for character age');
    }
  };

  const testSessionStorage = () => {
    const savedData = sessionStorage.getItem('formData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('🔍 Current sessionStorage formData:', parsed);
      toast.success(`SessionStorage test: characterName = "${parsed.characterName}"`);
    } else {
      console.log('🔍 No formData in sessionStorage');
      toast.error('No formData found in sessionStorage');
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter age (0-18)"
          value={characterAge}
          onChange={handleAgeChange}
          onKeyDown={handleAgeKeyDown}
          onPaste={handleAgePaste}
          onBlur={showInvalidInputFeedback}
          className="text-lg p-4 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
          autoComplete="off"
          spellCheck="false"
        />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>🔢 Only numbers 0-18 allowed</span>
          {characterAge && !/^\d+$/.test(characterAge) && (
            <span className="text-red-500 font-medium">⚠️ Invalid input</span>
          )}
        </div>
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
