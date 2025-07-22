
export const combineCharacterWithScene = (characterBlob: Blob, genre: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200; // Reduced from 300 for faster processing
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Create scene background with simplified approach
    const gradientColors = {
      adventure: ['#8B4513', '#DAA520', '#228B22'],
      fairytale: ['#FF69B4', '#9370DB', '#4169E1'],
      romance: ['#FFB6C1', '#FFC0CB', '#FFE4E1'],
      humour: ['#FFD700', '#FFA500', '#FF6347']
    };
    
    const colors = gradientColors[genre as keyof typeof gradientColors] || gradientColors.adventure;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw character
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      const dataUrl = canvas.toDataURL('image/png', 0.6); // Reduced quality
      resolve(dataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load character image'));
    img.src = URL.createObjectURL(characterBlob);
  });
};
