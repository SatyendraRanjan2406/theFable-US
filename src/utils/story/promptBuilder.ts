
import { StoryRequest, Pronouns } from '../types/storyTypes';
import { getPronouns, getAgeGroup } from './storyHelpers';

export const buildStoryPrompt = (request: StoryRequest): string => {
  const pronouns = getPronouns(request.characterGender);
  const ageGroup = getAgeGroup(request.characterAge);
  const style = getStyleReference(request.genre, request.characterAge);
  const customOutline = request.storyOutline ? `\n\nSTORY OUTLINE TO FOLLOW EXACTLY:\n${request.storyOutline}` : '';
  const moralMessage = request.message ? `\n\nIMPORTANT MORAL LESSON TO WEAVE THROUGHOUT:\n"${request.message}" - This should be naturally integrated into the story's events and character growth.` : '';

  return `You are creating a ${request.pages}-page comic book story for ${request.characterName}, a ${request.characterAge}-year-old ${request.characterGender} in the ${ageGroup} age group.
The story should be a ${request.genre}.

📘 CHARACTER DETAILS:
• Name: ${request.characterName}
• Age: ${request.characterAge} years old (Age Group: ${ageGroup})
• Gender: ${request.characterGender}
• Pronouns: ${pronouns.subject}/${pronouns.object}/${pronouns.possessive}
• Personality: Curious, brave, kind, and age-appropriately determined

📚 AUTHOR STYLE & TONE GUIDANCE:
*Genre:* ${request.genre}
*Age:* ${request.characterAge} (age group: ${ageGroup})
🎨 *Author Style:* ${style.author}
📝 *Tone & Style Notes:* ${style.notes}
📖 *Reference Book Example:* "${style.book}"
Use this as a tone and rhythm reference — match the spirit, pacing, and emotional feel of the example book, but do not copy the plot or characters.

💡 CRITICAL STORY REQUIREMENTS:
1. CLEAR NARRATIVE FLOW: Each panel must logically connect to the next (Intro → Conflict → Challenge → Climax → Resolution)
2. SIMPLE, ENGAGING TEXT: Use age-appropriate language that flows naturally
3. CONSISTENT CHARACTER: ${request.characterName} should act consistently throughout
4. LOGICAL PROGRESSION: Each page should build on the previous one
5. COMPLETE STORY ARC: Clear beginning, middle, and satisfying end
6. VISUAL INTRODUCTIONS: When a new character is introduced, create a clear visual description and use it consistently in all relevant panels

📖 MANDATORY STORY STRUCTURE:
${getLongFlowStructure(request.pages, request.characterName, pronouns)}

✍️ STRICT FORMATTING RULES:
• Start each page with: *Page X*
• Start each panel with: *Panel 1:* or *Panel 2:*
• Separate pages with: ---
• Each panel format: [Clear visual description] followed by story text and dialogue
• Make story text natural and conversational

🎨 ENHANCED PANEL FORMAT EXAMPLE:
*Panel 1:* ${request.characterName} sits in ${pronouns.possessive} bedroom, sunlight streaming through the window. ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} looks excited and ready for adventure.

${request.characterName} jumps out of bed with a big smile. "Today feels special!" ${pronouns.subject} says happily. "I wonder what amazing things will happen!"

💬 DIALOGUE RULES:
• Sound like a real ${request.characterAge}-year-old talking
• Keep sentences short, natural, and expressive
• Show the character’s personality through speech
• Include emotional reactions (e.g., surprise, joy, nervousness)
• Avoid overly complex sentence structures or adult phrasing

🖼️ VISUAL DESCRIPTION GUIDELINES:
• Focus on emotions, actions, and setting details
• Show the main character’s expressions clearly
• Describe any new character visually before they speak
• Indicate time of day, place, or action cues (e.g., shadows, wind, glowing objects)
• Avoid generic phrases like "beautiful room" or "strange place" — be specific and child-friendly

${customOutline}${moralMessage}

✨ CREATE A FLOWING, ENGAGING STORY where each panel clearly leads to the next, and the entire comic makes perfect sense when read from start to finish. 
Be imaginative, thoughtful, and aligned to the tone and rhythm of the referenced book.
Use the following reference table to select author style and tone based on age and genre:

Age Group: 4–6
- Adventure → Julia Donaldson
  Style: Rhyming, vivid imagery, friendly tone, simple arcs
  Example: The Gruffalo
- Mystery → Dr. Seuss (mystery)
  Style: Rhyming clues, playful tone, colorful, rhythmic storytelling
  Example: Green Eggs and Ham (tone/style ref)
- Fairytale → Beatrix Potter
  Style: Talking animals, moral lessons, soft narration
  Example: The Tale of Peter Rabbit
- Humor → Mo Willems
  Style: Silly, repetitive humor, strong expressions, interactive feel
  Example: Elephant & Piggie series

Age Group: 7–9
- Adventure → Enid Blyton
  Style: Classic adventure tone, group teamwork, safe suspense
  Example: Famous Five
- Mystery → Enid Blyton
  Style: Gentle mysteries, clue-based progression, friendly feel
  Example: Secret Seven
- Fairytale → Brothers Grimm (soft)
  Style: Simplified fairytales, moral outcomes, imaginative twists
  Example: Hansel and Gretel (simplified)
- Humor → Roald Dahl
  Style: Quirky, absurd humor, playful narration, often a moral
  Example: Charlie and the Chocolate Factory

Age Group: 10–12
- Adventure → Rick Riordan (lite)
  Style: Mythology-inspired, action-driven, witty, simplified cultural references
  Example: Percy Jackson
- Mystery → Lemony Snicket (light)
  Style: Whimsical dark humor, mysterious atmosphere, clever narration
  Example: A Series of Unfortunate Events
- Fairytale → C. S. Lewis
  Style: Fantasy epic, values-based, world-building, moral decisions
  Example: Chronicles of Narnia
- Humor → Jeff Kinney
  Style: Diary-style, sarcasm, relatable school-life humor
  Example: Diary of a Wimpy Kid

Age Group: 13–18
- Adventure → Rick Riordan (lite)
  Style: Bolder action, mythic scale, personal growth arcs
  Example: Heroes of Olympus
- Mystery → Lemony Snicket (light)
  Style: More intrigue, dramatic narration, complex vocabulary
  Example: A Series of Unfortunate Events
- Fairytale → C. S. Lewis
  Style: Deep themes, symbolism, layered world-building
  Example: The Magician’s Nephew
- Humor → Jeff Kinney
  Style: Light sarcasm, teen dilemmas, emotional humor
  Example: Diary of a Wimpy Kid: The Ugly Truth
`;
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
