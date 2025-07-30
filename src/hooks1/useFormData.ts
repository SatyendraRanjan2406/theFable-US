import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { compressImageForAPI } from '@/utils/imageUtils';
import { trackPhotoUploaded } from '@/utils/gtm';

export const useFormData = () => {
  // Move these inside the hook to ensure they are always in scope
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;

  const [formData, setFormData] = useState(() => {
    const savedData = sessionStorage.getItem('formData');
    console.log('🔄 Loading form data from sessionStorage:', savedData ? 'Found' : 'Not found');
    
    const initialData = {
      characterName: '',
      characterAge: '',
      characterGender: '',
      photo: null as File | null,
      genre: 'adventure',
      storyStyle: 'default',
      bookType: 'comic',
      message: '',
      storyLength: [3] as number[],
      storyOutline: '',
      cartoonImageUrl: null as string | null,
      selectedPhotoForStory: null as string | null, // URL of selected photo for story
      isCartoonSelectedForStory: false, // Whether cartoon is selected for story
      uploadedPhotoUrl: null as string | null, // S3 uploaded photo URL
      photoUploadedAt: null as string | null // Timestamp when photo was uploaded
    };

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('📖 Parsed sessionStorage data:', {
        characterName: parsedData.characterName,
        characterAge: parsedData.characterAge,
        characterGender: parsedData.characterGender,
        selectedPhotoForStory: parsedData.selectedPhotoForStory,
        isCartoonSelectedForStory: parsedData.isCartoonSelectedForStory,
        uploadedPhotoUrl: parsedData.uploadedPhotoUrl,
        photoUploadedAt: parsedData.photoUploadedAt
      });
      
      // Note: We don't restore the File object from sessionStorage
      // The photo will be re-selected by the user if needed
      // This simplifies the storage and avoids base64 conversion issues
      
      const finalData = { 
        ...initialData, 
        ...parsedData, 
        photo: null, // Always start with null photo - user will re-select if needed
        selectedPhotoForStory: parsedData.selectedPhotoForStory || null,
        isCartoonSelectedForStory: parsedData.isCartoonSelectedForStory || false,
        uploadedPhotoUrl: parsedData.uploadedPhotoUrl || null,
        photoUploadedAt: parsedData.photoUploadedAt || null
      };
      console.log('✅ Final form data loaded:', {
        characterName: finalData.characterName,
        characterAge: finalData.characterAge,
        characterGender: finalData.characterGender,
        selectedPhotoForStory: finalData.selectedPhotoForStory,
        isCartoonSelectedForStory: finalData.isCartoonSelectedForStory,
        uploadedPhotoUrl: finalData.uploadedPhotoUrl,
        photoUploadedAt: finalData.photoUploadedAt
      });
      return finalData;
    }
    console.log('📝 Using default form data (no sessionStorage)');
    return initialData;
  });

  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState(OPENAI_API_KEY || '');
  const [hfApiKey, setHfApiKey] = useState(HF_API_KEY || '');

  const handleInputChange = (
    fieldOrEvent: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string,
    value?: any
  ) => {
    // Case 1: Standard React event object
    if (typeof fieldOrEvent === 'object' && fieldOrEvent !== null && 'target' in fieldOrEvent) {
      const { name, value: eventValue } = fieldOrEvent.target;
      console.log('📝 handleInputChange (event):', { name, value: eventValue });
      setFormData(prev => ({ ...prev, [name]: eventValue }));
    } 
    // Case 2: Field name and value are passed as separate arguments
    else if (typeof fieldOrEvent === 'string') {
      console.log('📝 handleInputChange (string):', { field: fieldOrEvent, value });
      setFormData(prev => ({ ...prev, [fieldOrEvent]: value }));
    }
  };

  const handleStoryLengthChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, storyLength: value }));
  };

  const compressAndSetPhoto = async (file: File) => {
    setIsCompressingPhoto(true);
    toast.info('Large image detected, optimizing for you...');
    try {
      // This happens in the background without blocking the UI
      const compressedFile = await compressImageForAPI(file, 2000);
      setFormData(prev => ({ ...prev, photo: compressedFile }));
      toast.success('Image optimized and ready!');
    } catch (error) {
      console.error('Failed to compress image:', error);
      toast.error('Could not optimize the image. Using the original.');
      // The original file is already set, so we can just inform the user.
    } finally {
      setIsCompressingPhoto(false);
    }
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFormData(prev => ({ ...prev, photo: null }));
      return;
    }

    // If file is small, set it immediately.
    if (file.size <= 2 * 1024 * 1024) { // 2MB threshold
      setFormData(prev => ({ ...prev, photo: file }));
      toast.success('Photo uploaded!');
      trackPhotoUploaded('photo_upload_field');
      return;
    }

    // If file is large, show compressing state and then compress.
    setIsCompressingPhoto(true);
    toast.info('Large image detected, optimizing for you...');
    try {
      const compressedFile = await compressImageForAPI(file);
      setFormData(prev => ({ ...prev, photo: compressedFile }));
      toast.success('Image optimized and ready!');
      trackPhotoUploaded('photo_upload_field_after_compress');

    } catch (error) {
      console.error('Failed to compress image:', error);
      toast.error('Could not process the image. Please try another one.');
      // Ensure we clear the photo if compression fails
      setFormData(prev => ({ ...prev, photo: null }));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handlePhotoRemove = () => {
    setFormData(prev => ({ 
      ...prev, 
      photo: null, 
      cartoonImageUrl: null,
      selectedPhotoForStory: null,
      isCartoonSelectedForStory: false,
      uploadedPhotoUrl: null,
      photoUploadedAt: null
    }));
    
    // Clear photo-related data from sessionStorage
    try {
      const savedData = sessionStorage.getItem('formData');
      if (savedData) {
        const formData = JSON.parse(savedData);
        delete formData.uploadedPhotoUrl;
        delete formData.photoUploadedAt;
        delete formData.cartoonImageUrl;
        delete formData.selectedPhotoForStory;
        delete formData.isCartoonSelectedForStory;
        sessionStorage.setItem('formData', JSON.stringify(formData));
        console.log('🗑️ Photo data cleared from sessionStorage');
      }
    } catch (error) {
      console.error('❌ Error clearing photo data from sessionStorage:', error);
    }
    
    toast.success('Photo removed.');
  };

  const handleCartoonSelect = (cartoonUrl: string) => {
    setFormData(prev => ({ ...prev, cartoonImageUrl: cartoonUrl }));
    toast.success('Cartoon style applied!');
  };

  const handleCartoonRemove = () => {
    setFormData(prev => ({ 
      ...prev, 
      cartoonImageUrl: null,
      selectedPhotoForStory: null,
      isCartoonSelectedForStory: false
    }));
    toast.success('Cartoon style removed.');
  };

  const handlePhotoChosenForStory = (photoUrl: string, isCartoon: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedPhotoForStory: photoUrl,
      isCartoonSelectedForStory: isCartoon
    }));
    console.log('📸 Photo selected for story:', { photoUrl, isCartoon });
  };

  const resetFormData = () => {
    setFormData({
      characterName: '',
      characterAge: '',
      characterGender: '',
      photo: null,
      genre: 'adventure',
      storyStyle: 'default',
      bookType: 'comic',
      message: '',
      storyLength: [3],
      storyOutline: '',
      cartoonImageUrl: null,
      selectedPhotoForStory: null,
      isCartoonSelectedForStory: false,
      uploadedPhotoUrl: null,
      photoUploadedAt: null
    });
    sessionStorage.removeItem('formData');
    sessionStorage.removeItem('photoData');
  };

  // Effect to save data to sessionStorage (simplified - no photo base64 conversion)
  useEffect(() => {
    const saveData = () => {
      console.log('💾 Saving form data to sessionStorage:', {
        characterName: formData.characterName,
        characterAge: formData.characterAge,
        characterGender: formData.characterGender,
        hasPhoto: !!formData.photo,
        selectedPhotoForStory: formData.selectedPhotoForStory,
        isCartoonSelectedForStory: formData.isCartoonSelectedForStory,
        uploadedPhotoUrl: formData.uploadedPhotoUrl,
        photoUploadedAt: formData.photoUploadedAt
      });
      
      // Save form data without the photo File object
      // The photo File object is not serializable, so we exclude it
      const { photo, ...dataToSave } = formData;
      sessionStorage.setItem('formData', JSON.stringify(dataToSave));
      console.log('✅ Form data saved to sessionStorage');
      
      // Verify the save by reading it back
      const savedData = sessionStorage.getItem('formData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('🔍 Verification - Saved characterName:', parsed.characterName);
      }
    };
    saveData();
  }, [formData]);

  return {
    formData,
    setFormData,
    isCompressingPhoto,
    openaiApiKey,
    setOpenaiApiKey,
    hfApiKey,
    setHfApiKey,
    handleInputChange,
    handleStoryLengthChange,
    handlePhotoUpload,
    handlePhotoRemove,
    handleCartoonSelect,
    handleCartoonRemove,
    handlePhotoChosenForStory,
    resetFormData
  };
};
