// Google Tag Manager utility functions for tracking custom events

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void; // Add this line
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

// Generic function to push events to GTM dataLayer
export const gtmPush = (eventData: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(eventData);
    console.log('GTM Event:', eventData); // For debugging
  }
  // Also send to gtag if available
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && eventData.event) {
    const { event, ...params } = eventData;
    window.gtag('event', event, params);
  }
};

// StoryCreator specific event tracking functions
export const trackStoryCreationHomeButtonClicked = (source?: string) => {
  gtmPush({
    event: 'story_creation_home_button_clicked',
    event_category: 'engagement',
    event_label: source || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackDownloadPDFButtonClicked = (source?: string) => {
  gtmPush({
    event: 'download_pdf_button_clicked',
    event_category: 'engagement',
    event_label: source || 'unknown',
    timestamp: new Date().toISOString(),
  });
};


// StoryCreator specific event tracking functions
export const trackStoryCreationStarted = (source?: string) => {
  gtmPush({
    event: 'story_creation_started',
    event_category: 'engagement',
    event_label: source || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackPhotoUploaded = (uploadMethod?: string) => {
  gtmPush({
    event: 'photo_uploaded',
    event_category: 'engagement',
    event_label: uploadMethod || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackStoryRegenerated = (customizationType?: string) => {
  gtmPush({
    event: 'story_regenerated',
    event_category: 'engagement',
    event_label: customizationType || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackPhotosRegenerated = (customizationType?: string) => {
  gtmPush({
    event: 'photos_regenerated',
    event_category: 'engagement',
    event_label: customizationType || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackGeneratePhotoButtonClicked = (customizationType?: string) => {
  gtmPush({
    event: 'generate_photo_button_clicked',
    event_category: 'engagement',
    event_label: customizationType || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackStoryCustomized = (customizationType?: string) => {
  gtmPush({
    event: 'story_customized',
    event_category: 'engagement',
    event_label: customizationType || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackCheckoutStarted = (storyType?: string, price?: number) => {
  gtmPush({
    event: 'checkout_started',
    event_category: 'ecommerce',
    event_label: storyType || 'unknown',
    value: price || 0,
    currency: 'INR',
    timestamp: new Date().toISOString(),
  });
};

export const trackPurchaseCompleted = (
  transactionId: string,
  storyType?: string,
  price?: number
) => {
  gtmPush({
    event: 'purchase_completed',
    event_category: 'ecommerce',
    transaction_id: transactionId,
    event_label: storyType || 'unknown',
    value: price || 0,
    currency: 'INR',
    timestamp: new Date().toISOString(),
  });
};

export const trackStoryViewed = (storyId?: string) => {
  gtmPush({
    event: 'story_viewed',
    event_category: 'engagement',
    event_label: storyId || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const trackStoryShared = (platform?: string) => {
  gtmPush({
    event: 'story_shared',
    event_category: 'engagement',
    event_label: platform || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

// Custom event for story template selection
export const trackStoryTemplateSelected = (templateName?: string) => {
  gtmPush({
    event: 'story_template_selected',
    event_category: 'engagement',
    event_label: templateName || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

// Custom event for carousel interaction
export const trackCarouselInteraction = (action: string, imageIndex?: number) => {
  gtmPush({
    event: 'carousel_interaction',
    event_category: 'engagement',
    event_label: action,
    image_index: imageIndex,
    timestamp: new Date().toISOString(),
  });
};

// Page view tracking (if you want to track SPAs)
export const trackPageView = (pagePath: string, pageTitle: string) => {
  gtmPush({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle,
    timestamp: new Date().toISOString(),
  });
}; 