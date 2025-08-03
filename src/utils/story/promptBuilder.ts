
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
The rules for creating the story are as follows:
If the story outline is provided, use it to create the story and keep the ouline as the theme of the story , with the following rules , else if the story outline is not provided, then build a story based on the genre and age group and the following rules:
** RULES FOR STORY CREATION **
If the genre is Adventure and the age group is 4–6, the story should follow the style of Julia Donaldson (The Gruffalo) and be rhythmic, rhyme-based, vivid, friendly, and follow a simple story structure.

If the genre is Adventure and the age group is 7–9, the story should reflect the tone of Enid Blyton (Famous Five) and include light suspense, teamwork, classic adventure elements, and accessible language.

If the genre is Adventure and the age group is 10–18, the story should adopt a toned-down Rick Riordan style (Percy Jackson) and be myth-inspired, action-packed, humorous, with simplified modern references.

If the genre is Mystery and the age group is 4–6, the story should be written in the spirit of Dr. Seuss with a mystery twist, using rhyming clues, a playful tone, colorful resolutions, and an engaging rhythm.

If the genre is Mystery and the age group is 7–9, the story should mimic Enid Blyton’s Secret Seven, featuring gentle mysteries, group problem-solving, safe suspense, and easy vocabulary.

If the genre is Mystery and the age group is 10–18, the story should resemble a light version of Lemony Snicket’s A Series of Unfortunate Events, with whimsical dark humor, a mysterious atmosphere, and rich yet accessible vocabulary.

If the genre is Fairytale and the age group is 4–6, the story should be in the style of Beatrix Potter (Peter Rabbit), featuring gentle fables, talking animals, moral themes, and simple language.

If the genre is Fairytale and the age group is 7–9, the story should take inspiration from softened versions of Brothers Grimm stories, with traditional fairytales, simplified plots, and reduced dark elements.

If the genre is Fairytale and the age group is 10–18, the story should be modeled after C. S. Lewis’s Narnia series, focusing on epic world-building, fantasy-driven plots, deeper themes, and adventurous elements.

If the genre is Humor and the age group is 4–6, the story should follow the tone of Mo Willems (Elephant & Piggie) with repetitive humor, silly scenarios, expressive narration, and engaging dialogue.

If the genre is Humor and the age group is 7–9, the story should be inspired by Roald Dahl’s style (Matilda, Charlie and the Chocolate Factory), with whimsical and quirky characters, absurd humor, a moral undertone, and an easy narrative.

If the genre is Humor and the age group is 10–18, the story should resemble Jeff Kinney’s Diary of a Wimpy Kid, using light sarcasm, relatable humor, school-life scenarios, and an accessible tone.
The story should be in the style of [Author Name]. The story should be [Style Notes]
** END OF RULES FOR STORY CREATION **

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
6. When the new character is introduced in the story, create a visual description of the character and the setting and use it in every panel where the character is present.

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
- for each of the new character introduced in the story, create a visual description of the character in the beginning of the story and the setting and use it in every panel  where the character is present as part of the panel text.

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
