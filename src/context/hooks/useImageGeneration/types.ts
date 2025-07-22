
export interface UseImageGenerationProps {
  story: string | null;
  characterName: string;
  characterPhoto: string | null;
  genre: string;
  hfApiKey: string;
}

export interface PanelText {
  text: string;
  index: number;
}

export interface ImageCache {
  [key: string]: string;
}

export interface LoadingState {
  [key: string]: boolean;
}
