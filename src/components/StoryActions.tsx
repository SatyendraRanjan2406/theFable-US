import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, FileText, RefreshCw, Grid, Split, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { generateCuratedStoryPDF } from '@/utils/pdfGenerator';
import { downloadTextFile, shareOrCopyContent, downloadAllImages } from '@/utils/downloadHelpers';
import { parseStoryToPanels } from '@/utils/storyParser';

interface StoryActionsProps {
  story: string;
  characterName: string;
  characterPhoto: string | null;
  genre: string;
  generatedImages: {[key: string]: string} | (string | null)[];
  onRegenerateStory?: () => void;
  isRegenerating?: boolean;
  lockedPanels?: boolean[];
  onUnlockRequest?: () => void;
  title?: string; // NEW: story title
  isPaid?: boolean; // NEW: payment status
  panels?: any[]; // NEW: panels data for curated stories
}

const StoryActions: React.FC<StoryActionsProps> = ({
  story,
  characterName,
  characterPhoto,
  genre,
  generatedImages,
  onRegenerateStory,
  isRegenerating = false,
  lockedPanels = [],
  onUnlockRequest,
  title,
  isPaid = false,
  panels
}) => {
  // Manage local payment state like FinalCuratedPreview
  const [localIsPaid, setLocalIsPaid] = useState(isPaid);

  // Update local isPaid when prop changes
  useEffect(() => {
    setLocalIsPaid(isPaid);
  }, [isPaid]);

  // Check if payment has been made
  const isPaymentComplete = () => {
    // Use localIsPaid state (same pattern as FinalCuratedPreview)
    return localIsPaid;
  };

  const handleDownload = () => {
    // Check payment status first
    if (!isPaymentComplete()) {
      onUnlockRequest?.();
      return;
    }

    if (!story) return;
    const content = `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Comic Story\n\n${story}`;
    downloadTextFile(content, `${characterName}-comic-story.txt`);
    toast.success('Comic story downloaded successfully!');
  };

  const handleDownloadPDF = async (selectedViewMode: 'grid' | 'split' | 'fullscreen' = 'grid') => {
    // Check payment status first
    if (!isPaymentComplete()) {
      onUnlockRequest?.();
      return;
    }

    if (!story) return;
    
    try {
      toast.info('Preparing PDF...');
      
      // Create panels array if not provided (for AI-generated stories)
      let panelsToUse = panels;
      
      if (!panelsToUse || panelsToUse.length === 0) {
        console.log('🤖 No panels provided, creating from AI story data');
        
        // Parse story into panels array
        const storyPanels = parseStoryToPanels(story);
        console.log('🤖 Parsed story into panels:', storyPanels.length, 'panels');
        
        if (storyPanels.length === 0) {
          throw new Error('Failed to parse story into panels for PDF generation');
        }
        
        // Convert generatedImages to array format
      let imagesArray: (string | null)[] = [];
      if (Array.isArray(generatedImages)) {
        imagesArray = generatedImages;
      } else {
        const imageKeys = Object.keys(generatedImages);
        imagesArray = imageKeys.map(key => generatedImages[key]).filter(img => img && img !== 'undefined');
      }
        
        console.log('🤖 Images array:', imagesArray.length, 'images');
        
        // Create panels array with consistent structure
        panelsToUse = storyPanels.map((panelText, index) => ({
          panel_text: panelText,
          aws_s3_image_url: imagesArray[index] || null,
          file_url: imagesArray[index] || null,
          panel_number: index + 1
        }));
        
        console.log('🤖 Created panels array:', panelsToUse.length, 'panels');
      } else {
        console.log('📚 Using provided panels array:', panelsToUse.length, 'panels');
      }
      
      // Validate panels structure
      const validPanels = panelsToUse.filter(panel => 
        panel && 
        panel.panel_text && 
        (panel.aws_s3_image_url || panel.file_url)
      );
      
      if (validPanels.length === 0) {
        throw new Error('No valid panels found for PDF generation');
      }
      
      console.log('📚 Valid panels for PDF:', validPanels.length);
      console.log('📚 Panel structure:', validPanels.map(p => ({
        text: p.panel_text?.substring(0, 50) + '...',
        image: p.aws_s3_image_url || p.file_url
      })));
      
      // Generate PDF using the unified panels approach
      const pdf = await generateCuratedStoryPDF(
        validPanels,
        characterName,
        characterPhoto,
        genre,
        selectedViewMode, // Use the passed view mode
        title
      );
      
      const filename = panels ? `${characterName}-curated-story-${selectedViewMode}.pdf` : `${characterName}-comic-story-${selectedViewMode}.pdf`;
      pdf.save(filename);
      
      const successMessage = panels ? `Curated story PDF (${selectedViewMode}) downloaded successfully!` : `Comic PDF (${selectedViewMode}) downloaded successfully!`;
      toast.success(successMessage);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error(`PDF generation failed: ${error.message}`);
    }
  };

  const handleDownloadImages = async () => {
    // Check payment status first
    if (!isPaymentComplete()) {
      onUnlockRequest?.();
      return;
    }

    if (!generatedImages) return;
    
    try {
      // Use array format for images
      let imagesArray: (string | null)[] = [];
      if (Array.isArray(generatedImages)) {
        imagesArray = generatedImages;
      } else {
        const imageKeys = Object.keys(generatedImages);
        imagesArray = imageKeys.map(key => generatedImages[key]).filter(img => img && img !== 'undefined');
      }
      
      await downloadAllImages(imagesArray, characterName, genre);
      const validImageCount = imagesArray.filter(img => img !== null && img !== undefined).length;
      toast.success(`Downloaded ${validImageCount} images successfully!`);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error('Failed to download images. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!story) return;
    const shared = await shareOrCopyContent(`${characterName}'s Story`, story);
    if (shared) {
      toast.success('Story shared successfully!');
    } else {
      toast.success('Story copied to clipboard!');
    }
  };

  return (
    <div className="space-y-3">

      
      {/* Download and share buttons */}
      <div className="flex flex-col md:flex-row gap-3">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download TXT
        </Button>
        <Button
          onClick={handleDownloadImages}
          variant="outline"
          className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Images
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex-1 border-2 border-pink-300 text-pink-700 hover:bg-pink-50"
        >
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default StoryActions;
