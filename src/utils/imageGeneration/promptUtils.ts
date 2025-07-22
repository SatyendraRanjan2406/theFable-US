
import { shouldRenderCharacterFocus, createComicBookCharacterPrompt } from './characterUtils';

export const extractVisualElements = (panelText: string): string => {
  //console.log('Extracting visual elements from panel text:', panelText);
  
  // First, try to find text in asterisks (stage directions) - these are most visual
  const stageDirections = panelText.match(/\*(.*?)\*/g);
  if (stageDirections && stageDirections.length > 0) {
    const visualDescription = stageDirections
      .map(direction => direction.replace(/\*/g, '').trim())
      .join(', ');
    //console.log('Found stage directions:', visualDescription);
    return visualDescription;
  }

  // Remove character names followed by colons (dialogue attribution)
  let description = panelText.replace(/^[A-Z][a-zA-Z\s]*:/gm, '').trim();
  
  // Remove quoted dialogue
  description = description.replace(/["""].*?["""]/g, '').trim();
  
  // Remove parenthetical expressions
  description = description.replace(/\([^)]*\)/g, '').trim();
  
  // If we still have substantial content, use it
  if (description.length > 10) {
    //console.log('Extracted description:', description);
    return description;
  }

  // Last resort: use the full text but clean it up
  description = panelText
    .replace(/["""]/g, '') // Remove quotes but keep content
    .replace(/^[A-Z][a-zA-Z\s]*:/gm, '') // Remove character names
    .trim();

  //console.log('Final extracted description:', description);
  return description;
};

export const createContinuityPrompt = (
  visualDescription: string, 
  genre: string, 
  characterName: string, 
  panelIndex: number, 
  hasCharacterPhoto: boolean = false,
  previousPanelContext?: string
): string => {
  //console.log('Creating REFINED continuity-focused prompt for panel:', panelIndex, { 
  //   visualDescription, 
  //   genre, 
  //   characterName, 
  //   hasCharacterPhoto,
  //   hasPreviousContext: !!previousPanelContext 
  // });
  
  let prompt = "MASTERPIECE STORYBOOK DIGITAL PAINTING with ABSOLUTE VISUAL CONSISTENCY, IDENTICAL art style signature throughout ENTIRE story series, SAME professional artist technique in every single panel, UNIFORM color palette and lighting philosophy, SEAMLESS visual narrative flow, CONSISTENT brush stroke style, IDENTICAL artistic vision maintained across all panels";
  
  // Refined Photo Likeness prompt
  if (hasCharacterPhoto) {
    prompt += `, PHOTO-REALISTIC LIKENESS (IDENTITY-LOCKED): The character MUST be a 100% perfect facial match to the reference photo in every panel. **Core Facial Structure (Non-negotiable):** Preserve the exact bone structure (jaw, cheeks, chin), eye shape and color, nose bridge and tip, and mouth proportions. **Detailed Accuracy:** Replicate skin tone, hair texture and color, and any unique features like moles or freckles with photographic precision. The character must be the *exact same person* throughout the story, rendered in a consistent storybook style.`;
  }
  
  // ENHANCED previous panel context for stronger visual flow
  if (previousPanelContext && panelIndex > 0) {
    prompt += `, CRITICAL VISUAL CONTINUITY: direct continuation from previous scene (${previousPanelContext}), MAINTAIN EXACT same environmental lighting conditions, PRESERVE identical time of day and weather, CONTINUE same overall atmosphere and mood without variation, SEAMLESS transition between panels`;
  }
  
  const isCharacterFocusPanel = shouldRenderCharacterFocus(panelIndex);

  if (!isCharacterFocusPanel) {
    // ENHANCED scene-focused panels with stronger continuity
    prompt += ", SCENE-FOCUSED COMPOSITION with perfect character integration, detailed immersive background environment, ABSOLUTE storybook digital painting style consistency";
    
    // ENHANCED genre-specific scene continuity with stronger consistency requirements
    const genreStyles = {
      adventure: "CONSISTENT outdoor adventure environment with IDENTICAL natural lighting throughout, SAME forest/mountain/outdoor style in every panel, CONTINUOUS exploration atmosphere, MAINTAINED geographical consistency and terrain features, UNIFORM weather and time of day",
      fairytale: "CONSISTENT magical fairy tale world with IDENTICAL enchanted lighting philosophy, SAME mystical atmosphere maintained throughout entire story, CONTINUOUS magical environmental elements, UNIFIED fantasy world design language, IDENTICAL magical lighting effects",
      romance: "CONSISTENT warm cozy settings with IDENTICAL soft lighting style, SAME peaceful atmosphere throughout all panels, CONTINUOUS heartwarming environmental mood, UNIFIED gentle ambient lighting, MAINTAINED romantic atmosphere consistency",
      humour: "CONSISTENT bright cheerful environments with IDENTICAL vibrant lighting, SAME playful atmosphere in every panel, CONTINUOUS fun outdoor scene styling, UNIFIED joyful mood and color temperature, MAINTAINED upbeat environmental consistency"
    };

    const genreStyle = genreStyles[genre as keyof typeof genreStyles] || "CONSISTENT storybook scene atmosphere with UNIFIED environmental design language";
    prompt += `, ${genreStyle}`;

    if (visualDescription && visualDescription.length > 5) {
      const cleanDescription = visualDescription
        .replace(/\b(he|she|they|him|her|them|[A-Z][a-zA-Z]*)\b/gi, characterName || 'the child')
        .replace(/child|character|person/gi, characterName || 'the child')
        .trim();
      
      if (cleanDescription.length > 5) {
        prompt += `, CONSISTENT scene elements: ${cleanDescription} rendered in IDENTICAL storybook style as previous panels`;
      }
    }
  } else {
    // ENHANCED character focus panels with MAXIMUM photo likeness
    prompt += ", CHARACTER PORTRAIT FOCUS with MAXIMUM photo likeness preservation, detailed character expression and pose consistency, IDENTICAL storybook digital painting technique";
    
    const characterDescription = createComicBookCharacterPrompt(characterName || 'child', hasCharacterPhoto);
    prompt += `, featuring ${characterDescription}`;
    
    // Simplified reinforcement prompt
    if (hasCharacterPhoto) {
      prompt += `, LIKENESS REINFORCEMENT: Ensure the close-up portrait is an identical photographic match to the reference photo's facial features and structure.`;
    }
    
    // ENHANCED genre-specific character styling with stronger continuity
    const genreStyles = {
      adventure: "CONSISTENT brave adventurous character expression with IDENTICAL photo likeness, MAINTAINED nature-appropriate clothing style as previous panels, PRESERVED confident outdoor pose consistency, CONTINUED adventure story atmosphere",
      fairytale: "CONSISTENT magical fairy tale character design with PERFECT photo likeness, IDENTICAL enchanted costume style throughout story, MAINTAINED wonder-filled expression consistency, PRESERVED fantasy atmosphere",
      romance: "CONSISTENT warm caring character portrait style with EXACT photo likeness, IDENTICAL gentle expression as previous panels, MAINTAINED cozy clothing consistency, PRESERVED heartwarming atmosphere",
      humour: "CONSISTENT cheerful joyful character design with PERFECT photo likeness, IDENTICAL happy expression style throughout, MAINTAINED fun clothing aesthetic, PRESERVED whimsical atmosphere"
    };

    const genreStyle = genreStyles[genre as keyof typeof genreStyles] || "CONSISTENT friendly storybook character with MAINTAINED story mood and PERFECT photo likeness throughout";
    prompt += `, ${genreStyle}`;

    // ENHANCED scene context for the character
    if (visualDescription && visualDescription.length > 5) {
      const cleanDescription = visualDescription
        .replace(/\b(he|she|they|him|her|them)\b/gi, characterName || 'the child')
        .replace(/\b[A-Z][a-zA-Z]*\b/g, (match) => {
          if (match === characterName) return characterName || 'the child';
          return match.toLowerCase();
        });
      
      prompt += `, in CONSISTENT scene context: ${cleanDescription} maintaining IDENTICAL visual style and PERFECT photo likeness as previous panels`;
    }
  }

  // CRITICAL ENHANCED consistency requirements with photo likeness priority
  prompt += ", ABSOLUTE VISUAL CONSISTENCY REQUIREMENTS: IDENTICAL digital painting technique in every panel, SAME brush stroke pattern and texture, CONSISTENT color saturation levels and contrast ratios, UNIFIED artistic vision without variation, SEAMLESS story visual flow, PROFESSIONAL storybook illustration series with PERFECT continuity";
  
  // Simplified final enforcement
  if (hasCharacterPhoto) {
    prompt += ", FINAL LIKENESS CHECK: It is critical that the character's face is a perfect, 100% recognizable match to the reference photo. No artistic interpretation on facial identity is allowed. The individual must be the same person in every single image.";
  }
  
  // ENHANCED story progression awareness with stronger consistency and photo likeness
  if (panelIndex === 0) {
    prompt += ", STORY OPENING: establish MASTER visual tone and style template for ENTIRE story, CREATE consistent baseline for all following panels";
    if (hasCharacterPhoto) {
      prompt += ", SET PERFECT photo likeness standard for character throughout entire story";
    }
  } else if (panelIndex < 4) {
    prompt += ", EARLY STORY: MAINTAIN established master visual style without deviation, BUILD story atmosphere while PRESERVING visual consistency";
    if (hasCharacterPhoto) {
      prompt += ", CONTINUE perfect photo likeness established in opening panels";
    }
  } else if (panelIndex < 8) {
    prompt += ", MID-STORY: CONTINUE established visual continuity with ZERO style drift, DEVELOP story themes while MAINTAINING identical artistic approach";
    if (hasCharacterPhoto) {
      prompt += ", PRESERVE exact photo likeness consistency without any facial changes";
    }
  } else {
    prompt += ", STORY CLIMAX: MAINTAIN perfect visual consistency while bringing story to conclusion, PRESERVE established visual identity throughout ending";
    if (hasCharacterPhoto) {
      prompt += ", CONCLUDE story with same perfect photo likeness maintained throughout";
    }
  }
  
  prompt += ", MASTERPIECE children's book illustration quality with PERFECT consistency and MAXIMUM photo likeness preservation, ABSOLUTE storybook digital painting mastery, UNIFIED artistic vision maintained throughout ENTIRE story without variation, SEAMLESS visual narrative continuity with PHOTOGRAPHIC character accuracy";

  //console.log('REFINED continuity and photo likeness prompt for panel:', panelIndex, 'length:', prompt.length);
  return prompt;
};

export const createDetailedPrompt = (
  visualDescription: string, 
  genre: string, 
  characterName: string, 
  panelIndex: number, 
  hasCharacterPhoto: boolean = false,
  previousPanelContext?: string
): string => {
  return createContinuityPrompt(
    visualDescription, 
    genre, 
    characterName, 
    panelIndex, 
    hasCharacterPhoto,
    previousPanelContext
  );
};
