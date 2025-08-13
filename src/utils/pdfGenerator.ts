import jsPDF from 'jspdf';
import { imageToDataURL } from './imageConverter';
import { getPoweredByText } from '@/config/app';

// Helper function to safely set font with fallback
const safeSetFont = (pdf: jsPDF, fontFamily: string, fontStyle: string, fallbackFamily: string = 'helvetica', fallbackStyle: string = 'normal') => {
  try {
    // Check if the custom font is available by trying to set it
    pdf.setFont(fontFamily, fontStyle);
    return true;
  } catch (error) {
    // Fallback to default font
    try {
      pdf.setFont(fallbackFamily, fallbackStyle);
      console.warn(`⚠️ Font ${fontFamily} ${fontStyle} not available, using ${fallbackFamily} ${fallbackStyle}`);
      return false;
    } catch (fallbackError) {
      // Last resort - use helvetica normal
      pdf.setFont('helvetica', 'normal');
      console.error('❌ All font fallbacks failed, using helvetica normal');
      return false;
    }
  }
};

// Simple function to use Comic Sans-like fonts with built-in alternatives
const useComicStyleFont = (pdf: jsPDF, style: 'normal' | 'bold' | 'italic' | 'bolditalic') => {
  if (style === 'bold') {
    // Use courier bold for Comic Sans-like bold appearance
    pdf.setFont('helvetica', 'bold');
  } else if (style === 'italic') {
    // Use courier italic for Comic Sans-like italic appearance
    pdf.setFont('helvetica', 'italic');
  } else if (style === 'bolditalic') {
    // Use courier bold for Comic Sans-like bold italic appearance
    pdf.setFont('helvetica', 'bold');
  } else {
    // Use courier normal for Comic Sans-like normal appearance
    pdf.setFont('helvetica', 'normal');
  }
};

// Function to add "Powered by" text with background
const addPoweredByText = (pdf: jsPDF, pageWidth: number, pageHeight: number) => {
  const poweredByText = getPoweredByText();
  pdf.setFontSize(18); // Increased font size
  useComicStyleFont(pdf, 'bold'); // Made it bold for better visibility
  pdf.setTextColor(255, 193, 7); // Bright yellow color for better visibility
  
  // Calculate text dimensions for background
  const textWidth = pdf.getTextWidth(poweredByText);
  const textHeight = 8; // Approximate text height
  const padding = 8; // Padding around text
  
  // Position at bottom center
  const textX = pageWidth - textWidth - padding - 53; // 20px from right edge
  const textY = pageHeight - 14; // 2px from bottom - moved further down
  
  // Add white background with rounded corners
  pdf.setFillColor(255, 255, 255); // White background
  pdf.setDrawColor(200, 200, 200); // Light gray border
  pdf.setLineWidth(1);
  // Position background to properly align behind the text
  const bgX = textX + 15 - padding; // Align with text position
  const bgY = textY - textHeight - padding/2; // Center vertically with text
  pdf.roundedRect(bgX, bgY, textWidth + padding*2, textHeight + padding, 8, 8, 'F');
  pdf.roundedRect(bgX, bgY, textWidth + padding*2, textHeight + padding, 8, 8);
  
  // // Add shadow effect - draw black text slightly offset
  // pdf.setTextColor(0, 0, 0); // Black shadow
  // pdf.text(poweredByText, textX+17, textY, { align: 'left' });
  
  // Draw main text in bright yellow on top
  pdf.setTextColor(255, 193, 7); // Bright yellow color
  pdf.text(poweredByText, textX+15, textY-2, { align: 'left' });
  
  // Add hyperlink to the text (opens in new tab)
  pdf.link(bgX, bgY, textWidth + padding*2, textHeight + padding, { url: `https://${import.meta.env.VITE_APP_DOMAIN || 'storymaker.jcool.in'}`, target: '_blank' });
};

export const generateComicPDF = async (
  storyData: string | string[], // Accept either raw story or pre-parsed panels
  characterName: string,
  characterPhoto: string | null,
  genre: string,
  generatedImages: {[key: string]: string} | (string | null)[],
  hfApiKey: string,
  cleanPanelTextForDisplay: (text: string) => string,
  viewMode: 'grid' | 'split' | 'fullscreen' = 'grid',
  title?: string // NEW: story title
): Promise<jsPDF> => {
  const pdf = new jsPDF();
  
  // Set default font to avoid any font-related issues
  pdf.setFont('helvetica', 'normal');
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // // Load background image as Data URL
  // const bgImageUrl = '/pdf-bg/flowers.jpeg';
  let bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
  let bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  console.log('🔍 PDF Generator: Genre received:', genre);
  
  // Normalize genre to handle different spellings and cases
  const normalizedGenre = genre?.toLowerCase().trim();
  console.log('🔍 PDF Generator: Normalized genre:', normalizedGenre);
  
  if (normalizedGenre === 'fairytale') {
    bgImageFrontUrl = '/pdf-bg/fairy_back.jpeg';
    bgImageBackUrl = '/pdf-bg/fairy_back.jpeg';
    console.log('🔍 PDF Generator: Using fairy tale background');
  } else if (normalizedGenre === 'adventure') {
    bgImageFrontUrl = '/pdf-bg/adv_back.jpeg';
    bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
    console.log('🔍 PDF Generator: Using adventure background');
  } else if (normalizedGenre === 'mystery') {
    bgImageFrontUrl = '/pdf-bg/mystery_back.jpeg';
    bgImageBackUrl = '/pdf-bg/mystery_back.jpeg';
    console.log('🔍 PDF Generator: Using mystery background');
  } else if (normalizedGenre === 'humour' || normalizedGenre === 'humor') {
    bgImageFrontUrl = '/pdf-bg/comic_back.jpeg';
    bgImageBackUrl = '/pdf-bg/comic_back.jpeg';
    console.log('🔍 PDF Generator: Using humour/comic background');
  } else {
    console.log('🔍 PDF Generator: Unknown genre, using default adventure background');
  }
      
    const bgDataUrlFront = await imageToDataURL(bgImageFrontUrl);
    const bgDataUrlBack = await imageToDataURL( bgImageBackUrl);

  //console.log('=== PDF GENERATION DEBUG ===');
  
  // Handle both old object format and new array format
  let imagesArray: (string | null)[] = [];
  if (Array.isArray(generatedImages)) {
    imagesArray = generatedImages;
  } else {
    // Convert old object format to array
    const imageKeys = Object.keys(generatedImages);
    imagesArray = imageKeys.map(key => generatedImages[key]).filter(img => img && img !== 'undefined');
  }
  
  // Front Cover Page - Start background from -30 from bottom
  pdf.addImage(bgDataUrlFront, 'JPEG', 0, 0, pageWidth, pageHeight );
  
  // Add character photo with thick designer border if available
  if (characterPhoto) {
    try {
      const characterDataUrl = await imageToDataURL(characterPhoto);
      const photoSize = 80; // Larger photo size
      const photoX = pageWidth / 2 - photoSize / 2;
      const photoY = pageHeight / 2 - 60; // Position above title
      
      // Create thick designer border for the photo
      const borderThickness = 8;
      const borderPadding = 10;
      const totalSize = photoSize + (borderPadding * 2) + (borderThickness * 2);
      const borderX = photoX - borderPadding - borderThickness;
      const borderY = photoY - borderPadding - borderThickness;
      
      // Outer shadow
      // pdf.setFillColor(0, 0, 0);
      // pdf.roundedRect(borderX + 3, borderY + 3, totalSize, totalSize, 20, 20, 'F');
      
      // Main border frame
      // pdf.setFillColor(255, 215, 0); // Gold color for designer border
      // pdf.roundedRect(borderX, borderY, totalSize, totalSize, 20, 20, 'F');
      
      // Inner border
      // pdf.setFillColor(255, 255, 255);
      // pdf.roundedRect(borderX + borderThickness, borderY + borderThickness, photoSize + (borderPadding * 2), photoSize + (borderPadding * 2), 15, 15, 'F');
      
      // Photo background
      // pdf.setFillColor(240, 240, 240);
      // pdf.roundedRect(borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize, 10, 10, 'F');
      
      // Add the photo
      // pdf.addImage(characterDataUrl, 'JPEG', borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize);
      
      // Add decorative corner elements to the border
      pdf.setFillColor(255, 140, 0); // Orange accent
      const cornerSize = 6;
      // // Top-left corner
      // pdf.rect(borderX + 5, borderY + 5, cornerSize, cornerSize, 'F');
      // // Top-right corner
      // pdf.rect(borderX + totalSize - 11, borderY + 5, cornerSize, cornerSize, 'F');
      // // Bottom-left corner
      // pdf.rect(borderX + 5, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      // // Bottom-right corner
      // pdf.rect(borderX + totalSize - 11, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      
    } catch (error) {
      console.log('Could not add character photo to PDF:', error);
    }
  }
  
  // Add title with title.png background frame
  const titleFrameWidth = pageWidth - 80; // Leave 90px margin on each side
  const titleFrameHeight = 70; // Height for title frame
  const titleFrameX = 40; // X position (90px from left)
  const titleFrameY = pageHeight / 2; // Y position centered on page
  
  // Load and add title.png background with transparency
  try {
    const titleBgDataUrl = await imageToDataURL('/pdf-bg/title.png');
    // Calculate aspect ratio to maintain proportions
    const titleBgAspectRatio = 2.3; // Approximate aspect ratio of title.png (width/height)
    const titleBgHeight = titleFrameHeight;
    const titleBgWidth = titleBgHeight * titleBgAspectRatio;
    
    // Center the title background within the available space
    const titleBgX = titleFrameX + (titleFrameWidth - titleBgWidth) / 2;
    const titleBgY = titleFrameY;
    
    // Add a subtle white background behind the title.png for better transparency
    // pdf.setFillColor(255, 255, 255);
    // pdf.setDrawColor(240, 240, 240);
    // pdf.setLineWidth(1);
    // pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15, 'F');
    // pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15);
    
    // Add the title.png with transparency support
    // pdf.addImage(titleBgDataUrl, 'PNG', titleBgX, titleBgY, titleBgWidth, titleBgHeight, undefined, 'FAST', 0);
  } catch (error) {
    console.log('🔍 PDF Generator: Failed to add title background, using fallback', error);
    // Fallback to original white background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(titleFrameX, titleFrameY, titleFrameWidth, titleFrameHeight, 12, 12, 'F');
    
    // Inner border for title frame
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(2);
    pdf.roundedRect(titleFrameX, titleFrameY, titleFrameWidth, titleFrameHeight, 12, 12);
    
    // Add decorative elements to title frame
    pdf.setFillColor(150, 150, 150);
    const titleCornerSize = 4;
    // Top-left corner
    pdf.rect(titleFrameX + 5, titleFrameY + 5, titleCornerSize, titleCornerSize, 'F');
    // Top-right corner
    pdf.rect(titleFrameX + titleFrameWidth - 9, titleFrameY + 5, titleCornerSize, titleCornerSize, 'F');
    // Bottom-left corner
    pdf.rect(titleFrameX + 5, titleFrameY + titleFrameHeight - 9, titleCornerSize, titleCornerSize, 'F');
    // Bottom-right corner
    pdf.rect(titleFrameX + titleFrameWidth - 9, titleFrameY + titleFrameHeight - 9, titleCornerSize, titleCornerSize, 'F');
  }
  
  // Add title text - responsive to title.png background
  useComicStyleFont(pdf, 'bold');
  // pdf.setTextColor(205, 133, 63); // Golden brown color for stylish appearance
  pdf.setTextColor(255, 193, 7); // Bright yellow color for stylish appearance
  
  // Check if title already contains character name to avoid duplication
  let displayTitle;
  if (title && title.toLowerCase().includes(characterName.toLowerCase())) {
    // Title already contains character name, use as is
    displayTitle = title;
  } else {
    // Title doesn't contain character name, prepend it
    displayTitle = title ? `${characterName}'s ${title}` : `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)}`;
  }
  
  displayTitle = displayTitle.toUpperCase()
  
  // Calculate responsive text positioning based on title.png dimensions
  const titleBgAspectRatio = 2.5;
  const titleBgHeight = titleFrameHeight;
  const titleBgWidth = titleBgHeight * titleBgAspectRatio;
  const titleBgX = titleFrameX + (titleFrameWidth - titleBgWidth) / 2;
  
  // Text area within the title.png background - centered both vertically and horizontally
  const textAreaWidth = titleBgWidth * 0.7; // Use 70% of title.png width for text
  const textAreaX = titleBgX + (titleBgWidth * 0.15); // 15% margin from left edge for better centering
  
  // Responsive font sizing
  // let titleFontSize = Math.min(38, Math.floor(titleBgHeight * 0.4)); // Responsive font size
  let titleFontSize = 50;
  pdf.setFontSize(titleFontSize);
  
  // Split title to fit within title.png background
  let titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  
  // Adjust font size if text is too long
  if (titleLines.length > 2) {
    // titleFontSize = Math.min(35, Math.floor(titleBgHeight * 0.45));
    titleFontSize = 45
    pdf.setFontSize(titleFontSize);
    titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  }
  
  // Perfect center text within title.png background
  const lineHeight = 16; // Increased from 10 to 16 for better line spacing
  const totalTextHeight = titleLines.length * lineHeight;
  const textStartY = titleFrameY + (titleBgHeight - totalTextHeight) / 2; // Perfect vertical center
  
  titleLines.forEach((line, i) => {
    const lineY = textStartY + (i * lineHeight);
    
    // Add shadow effect - draw black text slightly offset
    pdf.setTextColor(0, 0, 0); // Black shadow
    pdf.text(line, titleBgX + (titleBgWidth / 2) + 2, lineY + 17, { align: 'center' });
    
    // Draw main text in bright yellow on top
    pdf.setTextColor(255, 193, 7); // Bright yellow color
    pdf.text(line, titleBgX + (titleBgWidth / 2), lineY + 15, { align: 'center' });
  });
  
  // Add "Powered by" text at bottom right with white background
  addPoweredByText(pdf, pageWidth, pageHeight);
  
  // Now start the comic panels on a new page (no background)
  pdf.addPage();
  
  // Handle both pre-parsed panels (single source of truth) and raw story (backward compatibility)
  let panelsToShow: string[];
  
  if (Array.isArray(storyData)) {
    // Use pre-parsed panels directly (single source of truth)
    console.log('🔍 PDF Generator: Using pre-parsed panels for PDF:', storyData.length, 'panels');
    console.log('🔍 PDF Generator: Panel texts:', storyData);
    panelsToShow = storyData;
  } else {
    // Parse raw story (backward compatibility)
    //console.log('Parsing raw story for PDF (backward compatibility)');
    const allPanels: string[] = [];
    const pages = storyData.split('---').map(page => page.trim()).filter(page => page.length > 0);
    
    pages.forEach((page) => {
      const lines = page.split('\n').filter(line => line.trim());
      let currentPanel = '';
      let inPanel = false;
      
      for (const line of lines) {
        if (line.includes('**Panel') && line.includes(':**')) {
          if (currentPanel.trim()) {
            allPanels.push(currentPanel.trim());
          }
          currentPanel = line.replace(/\*\*Panel \d+:\*\*/, '').trim();
          inPanel = true;
        } else if (inPanel && !line.includes('**Page') && !line.includes('**Panel')) {
          currentPanel += ' ' + line.trim();
        }
      }
      
      if (currentPanel.trim()) {
        allPanels.push(currentPanel.trim());
      }
    });
    
    panelsToShow = allPanels;
    //console.log('Parsed panels from raw story:', panelsToShow.length, 'panels');
  }
  
  if (viewMode === 'split') {
    // Split view: 1 panel per page for better readability
    const panelWidth = pageWidth - 2 * margin;
    const panelHeight = 200; // Bigger panels since only 1 per page
    const panelsPerPage = 1; // Only 1 panel per page in split mode
    const totalPages = Math.ceil(panelsToShow.length / panelsPerPage);
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) { pdf.addPage(); }
      // Decorations (same as before)
  //     pdf.setFillColor(240, 248, 255);
  //     pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  //     pdf.setFillColor(173, 216, 230);
  //     pdf.roundedRect(pageWidth/2 - 60, 10, 120, 20, 8, 8, 'F');
  //     pdf.setDrawColor(70, 130, 180);
  //     pdf.roundedRect(pageWidth/2 - 60, 10, 120, 20, 8, 8);
  //     pdf.setFontSize(13);
  //     pdf.setTextColor(70, 130, 180);
  // pdf.setFont('helvetica', 'bold');
      // pdf.text('Comic Panels', pageWidth / 2, 24, { align: 'center' });
      // Panels
      const startPanelIndex = pageNum * panelsPerPage;
      const endPanelIndex = Math.min(startPanelIndex + panelsPerPage, panelsToShow.length);
      for (let panelIndex = startPanelIndex; panelIndex < endPanelIndex; panelIndex++) {
        const panelText = panelsToShow[panelIndex];
        const cleanText = cleanPanelTextForDisplay(panelText);
        const y = margin + (panelIndex - startPanelIndex) * (panelHeight + margin);
        const x = margin;
        // Stylish non-rounded border
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(3);
        pdf.rect(x, y, panelWidth, panelHeight);
        pdf.setFillColor(255, 250, 240);
        pdf.rect(x+2, y+2, panelWidth-4, panelHeight-4, 'F');
        
        // Add stylish corner accents
        pdf.setFillColor(255, 140, 0); // Orange accent
        const cornerSize = 8;
        // Top-left corner
        pdf.rect(x+3, y+3, cornerSize, cornerSize, 'F');
        // Top-right corner
        pdf.rect(x+panelWidth-11, y+3, cornerSize, cornerSize, 'F');
        // Bottom-left corner
        pdf.rect(x+3, y+panelHeight-11, cornerSize, cornerSize, 'F');
        // Bottom-right corner
        pdf.rect(x+panelWidth-11, y+panelHeight-11, cornerSize, cornerSize, 'F');
        // Image
        const imageUrl = imagesArray[panelIndex];
        const imageWidth = panelWidth - 6;
        const imageHeight = 120; // Bigger image since we have more space
        const imageX = x + 3;
        const imageY = y + 5;
        debugger
        if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
          try {
            const imageDataUrl = await imageToDataURL(imageUrl);
            pdf.addImage(imageDataUrl, 'JPEG', imageX, imageY, imageWidth, imageHeight);
          } catch (error) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Image conversion failed', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
        } else {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text('Image not available', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        // Text
        const textX = x + 3;
        const textY = imageY + imageHeight + 15;
        const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 20);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(14); // Bigger font for better readability
        useComicStyleFont(pdf, 'normal');
        pdf.setTextColor(255, 193, 7); // Bright yellow for panel text
        const textLines = pdf.splitTextToSize(cleanText, textWidth - 4);
        const lineHeight = 5;
        const maxLines = Math.floor(textHeight / lineHeight);
        const displayLines = textLines.slice(0, maxLines);
        for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
          const lineY = textY + (lineIndex * lineHeight);
          if (lineY < textY + textHeight - lineHeight) {
            pdf.text(displayLines[lineIndex], textX + 2, lineY);
          }
        }
        if (textLines.length > maxLines) {
          const lastLineY = textY + ((maxLines - 1) * lineHeight);
          pdf.text('...', textX + textWidth - 10, lastLineY);
        }
      }
      // Page number removed - no longer needed
    }
  } else if (viewMode === 'fullscreen') {
    // Fullscreen view: 1 panel per page with image as full background
    console.log('🔍 PDF Generator: Fullscreen view - Total panels:', panelsToShow.length);
    
    for (let panelIndex = 0; panelIndex < panelsToShow.length; panelIndex++) {
      if (panelIndex > 0) { pdf.addPage(); }
      
      const panelText = panelsToShow[panelIndex];
      const cleanText = cleanPanelTextForDisplay(panelText);
      const imageUrl = imagesArray[panelIndex];
      
      // Add panel image as full background
      if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
        try {
          const imageDataUrl = imageUrl; // await imageToDataURL(imageUrl);
          pdf.addImage(imageDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch (error) {
          console.log('🔍 PDF Generator: Failed to add background image for panel', panelIndex, error);
          // Fallback to white background
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        }
      } else {
        // Fallback to white background if no image
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }
      
      // Add gradient background behind text at bottom of page
      const gradientStartY = pageHeight * 0.75; // Start at 3/4th of page
      const gradientHeight = pageHeight - gradientStartY;
      
      // Load and add gradient background image
      try {
        const gradientDataUrl = await imageToDataURL('/pdf-bg/gradient.png');
        pdf.addImage(gradientDataUrl, 'PNG', 0, gradientStartY, pageWidth, gradientHeight);
      } catch (error) {
        console.log('🔍 PDF Generator: Failed to add gradient background, using fallback', error);
        // Fallback to a simple gradient effect
        pdf.setFillColor(245, 245, 245); // Very light gray to simulate transparency (245/255 ≈ 0.96, so 4% opacity)
        pdf.rect(0, gradientStartY, pageWidth, gradientHeight, 'F');
      }
      
      // Add panel text at bottom with minimal padding/margins
      const textMargin = 8; // Reduced from 20 to 8 for minimal margins like the image
      const textWidth = pageWidth - (textMargin * 2);
      const textY = gradientStartY + 8; // Reduced from 20 to 8 for minimal top margin like the image
      
      useComicStyleFont(pdf, 'normal');
      pdf.setFontSize(10); // Match ComicPanel text-[10px]
      pdf.setTextColor(255, 255, 255); // White text like ComicPanel
      
      // Keep original gradient background (no black overlay)
      // The gradient background is already added above with the original properties
      
      const textLines = pdf.splitTextToSize(cleanText, textWidth);
      const lineHeight = 6; // Reduced from 8 to 6 for tighter spacing like the image
      const maxLines = Math.floor((gradientHeight - 16) / lineHeight); // Reduced from 20 to 16 for minimal padding
      const displayLines = textLines.slice(0, maxLines);
      
      for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * lineHeight);
        pdf.text(displayLines[lineIndex], textMargin, lineY);
      }
      
      if (textLines.length > maxLines) {
        const lastLineY = textY + ((maxLines - 1) * lineHeight);
        pdf.text('...', textMargin + textWidth - 20, lastLineY);
      }
      
      // Page number removed - no longer needed
    }
  } else {
    // Grid view: 2x2 grid (4 panels per page) - Optimized for larger panels and smaller font
    const reducedMargin = 8; // Reduced from 12 to 8 for tighter spacing
    const panelWidth = (pageWidth - reducedMargin * 3) / 2;
    const panelHeight = 125; // Reduced from 130 to 125 to fit within page
    const panelsPerPage = 4; // 2x2 grid per page
    const totalPages = Math.ceil(panelsToShow.length / panelsPerPage);
    console.log('🔍 PDF Generator: Grid view - Total panels:', panelsToShow.length, 'Total pages:', totalPages);
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) { pdf.addPage(); }
      // Decorations (same as before)
      // pdf.setFillColor(240, 248, 255);
      // pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      // pdf.setFillColor(173, 216, 230);
      // pdf.roundedRect(pageWidth/2 - 60, 10, 120, 20, 8, 8, 'F');
      // pdf.setDrawColor(70, 130, 180);
      // pdf.roundedRect(pageWidth/2 - 60, 10, 120, 20, 8, 8);
      // pdf.setFontSize(13);
      // pdf.setTextColor(70, 130, 180);
      // pdf.setFont('helvetica', 'bold');
      // pdf.text('Comic Panels', pageWidth / 2, 24, { align: 'center' });
    const startY = 20; // Reduced from 25 to 20 for more space
      const startPanelIndex = pageNum * panelsPerPage;
      const endPanelIndex = Math.min(startPanelIndex + panelsPerPage, panelsToShow.length);
      for (let panelIndex = startPanelIndex; panelIndex < endPanelIndex; panelIndex++) {
    const panelText = panelsToShow[panelIndex];
    const cleanText = cleanPanelTextForDisplay(panelText);
    console.log('🔍 PDF Generator: Processing panel', panelIndex, 'with text:', panelText?.substring(0, 50) + '...');
        const pagePanelIndex = panelIndex - startPanelIndex;
        const row = Math.floor(pagePanelIndex / 2);
        const col = pagePanelIndex % 2;
    const x = reducedMargin + col * (panelWidth + reducedMargin);
    const y = startY + row * (panelHeight + reducedMargin);
        // Stylish non-rounded border
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(3);
        pdf.rect(x, y, panelWidth, panelHeight);
        pdf.setFillColor(255, 250, 240);
        pdf.rect(x+2, y+2, panelWidth-4, panelHeight-4, 'F');
        
        // Add stylish corner accents
        pdf.setFillColor(255, 140, 0); // Orange accent
        const cornerSize = 6;
        // Top-left corner
        pdf.rect(x+3, y+3, cornerSize, cornerSize, 'F');
        // Top-right corner
        pdf.rect(x+panelWidth-9, y+3, cornerSize, cornerSize, 'F');
        // Bottom-left corner
        pdf.rect(x+3, y+panelHeight-9, cornerSize, cornerSize, 'F');
        // Bottom-right corner
        pdf.rect(x+panelWidth-9, y+panelHeight-9, cornerSize, cornerSize, 'F');
    const imageUrl = imagesArray[panelIndex];
    const imageWidth = panelWidth - 6;
        const imageHeight = 70; // Increased from 60 to 70
    const imageX = x + 3;
    const imageY = y + 5;
    if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
      try {
        const imageDataUrl = imageUrl //await imageToDataURL(imageUrl);
        pdf.addImage(imageDataUrl, 'JPEG', imageX, imageY, imageWidth, imageHeight);
      } catch (error) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
            pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Image conversion failed', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
    } else {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
          pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Image not available', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
    }
    const textX = x + 3;
        const textY = imageY + imageHeight + 6; // Reduced from 8 to 6 for tighter spacing
    const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 10); // Reduced from 12 to 10 for more text space
    pdf.setFillColor(255, 255, 255);
    pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        
        // Remove blank lines and normalize text
        const normalizedText = cleanText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        // Dynamic font size and line height calculation for optimal text fitting
        let fontSize = 9;
        let lineHeight = 4;
        
        // Calculate how many lines we can fit with current settings
        pdf.setFontSize(fontSize);
        const textLines = pdf.splitTextToSize(normalizedText, textWidth - 4);
        let maxLines = Math.floor(textHeight / lineHeight);
        
        // If text doesn't fit, reduce font size and recalculate
        while (textLines.length > maxLines && fontSize > 7) {
          fontSize--;
          pdf.setFontSize(fontSize);
          const adjustedTextLines = pdf.splitTextToSize(normalizedText, textWidth - 4);
          lineHeight = Math.max(3, fontSize * 0.4); // Dynamic line height based on font size
          maxLines = Math.floor(textHeight / lineHeight);
          
          // If still doesn't fit, reduce line height further
          if (adjustedTextLines.length > maxLines) {
            lineHeight = Math.max(2.5, lineHeight * 0.9); // Reduce line height slightly
            maxLines = Math.floor(textHeight / lineHeight);
          }
        }
        
        // Get final text lines with optimal settings
        const finalTextLines = pdf.splitTextToSize(normalizedText, textWidth - 4);
        const finalLineHeight = Math.max(2.5, fontSize * 0.4);
        const finalMaxLines = Math.floor(textHeight / finalLineHeight);
        
        // Display all text lines that fit within the available space
        const displayLines = finalTextLines.slice(0, finalMaxLines);
        
        useComicStyleFont(pdf, 'normal');
        pdf.setTextColor(255, 193, 7); // Bright yellow for panel text
        
        for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
          const lineY = textY + (lineIndex * finalLineHeight);
          if (lineY < textY + textHeight - finalLineHeight) {
            pdf.text(displayLines[lineIndex], textX + 2, lineY);
          }
        }
        
        // If text still doesn't fit completely, show a subtle indicator
        if (finalTextLines.length > finalMaxLines) {
          const lastLineY = textY + ((finalMaxLines - 1) * finalLineHeight);
          // Show a small indicator that more text exists
          pdf.setFontSize(6);
          pdf.setTextColor(255, 140, 0); // Orange color for indicator
          pdf.text('...', textX + textWidth - 8, lastLineY);
          // Reset font size for next panel
          pdf.setFontSize(fontSize);
        }
      }
      // Page number removed - no longer needed
    }
  }
  
  // Back Cover Page
  pdf.addPage();
  pdf.addImage(bgDataUrlBack, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  // Add "Powered by" text to back cover
  addPoweredByText(pdf, pageWidth, pageHeight);
  
  //console.log('PDF generation completed');
  return pdf;
};

export const generateCuratedStoryPDF = async (
  panels: Array<{
    panel_text: string;
    aws_s3_image_url?: string | null;
    file_url?: string | null;
  }>,
  characterName: string,
  characterPhoto: string | null,
  genre: string,
  viewMode: 'grid' | 'split' | 'fullscreen' = 'grid',
  title?: string,
  front_page_img_url_portrait?: string,
  back_page_image_url?: string
): Promise<jsPDF> => {
  const pdf = new jsPDF();
  debugger;

  // Set default font to avoid any font-related issues
  pdf.setFont('helvetica', 'normal');
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Load background images
  let bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
  let bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  
  // Use custom front and back page images if provided
  if (front_page_img_url_portrait) {
    bgImageFrontUrl = front_page_img_url_portrait;
    console.log('🔍 Curated PDF Generator: Using custom front page image:', front_page_img_url_portrait);
  } else {
    // Normalize genre to handle different spellings and cases
    const normalizedGenre = genre?.toLowerCase().trim();
    console.log('🔍 Curated PDF Generator: Genre received:', genre, 'Normalized:', normalizedGenre);
    
    if (normalizedGenre === 'fairytale') {
      bgImageFrontUrl = '/pdf-bg/fairy_front.jpg';
      bgImageBackUrl = '/pdf-bg/fairy_back.jpg';
      console.log('🔍 Curated PDF Generator: Using fairy tale background');
    } else if (normalizedGenre === 'adventure') {
      bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
      bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
      console.log('🔍 Curated PDF Generator: Using adventure background');
    } else if (normalizedGenre === 'mystery') {
      bgImageFrontUrl = '/pdf-bg/mystery_front.jpeg';
      bgImageBackUrl = '/pdf-bg/mystery_back.jpeg';
      console.log('🔍 Curated PDF Generator: Using mystery background');
    } else if (normalizedGenre === 'humour' || normalizedGenre === 'humor') {
      bgImageFrontUrl = '/pdf-bg/comic_front.jpg';
      bgImageBackUrl = '/pdf-bg/comic_back.jpg';
      console.log('🔍 Curated PDF Generator: Using humour/comic background');
    } else {
      console.log('🔍 Curated PDF Generator: Unknown genre, using default adventure background');
    }
  }
  
  // Use custom back page image if provided
  if (back_page_image_url) {
    bgImageBackUrl = back_page_image_url;
    console.log('🔍 Curated PDF Generator: Using custom back page image:', back_page_image_url);
  }
  debugger;
  const bgDataUrlFront = await imageToDataURL(bgImageFrontUrl);
  const bgDataUrlBack = await imageToDataURL(bgImageBackUrl);

  // Front Cover Page - Start background from -30 from bottom
  pdf.addImage(bgDataUrlFront, 'JPEG', 0, -30, pageWidth, pageHeight + 30);
  
  // Title section removed - no longer needed
  
  // Start comic panels on new page
  pdf.addPage();
  
  // Extract panel texts and image URLs
  const panelTexts = panels.map(panel => panel.panel_text || '');
  const imageUrls = panels.map(panel => panel.aws_s3_image_url || panel.file_url);

  if (viewMode === 'split') {
    // Split view: 1 panel per page
    for (let panelIndex = 0; panelIndex < panelTexts.length; panelIndex++) {
      if (panelIndex > 0) { pdf.addPage(); }
      
      const panelText = panelTexts[panelIndex];
      const imageUrl = imageUrls[panelIndex];
      const cleanText = panelText.replace(/\*\*Panel \d+:\*\*/, '').trim();
      
      const panelWidth = pageWidth - 2 * margin;
      const panelHeight = 200;
      const x = margin;
      const y = margin;
      
      // Stylish non-rounded panel border
      pdf.setDrawColor(255, 182, 193);
      pdf.setLineWidth(3);
      pdf.rect(x, y, panelWidth, panelHeight);
      pdf.setFillColor(255, 250, 240);
      pdf.rect(x+2, y+2, panelWidth-4, panelHeight-4, 'F');
      
      // Add stylish corner accents
      pdf.setFillColor(255, 140, 0); // Orange accent
      const cornerSize = 8;
      // Top-left corner
      pdf.rect(x+3, y+3, cornerSize, cornerSize, 'F');
      // Top-right corner
      pdf.rect(x+panelWidth-11, y+3, cornerSize, cornerSize, 'F');
      // Bottom-left corner
      pdf.rect(x+3, y+panelHeight-11, cornerSize, cornerSize, 'F');
      // Bottom-right corner
      pdf.rect(x+panelWidth-11, y+panelHeight-11, cornerSize, cornerSize, 'F');
      
      // Image
      const imageWidth = panelWidth - 6;
      const imageHeight = 120;
      const imageX = x + 3;
      const imageY = y + 5;
      
      if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
        try {
          const imageDataUrl = await imageToDataURL(imageUrl);
          pdf.addImage(imageDataUrl, 'JPEG', imageX, imageY, imageWidth, imageHeight);
        } catch (error) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text('Image conversion failed', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Image not available', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
      
      // Text
      const textX = x + 3;
      const textY = imageY + imageHeight + 15;
      const textWidth = panelWidth - 6;
      const textHeight = panelHeight - (imageHeight + 20);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
      pdf.setFontSize(14);
      useComicStyleFont(pdf, 'normal');
      pdf.setTextColor(0, 0, 0);
      const textLines = pdf.splitTextToSize(cleanText, textWidth - 4);
      const lineHeight = 5;
      const maxLines = Math.floor(textHeight / lineHeight);
      const displayLines = textLines.slice(0, maxLines);
      for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * lineHeight);
        if (lineY < textY + textHeight - lineHeight) {
          pdf.text(displayLines[lineIndex], textX + 2, lineY);
        }
      }
      if (textLines.length > maxLines) {
        const lastLineY = textY + ((maxLines - 1) * lineHeight);
        pdf.text('...', textX + textWidth - 10, lastLineY);
      }
      
      // Page number removed - no longer needed
    }
  } else if (viewMode === 'fullscreen') {
    // Fullscreen view: 1 panel per page with image as full background
    console.log('🔍 Curated PDF Generator: Fullscreen view - Total panels:', panelTexts.length);
    
    for (let panelIndex = 0; panelIndex < panelTexts.length; panelIndex++) {
      if (panelIndex > 0) { pdf.addPage(); }
      
      const panelText = panelTexts[panelIndex];
      const imageUrl = imageUrls[panelIndex];
      const cleanText = panelText.replace(/\*\*Panel \d+:\*\*/, '').trim();
      
      // Remove blank lines and normalize text
      const normalizedText = cleanText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      // Add panel image as full background
      if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
        try {
          const imageDataUrl = await imageToDataURL(imageUrl);
          pdf.addImage(imageDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch (error) {
          console.log('🔍 Curated PDF Generator: Failed to add background image for panel', panelIndex, error);
          // Fallback to white background
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        }
      } else {
        // Fallback to white background if no image
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }
      
      // Calculate text dimensions first to determine gradient height
      const textMargin = 8; // Reduced from 20 to 8 for minimal margins like the image
      const textWidth = pageWidth - (textMargin * 2);
      
      // Start with a reasonable font size and line height
      let fontSize = 10; // Match ComicPanel text-[10px]
      let lineHeight = 6; // Reduced from 8 to 6 for tighter spacing like the image
      
      // Calculate how much space the text needs
      pdf.setFontSize(fontSize);
      const textLines = pdf.splitTextToSize(normalizedText, textWidth);
      const totalTextHeight = textLines.length * lineHeight;
      
      // If text is too long, reduce font size and recalculate
      while (totalTextHeight > pageHeight * 0.25 && fontSize > 8) { // Increased from 0.2 to 0.25 for more text space
        fontSize--;
        pdf.setFontSize(fontSize);
        const newTextLines = pdf.splitTextToSize(normalizedText, textWidth);
        lineHeight = Math.max(4, fontSize * 0.6); // Reduced from 0.7 to 0.6 for tighter spacing
        const newTotalHeight = newTextLines.length * lineHeight;
        if (newTotalHeight <= pageHeight * 0.25) {
          break;
        }
      }
      
      // Recalculate final text lines with optimal settings
      const finalTextLines = pdf.splitTextToSize(normalizedText, textWidth);
      const finalLineHeight = Math.max(4, fontSize * 0.6);
      const finalTextHeight = finalTextLines.length * finalLineHeight;
      
      // Position gradient background to fit text perfectly with minimal padding
      const gradientStartY = pageHeight - finalTextHeight - 16; // Reduced from 20 to 16 for minimal padding
      const gradientHeight = finalTextHeight + 16; // Reduced from 20 to 16 for minimal padding
      
      // Load and add gradient background image
      try {
        const gradientDataUrl = await imageToDataURL('/pdf-bg/gradient.png');
        pdf.addImage(gradientDataUrl, 'PNG', 0, gradientStartY, pageWidth, gradientHeight);
        pdf.setGState(pdf.GState({ opacity: 0.5 }));
      } catch (error) {
        console.log('🔍 Curated PDF Generator: Failed to add gradient background, using fallback', error);
        // Fallback to a translucent gradient effect with 0.3 opacity
        pdf.setFillColor(245, 245, 245); // Very light gray to simulate transparency (245/255 ≈ 0.96, so 4% opacity)
        pdf.rect(0, gradientStartY, pageWidth, gradientHeight, 'F');
      }
      
      // Add panel text with minimal padding/margins
      const textY = gradientStartY + 8; // Reduced from 20 to 8 for minimal top margin like the image
      
      useComicStyleFont(pdf, 'normal');
      pdf.setFontSize(10); // Match ComicPanel text-[10px]
      
      // Draw text in white like ComicPanel (no shadow)
      pdf.setTextColor(255, 255, 255); // White text like ComicPanel text-white
      for (let lineIndex = 0; lineIndex < finalTextLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * finalLineHeight);
        pdf.text(finalTextLines[lineIndex], textMargin, lineY);
      }
      
      // Page number removed - no longer needed
    }
  } else {
    // Grid view: 2x2 grid (4 panels per page) - Optimized for larger panels and smaller font
    const reducedMargin = 8; // Reduced from 12 to 8 for tighter spacing
    const panelWidth = (pageWidth - reducedMargin * 3) / 2;
    const panelHeight = 125; // Reduced from 130 to 125 to fit within page
    const panelsPerPage = 4; // 2x2 grid per page
    const totalPages = Math.ceil(panelTexts.length / panelsPerPage);
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) { pdf.addPage(); }
      
      const startY = 20; // Reduced from 25 to 20 for more space
      const startPanelIndex = pageNum * panelsPerPage;
      const endPanelIndex = Math.min(startPanelIndex + panelsPerPage, panelTexts.length);
      
      console.log(`🔍 Curated PDF: Page ${pageNum + 1} - Processing panels ${startPanelIndex} to ${endPanelIndex - 1}`);
      
      for (let panelIndex = startPanelIndex; panelIndex < endPanelIndex; panelIndex++) {
        const panelText = panelTexts[panelIndex];
        const imageUrl = imageUrls[panelIndex];
        const cleanText = panelText.replace(/\*\*Panel \d+:\*\*/, '').trim();
        
        console.log(`🔍 Curated PDF: Processing panel ${panelIndex + 1} with image: ${!!imageUrl}`);
        
        const pagePanelIndex = panelIndex - startPanelIndex;
        const row = Math.floor(pagePanelIndex / 2);
        const col = pagePanelIndex % 2;
        const x = reducedMargin + col * (panelWidth + reducedMargin);
        const y = startY + row * (panelHeight + reducedMargin);
        
        // Stylish non-rounded panel border
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(3);
        pdf.rect(x, y, panelWidth, panelHeight);
        pdf.setFillColor(255, 250, 240);
        pdf.rect(x+2, y+2, panelWidth-4, panelHeight-4, 'F');
        
        // Add stylish corner accents
        pdf.setFillColor(255, 140, 0); // Orange accent
        const cornerSize = 6;
        // Top-left corner
        pdf.rect(x+3, y+3, cornerSize, cornerSize, 'F');
        // Top-right corner
        pdf.rect(x+panelWidth-9, y+3, cornerSize, cornerSize, 'F');
        // Bottom-left corner
        pdf.rect(x+3, y+panelHeight-9, cornerSize, cornerSize, 'F');
        // Bottom-right corner
        pdf.rect(x+panelWidth-9, y+panelHeight-9, cornerSize, cornerSize, 'F');
        
        // Image
        const imageWidth = panelWidth - 6;
        const imageHeight = 70; // Increased from 60 to 70
        const imageX = x + 3;
        const imageY = y + 5;
        
        if (imageUrl && imageUrl !== 'undefined' && imageUrl !== null) {
          try {
            const imageDataUrl = imageUrl //await imageToDataURL(imageUrl);
            pdf.addImage(imageDataUrl, 'JPEG', imageX, imageY, imageWidth, imageHeight);
          } catch (error) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Image conversion failed', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
        } else {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(imageX, imageY, imageWidth, imageHeight, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text('Image not available', imageX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        // Text
        const textX = x + 3;
        const textY = imageY + imageHeight + 6; // Reduced from 8 to 6 for tighter spacing
        const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 10); // Reduced from 12 to 10 for more text space
        pdf.setFillColor(255, 255, 255);
        pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(9); // Reduced from 11 to 9 for smaller text to fit more
        useComicStyleFont(pdf, 'normal');
        pdf.setTextColor(255, 193, 7); // Bright yellow for panel text
        const textLines = pdf.splitTextToSize(cleanText, textWidth - 4);
        const lineHeight = 3; // Reduced from 14 to 3 for tighter line spacing
        const maxLines = Math.floor(textHeight / lineHeight);
        const displayLines = textLines.slice(0, maxLines);
        for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
          const lineY = textY + (lineIndex * lineHeight);
          if (lineY < textY + textHeight - lineHeight) {
            pdf.text(displayLines[lineIndex], textX + 2, lineY);
          }
        }
        if (textLines.length > maxLines) {
          const lastLineY = textY + ((maxLines - 1) * lineHeight);
          pdf.text('...', textX + textWidth - 10, lastLineY);
        }
      }
      
      // Page number removed - no longer needed
    }
  }
  
  // Back Cover Page
  pdf.addPage();
  pdf.addImage(bgDataUrlBack, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  // Add "Powered by" text to back cover
  addPoweredByText(pdf, pageWidth, pageHeight);
  
  console.log('🔍 Curated PDF generation completed');
  return pdf;
};
