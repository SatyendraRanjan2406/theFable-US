import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { compressImageForAPI } from '@/utils/imageUtils';
import { trackPhotoUploaded } from '@/utils/gtm';

// Helper to convert base64 string back to a File object
const base64StringToFile = (base64String: string, filename: string, originalLastModified?: number) => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { 
    type: mime,
    lastModified: originalLastModified || Date.now()
  });
};

// Helper to convert a File to a base64 string
const fileToBase64String = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const useFormData = () => {
  // Move these inside the hook to ensure they are always in scope
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('formData');
    console.log('🔄 Loading form data from localStorage:', savedData ? 'Found' : 'Not found');
    
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
      console.log('📖 Parsed localStorage data:', {
        characterName: parsedData.characterName,
        characterAge: parsedData.characterAge,
        characterGender: parsedData.characterGender,
        selectedPhotoForStory: parsedData.selectedPhotoForStory,
        isCartoonSelectedForStory: parsedData.isCartoonSelectedForStory
      });
      
      if (parsedData.photo) {
        // Restore the File object with original metadata to maintain cache consistency
        initialData.photo = base64StringToFile(
          parsedData.photo, 
          parsedData.photoName || 'character.jpg',
          parsedData.photoLastModified
        );
      }
      const finalData = { 
        ...initialData, 
        ...parsedData, 
        photo: initialData.photo,
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
    console.log('📝 Using default form data (no localStorage)');
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
    const savedData = JSON.parse(localStorage.getItem('formData') || '{}');
    delete savedData.photo;
    delete savedData.photoName;
    delete savedData.photoLastModified;
    delete savedData.cartoonImageUrl;
    delete savedData.selectedPhotoForStory;
    delete savedData.isCartoonSelectedForStory;
    delete savedData.uploadedPhotoUrl;
    delete savedData.photoUploadedAt;
    localStorage.setItem('formData', JSON.stringify(savedData));
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
    localStorage.removeItem('formData');
  };

  // Effect to save data to localStorage
  useEffect(() => {
    const saveData = async () => {
      console.log('💾 Saving form data to localStorage:', {
        characterName: formData.characterName,
        characterAge: formData.characterAge,
        characterGender: formData.characterGender,
        hasPhoto: !!formData.photo,
        selectedPhotoForStory: formData.selectedPhotoForStory,
        isCartoonSelectedForStory: formData.isCartoonSelectedForStory,
        uploadedPhotoUrl: formData.uploadedPhotoUrl,
        photoUploadedAt: formData.photoUploadedAt
      });
      
      if (formData.photo) {
        const photoBase64 = await fileToBase64String(formData.photo);
        const dataToSave = {
          ...formData,
          photo: photoBase64,
          photoName: formData.photo.name,
          photoLastModified: formData.photo.lastModified // Save lastModified
        };
        localStorage.setItem('formData', JSON.stringify(dataToSave));
        console.log('✅ Form data saved with photo');
      } else {
        // Don't save photo-related fields if there is no photo
        const { photo, ...rest } = formData;
        localStorage.setItem('formData', JSON.stringify(rest));
        console.log('✅ Form data saved without photo');
      }
      
      // Verify the save by reading it back
      const savedData = localStorage.getItem('formData');
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
