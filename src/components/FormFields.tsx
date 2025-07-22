import React from 'react';
import CharacterDetailsForm from './CharacterDetailsForm';
import PhotoUploadField from './PhotoUploadField';
import StoryDetailsForm from './StoryDetailsForm';

interface FormFieldsProps {
  formData: {
    characterName: string;
    characterAge: string;
    characterGender: string;
    photo: File | null;
    genre: string;
    bookType: string;
    message: string;
    storyOutline: string;
    cartoonImageUrl?: string | null;
  };
  onInputChange: (field: string, value: string) => void;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  onCartoonSelect?: (cartoonUrl: string) => void;
  onCartoonRemove?: () => void;
  onPhotoChosenForStory?: (photoUrl: string, isCartoon: boolean) => void;
  isCompressingPhoto?: boolean;
}

const FormFields: React.FC<FormFieldsProps> = ({
  formData,
  onInputChange,
  onPhotoUpload,
  onPhotoRemove,
  onCartoonSelect,
  onCartoonRemove,
  onPhotoChosenForStory,
  isCompressingPhoto,
}) => {
  return (
    <div className="space-y-6">
      <CharacterDetailsForm
        characterName={formData.characterName}
        characterAge={formData.characterAge}
        characterGender={formData.characterGender}
        onInputChange={onInputChange}
      />

      <PhotoUploadField
        photo={formData.photo}
        onPhotoUpload={onPhotoUpload}
        onPhotoRemove={onPhotoRemove}
        cartoonImageUrl={formData.cartoonImageUrl}
        onCartoonSelect={onCartoonSelect}
        onCartoonRemove={onCartoonRemove}
        onPhotoChosenForStory={onPhotoChosenForStory}
        isCompressing={isCompressingPhoto}
      />

      <StoryDetailsForm
        genre={formData.genre}
        storyOutline={formData.storyOutline}
        message={formData.message}
        onInputChange={onInputChange}
      />
    </div>
  );
};

export default FormFields;
