/**
 * App Configuration
 * Centralized configuration for app-wide settings
 */

// App branding configuration
export const APP_CONFIG = {
  // App title - can be "StoryMaker" or "The Fable"
  title: import.meta.env.VITE_APP_TITLE || 'StoryMaker',
  
  // App description
  description: 'Personalized Storybooks for Kids',
  
  // App domain
  domain: import.meta.env.VITE_APP_DOMAIN || 'storymaker.jcool.in',
  
  // Company name
  company: 'Parable Studios Private Limited',
  
  // Copyright year
  copyrightYear: '2025',
  
  // App URLs
  urls: {
    website: `https://${import.meta.env.VITE_APP_DOMAIN || 'storymaker.jcool.in'}`,
    api: import.meta.env.VITE_API_BASE_URL || 'https://api.srujana.solutions',
  },
  
  // Carousel images for hero section
  carousel: {
    images: [
      import.meta.env.VITE_CAROUSEL_IMAGE_1 || "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/3.png",
      import.meta.env.VITE_CAROUSEL_IMAGE_2 || "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/6.png",
      import.meta.env.VITE_CAROUSEL_IMAGE_3 || "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/demo.jpeg"
    ]
  }
};

// Helper function to get full app title
export const getAppTitle = (suffix?: string): string => {
  const baseTitle = APP_CONFIG.title;
  return suffix ? `${baseTitle} - ${suffix}` : baseTitle;
};

// Helper function to get powered by text
export const getPoweredByText = (): string => {
  return `Powered by ${APP_CONFIG.domain}`;
};

// Helper function to get copyright text
export const getCopyrightText = (): string => {
  return `${APP_CONFIG.domain} © ${APP_CONFIG.copyrightYear} ${APP_CONFIG.company}. All rights reserved.`;
};

// Helper function to get carousel images with validation
export const getCarouselImages = (): string[] => {
  const images = APP_CONFIG.carousel.images;
  
  // Filter out any empty or invalid URLs
  const validImages = images.filter(img => img && img.trim() !== '');
  
  // If no valid images, return default fallback
  if (validImages.length === 0) {
    return [
      "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/3.png",
      "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/6.png",
      "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/demo.jpeg"
    ];
  }
  
  return validImages;
}; 