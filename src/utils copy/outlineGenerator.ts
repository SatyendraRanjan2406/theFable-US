export const generateStoryOutline = (
  characterName: string,
  characterAge: string,
  characterGender: string,
  genre: string,
  message?: string,
  userOutline?: string,
  pages: number = 10
): string => {
  // If user provided an outline, use it as the base and enhance it
  if (userOutline && userOutline.trim()) {
    //console.log('Using user-provided outline as base:', userOutline);
    return enhanceUserOutline(userOutline, characterName, characterAge, characterGender, genre, message, pages);
  }

  //console.log('Generating new outline with all parameters:', {
  //   characterName, characterAge, characterGender, genre, message, pages
  // });

  const pronouns = getPronouns(characterGender);
  const ageGroup = getAgeGroup(characterAge);
  const genreElements = getGenreElements(genre);
  
  // Create age-appropriate challenges and themes
  const ageAppropriateElements = getAgeAppropriateElements(ageGroup, characterAge);
  
  // Incorporate the moral message if provided
  const moralLesson = message ? ` The story will weave in this important lesson: "${message}".` : '';
  
  // Structure the outline based on the number of pages
  const storyStructure = createStoryStructure(pages, characterName, pronouns, genre, genreElements, ageAppropriateElements, moralLesson, ageGroup);
  
  return storyStructure;
};

const enhanceUserOutline = (
  userOutline: string,
  characterName: string,
  characterAge: string,
  characterGender: string,
  genre: string,
  message?: string,
  pages: number = 8
): string => {
  const pronouns = getPronouns(characterGender);
  const ageGroup = getAgeGroup(characterAge);
  const genreElements = getGenreElements(genre);
  const ageAppropriateElements = getAgeAppropriateElements(ageGroup, characterAge);
  const moralLesson = message ? ` The story emphasizes this lesson: "${message}".` : '';
  
  // Parse and enhance the user's outline with age-appropriate content
  const enhancedOutline = `**${characterName}'s ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure** (${pages} pages)
**Age: ${characterAge} years old**

**Based on your story idea:** ${userOutline}

**Enhanced Story Structure:**

**Opening (Pages 1-2):** ${characterName}, a ${characterAge}-year-old ${characterGender}, begins ${pronouns.possessive} adventure. The story establishes ${pronouns.possessive} world and introduces the main elements from your outline. ${genreElements.opening} ${ageAppropriateElements.contentGuidelines}

**Development (Pages 3-${Math.ceil(pages * 0.7)}):** Following your storyline, ${characterName} faces escalating challenges and discovers new aspects of ${pronouns.object}self. ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} encounters obstacles that test ${pronouns.possessive} courage, creativity, and determination. ${genreElements.middle} ${ageAppropriateElements.challenges}

**Climax & Resolution (Pages ${Math.ceil(pages * 0.7) + 1}-${pages}):** The adventure reaches its peak as ${characterName} uses everything ${pronouns.subject} has learned to overcome the final challenge from your outline. ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} emerges victorious and transformed by the experience. ${genreElements.ending} ${ageAppropriateElements.resolution}${moralLesson}

**Character Growth:** Throughout the ${pages} pages, ${characterName} evolves from someone facing uncertainty to a confident young ${characterGender} who believes in ${pronouns.possessive} abilities and the power of ${getGenreValues(genre)}.

**Age-Appropriate Elements:** ${ageAppropriateElements.themes}`;

  return enhancedOutline;
};

const createStoryStructure = (
  pages: number,
  characterName: string,
  pronouns: any,
  genre: string,
  genreElements: any,
  ageAppropriateElements: any,
  moralLesson: string,
  ageGroup: string
): string => {
  const openingPages = Math.ceil(pages * 0.25);
  const middlePages = Math.ceil(pages * 0.5);
  const endingPages = pages - openingPages - middlePages;

  return `**${characterName}'s Epic ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure** (${pages} pages)
**Age Group: ${ageGroup} (${ageAppropriateElements.ageRange})**

**Story Structure:**

**Act I - The Beginning (Pages 1-${openingPages}):**
${characterName} is introduced in ${pronouns.possessive} familiar world. ${genreElements.opening} ${ageAppropriateElements.challenge} This sets up the central conflict that will drive the entire story forward.${moralLesson}

**Content Guidelines:** ${ageAppropriateElements.contentGuidelines}

**Act II - The Journey (Pages ${openingPages + 1}-${openingPages + middlePages}):**
${characterName} embarks on ${pronouns.possessive} adventure, facing increasingly difficult challenges. ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} meets allies and encounters obstacles that test ${pronouns.possessive} resolve. ${genreElements.middle} Each challenge helps ${characterName} grow stronger and more confident. ${ageAppropriateElements.challenges}

**Act III - The Resolution (Pages ${openingPages + middlePages + 1}-${pages}):**
${characterName} faces the ultimate test of ${pronouns.possessive} journey. Using all the skills, wisdom, and courage ${pronouns.subject} has gained, ${pronouns.subject} overcomes the final challenge. ${genreElements.ending} The story concludes with ${characterName} transformed and empowered. ${ageAppropriateElements.resolution}

**Key Themes:** ${getGenreValues(genre)}, personal growth, believing in yourself${moralLesson ? `, and ${moralLesson.replace('The story will weave in this important lesson: "', '').replace('".', '')}` : ''}

**Character Arc:** ${characterName} begins as ${ageAppropriateElements.startingPoint} and grows into ${ageAppropriateElements.endingPoint}

**Age-Appropriate Elements:** ${ageAppropriateElements.themes}`;
};

const getPronouns = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return { subject: 'he', object: 'him', possessive: 'his' };
    case 'female':
      return { subject: 'she', object: 'her', possessive: 'her' };
    default:
      return { subject: 'they', object: 'them', possessive: 'their' };
  }
};

const getAgeGroup = (age: string) => {
  const numAge = parseInt(age);
  if (numAge <= 5) return 'toddler';
  if (numAge <= 8) return 'young child';
  if (numAge <= 12) return 'middle child';
  if (numAge <= 15) return 'young teen';
  return 'teen';
};

const getAgeAppropriateElements = (ageGroup: string, characterAge: string) => {
  const numAge = parseInt(characterAge);
  
  switch (ageGroup) {
    case 'toddler':
      return {
        ageRange: '0-5 years',
        challenge: 'A simple, safe problem appears that can be solved through kindness and curiosity.',
        startingPoint: 'a curious little one ready to explore the world safely',
        endingPoint: 'a confident child who knows they are loved and capable',
        contentGuidelines: 'Very simple language, bright and cheerful themes, focus on family and friendship.',
        challenges: 'Gentle obstacles that build confidence without fear.',
        resolution: 'Happy endings with hugs, celebrations, and family togetherness.',
        themes: 'Love, safety, discovery, and simple problem-solving through kindness.'
      };
    case 'young child':
      return {
        ageRange: '6-8 years',
        challenge: 'A fun adventure begins that requires creativity and teamwork to solve.',
        startingPoint: 'a curious child ready for their first big adventure',
        endingPoint: 'a confident young explorer who knows they can handle challenges',
        contentGuidelines: 'Simple vocabulary, positive role models, emphasis on friendship and helping others.',
        challenges: 'Age-appropriate obstacles that encourage problem-solving and cooperation.',
        resolution: 'Victories achieved through friendship, creativity, and persistence.',
        themes: 'Friendship, creativity, helping others, and learning new things.'
      };
    case 'middle child':
      return {
        ageRange: '9-12 years',
        challenge: 'A significant challenge emerges that requires courage and creativity to overcome.',
        startingPoint: 'someone unsure of their abilities but eager to prove themselves',
        endingPoint: 'a brave problem-solver who believes in their own strength',
        contentGuidelines: 'Rich vocabulary, complex emotions, focus on growth and learning from mistakes.',
        challenges: 'Meaningful obstacles that teach resilience and the value of perseverance.',
        resolution: 'Success through determination, learning from failures, and believing in oneself.',
        themes: 'Self-confidence, resilience, learning from mistakes, and discovering personal strengths.'
      };
    case 'young teen':
      return {
        ageRange: '13-15 years',
        challenge: 'A complex situation arises that tests their values and decision-making skills.',
        startingPoint: 'a young person questioning their place in the world',
        endingPoint: 'a confident individual who understands their own worth and potential',
        contentGuidelines: 'Mature themes handled sensitively, focus on identity and making good choices.',
        challenges: 'Real-world problems that encourage critical thinking and moral reasoning.',
        resolution: 'Growth through facing difficulties with integrity and support from others.',
        themes: 'Identity, making good choices, standing up for what\'s right, and finding your voice.'
      };
    case 'teen':
      return {
        ageRange: '16-18 years',
        challenge: 'A meaningful challenge that prepares them for adulthood and independence.',
        startingPoint: 'a young adult ready to take on greater responsibilities',
        endingPoint: 'a mature individual prepared for the next chapter of their life',
        contentGuidelines: 'Complex themes about growing up, responsibility, and preparing for adulthood.',
        challenges: 'Life-preparation scenarios that build confidence for future independence.',
        resolution: 'Achievements that demonstrate readiness for adult responsibilities.',
        themes: 'Responsibility, preparing for the future, leadership, and making a positive impact.'
      };
    default:
      return {
        ageRange: 'All ages',
        challenge: 'An exciting challenge appears that needs to be faced with courage.',
        startingPoint: 'someone ready for adventure',
        endingPoint: 'a confident hero who has grown through their experiences',
        contentGuidelines: 'Age-appropriate content that encourages positive values.',
        challenges: 'Suitable obstacles that promote growth and learning.',
        resolution: 'A satisfying conclusion that celebrates personal growth.',
        themes: 'Courage, friendship, and personal growth.'
      };
  }
};

const getGenreElements = (genre: string) => {
  switch (genre.toLowerCase()) {
    case 'adventure':
      return {
        opening: 'A mysterious discovery or unexpected event sets the stage for an epic journey filled with excitement and wonder.',
        middle: 'Thrilling challenges test courage and problem-solving skills as new worlds are explored and obstacles overcome.',
        ending: 'Victory is achieved through bravery and determination, with new horizons opening for future adventures.'
      };
    case 'fairytale':
      return {
        opening: 'Magic enters the ordinary world, bringing both wonder and responsibility as ancient powers awaken.',
        middle: 'Enchanted trials test the heart and spirit, with magical allies and mystical challenges shaping the path forward.',
        ending: 'Good triumphs through kindness and wisdom, restoring balance and bringing happiness to all.'
      };
    case 'romance':
      return {
        opening: 'New friendships bloom and connections are made, highlighting the importance of kindness and understanding.',
        middle: 'Relationships deepen through acts of compassion and shared adventures, building bonds that withstand challenges.',
        ending: 'Love and friendship prevail, creating a community filled with warmth, acceptance, and mutual support.'
      };
    case 'humour':
      return {
        opening: 'Silly situations and funny misunderstandings create opportunities for laughter and creative problem-solving.',
        middle: 'Comedic adventures pile up as good intentions lead to hilarious outcomes and unexpected solutions.',
        ending: 'Joy and laughter bring everyone together, proving that happiness is the best magic of all.'
      };
    default:
      return {
        opening: 'An exciting beginning sets the stage for adventure.',
        middle: 'Challenges and growth mark the journey forward.',
        ending: 'A satisfying conclusion rewards courage and determination.'
      };
  }
};

const getGenreValues = (genre: string) => {
  switch (genre.toLowerCase()) {
    case 'adventure':
      return 'courage, exploration, and determination';
    case 'fairytale':
      return 'magic, kindness, and wonder';
    case 'romance':
      return 'friendship, love, and compassion';
    case 'humour':
      return 'joy, creativity, and finding fun in everything';
    default:
      return 'courage, friendship, and personal growth';
  }
};
