import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { regenerateCuratedPanel } from '@/utils/curatedStoryApi';
import ComicBook from '@/components/ComicBook';
import StoryActions from '@/components/StoryActions';
import PricingModal from '@/components/PricingModal';
import { trackCheckoutStarted, trackPurchaseCompleted, trackStoryRegenerated, trackStoryCustomized, trackDownloadPDFButtonClicked } from '@/utils/gtm';
import { generateCuratedStoryPDF } from '@/utils/pdfGenerator';

interface CuratedPanel {
  id: string;
  panel_number: number;
  panel_text: string;
  image_prompt: string;
  minimax_image_url: string | null;
  aws_s3_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Additional fields from curated story API
  panel_id?: string;
  facemint_task_id?: string;
  file_url?: string;
}

interface CuratedStoryResult {
  story_id?: string;
  story_content?: string;
  panels?: CuratedPanel[];
  title?: string;
  genre?: string;
  [key: string]: any;
}

interface FinalCuratedPreviewProps {
  curatedStoryResult: CuratedStoryResult;
  characterName: string;
  characterPhoto: string | null;
  showBackButton: boolean;
  onBackToForm: () => void;
  onBackToCuratedForm: () => void;
  onUnlockRequest?: () => void;
  isPaid?: boolean;
  onPaymentSuccess?: () => void;
  onPaymentCancellation?: () => void;
}

const FinalCuratedPreview: React.FC<FinalCuratedPreviewProps> = ({
  curatedStoryResult,
  characterName,
  characterPhoto,
  showBackButton,
  onBackToForm,
  onBackToCuratedForm,
  onUnlockRequest,
  isPaid = false,
  onPaymentSuccess,
  onPaymentCancellation
}) => {
  const [regeneratingPanels, setRegeneratingPanels] = useState<{ [key: number]: boolean }>({});
  const [errorImages, setErrorImages] = useState<{ [key: number]: boolean }>({});
  const [retryLoadingPanels, setRetryLoadingPanels] = useState<{ [key: number]: boolean }>({});
  const [panels, setPanels] = useState<CuratedPanel[]>(curatedStoryResult.panels || []);
  const [images, setImages] = useState<(string | null)[]>([]);
  const [lockedPanels, setLockedPanels] = useState<boolean[]>([]);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isGeneratingPremiumContent, setIsGeneratingPremiumContent] = useState(false);
  const [isCreatingMagic, setIsCreatingMagic] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [localIsPaid, setLocalIsPaid] = useState(isPaid);

  // Determine if we're in edit mode or create mode
  const isEditMode = curatedStoryResult && (
    curatedStoryResult.character_name || 
    curatedStoryResult.photo_url || 
    curatedStoryResult.story_id
  );
  
  // Track story customization when in edit mode
  useEffect(() => {
    if (isEditMode) {
      trackStoryCustomized('curated_story_edit_mode');
    }
  }, [isEditMode]);
  
  // Get character information based on mode
  const displayCharacterName = isEditMode 
    ? (curatedStoryResult?.character_name || characterName)
    : characterName;
    
  const displayCharacterPhoto = isEditMode 
    ? (curatedStoryResult?.photo_url || characterPhoto)
    : characterPhoto;
  
  console.log('🎭 FinalCuratedPreview Mode Detection:', {
    isEditMode,
    curatedStoryResult_has_character_name: !!curatedStoryResult?.character_name,
    curatedStoryResult_has_photo_url: !!curatedStoryResult?.photo_url,
    curatedStoryResult_has_story_id: !!curatedStoryResult?.story_id,
    displayCharacterName,
    displayCharacterPhoto,
    props_characterName: characterName,
    props_characterPhoto: characterPhoto
  });
  
  // Early return if curatedStoryResult is not available
  if (!curatedStoryResult || typeof curatedStoryResult !== 'object') {
    console.log('❌ FinalCuratedPreview: curatedStoryResult is undefined or invalid, showing loading state');
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-purple-700 mb-2">Loading Your Curated Story</h3>
          <p className="text-gray-600">Preparing your story for editing...</p>
        </div>
      </div>
    );
  }

  const genreEmojis = {
    adventure: '🗺️',
    fairytale: '🏰',
    romance: '💕',
    humour: '😄',
    mystery: '🔍'
  };

  const genreColors = {
    adventure: 'from-green-400 via-emerald-400 to-teal-500',
    fairytale: 'from-purple-400 via-pink-400 to-rose-500',
    romance: 'from-pink-400 via-rose-400 to-red-400',
    humour: 'from-yellow-400 via-orange-400 to-red-400',
    mystery: 'from-indigo-400 via-purple-400 to-blue-500'
  };

  // Initialize images and locked panels from curated story result
  useEffect(() => {
    if (!curatedStoryResult || typeof curatedStoryResult !== 'object') {
      console.log('❌ curatedStoryResult is undefined or invalid');
      return;
    }
    
    if (curatedStoryResult?.panels) {
      console.log('🔍 Original curatedStoryResult:', curatedStoryResult);
      console.log('🔍 Original panels data:', curatedStoryResult.panels);
      
      // Debug original panel data before mapping
      console.log('🔍 Original Panel Data Before Mapping:');
      curatedStoryResult.panels.forEach((panel, index) => {
        console.log(`Original Panel ${index + 1}:`, {
          panel_id: panel.panel_id,
          panel_number: panel.panel_number,
          aws_s3_image_url: panel.aws_s3_image_url,
          file_url: panel.file_url,
          hasFileUrl: !!panel.file_url,
          hasAwsUrl: !!panel.aws_s3_image_url
        });
      });
      
      // Extract all panel texts from story content to ensure we have all 8 panels
      const extractedPanelTexts = extractPanelsFromStory(curatedStoryResult?.story_content || '');
      console.log('🔍 Extracted panel texts from story:', extractedPanelTexts);
      
      // Create a complete panel array with all 8 panels (index 0-7)
      const completePanels = [];
      for (let i = 0; i < 8; i++) {
        const existingPanel = curatedStoryResult.panels.find(p => p.panel_number === i);
        const extractedText = extractedPanelTexts[i] || '';
        
        if (existingPanel) {
          // Use existing panel data
          completePanels.push({
            id: existingPanel.panel_id || `panel-${existingPanel.panel_number}`,
            panel_number: existingPanel.panel_number,
            panel_text: existingPanel.panel_text || extractedText,
            image_prompt: existingPanel.panel_text || extractedText,
            minimax_image_url: existingPanel.file_url || null,
            aws_s3_image_url: existingPanel.aws_s3_image_url || null,
            status: existingPanel.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            panel_id: existingPanel.panel_id,
            facemint_task_id: existingPanel.facemint_task_id,
            file_url: existingPanel.file_url
          });
        } else {
          // Create placeholder panel with extracted text
          completePanels.push({
            id: `panel-${i}`,
            panel_number: i,
            panel_text: extractedText,
            image_prompt: extractedText,
            minimax_image_url: null,
            aws_s3_image_url: null,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            panel_id: null,
            facemint_task_id: null,
            file_url: null
          });
        }
      }
      
      console.log('🔍 Complete panels array (all 8):', completePanels);
      
      // Map the complete panels to the expected format
      const mappedPanels = completePanels;
      
      setPanels(mappedPanels);
      
      const panelImages = mappedPanels.map(panel => {
        // Use aws_s3_image_url if available, otherwise use file_url
        // Note: minimax_image_url is set to file_url in the mapping, so we check file_url directly
        const imageUrl = panel.aws_s3_image_url || panel.file_url;
        
        // Debug each panel's image extraction
        console.log(`🔍 Panel ${panel.panel_number} image extraction:`, {
          panel_id: panel.panel_id,
          aws_s3_image_url: panel.aws_s3_image_url,
          minimax_image_url: panel.minimax_image_url,
          file_url: panel.file_url,
          final_image_url: imageUrl,
          hasAwsUrl: !!panel.aws_s3_image_url,
          hasFileUrl: !!panel.file_url
        });
        
        return imageUrl;
      });
      setImages(panelImages);
      
      // Debug logging for images
      console.log('🔍 FinalCuratedPreview Images Debug:', {
        mappedPanelsLength: mappedPanels.length,
        panelImages: panelImages,
        validImagesCount: panelImages.filter(img => img !== null && img !== undefined).length,
        panelsWithImages: mappedPanels.filter(panel => panel.aws_s3_image_url || panel.minimax_image_url || panel.file_url).length
      });
      
      // Debug each panel's complete data
      console.log('🔍 Complete Panel Data Debug:');
      mappedPanels.forEach((panel, index) => {
        console.log(`Panel ${index + 1}:`, {
          panel_id: panel.panel_id,
          id: panel.id,
          panel_number: panel.panel_number,
          aws_s3_image_url: panel.aws_s3_image_url,
          minimax_image_url: panel.minimax_image_url,
          file_url: panel.file_url,
          status: panel.status,
          hasAnyImage: !!(panel.aws_s3_image_url || panel.minimax_image_url || panel.file_url)
        });
      });
      
      // Determine locked panels based on payment status and image availability
      // First 4 panels are free, rest are locked (same as FinalPreview)
      const previewCount = Number(import.meta.env.VITE_PREVIEW_IMAGE_COUNT) || 4;
      const locked = mappedPanels.map((panel, index) => 
        !localIsPaid && index >= previewCount && !(panel.aws_s3_image_url || panel.minimax_image_url || panel.file_url)
      );
      setLockedPanels(locked);
      
      // Set initial loading states for panels without images
      const panelsWithoutImages = mappedPanels.filter((panel, index) => 
        !(panel.aws_s3_image_url || panel.minimax_image_url || panel.file_url) && !locked[index]
      );
      
      if (panelsWithoutImages.length > 0 && localIsPaid) {
        // If payment is done but some panels don't have images, show creating magic
        setIsCreatingMagic(true);
        setIsGeneratingImages(true);
      }
    }
  }, [curatedStoryResult, localIsPaid]);

  // Update local isPaid when prop changes
  useEffect(() => {
    setLocalIsPaid(isPaid);
  }, [isPaid]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('🔍 FinalCuratedPreview state update:', {
      localIsPaid,
      isPricingModalOpen,
      isCreatingMagic,
      isGeneratingImages,
      panelsLength: panels.length,
      lockedPanelsLength: lockedPanels.length
    });
  }, [localIsPaid, isPricingModalOpen, isCreatingMagic, isGeneratingImages, panels.length, lockedPanels.length]);

  // Mock function for getSceneImage (not used in curated stories)
  const getSceneImage = async (text: string, genre: string, index: number): Promise<string> => {
    return panels[index]?.aws_s3_image_url || panels[index]?.minimax_image_url || panels[index]?.file_url || '';
  };

  // Mock function for cleanPanelTextForDisplay
  const cleanPanelTextForDisplay = (text: string): string => {
    return text.replace(/^Panel \d+:\s*/, '').trim();
  };

  // Extract panel text from story content
  const extractPanelsFromStory = (storyContent: string): string[] => {
    if (!storyContent) return [];
    
    // Split by panel markers and extract text
    const panelMatches = storyContent.match(/Panel \d+:[^]*?(?=Panel \d+:|$)/g);
    if (panelMatches && panelMatches.length > 0) {
      return panelMatches.map(panel => cleanPanelTextForDisplay(panel));
    }
    
    // Fallback: split by double newlines
    const sections = storyContent.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    return sections.slice(0, 8); // Limit to 8 panels
  };

  // Function to generate story content from panels for download and sharing
  const generateStoryContentFromPanels = (): string => {
    if (!panels || panels.length === 0) {
      return curatedStoryResult?.story_content || '';
    }

    // Create story content from panel texts
    const panelTexts = panels.map(panel => panel.panel_text || '').filter(text => text.trim());
    return panelTexts.join('\n\n');
  };

  // New PDF download function for FinalCuratedPreview
  const handleDownloadPDF = async (viewMode: 'grid' | 'split') => {
    // Check payment status
    // if (!localIsPaid) {
    //   onUnlockRequest?.();
    //   return;
    // }

    if (!panels || panels.length === 0) {
      toast.error('No panel data available for PDF generation');
      return;
    }
    
    try {
      // Track PDF download for curated stories
      trackDownloadPDFButtonClicked('curated_story_pdf_download');
      
      toast.info('Preparing PDF for curated story...');
      
      // Extract data directly from panels array - this is the source of truth
      const panelTexts = panels.map(panel => panel.panel_text || '');
      const imageUrls = panels.map(panel => panel.aws_s3_image_url || panel.file_url);
      
      console.log('🔍 Curated Story PDF Generation:');
      console.log('  - Total panels:', panels.length);
      console.log('  - Panels with text:', panelTexts.filter(text => text.trim()).length);
      console.log('  - Panels with images:', imageUrls.filter(url => url).length);
      console.log('  - Panel texts:', panelTexts);
      console.log('  - Image URLs:', imageUrls);

      // Validate we have the expected number of panels
      if (panels.length !== 8) {
        console.warn(`Expected 8 panels, but got ${panels.length}`);
      }

      // Generate PDF with all panels (including those without images)
      const pdf = await generateCuratedStoryPDF(
        panels,            // Pass the entire panels array
        characterName,
        characterPhoto,
        curatedStoryResult?.genre || 'adventure',
        viewMode,
        curatedStoryResult?.title || `${characterName}'s Curated Story`
      );
      
      const filename = `${characterName}-${curatedStoryResult?.genre || 'curated'}-comic-${viewMode}.pdf`;
      pdf.save(filename);
      toast.success(`Curated Story PDF (${viewMode} view) downloaded successfully!`);
      
    } catch (error) {
      console.error('Error generating curated story PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Handle panel regeneration using the curated story API
  const handleRegeneratePanelImage = async (index: number, panelId?: string) => {
    const panel = panels[index];
    if (!panel) return;

    setRegeneratingPanels(prev => ({ ...prev, [index]: true }));
    setErrorImages(prev => ({ ...prev, [index]: false }));
    
    try {
      // Track story regeneration for curated stories
      trackStoryRegenerated('curated_story_panel_regeneration');
      
      const result = await regenerateCuratedPanel(panel.panel_id || panel.id);
      console.log('Panel regeneration result:', result);

      // Handle the API response structure based on the actual response
      if (result.panel) {
        // Extract aws_s3_image_url from the nested panel object
        const newImageUrl = result.panel.aws_s3_image_url || result.panel.file_url;
        const newPanelText = result.panel.panel_text;
        
        console.log('🔄 Panel regeneration - updating panel data:', {
          panel_id: panel.panel_id,
          old_panel_text: panel.panel_text?.substring(0, 50) + '...',
          new_panel_text: newPanelText?.substring(0, 50) + '...',
          aws_s3_image_url: result.panel.aws_s3_image_url,
          file_url: result.panel.file_url,
          newImageUrl: newImageUrl
        });
        
        // Update the panel with new data from API response
        const updatedPanel = {
          ...panel,
          panel_text: newPanelText || panel.panel_text, // Update panel text if provided
          aws_s3_image_url: result.panel.aws_s3_image_url, // This is the key field for PDF generation
          minimax_image_url: result.panel.file_url,
          file_url: result.panel.file_url, // Also update the file_url field
          status: result.panel.status,
          updated_at: new Date().toISOString()
        };
        
        console.log('🔄 Updated panel data:', updatedPanel);
        
        setPanels(prev => {
          const newPanels = prev.map((p, i) => 
            i === index ? updatedPanel : p
          );
          console.log('🔄 New panels array after update:', newPanels);
          console.log('🔄 Updated panel at index', index, ':', newPanels[index]);
          console.log('🔄 Panel aws_s3_image_url:', newPanels[index]?.aws_s3_image_url);
          return newPanels;
        });
        
        // Update images array to keep it in sync
        setImages(prev => {
          const newImages = prev.map((img, i) => 
            i === index ? newImageUrl : img
          );
          console.log('🔄 New images array after update:', newImages);
          return newImages;
        });
        
        toast.success(`Panel ${index + 1} regenerated successfully!`);
        
        // Clear any error state for this panel since regeneration was successful
        setErrorImages(prev => ({ ...prev, [index]: false }));
      } else {
        throw new Error('No panel data in response or regeneration failed');
      }
    } catch (error) {
      console.error('Error regenerating panel:', error);
      setErrorImages(prev => ({ ...prev, [index]: true }));
      
      // Provide specific error message for the backend issue
      if (error instanceof Error && error.message.includes('temporarily unavailable')) {
        toast.error(`Panel regeneration is temporarily unavailable. Please try again in a few minutes.`);
      } else {
        toast.error(`Failed to regenerate panel ${index + 1}. Please try again.`);
      }
    } finally {
      setRegeneratingPanels(prev => ({ ...prev, [index]: false }));
    }
  };

  // Handle retry image
  const handleRetryImage = (index: number) => {
    handleRegeneratePanelImage(index);
  };

  // Handle image generated (same as FinalPreview)
  // This function updates both panels state and images array to keep them in sync
  const handleImageGenerated = (index: number, url: string | null, panelText?: string) => {
    console.log(`🎨 handleImageGenerated called for panel ${index} with URL:`, url, 'and panel text:', panelText?.substring(0, 50) + '...');
    
    if (url) {
      // Update panel data with new S3 URL (this is the source of truth for PDF generation)
      setPanels(prev => {
        const newPanels = prev.map((p, i) => 
          i === index ? {
            ...p,
            panel_text: panelText || p.panel_text, // Update panel text if provided
            aws_s3_image_url: url, // This is the key field for PDF generation
            minimax_image_url: url,
            file_url: url, // Also update the file_url field
            status: 'completed',
            updated_at: new Date().toISOString()
          } : p
        );
        console.log(`🔄 Panel ${index} updated with aws_s3_image_url:`, url);
        console.log(`🔄 Updated panel data:`, newPanels[index]);
        return newPanels;
      });
      
      // Update images array (kept in sync with panels for backward compatibility)
      setImages(prev => {
        const newImages = prev.map((img, i) => 
          i === index ? url : img
        );
        console.log(`🔄 Images array updated for panel ${index}:`, newImages);
        return newImages;
      });
      
      // Update locked status
      setLockedPanels(prev => prev.map((locked, i) => 
        i === index ? false : locked
      ));
      
      // Clear error state
      setErrorImages(prev => ({ ...prev, [index]: false }));
      
      console.log(`✅ Panel ${index} image updated successfully`);
    } else {
      // Mark as failed
      setErrorImages(prev => ({ ...prev, [index]: true }));
      console.log(`❌ Panel ${index} image generation failed`);
    }
  };

  // Refresh curated story data to get latest panel information
  const refreshCuratedStoryData = async () => {
    if (!curatedStoryResult?.story_id) {
      console.log('❌ No story_id available for refresh');
      return;
    }
    
    try {
      console.log('🔄 Refreshing curated story data for story_id:', curatedStoryResult.story_id);
      
      // Fetch the latest story data
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/curated-stories/${curatedStoryResult.story_id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Refreshed curated story data:', data);
      
      // Update panels with latest data
      if (data.panels && Array.isArray(data.panels)) {
        // Extract all panel texts from story content to ensure we have all 8 panels
        const extractedPanelTexts = extractPanelsFromStory(data.story_content || curatedStoryResult?.story_content || '');
        console.log('🔄 Extracted panel texts from refreshed story:', extractedPanelTexts);
        
        // Create a complete panel array with all 8 panels (index 0-7)
        const completePanels = [];
        for (let i = 0; i < 8; i++) {
          const existingPanel = data.panels.find((p: any) => p.panel_number === i);
          const extractedText = extractedPanelTexts[i] || '';
          
          if (existingPanel) {
            // Use existing panel data from API
            completePanels.push({
              id: existingPanel.panel_id || `panel-${existingPanel.panel_number}`,
              panel_number: existingPanel.panel_number,
              panel_text: existingPanel.panel_text || extractedText,
              image_prompt: existingPanel.panel_text || extractedText,
              minimax_image_url: existingPanel.file_url || null,
              aws_s3_image_url: existingPanel.aws_s3_image_url || null,
              status: existingPanel.status,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              panel_id: existingPanel.panel_id,
              facemint_task_id: existingPanel.facemint_task_id,
              file_url: existingPanel.file_url
            });
          } else {
            // Create placeholder panel with extracted text
            completePanels.push({
              id: `panel-${i}`,
              panel_number: i,
              panel_text: extractedText,
              image_prompt: extractedText,
              minimax_image_url: null,
              aws_s3_image_url: null,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              panel_id: null,
              facemint_task_id: null,
              file_url: null
            });
          }
        }
        
        console.log('🔄 Complete refreshed panels array (all 8):', completePanels);
        
        setPanels(completePanels);
        
        // Update images array with latest URLs
        const updatedImages = completePanels.map((panel: any) => 
          panel.aws_s3_image_url || panel.file_url || null
        );
        setImages(updatedImages);
        
        console.log('🔄 Updated panels and images with refreshed data:', {
          panelsCount: completePanels.length,
          imagesCount: updatedImages.filter(img => img !== null).length,
          panelNumbers: completePanels.map(p => p.panel_number),
          panelsWithImages: completePanels.filter(p => p.aws_s3_image_url || p.file_url).length,
          panelsWithText: completePanels.filter(p => p.panel_text && p.panel_text.trim()).length
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing curated story data:', error);
    }
  };

  // Mock function for loading images (not used in curated stories)
  const loadingImages: {[key: string]: boolean} = {};

  // Payment success handler
  const handlePaymentSuccess = async () => {
    console.log('🚀 Curated Story Payment Success - Starting premium image generation...');
    
    // Prevent multiple calls
    if (localIsPaid) {
      console.log('⚠️ Payment already processed, skipping duplicate call');
      return;
    }
    
    setIsPricingModalOpen(false);
    
    // Track successful purchase for GTM
    trackPurchaseCompleted(
      `curated_txn_${Date.now()}`, // Generate a simple transaction ID
      'payment_success_on_curated_story_premium_illustrations',
      49
    );
    
    // Step 1: Set the premium content generation state
    console.log('🔧 Setting flags in handlePaymentSuccess:');
    console.log('  - Setting isGeneratingPremiumContent to true');
    console.log('  - Setting isCreatingMagic to true');
    console.log('  - Setting isGeneratingImages to true');
    console.log('  - Setting localIsPaid to true');
    
    setIsGeneratingPremiumContent(true);
    setIsCreatingMagic(true);
    setIsGeneratingImages(true);
    setLocalIsPaid(true);
    
    // Refresh curated story data to get latest panel information
    await refreshCuratedStoryData();
    
    // Step 2: Calculate total panels and unlock ALL panels immediately
    const totalPanels = panels.length;
    
    console.log('=== PAYMENT SUCCESS DEBUG ===');
    console.log('Total panels calculated:', totalPanels);
    console.log('Setting isCreatingMagic to true');
    
    // Create array with exact panel count, all unlocked
    const unlockedPanels = Array(totalPanels).fill(false);
    setLockedPanels(unlockedPanels);
    console.log('Unlocked panels array:', unlockedPanels);
    
    // Step 3: Ensure we have the right number of image slots
    setImages(prev => {
      const newImages = [...prev];
      while (newImages.length < totalPanels) {
        newImages.push(null);
      }
      console.log('Updated images length:', newImages.length);
      return newImages.slice(0, totalPanels);
    });

    // Step 4: Clear all error states and regenerating states for panels that will be generated
    const previewCount = Number(import.meta.env.VITE_PREVIEW_IMAGE_COUNT) || 4;
    setErrorImages(prev => {
      const newErrorImages = { ...prev };
      // Clear error states for panels that will be generated (panels 4+)
      for (let i = previewCount; i < totalPanels; i++) {
        newErrorImages[i] = false;
      }
      return newErrorImages;
    });
    
    // Clear regenerating states for panels that will be generated
    setRegeneratingPanels(prev => {
      const newRegen = { ...prev };
      // Clear regenerating states for panels that will be generated (panels 4+)
      for (let i = previewCount; i < totalPanels; i++) {
        delete newRegen[i];
      }
      return newRegen;
    });

    toast.success('Payment successful! Creating your premium illustrations...');
    
    // Call parent payment success handler
    onPaymentSuccess?.();
    
    // Step 5: Start generation after a small delay to ensure state is updated
    setTimeout(async () => {
      console.log('🚀 Starting generateLockedImages after payment success...');
      console.log('🔍 Current localIsPaid state:', localIsPaid);
      // Force localIsPaid to true for this generation cycle to avoid race condition
      await generateLockedImages(true);
    }, 100);
  };

  // Payment cancellation handler
  const handlePaymentCancellation = () => {
    console.log('❌ Curated Story Payment Cancellation - Resetting payment state...');
    
    // Reset payment-related states
    setLocalIsPaid(false);
    setIsGeneratingPremiumContent(false);
    setIsCreatingMagic(false);
    setIsGeneratingImages(false);
    
    // Reset locked panels to default state (first 4 free, rest locked)
    const previewCount = Number(import.meta.env.VITE_PREVIEW_IMAGE_COUNT) || 4;
    const resetLockedPanels = Array(panels.length).fill(false).map((_, idx) => idx >= previewCount);
    setLockedPanels(resetLockedPanels);
    
    console.log('🔄 Curated story payment state reset:', {
      localIsPaid: false,
      totalPanels: panels.length,
      previewCount,
      resetLockedPanels
    });
    
    // Call parent payment cancellation handler
    onPaymentCancellation?.();
  };

  // Unlock request handler
  const handleUnlockRequest = () => {
    // Track checkout start for GTM
    trackCheckoutStarted('curated_story_unlock_now_panels_button', 49);
    
    setIsPricingModalOpen(true);
  };

  // Generate locked images in chunks (same logic as FinalPreview)
  const generateLockedImages = async (forcePaid: boolean = false) => {
    console.log('=== GENERATE LOCKED IMAGES START ===');
    console.log('🔍 generateLockedImages called with forcePaid:', forcePaid);
    console.log('🔍 Current localIsPaid state:', localIsPaid);
    
    // Prevent generation if payment hasn't been made (unless forced)
    if (!localIsPaid && !forcePaid) {
      console.error('❌ BLOCKED: Attempting to generate locked images without payment!');
      toast.error('Payment required to generate premium illustrations.');
      setIsCreatingMagic(false);
      setIsGeneratingPremiumContent(false);
      setIsGeneratingImages(false);
      return;
    }
    debugger
    if (!panels || panels.length === 0) {
      toast.error("Cannot generate locked images without panel data.");
      setIsCreatingMagic(false);
      setIsGeneratingPremiumContent(false);
      return;
    }

    console.log('✅ Payment verified, proceeding with locked image generation...');
    console.log('Panels data available:', panels.length, 'panels');
    
    // 1. Get panels that need generating (skip the first 4 free ones)
    const previewCount = Number(import.meta.env.VITE_PREVIEW_IMAGE_COUNT) || 4;
    const panelsToGenerate = panels.slice(previewCount);
    
    console.log('🎨 Generating images for', panelsToGenerate.length, 'locked panels');
  
    // 2. Process one by one instead of chunks
    for (let i = 0; i < panelsToGenerate.length; i++) {
      const panel = panelsToGenerate[i];
      const overallIndex = previewCount + i; // This is the actual index in the images array
      
      console.log(`🎨 Generating image for panel ${overallIndex} (ID: ${panel.id})`);
      
      // Set "Good things take time..." state for the current panel being generated
      toast.info(`Generating illustration for panel ${overallIndex}...`);
      setRegeneratingPanels(prev => {
        const newRegen = { ...prev };
        newRegen[overallIndex] = true; // Only set the current panel as regenerating
        return newRegen;
      });
      

      try {
        const result = await regenerateCuratedPanel(panel.panel_id || panel.id);
        
        if (result.success && result.panel) {
          console.log(`✅ Panel ${overallIndex} image generated successfully:`, {
            panel_id: result.panel.panel_id,
            panel_number: result.panel.panel_number,
            status: result.panel.status,
            image_url: result.panel.aws_s3_image_url || result.panel.file_url
          });
          
          // Update the panel with the generated image and panel text
          handleImageGenerated(
            overallIndex, 
            result.panel.aws_s3_image_url || result.panel.file_url,
            result.panel.panel_text
          );
        } else {
          throw new Error('No panel data in response or regeneration failed');
        }
      } catch (error) {
        console.error(`❌ Failed to generate image for panel ${overallIndex} (ID: ${panel.id}):`, error);
        handleImageGenerated(overallIndex, null); // Mark as failed, but still update progress
      }
      
      // Clear "Good things take time..." state for the processed panel
      setRegeneratingPanels(prev => {
        const newRegen = { ...prev };
        delete newRegen[overallIndex];
        return newRegen;
      });
    }

    // After all panels are processed and images are generated
    console.log('🔧 Resetting flags in generateLockedImages:');
    console.log('  - Setting isGeneratingImages to false');
    console.log('  - Setting isGeneratingPremiumContent to false');
    
    setIsGeneratingImages(false);
    setIsGeneratingPremiumContent(false);
    
    // Check if all panels were successfully generated
    const failedPanels = Object.keys(errorImages).filter(key => key !== 'general' && errorImages[key]);
    if (failedPanels.length > 0) {
      console.log('❌ Some panels failed, keeping isCreatingMagic true');
      toast.error(`Some illustrations failed to generate. You can retry individual panels using the "Retry Image" button.`);
      // Keep isCreatingMagic true if there are failures so users can see the retry options
    } else {
      console.log('✅ All panels successful, but keeping isCreatingMagic true until images are loaded');
      toast.success("All premium illustrations have been created!");
      // Don't reset isCreatingMagic here - let it be reset when images are actually loaded
      // The isCreatingMagic flag will be reset in handleImageGenerated when images are actually displayed
    }
  };

  // Safety check: if no curated story result, show loading or error
  if (!curatedStoryResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your story...</h2>
          <p className="text-gray-600">Please wait while we prepare your curated story.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-fit rounded-2xl overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${genreColors[curatedStoryResult.genre as keyof typeof genreColors] || 'from-purple-500 to-pink-500'} text-white`}>
          <CardTitle className="text-2xl flex items-center gap-3 justify-center">
            <span className="text-3xl">{genreEmojis[curatedStoryResult.genre as keyof typeof genreEmojis] || '📖'}</span>
            <div className="text-center">
              <div className="text-2xl font-bold">{curatedStoryResult.title || `${characterName}'s Curated Story`}</div>
              <div className="text-sm bg-white/20 px-3 py-1 rounded-full mt-1 inline-block">
                {curatedStoryResult.genre ? 
                  curatedStoryResult.genre.charAt(0).toUpperCase() + curatedStoryResult.genre.slice(1) + ' Adventure' : 
                  'Curated Adventure'
                }
              </div>
            </div>
            <span className="text-3xl">✨</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Back button */}
          {showBackButton && (
            <div className="flex gap-3">
              <Button
                onClick={onBackToCuratedForm}
                variant="outline"
                className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl py-3"
              >
                ← Back to Curated Stories
              </Button>
              <Button
                onClick={onBackToForm}
                variant="outline"
                className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl py-3"
              >
                ← Create Another Story
              </Button>
            </div>
          )}

          {/* Success message */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-center text-green-700 font-medium">
              🎉 Your curated story is ready! 🎉
              {characterPhoto && (
                <>
                  <br />
                  <span className="text-sm">✨ Your photo has been magically transformed into story illustrations! ✨</span>
                </>
              )}
            </p>
          </div>

          {/* Character Photo Display */}
          {displayCharacterPhoto && (
            <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="relative inline-block">
                <img
                  src={displayCharacterPhoto}
                  alt={displayCharacterName}
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-700 mt-3">Starring: {displayCharacterName}!</p>
              <p className="text-sm text-green-600 mt-2 font-medium">
                🎭 You're the main character in this amazing adventure! 🎭
              </p>
            </div>
          )}

          {/* Story Content using ComicBook component */}
          <ComicBook
            story={curatedStoryResult?.story_content || ''}
            genre={curatedStoryResult?.genre || 'adventure'}
            characterPhoto={displayCharacterPhoto}
            characterName={displayCharacterName}
            getSceneImage={getSceneImage}
            loadingImages={loadingImages}
            openaiApiKey="" // Not needed for curated stories
            cleanPanelTextForDisplay={cleanPanelTextForDisplay}
            onRestartForm={onBackToForm}
            images={images}
            characterPhotoFile={null}
            onGenerateLockedImages={generateLockedImages}
            onRetryImage={handleRetryImage}
            errorImages={errorImages}
            retryLoadingPanels={retryLoadingPanels}
            onUnlockRequest={handleUnlockRequest}
            onRegenerate={handleRegeneratePanelImage}
            regeneratingPanels={regeneratingPanels}
            isGeneratingImages={isGeneratingImages}
            lockedPanels={lockedPanels}
            isCreatingMagic={isCreatingMagic}
            title={curatedStoryResult?.title || `${characterName}'s Curated Story`}
            panels={panels}
            isPaid={localIsPaid}
            isCuratedStory={true}
            onCuratedDownloadPDF={handleDownloadPDF}
          />
          
        


          {/* Action Buttons using StoryActions component */}
          <StoryActions
            story={generateStoryContentFromPanels()}
            characterName={displayCharacterName}
            characterPhoto={displayCharacterPhoto}
            genre={curatedStoryResult?.genre || 'adventure'}
            generatedImages={images}
            lockedPanels={lockedPanels}
            onUnlockRequest={handleUnlockRequest}
            title={curatedStoryResult?.title || `${characterName}'s Curated Story`}
            isPaid={localIsPaid}
            panels={panels}
          />

          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <p className="text-lg text-purple-600 font-medium">
              🌈 Every child deserves to be the hero of their own amazing story! 🌈
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Share your story with friends and family! 📚✨
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Pricing Modal - Rendered at root level for proper overlay */}
      <PricingModal
        open={isPricingModalOpen}
        onClose={() => {
          console.log('🔒 PricingModal onClose called');
          setIsPricingModalOpen(false);
        }}
        onPaymentSuccess={() => {
          console.log('💰 PricingModal onPaymentSuccess called');
          handlePaymentSuccess();
        }}
        onPaymentCancellation={() => {
          console.log('❌ PricingModal onPaymentCancellation called' );
          handlePaymentCancellation();
        }}
        storyId={curatedStoryResult?.story_id || ''}
      />
    </>
  );
};

export default FinalCuratedPreview; 