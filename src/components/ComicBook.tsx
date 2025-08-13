import React, { useState, useEffect, useCallback } from 'react';
import ComicPanel from './ComicPanel';
import PricingModal from './PricingModal';
import { Grid, Split, Download, FileText, Image, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateComicPDF } from '@/utils/pdfGenerator';
import { downloadAllImages } from '@/utils/downloadHelpers';
import { fileToBase64 } from '@/utils/imageUtils';
import { useNavigate } from "react-router-dom";
import { trackCheckoutStarted, trackDownloadPDFButtonClicked } from '@/utils/gtm';
import { parseStoryToPanels } from '@/utils/storyParser';
import { urlToBase64 } from '@/utils/imageUtils';

interface ComicBookProps {
  story: string;
  genre: string;
  characterPhoto: string | null;
  characterName: string;
  getSceneImage: (text: string, genre: string, index: number) => Promise<string>;
  loadingImages: {[key: string]: boolean};
  openaiApiKey: string;
  cleanPanelTextForDisplay: (text: string) => string;
  onRestartForm?: () => void;
  images?: (string | null)[];
  characterPhotoFile?: File | null;
  onGenerateLockedImages?: () => Promise<void>;
  errorImages: {[key: string]: boolean};
  onRetryImage: (index: number) => void;
  retryLoadingPanels?: {[key: string]: boolean};
  onUnlockRequest?: () => void;
  onRegenerate?: (index: number, panelId?: string) => Promise<void>;
  regeneratingPanels?: { [key: number]: boolean };
  isGeneratingImages?: boolean;
  lockedPanels?: boolean[];
  isCreatingMagic?: boolean;
  title?: string; // NEW: story title
  panels?: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>; // NEW: panels data from API for edit mode
  isPaid?: boolean; // NEW: payment status for edit mode
  isCuratedStory?: boolean; // NEW: flag for curated story mode
  onCuratedDownloadPDF?: (viewMode: 'grid' | 'split' | 'fullscreen') => Promise<void>; // NEW: curated story PDF download handler
}

const ComicBook: React.FC<ComicBookProps> = ({
  story,
  genre,
  characterPhoto,
  characterName,
  getSceneImage,
  loadingImages,
  openaiApiKey,
  cleanPanelTextForDisplay,
  onRestartForm,
  images,
  characterPhotoFile,
  onGenerateLockedImages,
  errorImages,
  onRetryImage,
  retryLoadingPanels = {},
  onUnlockRequest,
  onRegenerate,
  regeneratingPanels,
  isGeneratingImages,
  lockedPanels = [],
  isCreatingMagic,
  title,
  panels,
  isPaid = false,
  isCuratedStory = false,
  onCuratedDownloadPDF,
}) => {
  console.log('=== COMIC BOOK PARSING DEBUG ===');
  console.log('Raw story length:', story.length);
  console.log('Images array:', images);
  console.log('Images array length:', images?.length || 0);
  console.log('Non-null images:', images?.filter(img => img !== null).length || 0);
  console.log('Story preview:', story.substring(0, 200) + '...');
  console.log('=== COMIC BOOK PROPS DEBUG ===');
  console.log('isCreatingMagic:', isCreatingMagic);
  console.log('lockedPanels:', lockedPanels);
  console.log('regeneratingPanels:', regeneratingPanels);
  console.log('Panels from API:', panels);
  
  // Use panels from API if available (edit mode), otherwise parse from story text
  let allPanels: string[] = [];
  let panelDataArray: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }> = [];
  
  if (panels && panels.length > 0) {
    console.log('🎭 Using panels from API (edit mode)');
    // Use panel data from API response
    panelDataArray = panels;
    allPanels = panels.map((panel) => panel.panel_text || '');
    console.log('📖 Using panel data from API:', panelDataArray.length, 'panels');
  } else {
    console.log('📖 Parsing panels from story text (create mode)');
  // Split by page separators and clean up
  const pages = story.split('---').map(page => page.trim()).filter(page => page.length > 0);
  
  console.log('Number of pages found:', pages.length);
  
    // If no pages found, try to extract panels directly from the story
    if (pages.length === 0) {
      console.log('No pages found, trying direct panel extraction...');
      
      // Look for Panel patterns in the story
      const panelMatches = story.match(/Panel \d+:[^]*?(?=Panel \d+:|$)/g);
      if (panelMatches) {
        allPanels.push(...panelMatches.map(panel => panel.replace(/Panel \d+:\s*/, '').trim()));
        console.log('Direct panel extraction found:', allPanels.length, 'panels');
      } else {
        // Fallback: split by double newlines and treat each as a panel
        const fallbackPanels = story.split(/\n\n+/).filter(panel => panel.trim().length > 0);
        allPanels.push(...fallbackPanels);
        console.log('Fallback panel extraction found:', allPanels.length, 'panels');
      }
    } else {
  pages.forEach((page, pageIndex) => {
    console.log(`=== PAGE ${pageIndex + 1} DEBUG ===`);
    
    const lines = page.split('\n').filter(line => line.trim());
    
    // Find panel content - look for lines that contain actual story content after Panel markers
    let currentPanel = '';
    let inPanel = false;
    
    for (const line of lines) {
      if (line.includes('**Panel') && line.includes(':**')) {
        // Start new panel
        if (currentPanel.trim()) {
          allPanels.push(currentPanel.trim());
        }
        currentPanel = line.replace(/\*\*Panel \d+:\*\*/, '').trim();
        inPanel = true;
      } else if (inPanel && !line.includes('**Page') && !line.includes('**Panel')) {
        // Add content to current panel
        currentPanel += ' ' + line.trim();
      }
    }
    
    // Add the last panel
    if (currentPanel.trim()) {
      allPanels.push(currentPanel.trim());
    }
  });
    }
  }
  
  console.log('Total panels found:', allPanels.length);
  

  
  // Show all panels (not just the first 6)
  const panelsToShow = allPanels;
  console.log('panelsToShow:', panelsToShow);
  const [isGeneratingLockedImages, setIsGeneratingLockedImages] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'split' | 'fullscreen'>('fullscreen');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);


  const handlePaymentSuccess = useCallback(async () => {
    console.log('🎨 ComicBook handlePaymentSuccess called');
    
    if (!onGenerateLockedImages) {
      console.error('onGenerateLockedImages callback not provided');
      return;
    }

    // Prevent generation if already generating
    if (isGeneratingLockedImages) {
      console.log('⚠️ Already generating locked images, skipping duplicate call');
      return;
    }

    setIsGeneratingLockedImages(true);
    try {
      console.log('Payment successful! Starting generation of all locked images...');
      await onGenerateLockedImages();
      console.log('All locked images generated successfully!');
    } catch (error) {
      console.error('Failed to generate locked images:', error);
    } finally {
      setIsGeneratingLockedImages(false);
    }
  }, [onGenerateLockedImages, isGeneratingLockedImages]);

  // Listen for payment success events
  useEffect(() => {
    const handlePaymentSuccessEvent = () => {
      console.log('🎨 ComicBook: Payment success event received');
      handlePaymentSuccess();
    };

    // Listen for custom payment success events
    window.addEventListener('payment-success', handlePaymentSuccessEvent);
    
    // Also listen for Stripe payment success events
    window.addEventListener('stripe-payment-success', handlePaymentSuccessEvent);

    return () => {
      window.removeEventListener('payment-success', handlePaymentSuccessEvent);
      window.removeEventListener('stripe-payment-success', handlePaymentSuccessEvent);
    };
  }, [handlePaymentSuccess]);




  // Check if payment has been made (no locked panels beyond the first 2 free ones)
  const isPaymentComplete = () => {
    // Use isPaid prop for payment status (same pattern as StoryActions)
    console.log('🔍 ComicBook isPaymentComplete called, isPaid =', isPaid);
    return isPaid;
  };

  const handleDownloadPDF = async (downloadViewMode?: 'grid' | 'split' | 'fullscreen') => {
    // // // Check payment status first
    // if (!isPaymentComplete()) {
    //   onUnlockRequest?.();
    //   trackCheckoutStarted('unlock_now_generate_pdf_button', 49);
    //   return;
    // }
    // If this is a curated story, use the curated download handler
    if (isCuratedStory && onCuratedDownloadPDF) {
      console.log('🔍 Using curated story PDF download handler');
      await onCuratedDownloadPDF(downloadViewMode || 'grid');
      return;
    }
    // Use the specified view mode for download, or current view mode if not specified
    const pdfViewMode = downloadViewMode || viewMode;
    
    // Debug logging
    console.log('🔍 ComicBook handleDownloadPDF Debug:', {
      isPaid,
      storyLength: story?.length,
      imagesLength: images?.length,
      images: images,
      validImagesCount: images?.filter(img => img !== null && img !== undefined).length,
      story: story?.substring(0, 200) + '...',
      characterName,
      genre,
      title
    });
    
    trackDownloadPDFButtonClicked('download_pdf_button');

    setIsDownloadingPDF(true);
    try {
      toast.info('Preparing images for PDF...');
      
      // Filter out null/undefined images
      const validImages = images.filter((img): img is string => img !== null && img !== undefined);
      
      console.log('🔍 Valid images for PDF:', validImages);
      
      if (validImages.length === 0) {
        console.log('⚠️ No valid images found, attempting PDF generation with story only');
        // Try to generate PDF with just the story content
        try {
          const storyPanels = parseStoryToPanels(story);
          const pdf = await generateComicPDF(
            storyPanels,
            characterName,
            characterPhoto,
            genre,
            [], // Empty images array
            openaiApiKey,
            cleanPanelTextForDisplay,
            pdfViewMode,
            title
          );
          
          const filename = `${characterName}-${genre}-comic-${pdfViewMode}-story-only.pdf`;
          pdf.save(filename);
          toast.success(`Comic PDF (${pdfViewMode} view) downloaded successfully! (Story only)`);
          return;
        } catch (error) {
          console.error('Error generating PDF with story only:', error);
          toast.error('No images available for PDF generation. Please wait for images to be generated or try regenerating panels.');
        return;
        }
      }
      debugger
      // Download and convert each image to base64 with better error handling
      const base64Images = await Promise.all(
        images.map(async (url, idx) => {
          if (!url) return null;
          try {
            console.log(`Processing image ${idx + 1} for PDF:`, url.includes('storymaker-jcool.s3.amazonaws.com') ? 'Using presigned URL' : 'Using original URL');
            const base64 = await urlToBase64(url);
            return base64;
          } catch (e) {
            console.error(`Failed to process image ${idx + 1}:`, e);
            console.log(`Image URL that failed: ${url}`);
            // Return null instead of throwing to continue with other images
            return null;
          }
        })
      );

      console.log('🔍 About to call generateComicPDF with:', {
        storyLength: story?.length,
        characterName,
        characterPhoto: !!characterPhoto,
        genre,
        base64ImagesLength: base64Images.length,
        pdfViewMode,
        title
      });
      const storyPanels = parseStoryToPanels(story);
      debugger
      // Generate PDF with specified view mode using the raw story (same as StoryActions)
      const pdf = await generateComicPDF(
        storyPanels, // Use raw story like StoryActions does
        characterName,
        characterPhoto,
        genre,
        base64Images,
        openaiApiKey,
        cleanPanelTextForDisplay,
        pdfViewMode, // Pass specified view mode for PDF
        title // NEW: pass the title
      );
      
      console.log('✅ PDF generated successfully:', pdf);
      
      const filename = `${characterName}-${genre}-comic-${pdfViewMode}.pdf`;
      pdf.save(filename);
      toast.success(`Comic PDF (${pdfViewMode} view) downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadImages = async () => {
    // Check payment status first
    if (!isPaymentComplete()) {
      onUnlockRequest?.();
      return;
    }

    if (!images) return;
    
    setIsDownloadingImages(true);
    try {
      await downloadAllImages(images, characterName, genre);
      const validImageCount = images.filter(img => img !== null && img !== undefined).length;
      toast.success(`Downloaded ${validImageCount} images successfully!`);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error('Failed to download images. Please try again.');
    } finally {
      setIsDownloadingImages(false);
    }
  };

  const navigate = useNavigate();

  const handleComicBookClick = () => {
    navigate("/", {
      state: {
        outline: story, // Pass the full story as the outline
        characterName: characterName,
      },
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Show the story title at the top if provided */}
      {title && (
        <div className="text-3xl font-extrabold text-center text-gradient bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 drop-shadow-lg">
          {title}
        </div>
      )}
      <div className="border-2 border-purple-300 rounded-xl p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-purple-700">
            {characterName}'s Amazing Story!
          </h3>
        
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'split'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Split className="w-4 h-4" />
              Split
            </button>
            <button
              onClick={() => setViewMode('fullscreen')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'fullscreen'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Fullscreen
            </button>
          </div>
        </div>

        {/* Download Options */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Button
            onClick={() => handleDownloadPDF('grid')}
            disabled={isDownloadingPDF || !images || images.filter(img => img).length === 0}
            variant="outline"
            className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {isDownloadingPDF && viewMode === 'grid' ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF (Grid)
              </>
            )}
          </Button>
          <Button
            onClick={() => handleDownloadPDF('split')}
            disabled={isDownloadingPDF || !images || images.filter(img => img).length === 0}
            variant="outline"
            className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {isDownloadingPDF && viewMode === 'split' ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF (Split)
              </>
            )}
          </Button>
          <Button
            onClick={() => handleDownloadPDF('fullscreen')}
            disabled={isDownloadingPDF || !images || images.filter(img => img).length === 0}
            variant="outline"
            className="flex-1 border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            {isDownloadingPDF && viewMode === 'fullscreen' ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 mr-2" />
                Fullscreen PDF
              </>
            )}
          </Button>
          {/* <Button
            onClick={handleDownloadImages}
            disabled={isDownloadingImages || !images || images.filter(img => img).length === 0}
            variant="outline"
            className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            {isDownloadingImages ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Download Images
              </>
            )}
          </Button> */}
        </div>
        
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
            : viewMode === 'fullscreen'
            ? 'space-y-4'
            : 'space-y-8'
        }`}>
          {panelsToShow.map((panelText, idx) => {
            const imageUrl = images?.[idx];
            const isRegenerating = regeneratingPanels ? !!regeneratingPanels[idx] : false;
            const hasError = errorImages ? !!errorImages[idx] : false;
            const panelData = panelDataArray[idx]; // Get panel data if available
            
            // Determine if panel is locked based on payment status and panel index
            let isLocked = false;
            let isLoading = false;
            
            // Debug logging for edit mode
            if (idx === 0) {
              console.log('🔍 ComicBook Debug - Panel 0:', {
                isPaid,
                lockedPanelsLength: lockedPanels?.length,
                lockedPanelsValues: lockedPanels,
                hasImageUrl: !!imageUrl,
                hasPanelData: !!panelData
              });
            }
            
            // Use lockedPanels array if available (for edit mode), otherwise use isPaid logic
            if (isPaid) {
              // If payment is done, no panels are locked (override lockedPanels array)
              isLocked = false;
              if (idx === 0) console.log('🔓 Panel 0: Using isPaid=true, setting isLocked=false');
            } else if (lockedPanels && lockedPanels.length > idx) {
              isLocked = lockedPanels[idx];
              if (idx === 0) console.log('🔒 Panel 0: Using lockedPanels array, isLocked=', lockedPanels[idx]);
            } else {
              // If payment is not done, first 4 panels are free, rest are locked
              const previewCount = import.meta.env.VITE_PREVIEW_IMAGE_COUNT;
              isLocked = idx >= previewCount;
              if (idx === 0) console.log('🔒 Panel 0: Using default logic, previewCount=', previewCount, 'isLocked=', isLocked);
            }
            
            // Show loading only if no image URL and regenerating
            isLoading = (!imageUrl) && (isRegenerating || (loadingImages[idx] === true));
            

            
            return (
              <ComicPanel
                key={panelData?.id || idx}
                panelData={panelData}
                panelIndex={idx}
                panelText={panelText}
                imagePrompt={panelData?.panel_text}
                imageUrl={imageUrl}
                isLoading={isLoading}
                isError={hasError}
                onRetry={() => onRegenerate && onRegenerate(idx, panelData?.id)}
                genre={genre}
                characterPhoto={characterPhoto}
                characterName={characterName}
                getSceneImage={getSceneImage}
                openaiApiKey={openaiApiKey}
                cleanPanelTextForDisplay={cleanPanelTextForDisplay}
                onRestartForm={onRestartForm}
                characterPhotoFile={characterPhotoFile}
                onUnlockClick={onUnlockRequest}
                viewMode={viewMode}
                errorImages={errorImages}
                retryLoadingPanels={retryLoadingPanels}
                isLocked={isLocked}
                onRegenerate={onRegenerate}
                isRegenerating={isRegenerating}
                isCreatingMagic={isCreatingMagic}
                onClick={handleComicBookClick} // Add onClick handler
                isPaid={isPaid} // Pass isPaid prop to ComicPanel
              />
            );
          })}
        </div>
      </div>
      {/* 
      <PricingModal 
        open={pricingOpen} 
        onClose={() => setPricingOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        isProcessing={isGeneratingLockedImages}
      /> 
      */}
    </div>
  );
};

export default ComicBook;
