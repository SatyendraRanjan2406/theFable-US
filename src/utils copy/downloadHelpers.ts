export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareOrCopyContent = async (title: string, content: string): Promise<boolean> => {
  try {
    await navigator.share({
      title,
      text: content,
    });
    return true;
  } catch (error) {
    // Fallback to clipboard
    navigator.clipboard.writeText(content);
    return false;
  }
};

// Download a single image from URL
export const downloadImage = async (imageUrl: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw error;
  }
};

// Download all images as individual files
export const downloadAllImages = async (
  images: (string | null)[],
  characterName: string,
  genre: string
): Promise<void> => {
  const validImages = images.filter((img): img is string => img !== null && img !== undefined);
  
  if (validImages.length === 0) {
    throw new Error('No images available to download');
  }

  // Download each image with a delay to avoid overwhelming the browser
  for (let i = 0; i < validImages.length; i++) {
    const imageUrl = validImages[i];
    const filename = `${characterName}-${genre}-panel-${i + 1}.jpg`;
    
    try {
      await downloadImage(imageUrl, filename);
      // Add small delay between downloads
      if (i < validImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to download image ${i + 1}:`, error);
      // Continue with other downloads even if one fails
    }
  }
};
