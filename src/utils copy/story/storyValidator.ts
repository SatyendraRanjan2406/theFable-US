
import { StoryRequest } from '../types/storyTypes';
import { getPronouns } from './storyHelpers';

export const validateStoryCoherence = (story: string, request: StoryRequest): string => {
  //console.log('Validating story coherence...');
  
  if (!story || story.trim().length === 0) {
    console.error('Empty story received, generating fallback');
    return generateFallbackStory(request);
  }
  
  // Split story into pages
  const pages = story.split('---').map(page => page.trim()).filter(page => page.length > 0);
  
  // Ensure we have the right number of pages
  if (pages.length === 0) {
    console.error('No valid pages found, generating fallback');
    return generateFallbackStory(request);
  }
  
  if (pages.length < request.pages) {
    console.warn(`Expected ${request.pages} pages, got ${pages.length}. Padding with additional content.`);
    // Add missing pages
    for (let i = pages.length; i < request.pages; i++) {
      pages.push(generateAdditionalPage(i + 1, request));
    }
  }
  
  // Validate and fix each page
  const validatedPages = pages.slice(0, request.pages).map((page, index) => {
    const pageNum = index + 1;
    return validateAndFixPage(page, pageNum, request);
  });
  
  //console.log(`Story validation complete. Generated ${validatedPages.length} coherent pages.`);
  return validatedPages.join('\n\n---\n\n');
};

const validateAndFixPage = (page: string, pageNum: number, request: StoryRequest): string => {
  let validatedPage = page;
  
  // Ensure proper page header
  if (!validatedPage.includes(`**Page ${pageNum}**`)) {
    validatedPage = `**Page ${pageNum}**\n\n${validatedPage}`;
  }
  
  // Ensure proper panel structure
  if (!validatedPage.includes('**Panel 1:**') || !validatedPage.includes('**Panel 2:**')) {
    validatedPage = addProperPanelStructure(validatedPage, pageNum, request);
  }
  
  // Ensure character name consistency
  validatedPage = ensureCharacterConsistency(validatedPage, request.characterName);
  
  // Ensure age-appropriate content
  validatedPage = ensureAgeAppropriate(validatedPage, request.characterAge);
  
  return validatedPage;
};

const addProperPanelStructure = (page: string, pageNum: number, request: StoryRequest): string => {
  const content = page.replace(/\*\*Page \d+\*\*/, '').trim();
  const pronouns = getPronouns(request.characterGender);
  
  if (!content || content.length < 20) {
    return generateAdditionalPage(pageNum, request);
  }
  
  // Split content into two meaningful panels
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  if (sentences.length < 2) {
    // Generate proper content if insufficient
    return generateAdditionalPage(pageNum, request);
  }
  
  const midPoint = Math.ceil(sentences.length / 2);
  const panel1Content = sentences.slice(0, midPoint).join('. ').trim() + '.';
  const panel2Content = sentences.slice(midPoint).join('. ').trim() + '.';
  
  return `**Page ${pageNum}**

**Panel 1:** ${panel1Content} ${request.characterName} ${pronouns.subject === 'he' ? 'shows his' : pronouns.subject === 'she' ? 'shows her' : 'shows their'} determination as ${pronouns.subject} begins this part of the adventure.

**Panel 2:** ${panel2Content} The story continues as ${request.characterName} learns and grows, with each step bringing ${pronouns.object} closer to ${pronouns.possessive} goal.`;
};

const ensureCharacterConsistency = (page: string, characterName: string): string => {
  // Replace any inconsistent character references
  const inconsistentNames = ['the child', 'the kid', 'the boy', 'the girl', 'they', 'he', 'she'];
  let fixedPage = page;
  
  inconsistentNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b(?=\\s+(said|thought|went|looked|felt|decided))`, 'gi');
    fixedPage = fixedPage.replace(regex, characterName);
  });
  
  return fixedPage;
};

const ensureAgeAppropriate = (page: string, characterAge: string): string => {
  const age = parseInt(characterAge);
  
  // Remove overly complex words for younger children
  if (age <= 7) {
    return page
      .replace(/\b(magnificent|extraordinary|tremendous)\b/gi, 'amazing')
      .replace(/\b(contemplated|pondered)\b/gi, 'thought')
      .replace(/\b(exclaimed)\b/gi, 'said');
  }
  
  return page;
};

const generateAdditionalPage = (pageNum: number, request: StoryRequest): string => {
  const pronouns = getPronouns(request.characterGender);
  
  const pageTemplates = [
    {
      panel1: `${request.characterName} discovers something new and exciting in ${pronouns.possessive} adventure.`,
      panel2: `With courage and determination, ${request.characterName} decides to explore further and learn more.`
    },
    {
      panel1: `${request.characterName} faces a small challenge but remembers ${pronouns.possessive} inner strength.`,
      panel2: `Through clever thinking and perseverance, ${request.characterName} finds a solution to the problem.`
    },
    {
      panel1: `${request.characterName} meets a helpful friend who offers guidance and support.`,
      panel2: `Together, they continue the journey with renewed hope and excitement.`
    }
  ];
  
  const template = pageTemplates[(pageNum - 1) % pageTemplates.length];
  
  return `**Page ${pageNum}**

**Panel 1:** ${template.panel1} The ${request.genre} atmosphere fills the scene with wonder and possibility.

**Panel 2:** ${template.panel2} ${request.characterName} feels proud of ${pronouns.possessive} progress and ready for what comes next.`;
};

const generateFallbackStory = (request: StoryRequest): string => {
  const pronouns = getPronouns(request.characterGender);
  const pages = [];
  
  for (let i = 1; i <= request.pages; i++) {
    pages.push(generateAdditionalPage(i, request));
  }
  
  return pages.join('\n\n---\n\n');
};
