import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { preloadImages, getCachedUrl } from '@/utils/imageCache';

interface ImageCarouselProps {
  images: string[];
  autoRotate?: boolean;
  rotationInterval?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  autoRotate = true, 
  rotationInterval = 3000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Preload all images when component mounts
  useEffect(() => {
    const preloadAllImages = async () => {
      try {
        console.log('🖼️ Preloading carousel images...');
        await preloadImages(images);
        console.log('✅ All carousel images preloaded and cached');
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error preloading images:', error);
        setIsLoading(false); // Still show images even if preloading fails
      }
    };

    preloadAllImages();
  }, [images]);

  useEffect(() => {
    if (autoRotate && !isLoading) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = prevIndex === images.length - 1 ? 0 : prevIndex + 1;
          // Removed GTM tracking for auto rotation
          return newIndex;
        });
      }, rotationInterval);

      return () => clearInterval(interval);
    }
  }, [autoRotate, rotationInterval, images.length, isLoading]);

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    // Removed GTM tracking for previous click
  };

  const goToNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    // Removed GTM tracking for next click
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // Removed GTM tracking for dot click
  };

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg">
      {/* Main Image Display */}
      <div className="relative w-full h-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading images...</div>
          </div>
        ) : (
        <img
            src={getCachedUrl(images[currentIndex])}
          alt={`Story example ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        />
        )}
        
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white shadow-md'
                : 'bg-white/60 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel; 