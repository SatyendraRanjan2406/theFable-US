export interface StoryRequest {
  characterName: string;
  characterAge: string;
  characterGender: string;
  genre: string;
  storyOutline?: string;
  message?: string;
  pages: number;
}

export interface StoryData {
  characterName: string;
  characterAge: string;
  characterGender: string;
  photo: File | null;
  genre: string;
  bookType: string;
  message: string;
  storyOutline: string;
}

export interface Pronouns {
  subject: string;
  object: string;
  possessive: string;
}

export type AgeGroup = 'young' | 'middle' | 'teen';
