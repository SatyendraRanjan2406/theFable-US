import jsPDF from 'jspdf';
import { imageToDataURL } from './imageConverter';
import { getPoweredByText } from '@/config/app';

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
    bgImageFrontUrl = '/pdf-bg/fairy_front.jpg';
    bgImageBackUrl = '/pdf-bg/fairy_back.jpg';
    console.log('🔍 PDF Generator: Using fairy tale background');
  } else if (normalizedGenre === 'adventure') {
    bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
    bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
    console.log('🔍 PDF Generator: Using adventure background');
  } else if (normalizedGenre === 'mystery') {
    bgImageFrontUrl = '/pdf-bg/mystery_front.jpeg';
    bgImageBackUrl = '/pdf-bg/mystery_back.jpeg';
    console.log('🔍 PDF Generator: Using mystery background');
  } else if (normalizedGenre === 'humour' || normalizedGenre === 'humor') {
    bgImageFrontUrl = '/pdf-bg/comic_front.jpg';
    bgImageBackUrl = '/pdf-bg/comic_back.jpg';
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
      pdf.setFillColor(0, 0, 0);
      pdf.roundedRect(borderX + 3, borderY + 3, totalSize, totalSize, 20, 20, 'F');
      
      // Main border frame
      pdf.setFillColor(255, 215, 0); // Gold color for designer border
      pdf.roundedRect(borderX, borderY, totalSize, totalSize, 20, 20, 'F');
      
      // Inner border
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(borderX + borderThickness, borderY + borderThickness, photoSize + (borderPadding * 2), photoSize + (borderPadding * 2), 15, 15, 'F');
      
      // Photo background
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize, 10, 10, 'F');
      
      // Add the photo
      pdf.addImage(characterDataUrl, 'JPEG', borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize);
      
      // Add decorative corner elements to the border
      pdf.setFillColor(255, 140, 0); // Orange accent
      const cornerSize = 6;
      // Top-left corner
      pdf.rect(borderX + 5, borderY + 5, cornerSize, cornerSize, 'F');
      // Top-right corner
      pdf.rect(borderX + totalSize - 11, borderY + 5, cornerSize, cornerSize, 'F');
      // Bottom-left corner
      pdf.rect(borderX + 5, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      // Bottom-right corner
      pdf.rect(borderX + totalSize - 11, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      
    } catch (error) {
      console.log('Could not add character photo to PDF:', error);
    }
  }
  
  // Add title with title.png background frame
  const titleFrameWidth = pageWidth - 80; // Leave 40px margin on each side
  const titleFrameHeight = 70; // Height for title frame
  const titleFrameX = 40; // X position (40px from left)
  const titleFrameY = pageHeight / 2 + 40; // Y position below photo
  
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
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(1);
    pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15, 'F');
    pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15);
    
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
  pdf.setFont('times', 'bold');
  pdf.setTextColor(205, 133, 63); // Golden brown color for stylish appearance
  let displayTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`;
  
  // Calculate responsive text positioning based on title.png dimensions
  const titleBgAspectRatio = 2.5;
  const titleBgHeight = titleFrameHeight;
  const titleBgWidth = titleBgHeight * titleBgAspectRatio;
  const titleBgX = titleFrameX + (titleFrameWidth - titleBgWidth) / 2;
  
  // Text area within the title.png background - centered both vertically and horizontally
  const textAreaWidth = titleBgWidth * 0.7; // Use 70% of title.png width for text
  const textAreaX = titleBgX + (titleBgWidth * 0.15); // 15% margin from left edge for better centering
  
  // Responsive font sizing
  let titleFontSize = Math.min(38, Math.floor(titleBgHeight * 0.4)); // Responsive font size
  pdf.setFontSize(titleFontSize);
  
  // Split title to fit within title.png background
  let titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  
  // Adjust font size if text is too long
  if (titleLines.length > 2) {
    titleFontSize = Math.min(35, Math.floor(titleBgHeight * 0.45));
    pdf.setFontSize(titleFontSize);
    titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  }
  
  // Perfect center text within title.png background
  const lineHeight =10;
  const totalTextHeight = titleLines.length * lineHeight;
  const textStartY = titleFrameY + (titleBgHeight - totalTextHeight) / 2; // Perfect vertical center
  
  titleLines.forEach((line, i) => {
    const lineY = textStartY + (i * lineHeight);
    pdf.text(line, titleBgX + (titleBgWidth / 2), lineY+15, { align: 'center' });
  });
  
  // Add "Powered by" text at bottom right with white background
  const poweredByText = getPoweredByText();
  pdf.setFontSize(18); // Increased font size
  pdf.setFont('helvetica', 'bold'); // Made it bold for better visibility
  pdf.setTextColor(205, 133, 63); // Golden brown color
  
  // Calculate text dimensions for background
  const textWidth = pdf.getTextWidth(poweredByText);
  const textHeight = 8; // Approximate text height
  const padding = 8; // Padding around text
  
  // Position at bottom right
  const textX = pageWidth - textWidth - padding -30; // 20px from right edge
  const textY = pageHeight - 4; // 2px from bottom - moved further down
  
  // Add white background with rounded corners
  pdf.setFillColor(255, 255, 255); // White background
  pdf.setDrawColor(200, 200, 200); // Light gray border
  pdf.setLineWidth(1);
  pdf.roundedRect(textX - padding, textY - textHeight - padding/2, textWidth + padding*4, textHeight + padding, 8, 8, 'F');
  pdf.roundedRect(textX - padding, textY - textHeight - padding/2, textWidth + padding*4, textHeight + padding, 8, 8);
  
  // Add the text
  pdf.text(poweredByText, textX+15, textY, { align: 'left' });
  
  // Add hyperlink to the text (opens in new tab)
  pdf.link(textX - padding, textY - textHeight - padding/2, textWidth + padding*2, textHeight + padding, { url: `https://${import.meta.env.VITE_APP_DOMAIN || 'storymaker.jcool.in'}`, target: '_blank' });
  
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
        const textY = imageY + imageHeight + 15;
        const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 20);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(14); // Bigger font for better readability
        pdf.setFont('helvetica', 'normal');
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
      }
      // Page number
      const pageCircleX = pageWidth - 15;
      const pageCircleY = pageHeight - 5;
      pdf.setFillColor(255, 182, 193);
      pdf.circle(pageCircleX, pageCircleY, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text(`${pageNum + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
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
        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, gradientStartY, pageWidth, gradientHeight, 'F');
      }
      
      // Add panel text at bottom with white color
      const textMargin = 20;
      const textWidth = pageWidth - (textMargin * 2);
      const textY = gradientStartY + 20; // Position text in the gradient area
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12); // Smaller font size
      pdf.setTextColor(255, 255, 255);
      
      const textLines = pdf.splitTextToSize(cleanText, textWidth);
      const lineHeight = 8;
      const maxLines = Math.floor((gradientHeight - 40) / lineHeight);
      const displayLines = textLines.slice(0, maxLines);
      
      for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * lineHeight);
        pdf.text(displayLines[lineIndex], textMargin, lineY);
      }
      
      if (textLines.length > maxLines) {
        const lastLineY = textY + ((maxLines - 1) * lineHeight);
        pdf.text('...', textMargin + textWidth - 20, lastLineY);
      }
      
      // Add page number
      const pageCircleX = pageWidth - 25;
      const pageCircleY = pageHeight - 25;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.circle(pageCircleX, pageCircleY, 12, 'F');
      pdf.circle(pageCircleX, pageCircleY, 12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${panelIndex + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
    }
  } else {
    // Grid view: 2x2 grid (4 panels per page) - Optimized for larger panels and smaller font
    const reducedMargin = 12; // Reduced from 20 to 12
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
    const startY = 25; // Reduced from 35 to 25
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
        const textY = imageY + imageHeight + 8; // Reduced from 10 to 8
    const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 12); // Reduced from 15 to 12
    pdf.setFillColor(255, 255, 255);
    pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(11); // Increased from 10 to 11 for better readability
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const textLines = pdf.splitTextToSize(cleanText, textWidth - 4);
        const lineHeight = 4; // Reduced from 5 to 4
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
      const pageCircleX = pageWidth - 15;
      const pageCircleY = pageHeight - 5;
      pdf.setFillColor(255, 182, 193);
      pdf.circle(pageCircleX, pageCircleY, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`${pageNum + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
    }
  }
  
  // Back Cover Page
  pdf.addPage();
  pdf.addImage(bgDataUrlBack, 'JPEG', 0, 0, pageWidth, pageHeight);
  
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
  title?: string
): Promise<jsPDF> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Load background images
  let bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
  let bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  
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
      
  const bgDataUrlFront = await imageToDataURL(bgImageFrontUrl);
  const bgDataUrlBack = await imageToDataURL(bgImageBackUrl);

  // Front Cover Page - Start background from -30 from bottom
  pdf.addImage(bgDataUrlFront, 'JPEG', 0, -30, pageWidth, pageHeight + 30);
  
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
      pdf.setFillColor(0, 0, 0);
      pdf.roundedRect(borderX + 3, borderY + 3, totalSize, totalSize, 20, 20, 'F');
      
      // Main border frame
      pdf.setFillColor(255, 215, 0); // Gold color for designer border
      pdf.roundedRect(borderX, borderY, totalSize, totalSize, 20, 20, 'F');
      
      // Inner border
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(borderX + borderThickness, borderY + borderThickness, photoSize + (borderPadding * 2), photoSize + (borderPadding * 2), 15, 15, 'F');
      
      // Photo background
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize, 10, 10, 'F');
      
      // Add the photo
      pdf.addImage(characterDataUrl, 'JPEG', borderX + borderThickness + borderPadding, borderY + borderThickness + borderPadding, photoSize, photoSize);
      
      // Add decorative corner elements to the border
      pdf.setFillColor(255, 140, 0); // Orange accent
      const cornerSize = 6;
      // Top-left corner
      pdf.rect(borderX + 5, borderY + 5, cornerSize, cornerSize, 'F');
      // Top-right corner
      pdf.rect(borderX + totalSize - 11, borderY + 5, cornerSize, cornerSize, 'F');
      // Bottom-left corner
      pdf.rect(borderX + 5, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      // Bottom-right corner
      pdf.rect(borderX + totalSize - 11, borderY + totalSize - 11, cornerSize, cornerSize, 'F');
      
    } catch (error) {
      console.log('Could not add character photo to PDF:', error);
    }
  }
  
  // Add title with title.png background frame
  const titleFrameWidth = pageWidth - 80; // Leave 90px margin on each side
  const titleFrameHeight = 70; // Height for title frame
  const titleFrameX = 90; // X position (90px from left)
  const titleFrameY = pageHeight / 2 + 20; // Y position below photo
  
  // Load and add title.png background with transparency
  try {
    const titleBgDataUrl = await imageToDataURL('/pdf-bg/title.png');
    // Calculate aspect ratio to maintain proportions
    const titleBgAspectRatio = 2.5; // Approximate aspect ratio of title.png (width/height)
    const titleBgHeight = titleFrameHeight;
    const titleBgWidth = titleBgHeight * titleBgAspectRatio;
    
    // Center the title background within the available space
    const titleBgX = titleFrameX + (titleFrameWidth - titleBgWidth) / 2;
    const titleBgY = titleFrameY;
    
    // Add a subtle white background behind the title.png for better transparency
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(1);
    pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15, 'F');
    pdf.roundedRect(titleBgX - 5, titleBgY - 1, titleBgWidth + 10, titleBgHeight + 2, 15, 15);
    
    // Add the title.png with transparency support
    // pdf.addImage(titleBgDataUrl, 'PNG', titleBgX, titleBgY, titleBgWidth, titleBgHeight, undefined, 'FAST', 0);
  } catch (error) {
    console.log('🔍 Curated PDF Generator: Failed to add title background, using fallback', error);
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
  pdf.setFont('times', 'bold');
  pdf.setTextColor(205, 133, 63); // Golden brown color for stylish appearance
  let displayTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`;
  
  // Calculate responsive text positioning based on title.png dimensions
  const titleBgAspectRatio = 2.5;
  const titleBgHeight = titleFrameHeight;
  const titleBgWidth = titleBgHeight * titleBgAspectRatio;
  const titleBgX = titleFrameX + (titleFrameWidth - titleBgWidth) / 2;
  
  // Text area within the title.png background - centered both vertically and horizontally
  const textAreaWidth = titleBgWidth * 0.7; // Use 70% of title.png width for text
  const textAreaX = titleBgX + (titleBgWidth * 0.15); // 15% margin from left edge for better centering
  
  // Responsive font sizing
  let titleFontSize = Math.min(38, Math.floor(titleBgHeight * 0.4)); // Responsive font size
  pdf.setFontSize(titleFontSize);
  
  // Split title to fit within title.png background
  let titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  
  // Adjust font size if text is too long
  if (titleLines.length > 2) {
    titleFontSize = Math.min(38, Math.floor(titleBgHeight * 0.45));
    pdf.setFontSize(titleFontSize);
    titleLines = pdf.splitTextToSize(displayTitle, textAreaWidth);
  }
  
  // Perfect center text within title.png background
  const lineHeight = 10;
  const totalTextHeight = titleLines.length * lineHeight;
  const textStartY = titleFrameY + (titleBgHeight - totalTextHeight) / 2; // Perfect vertical center
  
  titleLines.forEach((line, i) => {
    const lineY = textStartY + (i * lineHeight);
    pdf.text(line, titleBgX + (titleBgWidth / 2), lineY, { align: 'center' });
  });
  
  // Add footer - "Powered by" text at bottom right with white background
  const poweredByText = getPoweredByText();
  pdf.setFontSize(16); // Increased font size
  pdf.setFont('helvetica', 'bold'); // Made it bold for better visibility
  pdf.setTextColor(205, 133, 63); // Golden brown color
  
  // Calculate text dimensions for background
  const textWidth = pdf.getTextWidth(poweredByText);
  const textHeight = 8; // Approximate text height
  const padding = 8; // Padding around text
  
  // Position at bottom right
  const textX = pageWidth - textWidth - padding - 20; // 20px from right edge
  const textY = pageHeight - 2; // 2px from bottom - moved further down
  
  // Add white background with rounded corners
  pdf.setFillColor(255, 255, 255); // White background
  pdf.setDrawColor(200, 200, 200); // Light gray border
  pdf.setLineWidth(1);
  pdf.roundedRect(textX - padding, textY - textHeight - padding/2-10, textWidth + padding*2, textHeight + padding, 8, 8, 'F');
  pdf.roundedRect(textX - padding, textY - textHeight - padding/2-10, textWidth + padding*2, textHeight + padding, 8, 8);
  
  // Add the text
  pdf.text(poweredByText, textX, textY, { align: 'left' });
  
  // Add hyperlink to the text (opens in new tab)
  pdf.link(textX - padding, textY - textHeight - padding/2, textWidth + padding*2, textHeight + padding, { url: `https://${import.meta.env.VITE_APP_DOMAIN || 'storymaker.jcool.in'}`, target: '_blank' });
  
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
      pdf.setFont('helvetica', 'normal');
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
      
      // Page number
      const pageCircleX = pageWidth - 15;
      const pageCircleY = pageHeight - 5;
      pdf.setFillColor(255, 182, 193);
      pdf.circle(pageCircleX, pageCircleY, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text(`${panelIndex + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
    }
  } else if (viewMode === 'fullscreen') {
    // Fullscreen view: 1 panel per page with image as full background
    console.log('🔍 Curated PDF Generator: Fullscreen view - Total panels:', panelTexts.length);
    
    for (let panelIndex = 0; panelIndex < panelTexts.length; panelIndex++) {
      if (panelIndex > 0) { pdf.addPage(); }
      
      const panelText = panelTexts[panelIndex];
      const imageUrl = imageUrls[panelIndex];
      const cleanText = panelText.replace(/\*\*Panel \d+:\*\*/, '').trim();
      
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
      
      // Add gradient background behind text at bottom of page
      const gradientStartY = pageHeight * 0.75; // Start at 3/4th of page
      const gradientHeight = pageHeight - gradientStartY;
      
      // Load and add gradient background image
      try {
        const gradientDataUrl = await imageToDataURL('/pdf-bg/gradient.png');
        pdf.addImage(gradientDataUrl, 'PNG', 0, gradientStartY, pageWidth, gradientHeight);
      } catch (error) {
        console.log('🔍 Curated PDF Generator: Failed to add gradient background, using fallback', error);
        // Fallback to a simple gradient effect
        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, gradientStartY, pageWidth, gradientHeight, 'F');
      }
      
      // Add panel text at bottom with white color and subtle shadow
      const textMargin = 20;
      const textWidth = pageWidth - (textMargin * 2);
      const textY = gradientStartY + 20; // Position text in the bottom area
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12); // Smaller font size
      
      // Add subtle text shadow for readability
      pdf.setTextColor(0, 0, 0); // Black shadow
      const shadowOffset = 1;
      const textLines = pdf.splitTextToSize(cleanText, textWidth);
      const lineHeight = 8;
      const maxLines = Math.floor((gradientHeight - 40) / lineHeight);
      const displayLines = textLines.slice(0, maxLines);
      
      // Draw shadow first
      for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * lineHeight);
        pdf.text(displayLines[lineIndex], textMargin + shadowOffset, lineY + shadowOffset);
      }
      
      // Draw main text
      pdf.setTextColor(255, 255, 255); // White text
      for (let lineIndex = 0; lineIndex < displayLines.length; lineIndex++) {
        const lineY = textY + (lineIndex * lineHeight);
        pdf.text(displayLines[lineIndex], textMargin, lineY);
      }
      
      if (textLines.length > maxLines) {
        const lastLineY = textY + ((maxLines - 1) * lineHeight);
        pdf.text('...', textMargin + textWidth - 20, lastLineY);
      }
      
      // Add page number
      const pageCircleX = pageWidth - 25;
      const pageCircleY = pageHeight - 25;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.circle(pageCircleX, pageCircleY, 12, 'F');
      pdf.circle(pageCircleX, pageCircleY, 12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${panelIndex + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
    }
  } else {
    // Grid view: 2x2 grid (4 panels per page) - Optimized for larger panels and smaller font
    const reducedMargin = 12; // Reduced from 20 to 12
    const panelWidth = (pageWidth - reducedMargin * 3) / 2;
    const panelHeight = 125; // Reduced from 130 to 125 to fit within page
    const panelsPerPage = 4;
    const totalPages = Math.ceil(panelTexts.length / panelsPerPage);
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) { pdf.addPage(); }
      
      const startY = 25; // Reduced from 35 to 25
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
        const textY = imageY + imageHeight + 8; // Reduced from 10 to 8
        const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 12); // Reduced from 15 to 12
        pdf.setFillColor(255, 255, 255);
        pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(11); // Increased from 10 to 11 for better readability
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const textLines = pdf.splitTextToSize(cleanText, textWidth - 4);
        const lineHeight = 4; // Reduced from 5 to 4
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
      
      // Page number
      const pageCircleX = pageWidth - 15;
      const pageCircleY = pageHeight - 5;
      pdf.setFillColor(255, 182, 193);
      pdf.circle(pageCircleX, pageCircleY, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`${pageNum + 1}`, pageCircleX, pageCircleY + 3, { align: 'center' });
    }
  }
  
  // Back Cover Page
  pdf.addPage();
  pdf.addImage(bgDataUrlBack, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  console.log('🔍 Curated PDF generation completed');
  return pdf;
};
