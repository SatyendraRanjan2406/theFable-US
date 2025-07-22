import React from "react";
import "./FunkyCollage.css";

const collageOptions = [
  // {
  //   img: "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/390578998789881857.png",
  //   title: "The Magical Cake Race",
  //   context: "{character} entered a magical race where the track was made of cake and the finish line was a giant jellybean. What a sweet victory!",
  // },
];

interface MagicalImageCollageProps {
  onStorySelect?: (outline: string, characterName: string) => void;
}

const MagicalImageCollage: React.FC<MagicalImageCollageProps> = ({ onStorySelect }) => {
  // For demo, use a default name. Replace with user input if you want!
  const characterName = "Alex";

  const handleClick = (option: typeof collageOptions[0]) => {
    // Replace {character} in context with the character name
    const outline = option.context.replace(/{character}/g, characterName);

    if (onStorySelect) {
      onStorySelect(outline, characterName);
    }
  };

  return (
    // Removed <div className="relative"> wrapper
    <>
      {/* Floating Elements Around Collage - Kid-Friendly Animation */}
      {/* <div className="absolute inset-0 pointer-events-none z-0"> */}
        {/* <div className="absolute -top-4 -left-4 text-6xl animate-balloon-float" style={{ animationDelay: '0.2s' }}>🎈</div> */}
        {/* <div className="absolute -top-4 -right-4 text-5xl animate-lion-roar" style={{ animationDelay: '1s' }}>🦁</div> */}
        {/* <div className="absolute -top-7 -left-4 text-5xl animate-frog-hop" style={{ animationDelay: '0.7s' }}>🐸</div> */}
        {/* <div className="absolute -top-7 -right-4 text-6xl animate-balloon-float" style={{ animationDelay: '1.3s' }}>🎈</div> */}
        {/* <div className="absolute top-1/4 -left-8 text-4xl animate-lion-roar" style={{ animationDelay: '0.5s' }}>🦁</div>
        <div className="absolute top-1/2 -right-8 text-5xl animate-frog-hop" style={{ animationDelay: '1.5s' }}>🐸</div>
        <div className="absolute top-1/4 -left-6 text-5xl animate-balloon-float" style={{ animationDelay: '0.9s' }}>🎈</div>
        <div className="absolute top-3/4 -right-6 text-4xl animate-lion-roar" style={{ animationDelay: '1.7s' }}>🦁</div> */}
      {/* </div> */}

  
    </>
  );
};

export default MagicalImageCollage; 