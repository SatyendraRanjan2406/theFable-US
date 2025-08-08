
import { Pronouns, AgeGroup } from '../types/storyTypes';

export const getPronouns = (gender: string): Pronouns => {
  switch (gender.toLowerCase()) {
    case 'male':
      return { subject: 'he', object: 'him', possessive: 'his' };
    case 'female':
      return { subject: 'she', object: 'her', possessive: 'her' };
    default:
      return { subject: 'they', object: 'them', possessive: 'their' };
  }
};

export const getAgeGroup = (age: string): AgeGroup => {
  const numAge = parseInt(age);
  if (numAge <= 7) return 'young';
  if (numAge <= 12) return 'middle';
  return 'teen';
};

export interface StyleReference {
  author: string;
  notes: string;
  book: string;
}

export const getStyleReference = (genre: string, age: string): StyleReference => {
  const numAge = parseInt(age);
  const ageGroup = getAgeGroup(age);

  // Age Group: 4–6
  if (numAge <= 6) {
    switch (genre.toLowerCase()) {
      case 'adventure':
        return {
          author: 'Julia Donaldson',
          notes: 'Rhyming, vivid imagery, friendly tone, simple arcs',
          book: 'The Gruffalo'
        };
      case 'mystery':
        return {
          author: 'Dr. Seuss',
          notes: 'Rhyming clues, playful tone, colorful, rhythmic storytelling',
          book: 'Green Eggs and Ham'
        };
      case 'fairytale':
        return {
          author: 'Beatrix Potter',
          notes: 'Talking animals, moral lessons, soft narration',
          book: 'The Tale of Peter Rabbit'
        };
      case 'humor':
        return {
          author: 'Mo Willems',
          notes: 'Silly, repetitive humor, strong expressions, interactive feel',
          book: 'Elephant & Piggie series'
        };
      default:
        return {
          author: 'Julia Donaldson',
          notes: 'Rhyming, vivid imagery, friendly tone, simple arcs',
          book: 'The Gruffalo'
        };
    }
  }
  
  // Age Group: 7–9
  else if (numAge <= 9) {
    switch (genre.toLowerCase()) {
      case 'adventure':
        return {
          author: 'Enid Blyton',
          notes: 'Classic adventure tone, group teamwork, safe suspense',
          book: 'Famous Five'
        };
      case 'mystery':
        return {
          author: 'Enid Blyton',
          notes: 'Gentle mysteries, clue-based progression, friendly feel',
          book: 'Secret Seven'
        };
      case 'fairytale':
        return {
          author: 'Brothers Grimm (soft)',
          notes: 'Simplified fairytales, moral outcomes, imaginative twists',
          book: 'Hansel and Gretel (simplified)'
        };
      case 'humor':
        return {
          author: 'Roald Dahl',
          notes: 'Quirky, absurd humor, playful narration, often a moral',
          book: 'Charlie and the Chocolate Factory'
        };
      default:
        return {
          author: 'Enid Blyton',
          notes: 'Classic adventure tone, group teamwork, safe suspense',
          book: 'Famous Five'
        };
    }
  }
  
  // Age Group: 10–12
  else if (numAge <= 12) {
    switch (genre.toLowerCase()) {
      case 'adventure':
        return {
          author: 'Rick Riordan (lite)',
          notes: 'Mythology-inspired, action-driven, witty, simplified cultural references',
          book: 'Percy Jackson'
        };
      case 'mystery':
        return {
          author: 'Lemony Snicket (light)',
          notes: 'Whimsical dark humor, mysterious atmosphere, clever narration',
          book: 'A Series of Unfortunate Events'
        };
      case 'fairytale':
        return {
          author: 'C. S. Lewis',
          notes: 'Fantasy epic, values-based, world-building, moral decisions',
          book: 'Chronicles of Narnia'
        };
      case 'humor':
        return {
          author: 'Jeff Kinney',
          notes: 'Diary-style, sarcasm, relatable school-life humor',
          book: 'Diary of a Wimpy Kid'
        };
      default:
        return {
          author: 'Rick Riordan (lite)',
          notes: 'Mythology-inspired, action-driven, witty, simplified cultural references',
          book: 'Percy Jackson'
        };
    }
  }
  
  // Age Group: 13–18
  else {
    switch (genre.toLowerCase()) {
      case 'adventure':
        return {
          author: 'Rick Riordan (lite)',
          notes: 'Bolder action, mythic scale, personal growth arcs',
          book: 'Heroes of Olympus'
        };
      case 'mystery':
        return {
          author: 'Lemony Snicket (light)',
          notes: 'More intrigue, dramatic narration, complex vocabulary',
          book: 'A Series of Unfortunate Events'
        };
      case 'fairytale':
        return {
          author: 'C. S. Lewis',
          notes: 'Deep themes, symbolism, layered world-building',
          book: 'The Magician\'s Nephew'
        };
      case 'humor':
        return {
          author: 'Jeff Kinney',
          notes: 'Light sarcasm, teen dilemmas, emotional humor',
          book: 'Diary of a Wimpy Kid: The Ugly Truth'
        };
      default:
        return {
          author: 'Rick Riordan (lite)',
          notes: 'Bolder action, mythic scale, personal growth arcs',
          book: 'Heroes of Olympus'
        };
    }
  }
};
