
import { StoryRequest, Pronouns } from '../types/storyTypes';
import { getPronouns, getAgeGroup } from './storyHelpers';

export const buildStoryPrompt = (request: StoryRequest): string => {
  const pronouns = getPronouns(request.characterGender);
  const ageGroup = getAgeGroup(request.characterAge);
  const customOutline = request.storyOutline ? `\n\nSTORY OUTLINE TO FOLLOW EXACTLY:\n${request.storyOutline}` : '';
  const moralMessage = request.message ? `\n\nIMPORTANT MORAL LESSON TO WEAVE THROUGHOUT:\n"${request.message}" - This should be naturally integrated into the story's events and character growth.` : '';

  return `You are creating a ${request.pages}-page comic book story for ${request.characterName} and age group ${ageGroup}, a ${request.characterAge}-year-old ${request.characterGender}.
  The story should be a ${request.genre}. The reference table for story creation depeding on ${request.characterAge} and ${request.genre}  will result in corresponding 
  [Author Style] and [Style Notes] referring the following tabel . 
  Use this reference mapping:

| Genre     | Age Group | Author Style                             | Style Notes                                                                 |
|-----------|-----------|-------------------------------------------|------------------------------------------------------------------------------|
| Adventure | 4-6       | Julia Donaldson (The Gruffalo)           | Rhythmic, rhyme-based, vivid, friendly, simple story structure.             |
| Adventure | 7-9       | Enid Blyton (Famous Five)                | Light suspense, teamwork, classic adventure, accessible language.           |
| Adventure | 10-18     | Rick Riordan (Percy Jackson tone-down)   | Myth-inspired, action-packed, humor, modern references simplified.          |
| Mystery   | 4-6       | Dr. Seuss (with mystery twist)           | Rhyming clues, playful mystery, colorful resolution, engaging rhythm.       |
| Mystery   | 7-9       | Enid Blyton (Secret Seven)               | Gentle mysteries, group problem-solving, safe suspense, easy vocabulary.    |
| Mystery   | 10-18     | Lemony Snicket (Unfortunate Events lite) | Whimsical dark humor, mysterious atmosphere, rich yet accessible vocabulary.|
| Fairytale | 4-6       | Beatrix Potter (Peter Rabbit)            | Gentle fables, talking animals, moral themes, simple language.              |
| Fairytale | 7-9       | Brothers Grimm (Softened version)        | Traditional fairytales, simplified plots, reduced dark elements.            |
| Fairytale | 10-18     | C.S. Lewis (Narnia tone)                 | Epic world-building, fantasy-driven, deeper themes, adventurous elements.   |
| Humor     | 4-6       | Mo Willems (Elephant & Piggie)           | Repetitive humor, silly scenarios, expressive, engaging dialogue.           |
| Humor     | 7-9       | Roald Dahl (Matilda/Charlie)             | Whimsical, quirky characters, absurd humor, moral undertone, easy narrative.|
| Humor     | 10-18     | Jeff Kinney (Diary of a Wimpy Kid)       | Light sarcasm, relatable humor, school-life scenarios, accessible tone.     |

  
The story should be in the style of [Author Name]. The story should be [Style Notes]


Example Input:  
**Genre:** Mystery  
**Age Group:** 7 - 9  

Expected Output:  
Write a story in the style of *Enid Blyton's Secret Seven* with group problem-solving, gentle suspense, and simple vocabulary.

If the ${request.storyOutline} and ${request.message} is filled that should be used to create the story.
The story should set the scene, introduce a conflict, raise the stakes, reach a climax and resolve and reflect


CRITICAL STORY REQUIREMENTS:
1. CLEAR NARRATIVE FLOW: Each panel must logically connect to the next
2. SIMPLE, ENGAGING TEXT: Use age-appropriate language that flows naturally
3. CONSISTENT CHARACTER: ${request.characterName} should act consistently throughout
4. LOGICAL PROGRESSION: Each page should build on the previous one
5. COMPLETE STORY ARC: Clear beginning, middle, and satisfying end

MANDATORY STORY STRUCTURE:
${getSimpleStoryStructure(request.pages, request.characterName, pronouns, request.genre)}

STRICT FORMATTING RULES:
- Start each page with: **Page X**
- Start each panel with: **Panel 1:** or **Panel 2:**
- Separate pages with: ---
- Each panel format: *[Clear visual description]* followed by story text and dialogue
- Keep visual descriptions focused and specific
- Make story text natural and conversational

ENHANCED PANEL FORMAT EXAMPLE:
**Panel 1:** *${request.characterName} sits in ${pronouns.possessive} bedroom, sunlight streaming through the window. ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} looks excited and ready for adventure.* 

${request.characterName} jumps out of bed with a big smile. "Today feels special!" ${pronouns.subject} says happily. "I wonder what amazing things will happen!"

CHARACTER CONSISTENCY:
- Name: Always use "${request.characterName}" exactly
- Age: ${request.characterAge} years old - dialogue must match this age
- Pronouns: ${pronouns.subject}/${pronouns.object}/${pronouns.possessive}
- Personality: Curious, brave, kind, and age-appropriately determined

STORY FLOW REQUIREMENTS:
✓ Each panel connects logically to the next
✓ Story builds momentum from page to page
✓ Character actions have clear motivations
✓ Dialogue sounds natural for a ${request.characterAge}-year-old
✓ Clear cause-and-effect relationships
✓ Satisfying resolution that ties everything together
✓ Simple, engaging language throughout

VISUAL DESCRIPTION GUIDELINES:
- Keep descriptions clear and focused
- Describe main character's expressions and actions
- Include important setting details
- Show emotions through character body language
- Make scenes easy to visualize
- Avoid overly complex descriptions

DIALOGUE RULES:
- Sound like a real ${request.characterAge}-year-old talking
- Keep sentences simple and clear
- Show character's personality through speech
- Include natural reactions and emotions
- Make conversations flow naturally ${customOutline}${moralMessage}

CREATE A FLOWING, ENGAGING STORY where each panel clearly leads to the next and the entire story makes perfect sense when read from start to finish.`;
};

const getSimpleStoryStructure = (pages: number, characterName: string, pronouns: Pronouns, genre: string): string => {
  if (pages <= 3) {
    return getShortFlowStructure(pages, characterName, pronouns);
  } else if (pages <= 5) {
    return getMediumFlowStructure(pages, characterName, pronouns);
  } else {
    return getLongFlowStructure(pages, characterName, pronouns);
  }
};

const getShortFlowStructure = (pages: number, characterName: string, pronouns: Pronouns): string => {
  return `
PAGE 1 - BEGINNING:
- Panel 1: Show ${characterName} in ${pronouns.possessive} normal day
- Panel 2: Something interesting happens that starts the adventure

PAGE 2 - MIDDLE:
- Panel 1: ${characterName} decides to explore or solve the problem
- Panel 2: ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} faces a challenge but keeps trying

${pages === 3 ? `PAGE 3 - ENDING:
- Panel 1: ${characterName} finds a solution using ${pronouns.possessive} skills
- Panel 2: Happy ending showing what ${pronouns.subject} learned` : ''}`;
};

const getMediumFlowStructure = (pages: number, characterName: string, pronouns: Pronouns): string => {
  return `
PAGE 1 - START THE ADVENTURE:
- Panel 1: ${characterName} in ${pronouns.possessive} everyday world
- Panel 2: Something exciting happens that begins the story

PAGE 2 - TAKE ACTION:
- Panel 1: ${characterName} decides to do something about it
- Panel 2: ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} starts the journey or quest

PAGE 3 - FACE CHALLENGES:
- Panel 1: A problem or obstacle appears
- Panel 2: ${characterName} tries to overcome it

PAGE 4 - SOLVE THE PROBLEM:
- Panel 1: ${characterName} uses creativity or courage to find a solution
- Panel 2: Success! The problem is solved

${pages === 5 ? `PAGE 5 - HAPPY ENDING:
- Panel 1: ${characterName} celebrates the victory
- Panel 2: Back home, ${pronouns.subject} reflects on the adventure` : ''}`;
};

const getLongFlowStructure = (pages: number, characterName: string, pronouns: Pronouns): string => {
  return `
PAGE 1 - INTRODUCTION:
- Panel 1: Show ${characterName}'s normal world
- Panel 2: The adventure begins

PAGES 2-${pages - 2} - THE JOURNEY:
- Each page shows ${characterName} facing new challenges
- Progressive story building where each page connects to the next
- Show ${pronouns.possessive} growth and learning

PAGE ${pages - 1} - THE BIG CHALLENGE:
- Panel 1: ${characterName} faces the biggest test
- Panel 2: ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} overcomes it through determination

PAGE ${pages} - HAPPY ENDING:
- Panel 1: Victory and celebration
- Panel 2: ${characterName} returns home, changed for the better`;
};
