
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

export const generateSceneImage = async (prompt: string, apiKey: string): Promise<string> => {
  try {
    //console.log('=== OPENAI API CALL START ===');
    //console.log('Prompt length:', prompt.length);
    //console.log('API key provided:', !!apiKey);
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is required');
    }
    
    const response = await fetch(OPENAI_API_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      }),
    });

    //console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    //console.log('=== OPENAI API SUCCESS ===');
    //console.log('Generated image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('=== OPENAI API ERROR ===');
    console.error('Error details:', error);
    throw error; // Re-throw to be handled by caller
  }
};

const extractVisualElements = (panelText: string): string => {
  //console.log('Extracting from panel text:', panelText);
  
  const stageDirections = panelText.match(/\*(.*?)\*/g);
  if (stageDirections && stageDirections.length > 0) {
    const visualDescription = stageDirections
      .map(direction => direction.replace(/\*/g, '').trim())
      .join(', ');
    //console.log('Found stage directions:', visualDescription);
    return visualDescription;
  }

  let description = panelText.replace(/^[A-Z][a-zA-Z\s]*:/gm, '').trim();
  description = description.replace(/["""].*?["""]/g, '').trim();
  description = description.replace(/\([^)]*\)/g, '').trim();
  
  if (description.length > 10) {
    //console.log('Extracted description:', description);
    return description;
  }

  description = panelText
    .replace(/["""]/g, '')
    .replace(/^[A-Z][a-zA-Z\s]*:/gm, '')
    .trim();

  //console.log('Final extracted description:', description);
  return description;
};

const createDetailedCharacterDescription = (characterName: string, hasCharacterPhoto: boolean): string => {
  if (hasCharacterPhoto) {
    return `${characterName}, a specific individual child with EXACT photorealistic facial features from the reference photograph, IDENTICAL facial structure including precise eye shape, nose bridge, mouth proportions, jawline, cheekbones, and hair pattern, rendered in beautiful children's book illustration style while maintaining 100% facial accuracy to the uploaded photo, same recognizable individual person in every single panel with consistent appearance, photographic facial identity preserved exactly in storybook art style, NO variation in facial features between scenes, same specific child's face throughout entire story`;
  } else {
    return `a child character named ${characterName} with CONSISTENT children's book art style, IDENTICAL character design in every panel, same storybook-inspired protagonist appearance with unchanging facial features, hair, and physical characteristics throughout all scenes`;
  }
};

const createConsistentStorybookPrompt = (visualDescription: string, genre: string, characterName: string, hasCharacterPhoto: boolean = false, panelIndex: number = 0): string => {
  //console.log('Creating storybook prompt for:', { visualDescription, genre, characterName, hasCharacterPhoto, panelIndex });
  
  const characterDescription = createDetailedCharacterDescription(characterName || 'child', hasCharacterPhoto);
  
  let prompt = "Beautiful children's book illustration masterpiece, CONSISTENT character design across entire story, detailed hand-drawn artwork, soft watercolor textures, whimsical magical atmosphere, professional illustration quality";
  
  prompt += `, featuring ${characterDescription}`;
  
  const storybookGenreStyles = {
    adventure: "lush emerald forests, rolling hills, crystal clear blue skies with fluffy white clouds, magical nature elements, sense of wonder and exploration, enchanted outdoor environment",
    fairytale: "enchanted magical world with floating islands, mystical glowing creatures, sparkles and golden magic dust, castle in the sky aesthetic, magical fairy tale vibes",
    romance: "tender heartwarming scene, soft pastel cherry blossom colors, flower meadows, gentle golden hour lighting, romantic atmosphere, charming storybook charm",
    humour: "playful lighthearted scene, vibrant cheerful colors, silly joyful expressions, comedic timing, energetic and fun atmosphere"
  };

  const storybookStyle = storybookGenreStyles[genre as keyof typeof storybookGenreStyles] || "magical children's adventure, wonder and imagination";
  prompt += `, ${storybookStyle}`;

  if (visualDescription && visualDescription.length > 5) {
    const cleanDescription = visualDescription
      .replace(/\b(he|she|they|him|her|them)\b/gi, characterName || 'the child')
      .replace(/\b[A-Z][a-zA-Z]*\b/g, (match) => {
        if (match === characterName) return characterName || 'the child';
        return match.toLowerCase();
      });
    
    prompt += `, scene: ${cleanDescription} beautifully rendered in authentic children's book illustration style`;
  }

  prompt += ", soft detailed artwork, expressive character animation, breathtaking nature backgrounds, warm natural lighting, beautiful storybook color palette, professional children's book art direction";

  if (hasCharacterPhoto) {
    prompt += `, CRITICAL REQUIREMENT: maintain IDENTICAL facial features from reference photograph in every single panel, preserve EXACT facial proportions, eye shape, nose structure, mouth shape, and hair style from uploaded photo, render as consistent storybook character while keeping 100% photographic facial accuracy, same recognizable individual child in ALL scenes with unchanging facial characteristics, photorealistic facial features perfectly translated to children's book art style, ZERO variation in character appearance, consistent facial identity throughout story, maintain photo accuracy in storybook aesthetic`;
  } else {
    prompt += `, CONSISTENT character design requirement: exact same illustrated character appearance in every panel, identical facial features, hair, and physical characteristics throughout all scenes, no variation in character design, same storybook protagonist in every image`;
  }
  
  prompt += ", perfect children's book illustration quality, child-friendly magical content, no text overlay, detailed masterpiece artwork, professional storybook illustration, clear focus on main character, authentic children's book art style";

  if (hasCharacterPhoto) {
    prompt += `, character consistency priority: same individual child from photo in every single panel, maintain facial recognition accuracy, preserve uploaded photo identity in storybook style, consistent character across all story panels`;
  }

  //console.log('Final storybook prompt created, length:', prompt.length);
  return prompt;
};

export const generateImageFromPanelText = async (panelText: string, genre: string, characterName?: string, apiKey?: string, hasCharacterPhoto: boolean = false, panelIndex: number = 0): Promise<string> => {
  //console.log('=== IMAGE GENERATION START ===');
  //console.log('Panel text:', panelText.substring(0, 100));
  //console.log('Genre:', genre);
  //console.log('Character:', characterName);
  //console.log('Has API key:', !!apiKey);
  //console.log('Has character photo:', hasCharacterPhoto);
  //console.log('Panel index:', panelIndex);
  
  if (!apiKey || apiKey.trim() === '') {
    //console.log('No API key provided, throwing error');
    throw new Error('OpenAI API key is required for image generation');
  }
  
  const visualDescription = extractVisualElements(panelText);
  const finalPrompt = createConsistentStorybookPrompt(visualDescription, genre, characterName || 'child', hasCharacterPhoto, panelIndex);
  
  //console.log('=== CALLING OPENAI API ===');
  const result = await generateSceneImage(finalPrompt, apiKey);
  //console.log('=== IMAGE GENERATION COMPLETE ===');
  
  return result;
};
