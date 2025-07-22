
import { StoryRequest } from './types/storyTypes';
import { buildStoryPrompt } from './story/promptBuilder';
import { validateStoryCoherence } from './story/storyValidator';

export const generateStoryWithOpenAI = async (
  request: StoryRequest,
  apiKey: string
): Promise<{ title: string; story: string }> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!request.characterName || !request.characterAge || !request.characterGender || !request.genre) {
    throw new Error('Missing required story parameters');
  }

  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = buildStoryPrompt(request);

  // 1. Generate a creative storybook title
  const titlePrompt = `Suggest a short, catchy, creative storybook title (max 10 words) for a children's story. The title must include the character's name: ${request.characterName}. The story genre is: ${request.genre}. The story prompt is: ${request.storyOutline || prompt}`;
  const titleCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an award-winning children's author. Generate only the storybook title, nothing else."
      },
      {
        role: "user",
        content: titlePrompt
      }
    ],
    max_tokens: 32,
    temperature: 0.7,
  });
  let title = titleCompletion.choices[0]?.message?.content?.trim() || `${request.characterName}'s ${request.genre.charAt(0).toUpperCase() + request.genre.slice(1)} `;
  // Remove quotes if present
  if (title.startsWith('"') && title.endsWith('"')) title = title.slice(1, -1);
  if (title.startsWith("'") && title.endsWith("'")) title = title.slice(1, -1);

  // 2. Generate the story as before
  const storyCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an award-winning children's author renowned for creating exceptionally coherent, logically structured stories. Your stories have perfect narrative flow, consistent characterization, and every element serves the story's progression. You create engaging, age-appropriate content that children love because everything makes perfect sense and connects beautifully."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 4000,
    temperature: 0.3,
  });
  const rawStory = storyCompletion.choices[0]?.message?.content;
  if (!rawStory) {
    throw new Error('No story content received from OpenAI');
  }
  return { title, story: rawStory };
};
