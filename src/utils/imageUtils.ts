const MAX_IMAGE_DIMENSION = 200; // Even smaller for maximum speed

export function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const createCircularCrop = (imageElement: HTMLImageElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Small size for fast processing
    const size = Math.min(imageElement.naturalWidth, imageElement.naturalHeight, 150);
    canvas.width = size;
    canvas.height = size;
    
    // Create circular mask
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw image centered and scaled
    const scale = size / Math.min(imageElement.naturalWidth, imageElement.naturalHeight);
    const scaledWidth = imageElement.naturalWidth * scale;
    const scaledHeight = imageElement.naturalHeight * scale;
    const x = (size - scaledWidth) / 2;
    const y = (size - scaledHeight) / 2;
    
    ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);
    
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      'image/png',
      0.5
    );
  });
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix if present
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const compressImageForAPI = (file: File, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions (max 800px on longest side)
      const maxDimension = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with high quality and reduce if needed
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const sizeKB = blob.size / 1024;
            //console.log(`Compressed image size: ${sizeKB.toFixed(1)}KB with quality ${quality}`);
            
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              // Convert blob to File
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              // Reduce quality and try again
              quality -= 0.1;
              tryCompress();
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      tryCompress();
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Ultra-aggressive compression specifically for API base64 payloads
export const compressImageForBase64API = (file: File, maxSizeKB: number = 100): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Much smaller dimensions for API calls (max 400px)
      const maxDimension = 400;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with lower quality for aggressive compression
      let quality = 0.6;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const sizeKB = blob.size / 1024;
            const estimatedBase64SizeKB = (sizeKB * 4) / 3; // Base64 is ~33% larger
            //console.log(`API compression: ${sizeKB.toFixed(1)}KB file → ~${estimatedBase64SizeKB.toFixed(1)}KB base64 with quality ${quality}`);
            
            if (sizeKB <= maxSizeKB || quality <= 0.05) {
              // Convert blob to File
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              //console.log(`Final API image: ${sizeKB.toFixed(1)}KB file, estimated ${estimatedBase64SizeKB.toFixed(1)}KB base64`);
              resolve(compressedFile);
            } else {
              // Reduce quality more aggressively
              quality -= 0.05;
              tryCompress();
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      tryCompress();
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Convert image URL to base64 string
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

// Get the appropriate character image base64 for story generation
export const getSelectedCharacterImageBase64 = async (
  selectedPhotoForStory: string | null,
  isCartoonSelectedForStory: boolean,
  originalPhotoFile: File | null
): Promise<string> => {
  if (selectedPhotoForStory) {
    // User has explicitly selected a photo for story (original or cartoon)
    if (selectedPhotoForStory.startsWith('blob:') && originalPhotoFile) {
      // It's a blob URL (original photo), use the file
      return await fileToBase64(originalPhotoFile);
    } else {
      // It's a URL (cartoon or uploaded image), convert to base64
      return await urlToBase64(selectedPhotoForStory);
    }
  } else if (originalPhotoFile) {
    // Fallback to original photo file
    return await fileToBase64(originalPhotoFile);
  } else {
    // No photo available
    return '';
  }
};
