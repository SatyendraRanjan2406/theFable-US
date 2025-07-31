import React, { useRef, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { uploadImageToS3 } from '@/utils/s3Upload';
import { toast } from 'sonner';

// Add custom CSS for animated dashed borders
const dashAnimation = `
  @keyframes dash-blink {
    0%, 50% { border-color: currentColor; }
    51%, 100% { border-color: transparent; }
  }
  .animate-dash-blink {
    animation: dash-blink 1s infinite;
  }
`;

// Dynamic import for CartoonizationModal
const CartoonizationModal = React.lazy(() => import('./CartoonizationModal'));

interface PhotoUploadFieldProps {
  photo: File | null;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  isCompressing?: boolean;
  cartoonImageUrl?: string | null;
  onCartoonSelect?: (cartoonUrl: string) => void;
  onCartoonRemove?: () => void;
  onPhotoChosenForStory?: (photoUrl: string, isCartoon: boolean) => void;
}

const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  photo,
  onPhotoUpload,
  onPhotoRemove,
  isCompressing = false,
  cartoonImageUrl,
  onCartoonSelect,
  onCartoonRemove,
  onPhotoChosenForStory,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isCartoonModalOpen, setIsCartoonModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedForStory, setSelectedForStory] = useState<'original' | 'cartoon' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photo data from sessionStorage on component mount
  useEffect(() => {
    console.log('🔄 Loading photo data from sessionStorage...');
    try {
      const savedPhotoData = sessionStorage.getItem('photoData');
      const savedFormData = sessionStorage.getItem('formData');
      
      console.log('🔍 Raw sessionStorage data:', {
        photoData: savedPhotoData,
        formData: savedFormData
      });
      
      // Priority 1: Load from photoData (most reliable for photo persistence)
      if (savedPhotoData) {
        const photoData = JSON.parse(savedPhotoData);
        console.log('✅ Loaded photo data from sessionStorage:', photoData);
        
        // Set the uploaded image URL if it exists
        if (photoData.uploadedImageUrl) {
          setUploadedImageUrl(photoData.uploadedImageUrl);
          setPreviewUrl(photoData.uploadedImageUrl);
          console.log('📸 Set preview URL from photoData.uploadedImageUrl:', photoData.uploadedImageUrl);
        }
        
        // Set selected for story if it exists
        if (photoData.selectedForStory) {
          setSelectedForStory(photoData.selectedForStory);
          console.log('📸 Set selected for story from photoData:', photoData.selectedForStory);
        }
      }
      
      // Priority 2: Fallback to form data if no photoData or no uploadedImageUrl
      if (savedFormData && (!savedPhotoData || !JSON.parse(savedPhotoData || '{}').uploadedImageUrl)) {
        const formData = JSON.parse(savedFormData);
        console.log('✅ Loaded form data from sessionStorage:', {
          selectedPhotoForStory: formData.selectedPhotoForStory,
          uploadedPhotoUrl: formData.uploadedPhotoUrl
        });
        
        // If we have a selected photo for story, set it as preview
        if (formData.selectedPhotoForStory) {
          setPreviewUrl(formData.selectedPhotoForStory);
          setSelectedForStory(formData.isCartoonSelectedForStory ? 'cartoon' : 'original');
          console.log('📸 Set preview URL from formData.selectedPhotoForStory:', formData.selectedPhotoForStory);
        } else if (formData.uploadedPhotoUrl) {
          // Fallback to uploaded photo URL
          setPreviewUrl(formData.uploadedPhotoUrl);
          setUploadedImageUrl(formData.uploadedPhotoUrl);
          console.log('📸 Set preview URL from formData.uploadedPhotoUrl:', formData.uploadedPhotoUrl);
        }
      }
    } catch (error) {
      console.error('❌ Error loading photo data from sessionStorage:', error);
    }
  }, []);

  // Save photo data to sessionStorage
  const savePhotoDataToSessionStorage = (data: any) => {
    try {
      const currentData = sessionStorage.getItem('photoData');
      const existingData = currentData ? JSON.parse(currentData) : {};
      const updatedData = { ...existingData, ...data };
      sessionStorage.setItem('photoData', JSON.stringify(updatedData));
      console.log('💾 Saved photo data to sessionStorage:', updatedData);
    } catch (error) {
      console.error('❌ Error saving photo data to sessionStorage:', error);
    }
  };

  // Helper function to save photo URL to form data sessionStorage
  const savePhotoUrlToFormData = (photoUrl: string) => {
    try {
      console.log('💾 Saving photo URL to form data:', photoUrl);
      
      // Get current form data from sessionStorage
      const savedFormData = sessionStorage.getItem('formData');
      let formData = savedFormData ? JSON.parse(savedFormData) : {};
      
      // Update form data with the uploaded photo URL
      formData.uploadedPhotoUrl = photoUrl;
      formData.photoUploadedAt = new Date().toISOString();
      
      // Save updated form data back to sessionStorage
      sessionStorage.setItem('formData', JSON.stringify(formData));
      
      console.log('✅ Photo URL saved to form data successfully');
    } catch (error) {
      console.error('❌ Error saving photo URL to form data:', error);
    }
  };

  // Simplified upload logic - always upload if not already uploaded
  const handlePhotoUpload = async (file: File) => {
    console.log('🔄 Uploading photo:', file.name);
    
    // If already uploaded, don't upload again
    if (uploadedImageUrl) {
      console.log('✅ Photo already uploaded, skipping upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress('🔄 Uploading image to cloud...');
      
      const result = await uploadImageToS3(file);
      console.log('🚀 Upload result:', result);
      
      if (result.success && result.imageUrl) {
        console.log('✅ Upload successful:', result.imageUrl);
        
        setUploadedImageUrl(result.imageUrl);
        setPreviewUrl(result.imageUrl);
        setUploadProgress('✅ Upload completed!');
        toast.success('🎉 Photo uploaded successfully!');
        
        // Save the uploaded photo URL to form data
        savePhotoUrlToFormData(result.imageUrl);
        
        // Save photo data to sessionStorage
        savePhotoDataToSessionStorage({
          uploadedImageUrl: result.imageUrl,
          selectedForStory: selectedForStory
        });
        
        setTimeout(() => {
          setUploadProgress('');
          setIsUploading(false);
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress('');
      setIsUploading(false);
    }
  };

  // Handle photo selection and preview
  useEffect(() => {
    let objectUrl: string | null = null;
    
    console.log('🔍 PhotoUploadField useEffect triggered');
    console.log('📊 Current state:', { 
      hasPhoto: !!photo, 
      photoName: photo?.name,
      uploadedImageUrl,
      selectedForStory
    });
    
    if (photo) {
      console.log('📸 Photo exists in props:', photo.name);
      
      setIsImageLoading(true);
      
      // Create blob URL for immediate preview
      objectUrl = URL.createObjectURL(photo);
      setPreviewUrl(objectUrl);
      setIsImageLoading(false);
      
      // Upload if not already uploaded
      if (!uploadedImageUrl) {
        console.log('🎯 Starting photo upload...');
        handlePhotoUpload(photo);
      }
      
      // Set a timeout to revoke the blob URL to prevent memory leaks
      const timeoutId = setTimeout(() => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }, 30000);

      return () => {
        clearTimeout(timeoutId);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } else {
      console.log('🗑️ No photo selected, clearing state');
      setPreviewUrl(null);
      setIsImageLoading(false);
      setUploadedImageUrl(null);
      setSelectedForStory(null);
      
      // Clear photo data from sessionStorage
      sessionStorage.removeItem('photoData');
    }
  }, [photo]); // Only depend on photo changes

  const handleRemoveClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadedImageUrl(null);
    setPreviewUrl(null);
    setUploadProgress('');
    setIsUploading(false);
    setSelectedForStory(null);
    
    // Clear uploaded photo URL from form data sessionStorage
    try {
      const savedFormData = sessionStorage.getItem('formData');
      if (savedFormData) {
        const formData = JSON.parse(savedFormData);
        delete formData.uploadedPhotoUrl;
        delete formData.photoUploadedAt;
        sessionStorage.setItem('formData', JSON.stringify(formData));
        console.log('🗑️ Uploaded photo URL cleared from form data');
      }
    } catch (error) {
      console.error('❌ Error clearing uploaded photo URL:', error);
    }
    
    // Clear photo data from sessionStorage
    sessionStorage.removeItem('photoData');
    
    onPhotoRemove();
  };

  const handleCartoonizeClick = () => {
    setIsCartoonModalOpen(true);
  };

  const handleCartoonSelect = (cartoonUrl: string) => {
    if (onCartoonSelect) {
      onCartoonSelect(cartoonUrl);
    }
    setIsCartoonModalOpen(false);
    // Automatically select cartoon for story
    setSelectedForStory('cartoon');
    if (onPhotoChosenForStory) {
      onPhotoChosenForStory(cartoonUrl, true);
    }
    
    // Save the cartoon URL as the uploaded photo URL in form data
    savePhotoUrlToFormData(cartoonUrl);
    
    // Save photo data to sessionStorage
    savePhotoDataToSessionStorage({
      uploadedImageUrl: cartoonUrl,
      selectedForStory: 'cartoon'
    });
  };

  const handleCartoonRemove = () => {
    if (onCartoonRemove) {
      onCartoonRemove();
    }
    
    // Clear uploaded photo URL from form data sessionStorage when cartoon is removed
    try {
      const savedFormData = sessionStorage.getItem('formData');
      if (savedFormData) {
        const formData = JSON.parse(savedFormData);
        delete formData.uploadedPhotoUrl;
        delete formData.photoUploadedAt;
        sessionStorage.setItem('formData', JSON.stringify(formData));
        console.log('🗑️ Uploaded photo URL cleared when cartoon removed');
      }
    } catch (error) {
      console.error('❌ Error clearing uploaded photo URL:', error);
    }
    
    // Update photo data in sessionStorage
    savePhotoDataToSessionStorage({
      selectedForStory: null
    });
  };

  const renderContent = () => {
    if (isCompressing) {
      return (
        <div className="mt-2 flex flex-col justify-center items-center w-36 h-36 mx-auto bg-purple-50 rounded-xl border-2 border-dashed border-purple-300">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="text-sm text-purple-600 mt-2">Optimizing...</span>
        </div>
      );
    }

    if (isUploading && uploadProgress) {
      return (
        <div className="mt-2 flex flex-col justify-center items-center w-36 h-36 mx-auto bg-blue-50 rounded-xl border-2 border-dashed border-blue-300">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-600 mt-2 text-center">{uploadProgress}</span>
        </div>
      );
    }

    if (photo && previewUrl) {
      return (
        <div className="mt-2 space-y-4">
          {/* Image Display Section */}
          <div className="space-y-4">
            {/* Show both images side by side when cartoon exists */}
            {cartoonImageUrl ? (
              <div className="flex flex-col items-center space-y-6">
                <p className="text-center text-lg font-semibold text-purple-600">
                  🌟 Choose which photo to use for your story! 🌟
                </p>
                <div className="flex justify-center items-center gap-6">
                   {/* Original Image Card */}
                   <div className={`relative bg-white rounded-2xl shadow-lg p-4 border-2 transition-all duration-500 transform ${
                     selectedForStory === 'original' 
                       ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl ring-4 ring-blue-200 ring-opacity-50' 
                       : 'border-gray-200 hover:border-blue-400'
                   }`}>
                     <p className="text-sm font-medium text-gray-700 mb-2 text-center">📷 Original Photo</p>
                     <div className={`w-32 h-32 bg-gray-100 rounded-xl overflow-hidden relative ${
                       selectedForStory === 'original' 
                         ? 'border-4 border-dashed border-blue-500 animate-pulse' 
                         : ''
                     }`}>
                       <img
                         src={previewUrl}
                         alt={photo.name}
                         className="w-full h-full object-cover rounded-lg"
                       />
                       {selectedForStory === 'original' && (
                         <>
                           <div className="absolute inset-0 border-4 border-dashed border-white rounded-xl animate-ping opacity-75"></div>
                           <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-xl animate-dash-blink"></div>
                           <div className="absolute inset-1 border-2 border-dashed border-yellow-400 rounded-lg animate-pulse opacity-60"></div>
                         </>
                       )}
                     </div>
                     {selectedForStory === 'original' && (
                       <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-2 animate-bounce">
                         ✅
                       </div>
                     )}
                     <Button
                       onClick={() => {
                         setSelectedForStory('original');
                         if (onPhotoChosenForStory && previewUrl) {
                           onPhotoChosenForStory(previewUrl, false);
                           toast.success('🎉 Original photo selected for story!');
                           // Save the original photo URL to form data
                           savePhotoUrlToFormData(previewUrl);
                           
                           // Save photo data to sessionStorage
                           savePhotoDataToSessionStorage({
                             selectedForStory: 'original'
                           });
                         }
                       }}
                       className={`w-full mt-3 rounded-xl py-2 text-sm font-medium transition-all duration-300 ${
                         selectedForStory === 'original'
                           ? 'bg-green-500 hover:bg-green-600 text-white'
                           : 'bg-blue-500 hover:bg-blue-600 text-white'
                       }`}
                     >
                       {selectedForStory === 'original' ? '✅ Selected!' : '📖 Use for Story'}
                     </Button>
                   </div>

                                     {/* Cartoon Image Card */}
                   <div className={`relative bg-white rounded-2xl shadow-lg p-4 border-2 transition-all duration-500 transform ${
                     selectedForStory === 'cartoon' 
                       ? 'border-purple-500 bg-purple-50 scale-105 shadow-xl ring-4 ring-purple-200 ring-opacity-50' 
                       : 'border-purple-300 hover:border-purple-500'
                   }`}>
                     <p className="text-sm font-medium text-purple-700 mb-2 text-center">🎨 Cartoon Version</p>
                     <div className={`w-32 h-32 bg-purple-50 rounded-xl overflow-hidden relative ${
                       selectedForStory === 'cartoon' 
                         ? 'border-4 border-dashed border-purple-500 animate-pulse' 
                         : ''
                     }`}>
                       <img
                         src={cartoonImageUrl}
                         alt="Cartoonized version"
                         className="w-full h-full object-cover rounded-lg"
                       />
                       {selectedForStory === 'cartoon' && (
                         <div className="absolute inset-0 border-4 border-dashed border-white rounded-xl animate-ping opacity-75"></div>
                       )}
                     </div>
                     {selectedForStory === 'cartoon' && (
                       <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-2 animate-bounce">
                         ✅
                       </div>
                     )}
                     <Button
                       onClick={() => {
                         setSelectedForStory('cartoon');
                         if (onPhotoChosenForStory && cartoonImageUrl) {
                           onPhotoChosenForStory(cartoonImageUrl, true);
                           toast.success('🎉 Cartoon photo selected for story!');
                           // Save the cartoon photo URL to form data
                           savePhotoUrlToFormData(cartoonImageUrl);
                           
                           // Save photo data to sessionStorage
                           savePhotoDataToSessionStorage({
                             selectedForStory: 'cartoon'
                           });
                         }
                       }}
                       className={`w-full mt-3 rounded-xl py-2 text-sm font-medium transition-all duration-300 ${
                         selectedForStory === 'cartoon'
                           ? 'bg-green-500 hover:bg-green-600 text-white'
                           : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                       }`}
                     >
                       {selectedForStory === 'cartoon' ? '✅ Selected!' : '📖 Use for Story'}
                     </Button>
                   </div>
                </div>
                
                {/* Remove buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleRemoveClick}
                    className="text-gray-600 hover:text-red-600 border-gray-300 rounded-xl"
                  >
                    🗑️ Remove Photos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCartoonRemove}
                    className="text-purple-600 hover:text-red-600 border-purple-300 rounded-xl"
                  >
                    🎨 Remove Cartoon
                  </Button>
                </div>
              </div>
            ) : (
              /* Single image view when no cartoon */
              <div className="flex flex-col items-center space-y-4">
                {/* Photo Title and Status */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    📷 Your Photo
                    {uploadedImageUrl && (
                      <span className="ml-2 text-green-600">
                        <CheckCircle className="w-4 h-4 inline" /> Uploaded
                      </span>
                    )}
                  </p>
                </div>

                {/* Image Container */}
                <div className="relative">
                  <div className="flex justify-center items-center relative w-36 h-36 bg-gray-100 rounded-xl border-2 border-dashed border-purple-300">
                    {(isImageLoading || isUploading) && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 rounded-xl">
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          {isUploading && uploadProgress && (
                            <span className="text-xs text-purple-600 mt-1 text-center">{uploadProgress}</span>
                          )}
                        </div>
                      </div>
                    )}
                    <img
                      src={previewUrl}
                      alt={photo.name}
                      onLoad={() => {
                        console.log('Image loaded successfully');
                        setIsImageLoading(false);
                      }}
                      onError={(e) => {
                        console.error('Image load error:', e);
                        setIsImageLoading(false);
                        // Try to recreate blob URL if it failed
                        if (photo && previewUrl?.startsWith('blob:')) {
                          console.log('Recreating blob URL for image preview');
                          const newObjectUrl = URL.createObjectURL(photo);
                          setPreviewUrl(newObjectUrl);
                        }
                      }}
                      className={`w-full h-full object-cover rounded-xl shadow-md transition-opacity duration-300 ${isImageLoading || isUploading ? 'opacity-30' : 'opacity-100'}`}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveClick}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110 disabled:bg-gray-400 z-30"
                      aria-label="Remove image"
                      disabled={isImageLoading || isUploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* Upload success indicator */}
                    {uploadedImageUrl && !isUploading && (
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1 z-20">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Use for Story Button */}
                {uploadedImageUrl && !selectedForStory && (
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setSelectedForStory('original');
                        if (onPhotoChosenForStory && previewUrl) {
                          onPhotoChosenForStory(previewUrl, false);
                          // Save the original photo URL to form data
                          savePhotoUrlToFormData(previewUrl);
                          
                          // Save photo data to sessionStorage
                          savePhotoDataToSessionStorage({
                            selectedForStory: 'original'
                          });
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2 px-6 text-sm font-medium"
                    >
                      📖 Use for Story
                    </Button>
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedForStory === 'original' && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Selected for Story
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cartoonization Section */}
          <div className="flex flex-col items-center space-y-3">
            {/* Cartoonization Button */}
            <Button
              type="button"
              onClick={handleCartoonizeClick}
              variant="outline"
              disabled={isUploading || !uploadedImageUrl}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 hover:from-purple-100 hover:to-pink-100 disabled:opacity-50 rounded-xl py-2 px-6"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              {isUploading ? 'Uploading...' : cartoonImageUrl ? 'Change Cartoon Style' : '🎨 Cartoonize Photo'}
            </Button>

            {/* Cartoonization Info */}
            {!cartoonImageUrl && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 max-w-md">
                <p className="text-sm text-purple-700 text-center">
                  {!uploadedImageUrl ? (
                    <>📤 <strong>Photo uploading...</strong> Please wait for upload to complete before cartoonizing.</>
                  ) : (
                    <>✨ <strong>Ready to cartoonize!</strong> Transform your photo into amazing cartoon styles that work perfectly in illustrated stories.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

  return (
      <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={onPhotoUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <Label htmlFor="photo" className="cursor-pointer">
          <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <span className="text-purple-600 hover:text-purple-800 font-medium">
            Click to upload a photo
          </span>
          <p className="text-sm text-gray-500 mt-1">Maximum file size: 2MB</p>
        </Label>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Add custom CSS for animated dashed borders */}
      <style>{dashAnimation}</style>
      
      <Label className="text-lg font-semibold text-gray-700">
        Character Photo (Optional)
      </Label>
      {renderContent()}
      
      {/* Cartoonization Modal */}
      {photo && previewUrl && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <CartoonizationModal
            isOpen={isCartoonModalOpen}
            onClose={() => setIsCartoonModalOpen(false)}
            originalImageFile={photo}
            originalImageUrl={previewUrl}
            uploadedImageUrl={uploadedImageUrl}
            onSelectCartoon={handleCartoonSelect}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default PhotoUploadField;
