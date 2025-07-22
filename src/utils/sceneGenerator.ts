
export const generateSceneBackground = (genre: string): string => {
  const sceneBackgrounds = {
    adventure: `
      background: linear-gradient(135deg, #8B4513 0%, #DAA520 50%, #228B22 100%);
      background-image: 
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.2) 0%, transparent 50%);
    `,
    fairytale: `
      background: linear-gradient(135deg, #FF69B4 0%, #9370DB 50%, #4169E1 100%);
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    `,
    romance: `
      background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%);
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(255, 182, 193, 0.3) 0%, transparent 50%);
    `,
    humour: `
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%);
      background-image: 
        radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
    `
  };

  return sceneBackgrounds[genre as keyof typeof sceneBackgrounds] || sceneBackgrounds.adventure;
};
