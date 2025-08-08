// Domain detection utility
export const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return '';
};

export const isStorymakerDomain = (): boolean => {
  const domain = getCurrentDomain();
  return domain === 'storymaker.jcool.in' || domain === 'localhost' || domain === '127.0.0.1';
};

export const isThefableDomain = (): boolean => {
  const domain = getCurrentDomain();
  return domain === 'thefable.app';
};

// Conditional PDF selection based on domain
export const getSamplePdfs = () => {
  if (isThefableDomain()) {
    // Import SAMPLE_PDFS_US for thefable.app
    return import('@/components/AppHeader').then(({ SAMPLE_PDFS_US }) => SAMPLE_PDFS_US);
  } else {
    // Import SAMPLE_PDFS for storymaker.jcool.in and other domains
    return import('@/components/AppHeader').then(({ SAMPLE_PDFS }) => SAMPLE_PDFS);
  }
}; 