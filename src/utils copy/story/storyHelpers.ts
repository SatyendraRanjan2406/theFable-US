
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
