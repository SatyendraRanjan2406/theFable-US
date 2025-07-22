import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronLeft, Pencil, RefreshCw, RotateCcw, Save, X, BookOpen, Sparkles } from 'lucide-react';
import { HF_API_KEY } from './ApiConfiguration';

import { saveStoryPanels, extractPanelsFromStory, StoryPanel, saveStoryToDatabase, savePanelsInBulk, generatePanelImage } from '@/utils/storyApi';
import { savePublicStory, generatePublicPanelImage } from '@/utils/publicStoryApi';
import { trackGeneratePhotoButtonClicked, trackStoryCreationStarted, trackStoryCustomized, trackStoryRegenerated } from '@/utils/gtm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LoginModal from './LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { fileToBase64 } from '@/utils/imageUtils';

interface StoryOutlineEditorProps {
  generatedOutline: string;
  characterName: string;
  characterAge?: string;
  characterGender?: string;
  genre: string;
  onConfirmOutline: (finalOutline: string, hfApiKey: string) => void;
  onRegenerateOutline: () => void;
  isRegenerating: boolean;
  generatedStory?: string | null;
  characterPhoto?: string | null;
  characterPhotoFile?: File | null;
  selectedPhotoForStory?: string | null;
  isCartoonSelectedForStory?: boolean;
  onIllustrationsReady?: (story: string, images: string[], panelData?: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>) => void;
  onStartImageGeneration?: () => void;
  onImageGenerationError?: () => void;
  onBackToForm?: () => void;
  onImageProgress?: (generatedCount: number) => void;
  onImageGenerated?: (index: number, url: string) => void;
  title?: string; // NEW: story title
  onBackToCurated?: () => void; // NEW: for curated stories navigation
}

const StoryOutlineEditor: React.FC<StoryOutlineEditorProps> = ({
  generatedOutline,
  characterName,
  characterAge,
  characterGender,
  genre,
  onConfirmOutline,
  onRegenerateOutline,
  isRegenerating,
  generatedStory: initialStory,
  characterPhoto,
  characterPhotoFile,
  selectedPhotoForStory,
  isCartoonSelectedForStory,
  onIllustrationsReady,
  onStartImageGeneration,
  onImageGenerationError,
  onBackToForm,
  onImageProgress,
  onImageGenerated,
  title,
  onBackToCurated
}) => {
  const [savedStory, setSavedStory] = useState<string | null>(initialStory || null);
  const [editableStory, setEditableStory] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaveWorkModalOpen, setIsSaveWorkModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Use the original authentication hook
  const { isAuthenticated, storyId, setStoryId } = useAuth();

  // Update the story when initialStory changes
  useEffect(() => {
    if (initialStory && initialStory !== savedStory) {
      setSavedStory(initialStory);
      setEditableStory(initialStory);
    }
  }, [initialStory, savedStory]);

  // Listen for login success from localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'login_success' && event.newValue) {
        setIsLoginModalOpen(false);
        setIsSaveWorkModalOpen(false);
        toast.success('🎉 Welcome back! Your work is now saved.');
        // Proceed with image generation after successful login using new flow
        proceedWithImageGenerationUsingPanelIds();
        // Clean up the storage item
        localStorage.removeItem('login_success');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleEdit = () =>{
    trackStoryCustomized('edit_story_button');
    setIsEditing(true);
  } 
  const handleCancel = () => {
    setEditableStory(savedStory || '');
    setIsEditing(false);
  };
  const handleSave = () => {
    setSavedStory(editableStory);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    onConfirmOutline(savedStory || '', HF_API_KEY);
  };

  const handleRegenerate = () => {
    trackStoryRegenerated('try_different_story_button');
    onRegenerateOutline();
  };

  const handleAddIllustrations = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setIsSaveWorkModalOpen(true);
      return;
    }

    // Proceed with image generation using the new panel ID flow
    await proceedWithImageGenerationUsingPanelIds();
  };



  const proceedWithImageGenerationUsingPanelIds = async () => {
    if (!savedStory) {
      toast.error('Please save your story first!');
      return;
    }

    setHasGenerationError(false);
    setErrorMessage('');
    
    // Debug logging for photo selection
    console.log('🔍 [STORY OUTLINE EDITOR] Photo selection debug:', {
      selectedPhotoForStory,
      isCartoonSelectedForStory,
      characterPhoto,
      characterPhotoFile: !!characterPhotoFile,
      isAuthenticated
    });
    
    if (!characterPhotoFile) {
      alert('Character photo is required for illustrations');
      return;
    }

    const storyToProcess = savedStory;
    if (!storyToProcess) {
      alert('Please wait for the story to be generated first');
      return;
    }

    trackGeneratePhotoButtonClicked('generate_photos_button');

    // Step 1: Save story to database to get story ID and panel IDs
    let currentStoryId = storyId;
    let panelIds: string[] = [];
    let saveResult: any = null;
    
    if (isAuthenticated) {
      try {
        const storyTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure!`;
        
        // Prepare additional fields for the API
        const characterAgeNumber = characterAge ? parseInt(characterAge) : undefined;
        const photoUrl = selectedPhotoForStory || characterPhoto;
        const storyOutline = generatedOutline || '';
        const storyMessage = `A personalized ${genre} story for ${characterName}`;
        
        saveResult = await saveStoryToDatabase(
          storyTitle, 
          storyToProcess,
          characterName, // character
          characterAgeNumber, // age
          characterName, // name (same as character)
          characterGender, // gender
          photoUrl, // photo_url
          genre, // story_genre
          storyOutline, // outline
          storyMessage // message
        );
        console.log('📝 Story save result:', saveResult);
        console.log('🔍 Checking for panels in response:', {
          hasPanels: !!saveResult.panels,
          panelsType: typeof saveResult.panels,
          isArray: Array.isArray(saveResult.panels),
          panelsLength: saveResult.panels?.length || 0,
          samplePanel: saveResult.panels?.[0]
        });

        if (saveResult.success && saveResult.story_id) {
          currentStoryId = saveResult.story_id;
          setStoryId(currentStoryId);
          console.log('✅ Story saved with ID:', currentStoryId);
          
          // Extract panel IDs from the first 4 panels in the response
          if (saveResult.panels && Array.isArray(saveResult.panels)) {
            panelIds = saveResult.panels
              .filter(panel => panel.panel_number <=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT)
              .sort((a, b) => a.panel_number - b.panel_number)
              .map(panel => panel.id);
            
            console.log('🎯 Panel IDs for first 4 panels:', panelIds);
            console.log('📋 First 4 panels details:', saveResult.panels
              .filter(panel => panel.panel_number <=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT)
              .sort((a, b) => a.panel_number - b.panel_number)
              .map(panel => ({
                id: panel.id,
                panel_number: panel.panel_number,
                panel_text: panel.panel_text?.substring(0, 50) + '...'
              }))
            );
          } else {
            console.error('❌ No panels found in story save response. Full response:', saveResult);
            throw new Error('No panels found in story save response');
          }
        } else {
          throw new Error('Failed to save story to database');
        }
      } catch (saveError) {
        console.error('❌ Error saving story to database:', saveError);
        toast.error('Failed to save story. Please try again.');
        return;
      }
    } else {
      // Unauthenticated flow: Save story using public API and generate images
      console.log('🚀 Starting unauthenticated flow...');
      
      try {
        const storyTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure!`;
        
        // Prepare story data for public API
        const characterAgeNumber = characterAge ? parseInt(characterAge) : undefined;
        const photoUrl = selectedPhotoForStory || characterPhoto || '';
        const storyOutline = generatedOutline || '';
        const storyMessage = `A personalized ${genre} story for ${characterName}`;
        
        console.log('🔍 [UNAUTHENTICATED FLOW] Photo URL selection:', {
          selectedPhotoForStory,
          characterPhoto,
          finalPhotoUrl: photoUrl,
          isCartoonSelectedForStory
        });
        
        const publicStoryData = {
          title: storyTitle,
          content: storyToProcess,
          character: characterName,
          age: characterAgeNumber || 8, // Default age if not provided
          name: characterName,
          gender: characterGender || 'male', // Default gender if not provided
          photo_url: photoUrl,
          story_genre: genre,
          outline: storyOutline,
          message: storyMessage
        };
        
        console.log('💾 Saving story via public API:', publicStoryData);
        
        // Save story using public API
        saveResult = await savePublicStory(publicStoryData);
        console.log('🔍 [UNAUTHENTICATED FLOW] Public save result:', saveResult);
        
        if (saveResult.id || saveResult.story_id) {
          currentStoryId = saveResult.id || saveResult.story_id;
          setStoryId(currentStoryId);
          console.log('✅ Story saved with ID:', currentStoryId);
          
          // Extract panel IDs from the first 4 panels in the response
          if (saveResult.panels && Array.isArray(saveResult.panels) && saveResult.panels.length > 0) {
            panelIds = saveResult.panels
              .filter(panel => panel.panel_number <=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT)
              .sort((a, b) => a.panel_number - b.panel_number)
              .map(panel => panel.id);
            
            console.log('🎯 unauthenticated flow: Panel IDs for first 4 panels:', panelIds);
            console.log('📋 First free panels details:', saveResult.panels
              .filter(panel => panel.panel_number <=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT)
              .sort((a, b) => a.panel_number - b.panel_number)
              .map(panel => ({
                id: panel.id,
                panel_number: panel.panel_number,
                panel_text: panel.panel_text?.substring(0, 50) + '...'
              }))
            );
          } else {
            console.log('⚠️ No panels found in public story response. This is expected for public stories.');
            console.log('📝 Public story saved successfully, but no panels were created automatically.');
            console.log('🔍 Public save result:', saveResult);
            
            // For public stories, we need to create panels manually or use a different approach
            // For now, we'll proceed without panel IDs and use a fallback approach
            // panelIds = [];
          }
        } else {
          throw new Error('Failed to save story to database');
        }
        
        console.log('✅ Story saved via public API successfully:', saveResult);
        // Step 2: Generate images for first 4 panels using panel IDs
        console.log('🎨 Generating images for first 4 panels using panel IDs...');
        console.log('📊 Panel IDs available:', panelIds.length);
        console.log('📊 Panel IDs:', panelIds);
      } catch (error) {
        console.error('❌ Error saving story to database unauthenticated:', error);
        toast.error('Failed to save story. Please try again.');
      }
    }
    console.log('🔍 starting image generation process:', panelIds);
    // Confirm outline and start image generation process
    onConfirmOutline(savedStory || '', HF_API_KEY);
    if (typeof onStartImageGeneration === 'function') {
      onStartImageGeneration();
    }

    // Create a progress tracker
    let generatedImageCount = 0;
    const progressWrapper = (index: number) => {
      generatedImageCount++;
      console.log(`🎨 Generated image ${generatedImageCount}/4 for panel ${index + 1}`);
      if (onImageProgress) {
        onImageProgress(generatedImageCount);
      }
    };
    
    try {
      const imageResults: (string | null)[] = [];
      
      // Check if we have panel IDs (authenticated flow) or need to use fallback (unauthenticated flow)
      if (panelIds.length > 0 && saveResult && saveResult.panels) {
        // Generate images for first 4 panels using their panel IDs IN PARALLEL
        const panelIdObjs = panelIds.map((panelId, i) => ({
          panelId,
          panelIndex: i,
          panelText: saveResult.panels?.find(p => p.id === panelId)?.panel_text
        }));

        // Get character image base64 for subject reference
        const characterImageBase64 = characterPhotoFile ? await fileToBase64(characterPhotoFile) : undefined;
        const characterImageType = characterPhotoFile?.type;
        
        const imagePromises = panelIdObjs.map(({ panelId, panelIndex, panelText }) =>
          generatePanelImage(panelId, "16:9", 1, panelText, panelIndex, characterImageBase64, characterImageType)
            .then(result => {
              progressWrapper(panelIndex); // Update progress on success
              return { type: 'success' as const, result, panelIndex };
            })
            .catch(error => {
              progressWrapper(panelIndex); // Update progress on error
              return { type: 'error' as const, error, panelIndex };
            })
        );

        const results = await Promise.all(imagePromises);

        results.forEach((res) => {
          console.log('🔍 Image generation result:', res);
          if (res.type === 'success' && res.result && res.result.success && res.result.image_url) {
            console.log('🔍 Image generation result:', res);
            imageResults[res.panelIndex] = res.result.image_url;
            if (onImageGenerated) onImageGenerated(res.panelIndex, res.result.image_url);
          } else {
            const errorMsg = res.type === 'error' ? res.error : res.result?.error;
            console.error(`❌ Failed to generate image for panel ${res.panelIndex + 1}:`, errorMsg);
            imageResults[res.panelIndex] = null;
            if (onImageGenerated) onImageGenerated(res.panelIndex, null);
          }
        });

        // Step 3: Create final array with images and locked placeholders
        const totalPanels = saveResult.panels?.length || 21; // Default to 21 if not available
        const lockedPanelsCount = totalPanels - 4;
        const allImages = [...imageResults, ...Array(lockedPanelsCount).fill(null)];

        console.log('✅ Image generation completed:', {
          totalPanels,
          generatedImages: imageResults.filter(img => img !== null).length,
          lockedPanels: lockedPanelsCount
        });

        // Step 4: Call onIllustrationsReady with the results
        if (typeof onIllustrationsReady === 'function') {
          // Get panel data from the story save response
          const savedPanelData = saveResult.panels || [];
          onIllustrationsReady(savedStory || '', allImages, savedPanelData);
        }
      } else {
        // Fallback for unauthenticated flow when no panels are created
        console.log('⚠️ No panel IDs available or no saveResult.panels. Using fallback approach for unauthenticated flow.');
        console.log('🔍 saveResult:', saveResult);
        console.log('🔍 panelIds:', panelIds);
        
        // For now, we'll create placeholder images or use a different approach
        const allImages = Array(21).fill(null); // Create 21 placeholder images
        
        console.log('✅ Fallback image generation completed with placeholders');
        
        // Step 4: Call onIllustrationsReady with the results
        if (typeof onIllustrationsReady === 'function') {
          onIllustrationsReady(savedStory || '', allImages, []);
        }
      }

    } catch (error) {
      console.error('❌ Error during image generation:', error);
      setHasGenerationError(true);
      setErrorMessage(error.message || 'Failed to generate images');
      
      if (typeof onImageGenerationError === 'function') {
        onImageGenerationError();
      }
    }
  };

  const handleLoginSuccess = async () => {
    setIsLoginModalOpen(false);
    setIsSaveWorkModalOpen(false);
    toast.success('🎉 Welcome back! Your work is now saved.');
    
    // Save story to database after successful login
    if (savedStory) {
      try {
        const storyTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure!`;
        
        // Prepare additional fields for the API
        const characterAgeNumber = characterAge ? parseInt(characterAge) : undefined;
        const photoUrl = selectedPhotoForStory || characterPhoto;
        const storyOutline = generatedOutline || '';
        const storyMessage = `A personalized ${genre} story for ${characterName}`;
        
        const saveResult = await saveStoryToDatabase(
          storyTitle, 
          savedStory,
          characterName, // character
          characterAgeNumber, // age
          characterName, // name (same as character)
          characterGender, // gender
          photoUrl, // photo_url
          genre, // story_genre
          storyOutline, // outline
          storyMessage // message
        );
        
        if (saveResult.success) {
          const newStoryId = saveResult.story_id || null;
          setStoryId(newStoryId);
          toast.success('✅ Story saved to your account!');
          
          // Proceed with image generation using the new panel ID flow
          await proceedWithImageGenerationUsingPanelIds();
        } else {
          console.error('Failed to save story after login:', saveResult.message);
          // Proceed without story ID if save failed
          proceedWithImageGenerationUsingPanelIds();
        }
      } catch (saveError) {
        console.error('Error saving story after login:', saveError);
        // Proceed without story ID if save failed
        proceedWithImageGenerationUsingPanelIds();
      }
    } else {
      // Proceed with image generation after successful login
      proceedWithImageGenerationUsingPanelIds();
    }
  };

  const handleTryProductFirst = () => {
    setIsSaveWorkModalOpen(false);
    toast.info('🚀 Starting image generation without saving...');
    // Use the new flow that saves story first, then generates images using panel IDs
    proceedWithImageGenerationUsingPanelIds();
  };

  // Helper to format story: paragraphs and dialogue
  function formatStory(text: string) {
    if (!text) return null;
    // Split by double newlines for paragraphs
    return text.split(/\n\n+/).map((para, idx) => {
      // Highlight dialogue lines
      if (/^\s*\".*\"/.test(para.trim())) {
        return (
          <p key={idx} className="my-2 text-blue-900 italic pl-4 border-l-4 border-blue-200 bg-blue-50 rounded">
            {para}
          </p>
        );
      }
      return <p key={idx} className="my-2">{para}</p>;
    });
  }

  //console.log('=== STORY OUTLINE EDITOR DEBUG ===');
  //console.log('initialStory received:', initialStory ? `${initialStory.length} characters` : 'null');
  //console.log('savedStory current:', savedStory ? `${savedStory.length} characters` : 'null');
  //console.log('isEditing:', isEditing);

  return (
    <>
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white">
          <CardTitle className="text-2xl flex items-center gap-3 justify-center">
            <BookOpen className="w-7 h-7" />
            <div className="text-center">
              <div className="text-2xl font-bold">Your Story is Ready! 🎉</div>
              <div className="text-sm opacity-90 mt-1">Let's add some magical illustrations!</div>
            </div>
            <Sparkles className="w-7 h-7" />
          </CardTitle>
        </CardHeader>
        {/* Back button */}
        {onBackToForm && (
          <Button
            onClick={onBackToForm}
            variant="outline"
            className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-3"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Form
          </Button>
        )}
        
        {/* Generated Title Display */}
        {title && (
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-xl p-6 mx-6 mt-4">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              ✨ {title} ✨
            </h2>
            <p className="text-sm text-center text-gray-600">
              Your AI-generated story title
            </p>
          </div>
        )}
        
        <CardContent className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="font-bold text-green-800 mb-2 text-center">
              🌟 {title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure!`} 🌟
            </h3>
            <p className="text-sm text-green-700 text-center">
              Your amazing story is complete! Now let's bring it to life with beautiful illustrations. 
              {characterPhoto && " Your photo will be transformed into story art! 🎨"}
            </p>
          </div>

          {/* Editable personalized story */}
          {savedStory && (
            <div className="space-y-4">
              <Label className="text-lg font-bold text-gray-700 flex items-center gap-2">
                📖 Your Personalized Story
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Ready to Edit & Illustrate!</span>
                {!isEditing && (
                  <button
                    type="button"
                    className="ml-2 p-1 rounded hover:bg-purple-100"
                    onClick={handleEdit}
                    aria-label="Edit story"
                  >
                    <Pencil className="w-4 h-4 text-purple-600" />
                  </button>
                )}
              </Label>
              
              {/* Quick edit button when not editing */}
              {!isEditing && (
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-2 px-4"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    ✏️ Edit Your Story
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    variant="outline"
                    className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-2 px-4"
                  >
                    {isRegenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ✨ Creating New Story...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        🔄 Try Different Story
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddIllustrations}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl py-2 px-4"
                  >
                    {hasGenerationError ? (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        🔄 Retry Illustrations
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        🎉 Generate photos
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {isEditing ? (
                <>
                  <textarea
                    className="w-full min-h-[300px] p-4 border-2 border-purple-200 rounded-lg bg-purple-50 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                    value={editableStory}
                    onChange={e => setEditableStory(e.target.value)}
                    spellCheck={true}
                    placeholder="Your AI-generated story will appear here. You can edit it to make it perfect!"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="prose prose-purple max-w-none bg-white/70 rounded-lg p-4 border border-purple-100">
                  {formatStory(savedStory || '')}
                </div>
              )}
            </div>
          )}

          {/* Show message if no story is available */}
          {!savedStory && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-center text-yellow-700 font-medium">
                ⏳ Generating your personalized story... Please wait a moment!
              </p>
            </div>
          )}

          {/* Show error message if image generation failed */}
          {hasGenerationError && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  🚨 Image Generation Failed
                </h3>
                <p className="text-red-600 mb-3 text-sm">
                  {errorMessage}
                </p>
                <p className="text-xs text-gray-600">
                  Click "Add Illustrations" again to retry, or check your internet connection.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              variant="outline"
              className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-3"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ✨ Creating New Story...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  🔄 Try Different Story
                </>
              )}
            </Button>
            <Button
              onClick={handleAddIllustrations}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl py-3"
            >
              {hasGenerationError ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  🔄 Retry Illustrations
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  🎉 Generate photos
                </>
              )}
            </Button>
          </div>
          
          {/* Choose from Curated Stories Button */}
          {onBackToCurated && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={onBackToCurated}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Choose from Curated Stories
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Your Work Modal */}
      <Dialog open={isSaveWorkModalOpen} onOpenChange={setIsSaveWorkModalOpen}>
        <DialogContent className="sm:max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              💾 Save Your Work
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 pt-2">
              Create an account to save your story and access it later from any device.
              <br />
              <span className="text-sm text-gray-500">Your progress will be safely stored! 🎉</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">✨ What you'll get:</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• 📱 Access your stories from any device</li>
                <li>• 🔄 Continue where you left off</li>
                <li>• 📚 Library of all your created stories</li>
                <li>• 🎨 Save your favorite cartoon styles</li>
                <li>• ⚡ Faster generation with saved preferences</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setIsSaveWorkModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🔐 Login & Save Work
              </Button>
              
              <Button
                onClick={handleTryProductFirst}
                variant="outline"
                className="w-full h-12 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold"
              >
                🚀 Try Product First!
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You can always create an account later to save your work.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default StoryOutlineEditor;
