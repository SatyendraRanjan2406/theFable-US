import React, { useState, useEffect } from 'react';
import { fetchCuratedStories } from '@/utils/curatedStoryApi';

interface CuratedStory {
  id: string;
  title: string;
  thumbnail: string | null;
  min_age: number;
  max_age: number;
  gender: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_new: boolean;
  panels_count: number;
}

interface CuratedStoriesShowcaseProps {
  onStorySelect: (story: CuratedStory) => void;
}

const CuratedStoriesShowcase: React.FC<CuratedStoriesShowcaseProps> = ({ onStorySelect }) => {
  const [stories, setStories] = useState<CuratedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        const data = await fetchCuratedStories();
        setStories(data);
      } catch (err) {
        console.error('Failed to load curated stories:', err);
        setError('Failed to load stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">Loading amazing stories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">No stories available at the moment.</p>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" data-curated-stories>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-dm-serif mb-4 text-[#8D4BE5]">
            Choose from Our Readymade Stories
          </h2>
          {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our collection of magical stories designed to spark imagination and create unforgettable memories
          </p> */}
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-purple-100"
                onClick={() => onStorySelect(story)}
              >
                {/* Story Image */}
                <div className="relative h-48 rounded-t-2xl overflow-hidden">
                  {story.thumbnail ? (
                    <img
                      src={story.thumbnail}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                      <div className="text-4xl">📚</div>
                    </div>
                  )}
                  
                  {/* New Badge */}
                  {story.is_new && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      NEW
                    </div>
                  )}
                  
                  {/* Age Range Badge */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-lg text-xs font-medium">
                    Ages {story.min_age}-{story.max_age}
                  </div>
                </div>

                {/* Story Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      {story.panels_count} Panel{story.panels_count !== 1 ? 's' : ''}
                    </span>
                    <span className="capitalize">{story.gender}</span>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white py-2 px-4 rounded-lg font-medium hover:from-[#D55A3A] hover:to-[#C026D6] transition-all duration-300 transform hover:scale-105">
                    Choose This Story
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Can't find the perfect story? Create your own custom adventure!
          </p>
        </div>
      </div>
    </section>
  );
};

export default CuratedStoriesShowcase; 