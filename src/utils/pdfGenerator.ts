import jsPDF from 'jspdf';
import { imageToDataURL } from './imageConverter';

export const generateComicPDF = async (
  storyData: string | string[], // Accept either raw story or pre-parsed panels
  characterName: string,
  characterPhoto: string | null,
  genre: string,
  generatedImages: {[key: string]: string} | (string | null)[],
  hfApiKey: string,
  cleanPanelTextForDisplay: (text: string) => string,
  viewMode: 'grid' | 'split' = 'grid',
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
  console.log('genre ----- -- ------- --- - -', genre);
  if (genre === 'fairytale') {
    bgImageFrontUrl = '/pdf-bg/fairy_front.jpeg';
    bgImageBackUrl = '/pdf-bg/fairy_back.jpeg';
  } else if (genre === 'adventure') {
    bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
    bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  } else if (genre === 'mystery') {
    bgImageFrontUrl = '/pdf-bg/mystery_front.jpeg';
    bgImageBackUrl = '/pdf-bg/mystery_back.jpeg';
  } else if (genre === 'humor') {
    bgImageFrontUrl = '/pdf-bg/comic_front.jpeg';
    bgImageBackUrl = '/pdf-bg/comic_back.jpeg';
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
  
  // Front Cover Page
  pdf.addImage(bgDataUrlFront, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  // Add title in center below photo
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text for better visibility
  let displayTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`;
  let titleFontSize = 28;
  let titleY = pageHeight / 2 + 40;
  pdf.setFontSize(titleFontSize);
  // Split title if too long
  let titleLines = pdf.splitTextToSize(displayTitle, pageWidth - 40);
  if (titleLines.length > 2) {
    // If still too many lines, reduce font size
    titleFontSize = 22;
    pdf.setFontSize(titleFontSize);
    titleLines = pdf.splitTextToSize(displayTitle, pageWidth - 40);
  }
  // Center each line
  titleLines.forEach((line, i) => {
    pdf.text(line, pageWidth / 2, titleY + i * (titleFontSize + 2), { align: 'center' });
  });
  
  // Add character photo if available
  if (characterPhoto) {
    try {
      //console.log('Adding character photo to PDF...');
      const characterDataUrl = await imageToDataURL(characterPhoto);
      pdf.addImage(characterDataUrl, 'JPEG', pageWidth / 2 - 30, pageHeight / 2 - 50, 60, 60);
      //console.log('Character photo added successfully');
    } catch (error) {
      //console.log('Could not add character photo to PDF:', error);
    }
  }
  
  // Add "Powered by storymaker.jcool.in" at bottom
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Powered by storymaker.jcool.in', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Add hyperlink to the text (opens in new tab)
  pdf.link(pageWidth / 2 - 50, pageHeight - 25, 100, 10, { url: 'https://storymaker.jcool.in', target: '_blank' });
  
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
        // Fancy border
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, panelWidth, panelHeight, 8, 8);
        pdf.setFillColor(255, 250, 240);
        pdf.roundedRect(x+1, y+1, panelWidth-2, panelHeight-2, 7, 7, 'F');
        // Image
        const imageUrl = imagesArray[panelIndex];
        const imageWidth = panelWidth - 6;
        const imageHeight = 120; // Bigger image since we have more space
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
  } else {
    // Grid view: 2x2 grid (4 panels per page)
  const panelWidth = (pageWidth - margin * 3) / 2;
    const panelHeight = 110;
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
  const startY = 35;
      const startPanelIndex = pageNum * panelsPerPage;
      const endPanelIndex = Math.min(startPanelIndex + panelsPerPage, panelsToShow.length);
      for (let panelIndex = startPanelIndex; panelIndex < endPanelIndex; panelIndex++) {
    const panelText = panelsToShow[panelIndex];
    const cleanText = cleanPanelTextForDisplay(panelText);
    console.log('🔍 PDF Generator: Processing panel', panelIndex, 'with text:', panelText?.substring(0, 50) + '...');
        const pagePanelIndex = panelIndex - startPanelIndex;
        const row = Math.floor(pagePanelIndex / 2);
        const col = pagePanelIndex % 2;
    const x = margin + col * (panelWidth + margin);
    const y = startY + row * (panelHeight + margin);
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, panelWidth, panelHeight, 8, 8);
        pdf.setFillColor(255, 250, 240);
        pdf.roundedRect(x+1, y+1, panelWidth-2, panelHeight-2, 7, 7, 'F');
    const imageUrl = imagesArray[panelIndex];
    const imageWidth = panelWidth - 6;
        const imageHeight = 60;
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
        const textY = imageY + imageHeight + 10;
    const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 15);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(12); // Bigger font
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
  viewMode: 'grid' | 'split' = 'grid',
  title?: string
): Promise<jsPDF> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Load background images
  let bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
  let bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  
  if (genre === 'fairytale') {
    bgImageFrontUrl = '/pdf-bg/fairy_front.jpeg';
    bgImageBackUrl = '/pdf-bg/fairy_back.jpeg';
  } else if (genre === 'adventure') {
    bgImageFrontUrl = '/pdf-bg/adv_front.jpeg';
    bgImageBackUrl = '/pdf-bg/adv_back.jpeg';
  } else if (genre === 'mystery') {
    bgImageFrontUrl = '/pdf-bg/mystery_front.jpeg';
    bgImageBackUrl = '/pdf-bg/mystery_back.jpeg';
  } else if (genre === 'humor') {
    bgImageFrontUrl = '/pdf-bg/comic_front.jpeg';
    bgImageBackUrl = '/pdf-bg/comic_back.jpeg';
  }
      
  const bgDataUrlFront = await imageToDataURL(bgImageFrontUrl);
  const bgDataUrlBack = await imageToDataURL(bgImageBackUrl);

  // Front Cover Page
  pdf.addImage(bgDataUrlFront, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  // Add title
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  let displayTitle = title || `${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`;
  let titleFontSize = 28;
  let titleY = pageHeight / 2 + 40;
  pdf.setFontSize(titleFontSize);
  let titleLines = pdf.splitTextToSize(displayTitle, pageWidth - 40);
  if (titleLines.length > 2) {
    titleFontSize = 22;
    pdf.setFontSize(titleFontSize);
    titleLines = pdf.splitTextToSize(displayTitle, pageWidth - 40);
  }
  titleLines.forEach((line, i) => {
    pdf.text(line, pageWidth / 2, titleY + i * (titleFontSize + 2), { align: 'center' });
  });
  
  // Add character photo if available
  if (characterPhoto) {
    try {
      const characterDataUrl = await imageToDataURL(characterPhoto);
      pdf.addImage(characterDataUrl, 'JPEG', pageWidth / 2 - 30, pageHeight / 2 - 50, 60, 60);
    } catch (error) {
      console.log('Could not add character photo to PDF:', error);
    }
  }
  
  // Add footer
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Powered by storymaker.jcool.in', pageWidth / 2, pageHeight - 20, { align: 'center' });
  pdf.link(pageWidth / 2 - 50, pageHeight - 25, 100, 10, { url: 'https://storymaker.jcool.in', target: '_blank' });
  
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
      
      // Panel border
      pdf.setDrawColor(255, 182, 193);
      pdf.setLineWidth(2);
      pdf.roundedRect(x, y, panelWidth, panelHeight, 8, 8);
      pdf.setFillColor(255, 250, 240);
      pdf.roundedRect(x+1, y+1, panelWidth-2, panelHeight-2, 7, 7, 'F');
      
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
  } else {
    // Grid view: 2x2 grid (4 panels per page)
    const panelWidth = (pageWidth - margin * 3) / 2;
    const panelHeight = 110;
    const panelsPerPage = 4;
    const totalPages = Math.ceil(panelTexts.length / panelsPerPage);
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) { pdf.addPage(); }
      
      const startY = 35;
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
        const x = margin + col * (panelWidth + margin);
        const y = startY + row * (panelHeight + margin);
        
        // Panel border
        pdf.setDrawColor(255, 182, 193);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, panelWidth, panelHeight, 8, 8);
        pdf.setFillColor(255, 250, 240);
        pdf.roundedRect(x+1, y+1, panelWidth-2, panelHeight-2, 7, 7, 'F');
        
        // Image
        const imageWidth = panelWidth - 6;
        const imageHeight = 60;
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
        const textY = imageY + imageHeight + 10;
        const textWidth = panelWidth - 6;
        const textHeight = panelHeight - (imageHeight + 15);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(textX, textY - 2, textWidth, textHeight, 'F');
        pdf.setFontSize(12);
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
