
export const shouldRenderCharacterFocus = (panelIndex: number): boolean => {
  // Only render character-focused images in panels 1, 4, 6, and 10 (0-indexed: 0, 3, 5, 9)
  const characterFocusPanels = [0, 3, 5, 9];
  return characterFocusPanels.includes(panelIndex);
};

export const createComicBookCharacterPrompt = (characterName: string, hasCharacterPhoto: boolean): string => {
  if (hasCharacterPhoto) {
    return `IDENTITY-LOCKED LIKENESS of ${characterName}: Base the character's face on a reference photo to achieve a perfect, 100% accurate photographic likeness. **Facial Identity Invariants (DO NOT CHANGE):** Eye Shape/Color/Spacing, Nose Structure, Mouth and Smile, Jawline and Cheekbones. **Preserve Detailed Features:** Skin tone, hair color/texture, unique marks or freckles. Render in a beautiful, consistent children's book illustration style, ensuring the character is instantly recognizable as the same person in every panel. The face must be identical to the reference photo, with zero artistic deviation on facial features.`;
  } else {
    return `charming CONSISTENT storybook-style digital painting character named ${characterName}, IDENTICAL soft painterly illustration style in every panel, SAME warm friendly features throughout story, CONSISTENT gentle expression, UNIFIED children's book digital art style, ZERO character design variation between panels`;
  }
};
