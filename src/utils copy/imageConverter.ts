// Helper function to convert image URL to data URL with better error handling
export const imageToDataURL = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    //console.log('Converting image to data URL:', imageUrl);
    
    const img = new Image();
    
    // Set CORS to anonymous to handle cross-origin images
    img.crossOrigin = 'anonymous';
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!img.complete) {
        console.error('Image loading timeout');
        reject(new Error('Image loading timeout'));
      }
    }, 15000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        //console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to data URL with good quality
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        //console.log('Image converted to data URL, length:', dataURL.length);
        resolve(dataURL);
      } catch (error) {
        console.error('Canvas conversion error:', error);
        reject(new Error(`Failed to convert image: ${error}`));
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('Image loading error:', error);
      reject(new Error(`Failed to load image from ${imageUrl}: ${error}`));
    };
    
    // Start loading the image
    img.src = imageUrl;
  });
};
