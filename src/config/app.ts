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