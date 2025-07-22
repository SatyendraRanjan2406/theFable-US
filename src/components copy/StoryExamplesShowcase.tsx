import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Heart, Crown, Rocket, Castle } from 'lucide-react';

interface StoryExamplesShowcaseProps {
  onStorySelect?: (outline: string, characterName: string) => void;
}

const StoryExamplesShowcase: React.FC<StoryExamplesShowcaseProps> = ({ onStorySelect }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const characterName = "Alex"; // Or get from user input

  // Beautiful child-like story examples with amazing backgrounds
  const storyExamples = [
    {
      imageUrl: '/story-examples/space-astronaut.jpg',
      title: "🚀 Space Explorer",
      description: "Join amazing space adventures with robots and rockets!",
      bgGradient: "from-blue-200 via-purple-200 to-pink-200",
      emoji: "🌟",
      context: "Once upon a time, {character} became a brave space explorer and discovered a planet made of candy! {character} made friends with friendly aliens and had amazing adventures among the stars."
    },
    {
      imageUrl: '/story-examples/mountain-adventure.jpg', 
      title: "🏔️ Mountain Hero",
      description: "Climb magical mountains and discover hidden treasures!",
      bgGradient: "from-green-200 via-blue-200 to-purple-200",
      emoji: "⛰️",
      context: "High up in the magical mountains, {character} found a secret treasure chest filled with sparkly gems and magical powers! {character} became the bravest mountain climber ever."
    },
    {
      imageUrl: '/story-examples/garden-puppies.jpg',
      title: "🐕 Garden Friends", 
      description: "Play with adorable puppies in enchanted gardens!",
      bgGradient: "from-yellow-200 via-green-200 to-blue-200",
      emoji: "🌸",
      context: "In the enchanted garden, {character} discovered talking puppies who loved to play hide and seek! {character} and the puppies had the most wonderful day playing together."
    },
    {
      imageUrl: '/story-examples/beach-adventure.jpg',
      title: "🏖️ Beach Explorer",
      description: "Have fun beach adventures with sun and sand!",
      bgGradient: "from-orange-200 via-yellow-200 to-blue-200", 
      emoji: "☀️",
      context: "At the magical beach, {character} found seashells that could sing beautiful songs! {character} built the most amazing sandcastle and met a friendly dolphin."
    },
    {
      imageUrl: '/story-examples/space-planets.jpg',
      title: "🪐 Planet Jumper",
      description: "Hop between colorful planets and meet aliens!",
      bgGradient: "from-purple-200 via-pink-200 to-blue-200",
      emoji: "👽",
      context: "Jumping from planet to planet, {character} met silly purple aliens who loved to dance! {character} learned their funny alien dance and became the best planet jumper in the galaxy."
    },
    {
      imageUrl: '/story-examples/comic-fun.jpg',
      title: "💥 Comic Hero",
      description: "Become a superhero in your own comic book!",
      bgGradient: "from-red-200 via-orange-200 to-yellow-200",
      emoji: "💪",
      context: "With amazing superpowers, {character} saved the day by helping all the animals in the city! {character} became the most beloved superhero with the power of kindness."
    }
  ];

  const magicalElements = [
    { icon: Sparkles, color: "text-yellow-400", size: "w-4 h-4" },
    { icon: Star, color: "text-pink-400", size: "w-3 h-3" },
    { icon: Heart, color: "text-red-400", size: "w-3 h-3" },
    { icon: Crown, color: "text-purple-400", size: "w-4 h-4" },
    { icon: Rocket, color: "text-blue-400", size: "w-4 h-4" },
    { icon: Castle, color: "text-pink-500", size: "w-4 h-4" }
  ];

  const handleClick = (example: typeof storyExamples[0]) => {
    const outline = example.context.replace(/{character}/g, characterName);
    if (onStorySelect) {
      onStorySelect(outline, characterName);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % storyExamples.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-3xl p-8 mb-8 border-4 border-dashed border-purple-300 overflow-hidden">
      

      {/* Floating magical elements */}
      <div className="absolute inset-0 pointer-events-none">
        {magicalElements.map((Element, index) => (
          <div
            key={index}
            className={`absolute animate-bounce ${Element.color}`}
            style={{
              left: `${10 + (index * 15)}%`,
              top: `${15 + (index % 3) * 20}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${2 + (index % 3)}s`
            }}
          >
            <Element.icon className={Element.size} />
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Star className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            ✨ MAGICAL STORY ADVENTURES! ✨
          </h2>
          <Star className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <p className="text-lg md:text-xl font-bold text-purple-700 mb-2">
          See how amazing kids become the HEROES of their own stories!
        </p>
        <p className="text-base md:text-lg text-pink-600 font-semibold">
          Your child could be the next space explorer, mountain climber, or magical adventurer!
        </p>
      </div>

      {/* Magical Carousel Showcase */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/50 backdrop-blur-sm border-4 border-white/60 mb-6">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {storyExamples.map((example, index) => (
            <div
              key={index}
              onClick={() => handleClick(example)}
              style={{ cursor: "pointer" }}
              className={`min-w-full relative h-80 bg-gradient-to-br ${example.bgGradient} hover:brightness-110 transition-all duration-300`}
            >
              {/* Magical Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.3'%3E%3Cpath d='M30 20l2.5 7.5H40l-6.25 4.5 2.5 7.5L30 35l-6.25 4.5 2.5-7.5L20 27.5h7.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              {/* Floating Fun Elements - Reduced emoticons for cleaner look */}
              {/* <div className="absolute top-2 left-4 text-6xl animate-balloon-float hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0s' }}>🎈</div>
              <div className="absolute bottom-4 left-6 text-6xl animate-lion-roar hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.8s' }}>🦁</div>
              <div className="absolute top-12 left-1/4 text-5xl animate-frog-hop hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.3s' }}>🐸</div>
              <div className="absolute bottom-8 right-8 text-5xl animate-float-wiggle hover:scale-110 transition-transform cursor-pointer" style={{ animationDelay: '1s' }}>🎪</div>
               */}
              {/* Fewer floating emoticons for cleaner appearance */}
              {/* <div className="absolute top-1/3 right-6 text-5xl animate-balloon-float hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.7s' }}>🦄</div> */}
              {/* <div className="absolute bottom-1/3 left-12 text-4xl animate-frog-hop hover:scale-120 transition-transform cursor-pointer" style={{ animationDelay: '1.8s' }}>🐻</div> */}
              {/* <div className="absolute top-6 left-16 text-3xl animate-float-and-spin hover:scale-110 transition-transform cursor-pointer" style={{ animationDelay: '0.9s' }}>🌈</div> */}
              {/* <div className="absolute bottom-6 right-16 text-4xl animate-lion-roar hover:scale-115 transition-transform cursor-pointer" style={{ animationDelay: '1.1s' }}>🐰</div> */}
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <div className="w-40 h-40 mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 transform hover:scale-110 transition-all duration-300 hover:rotate-2">
                    <img
                      src={example.imageUrl}
                      alt={example.title}
                      className="w-full h-full object-cover hover:brightness-110 transition-all duration-300"
                      onError={(e) => {
                        // Create a beautiful colorful fallback background
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.background = example.bgGradient.includes('blue') ? 
                            'linear-gradient(135deg, #93C5FD, #C084FC, #F472B6)' :
                            example.bgGradient.includes('green') ?
                            'linear-gradient(135deg, #86EFAC, #60A5FA, #C084FC)' :
                            'linear-gradient(135deg, #FBBF24, #F472B6, #60A5FA)';
                          parent.innerHTML = `<div class="flex items-center justify-center h-full text-6xl">${example.emoji}</div>`;
                        }
                      }}
                    />
                  </div>
                  
                  {/* Magic Emoji */}
                  <div className="text-4xl mb-2 animate-pulse">
                    {example.emoji}
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-purple-800 drop-shadow-lg">
                    {example.title}
                  </h3>
                  <p className="text-lg text-purple-700 max-w-md mx-auto leading-relaxed font-medium">
                    {example.description}
                  </p>
                  
                  {/* Sparkle Effect */}
                  <div className="flex justify-center space-x-2 mt-4">
                    <span className="text-2xl animate-spin">✨</span>
                    <span className="text-2xl animate-ping">⭐</span>
                    <span className="text-2xl animate-spin">✨</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {storyExamples.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-purple-500 scale-125' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Fun Call to Action */}
      {/* <div className="text-center relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-purple-200">
          <p className="text-lg font-bold text-purple-800 mb-2">
            Click any adventure above to start your magical story!
          </p>
          <p className="text-purple-600">
            Each story is personalized just for your child!
          </p>
        </div>
      </div> */}
    </div>
  );
};

export default StoryExamplesShowcase; 