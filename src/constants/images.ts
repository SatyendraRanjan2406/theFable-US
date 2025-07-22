/**
 * Centralized Image Constants
 * All image URLs used in the application
 */

// Story example images used in carousels and showcases
export const STORY_EXAMPLE_IMAGES = [
  "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/4.png",
  "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/2.png",
  "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/3.png"
];

// Collage options with their associated stories
export const COLLAGE_STORY_OPTIONS = [
];

// Extract all image URLs for bulk operations
export const ALL_STORY_IMAGES = [
  ...STORY_EXAMPLE_IMAGES,
  ...COLLAGE_STORY_OPTIONS.map(option => option.img)
];

// Remove duplicates
export const UNIQUE_STORY_IMAGES = [...new Set(ALL_STORY_IMAGES)];

// Preload all images function
export const preloadAllStoryImages = async () => {
  const { preloadImages } = await import('@/utils/imageCache');
  return preloadImages(UNIQUE_STORY_IMAGES);
}; 