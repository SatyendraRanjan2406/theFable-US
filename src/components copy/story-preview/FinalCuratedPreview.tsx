import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { regenerateCuratedPanel } from '@/utils/curatedStoryApi';
import ComicBook from '@/components/ComicBook';
import StoryActions from '@/components/StoryActions';
import PricingModal from '@/components/PricingModal';
import { trackCheckoutStarted, trackPurchaseCompleted } from '@/utils/gtm';
import { generateComicPDF } from '@/utils/pdfGenerator';

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
      
      // Map curated story panels to the expected format
      const mappedPanels = curatedStoryResult.panels.map(panel => ({
        id: panel.panel_id || `panel-${panel.panel_number}`,
        panel_number: panel.panel_number,
        panel_text: panel.panel_text,
        image_prompt: panel.panel_text, // Use panel_text as image_prompt
        minimax_image_url: panel.file_url || null,
        aws_s3_image_url: panel.aws_s3_image_url || null,
        status: panel.status,
        created_at: new Date().toISOString(), // Use current date if not available
        updated_at: new Date().toISOString(),
        panel_id: panel.panel_id,
        facemint_task_id: panel.facemint_task_id,
        file_url: panel.file_url
      }));
      
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

  // New PDF download function for FinalCuratedPreview
  const handleDownloadPDF = async (viewMode: 'grid' | 'split') => {
    debugger; // Debugger statement added for debugging
    console.log('🔍 Curated story result:', curatedStoryResult);
    console.log('🔍 FinalCuratedPreview handleDownloadPDF called:', {
      viewMode,
      isPaid: localIsPaid,
      imagesLength: images.length,
      validImagesCount: images.filter(img => img !== null && img !== undefined).length,
      panelsLength: curatedStoryResult.panels?.length || 0
    });

    // Check payment status
    if (!localIsPaid) {
      onUnlockRequest?.();
      return;
    }
    console.log('🔍 Curated story result:', curatedStoryResult);
    console.log('🔍 Images:', images);
    if (!curatedStoryResult.panels || !images) {
      toast.error('No panel data or images available for PDF generation');
      return;
    }

    try {
      toast.info('Preparing images for PDF...');
      
      // Use actual panel data from curatedStoryResult.panels
      const panelData = curatedStoryResult.panels;
      console.log('🔍 Panel data from API:', panelData);

      // Extract panel texts and S3 URLs from the panel data
      const panelsToShow = panelData.map(panel => panel.panel_text || '').filter(text => text.trim());
      const s3ImageUrls = panelData.map(panel => panel.aws_s3_image_url || panel.file_url).filter(url => url);
      
      console.log('🔍 Extracted panel texts:', panelsToShow);
      console.log('🔍 Extracted S3 image URLs:', s3ImageUrls);
      
      // Log detailed panel data for debugging
      console.log('🔍 Detailed panel data for PDF generation:');
      panelData.forEach((panel, index) => {
        console.log(`Panel ${index + 1}:`, {
          panel_number: panel.panel_number,
          panel_text: panel.panel_text?.substring(0, 100) + '...',
          aws_s3_image_url: panel.aws_s3_image_url,
          file_url: panel.file_url,
          final_image_url: panel.aws_s3_image_url || panel.file_url
        });
      });

      if (s3ImageUrls.length === 0) {
        toast.error('No images available for PDF generation. Please wait for images to be generated.');
        return;
      }

      if (panelsToShow.length === 0) {
        toast.error('No panel texts available for PDF generation.');
        return;
      }

      // Ensure we have the same number of panels and images
      const maxPanels = Math.min(panelsToShow.length, s3ImageUrls.length);
      const alignedPanels = panelsToShow.slice(0, maxPanels);
      const alignedS3Urls = s3ImageUrls.slice(0, maxPanels);

      console.log('🔍 Aligned data for PDF:', {
        panelsCount: alignedPanels.length,
        s3UrlsCount: alignedS3Urls.length,
        panels: alignedPanels,
        s3Urls: alignedS3Urls
      });

      // Use S3 URLs directly (generateComicPDF will handle the conversion)
      const finalImageUrls = alignedS3Urls.filter((url): url is string => url !== null);
      
      console.log('🔍 About to call generateComicPDF with panel texts:', {
        panelTextsLength: alignedPanels.length,
        imageUrlsLength: finalImageUrls.length,
        characterName,
        genre: curatedStoryResult.genre,
        viewMode,
        firstPanelText: alignedPanels[0]?.substring(0, 50) + '...',
        firstImageUrl: finalImageUrls[0]?.substring(0, 50) + '...',
        allPanelTexts: alignedPanels
      });

      // Generate PDF using panel texts array (not raw story content)
      const pdf = await generateComicPDF(
        alignedPanels, // Use panel texts array directly
        characterName,
        characterPhoto,
        curatedStoryResult.genre || 'adventure',
        finalImageUrls, // Use S3 URLs directly
        '', // No API key needed for curated stories
        cleanPanelTextForDisplay,
        viewMode,
        curatedStoryResult.title || `${characterName}'s Curated Story`
      );
      
      const filename = `${characterName}-${curatedStoryResult.genre || 'curated'}-comic-${viewMode}.pdf`;
      pdf.save(filename);
      toast.success(`Curated Story PDF (${viewMode} view) downloaded successfully!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
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
      const result = await regenerateCuratedPanel(panel.panel_id || panel.id);
      console.log('Panel regeneration result:', result);

      if (result.panel) {
        // Update the panel with new data
        const updatedPanel = {
          ...panel,
          aws_s3_image_url: result.panel.aws_s3_image_url,
          minimax_image_url: result.panel.file_url,
          file_url: result.panel.file_url, // Also update the file_url field
          status: result.panel.status,
          updated_at: new Date().toISOString()
        };
        
        setPanels(prev => prev.map((p, i) => 
          i === index ? updatedPanel : p
        ));
        
        // Update the image
        const newImageUrl = result.panel.aws_s3_image_url || result.panel.file_url;
        console.log(`🔄 Panel ${index + 1} regeneration - updating image:`, {
          panel_id: panel.panel_id,
          aws_s3_image_url: result.panel.aws_s3_image_url,
          file_url: result.panel.file_url,
          newImageUrl: newImageUrl
        });
        
        setImages(prev => {
          const newImages = prev.map((img, i) => 
            i === index ? newImageUrl : img
          );
          console.log(`🔄 Updated images array:`, newImages);
          return newImages;
        });
        
        // Update locked status
        setLockedPanels(prev => prev.map((locked, i) => 
          i === index ? false : locked
        ));
        
        toast.success(`Panel ${index + 1} regenerated successfully!`);
      } else {
        throw new Error('No panel data in response');
      }
    } catch (error) {
      console.error('Error regenerating panel:', error);
      setErrorImages(prev => ({ ...prev, [index]: true }));
      toast.error(`Failed to regenerate panel ${index + 1}. Please try again.`);
    } finally {
      setRegeneratingPanels(prev => ({ ...prev, [index]: false }));
    }
  };

  // Handle retry image
  const handleRetryImage = (index: number) => {
    handleRegeneratePanelImage(index);
  };

  // Handle image generated (same as FinalPreview)
  const handleImageGenerated = (index: number, url: string | null) => {
    console.log(`🎨 handleImageGenerated called for panel ${index + 1} with URL:`, url);
    
    if (url) {
      // Update panel data
      setPanels(prev => prev.map((p, i) => 
        i === index ? {
          ...p,
          aws_s3_image_url: url,
          minimax_image_url: url,
          file_url: url, // Also update the file_url field
          status: 'completed',
          updated_at: new Date().toISOString()
        } : p
      ));
      
      // Update image
      setImages(prev => prev.map((img, i) => 
        i === index ? url : img
      ));
      
      // Update locked status
      setLockedPanels(prev => prev.map((locked, i) => 
        i === index ? false : locked
      ));
      
      // Clear error state
      setErrorImages(prev => ({ ...prev, [index]: false }));
      
      console.log(`✅ Panel ${index + 1} image updated successfully`);
    } else {
      // Mark as failed
      setErrorImages(prev => ({ ...prev, [index]: true }));
      console.log(`❌ Panel ${index + 1} image generation failed`);
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
      
      console.log(`🎨 Generating image for panel ${overallIndex + 1} (ID: ${panel.id})`);
      
      // Set "Good things take time..." state for the current panel being generated
      toast.info(`Generating illustration for panel ${overallIndex + 1}...`);
      setRegeneratingPanels(prev => {
        const newRegen = { ...prev };
        newRegen[overallIndex] = true; // Only set the current panel as regenerating
        return newRegen;
      });

      try {
        const result = await regenerateCuratedPanel(panel.panel_id || panel.id);
        
        if (result.panel) {
          console.log(`✅ Panel image generated successfully:`, {
            panel_id: result.panel.panel_id,
            panel_number: result.panel.panel_number,
            status: result.panel.status,
            image_url: result.panel.aws_s3_image_url || result.panel.file_url
          });
          
          // Update the panel with the generated image
          handleImageGenerated(overallIndex, result.panel.aws_s3_image_url || result.panel.file_url);
        } else {
          throw new Error('No panel data in response');
        }
      } catch (error) {
        console.error(`❌ Failed to generate image for panel ${overallIndex + 1} (ID: ${panel.id}):`, error);
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
          {characterPhoto && (
            <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="relative inline-block">
                <img
                  src={characterPhoto}
                  alt={characterName}
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-700 mt-3">Starring: {characterName}!</p>
              <p className="text-sm text-green-600 mt-2 font-medium">
                🎭 You're the main character in this amazing adventure! 🎭
              </p>
            </div>
          )}

          {/* Story Content using ComicBook component */}
          <ComicBook
            story={curatedStoryResult.story_content || ''}
            genre={curatedStoryResult.genre || 'adventure'}
            characterPhoto={characterPhoto}
            characterName={characterName}
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
            title={curatedStoryResult.title || `${characterName}'s Curated Story`}
            panels={panels}
            isPaid={localIsPaid}
            isCuratedStory={true}
            onCuratedDownloadPDF={handleDownloadPDF}
          />
     

          {/* Action Buttons using StoryActions component */}
          <StoryActions
            story={curatedStoryResult.story_content || ''}
            characterName={characterName}
            characterPhoto={characterPhoto}
            genre={curatedStoryResult.genre || 'adventure'}
            generatedImages={images}
            hfApiKey="" // Not needed for curated stories
            cleanPanelTextForDisplay={cleanPanelTextForDisplay}
            lockedPanels={lockedPanels}
            onUnlockRequest={handleUnlockRequest}
            title={curatedStoryResult.title || `${characterName}'s Curated Story`}
            isPaid={localIsPaid}
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
          console.log('❌ PricingModal onPaymentCancellation called');
          handlePaymentCancellation();
        }}
        storyId={curatedStoryResult.story_id}
      />
    </>
  );
};

export default FinalCuratedPreview; 