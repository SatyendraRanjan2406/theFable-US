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
  },
  
  // Payment configuration
  payment: {
    amount: parseFloat(import.meta.env.VITE_PAYMENT_AMOUNT || '2.00'),
    originalPrice: parseFloat(import.meta.env.VITE_PAYMENT_ORIGINAL_PRICE || '5.00'),
    currency: import.meta.env.VITE_PAYMENT_CURRENCY || 'INR',
    description: 'Storymaker Premium'
  },
  
  // Platform configuration
  platform: import.meta.env.VITE_PLATFORM || 'IN'
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

// Helper function to get payment configuration
export const getPaymentConfig = () => {
  return {
    amount: APP_CONFIG.payment.amount,
    currency: APP_CONFIG.payment.currency,
    description: APP_CONFIG.payment.description
  };
};

// Helper function to get formatted payment amount
export const getFormattedPaymentAmount = (): string => {
  const { amount, currency } = APP_CONFIG.payment;
  
  // Format based on currency
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`;
  } else if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// Helper function to get formatted original price
export const getFormattedOriginalPrice = (): string => {
  const { originalPrice, currency } = APP_CONFIG.payment;
  
  // Format based on currency
  if (currency === 'INR') {
    return `₹${originalPrice.toFixed(2)}`;
  } else if (currency === 'USD') {
    return `$${originalPrice.toFixed(2)}`;
  } else {
    return `${originalPrice.toFixed(2)} ${currency}`;
  }
}; 