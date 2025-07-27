# Carousel Images Configuration

This document explains how to configure the carousel images displayed in the hero section of the application.

## Environment Variables

Add these variables to your `.env` file to customize the carousel images:

```bash
# Carousel Images Configuration
VITE_CAROUSEL_IMAGE_1=https://your-domain.com/image1.jpg
VITE_CAROUSEL_IMAGE_2=https://your-domain.com/image2.jpg
VITE_CAROUSEL_IMAGE_3=https://your-domain.com/image3.jpg
```

## Default Images

If no environment variables are set, the application will use these default images:

1. `https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/3.png`
2. `https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/6.png`
3. `https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/demo.jpeg`

## Usage in Code

The carousel images are accessed through the centralized configuration:

```typescript
import { getCarouselImages } from '@/config/app';

// Get all carousel images with validation
const carouselImages = getCarouselImages();
```

## Validation

The `getCarouselImages()` function includes validation to:
- Filter out empty or invalid URLs
- Provide fallback images if no valid images are configured
- Ensure the carousel always has at least one image to display

## Example Configuration

### For Production
```bash
VITE_CAROUSEL_IMAGE_1=https://cdn.yourdomain.com/hero-image-1.jpg
VITE_CAROUSEL_IMAGE_2=https://cdn.yourdomain.com/hero-image-2.jpg
VITE_CAROUSEL_IMAGE_3=https://cdn.yourdomain.com/hero-image-3.jpg
```

### For Development
```bash
VITE_CAROUSEL_IMAGE_1=http://localhost:3000/images/hero-1.jpg
VITE_CAROUSEL_IMAGE_2=http://localhost:3000/images/hero-2.jpg
VITE_CAROUSEL_IMAGE_3=http://localhost:3000/images/hero-3.jpg
```

## Image Requirements

- **Format**: JPG, PNG, or WebP
- **Aspect Ratio**: Recommended 1:1 or 4:3 for best display
- **Size**: Optimize for web (typically 500x500px or larger)
- **Content**: Should represent your app's story creation features

## Troubleshooting

### Images Not Loading
1. Check that the URLs are accessible
2. Verify the environment variables are set correctly
3. Ensure the development server is restarted after changing `.env`

### Fallback Behavior
If any image fails to load, the carousel will continue with the remaining images. If all images fail, the default images will be used. 