import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateComicPDF } from '@/utils/pdfGenerator';
import { downloadTextFile, shareOrCopyContent, downloadAllImages } from '@/utils/downloadHelpers';

// Utility: Download URL as File
async function urlToFile(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

// Utility: File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface StoryActionsProps {
  story: string;
  characterName: string;
  characterPhoto: string | null;
  genre: string;
  generatedImages: {[key: string]: string} | (string | null)[];
  hfApiKey: string;
  cleanPanelTextForDisplay: (text: string) => string;
  onRegenerateStory?: () => void;
  isRegenerating?: boolean;
  lockedPanels?: boolean[];
  onUnlockRequest?: () => void;
  title?: string; // NEW: story title
  isPaid?: boolean; // NEW: payment status
}

const StoryActions: React.FC<StoryActionsProps> = ({
  story,
  characterName,
  characterPhoto,
  genre,
  generatedImages,
  hfApiKey,
  cleanPanelTextForDisplay,
  onRegenerateStory,
  isRegenerating = false,
  lockedPanels = [],
  onUnlockRequest,
  title,
  isPaid = false
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

  const handleDownloadPDF = async () => {
    // Check payment status first
    if (!isPaymentComplete()) {
      onUnlockRequest?.();
      return;
    }

    if (!story) return;
    try {
      //console.log('generatedImages:', generatedImages);
      toast.info('Preparing images for PDF...');
      // Use array format for images
      let imagesArray: (string | null)[] = [];
      if (Array.isArray(generatedImages)) {
        imagesArray = generatedImages;
      } else {
        const imageKeys = Object.keys(generatedImages);
        imagesArray = imageKeys.map(key => generatedImages[key]).filter(img => img && img !== 'undefined');
      }
      // Download and convert each image to base64
      const base64Images = await Promise.all(
        imagesArray.map(async (url, idx) => {
          if (!url) return null;
          try {
            //console.log(`Processing image ${idx + 1} for PDF:`, url.includes('storymaker-jcool.s3.amazonaws.com') ? 'Using presigned URL' : 'Using original URL');
            const file = await urlToFile(url, `panel${idx + 1}.jpg`);
            return await fileToBase64(file);
          } catch (e) {
            console.error(`Failed to process image ${idx + 1}:`, e);
            return null;
          }
        })
      );
      // Now call your PDF generator with base64Images
      const pdf = await generateComicPDF(
        story,
        characterName,
        characterPhoto,
        genre,
        base64Images as (string | null)[], // pass the base64 array
        hfApiKey,
        cleanPanelTextForDisplay,
        'grid', // viewMode
        title // NEW: pass the title
      );
      pdf.save(`${characterName}-comic-story.pdf`);
      toast.success('Comic PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
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
      {/* Regenerate button */}
      {/* {onRegenerateStory && (
        <Button
          onClick={onRegenerateStory}
          disabled={isRegenerating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Regenerating Story...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Story
            </>
          )}
        </Button>
      )} */}
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
          onClick={handleDownloadPDF}
          variant="outline"
          className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <FileText className="w-4 h-4 mr-2" />
          Download Comic PDF
        </Button>
        {/* <Button
          onClick={handleDownloadImages}
          variant="outline"
          className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Images
        </Button> */}
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
