import React from 'react';

const ScrollingEmojis: React.FC = () => {
  // Array of funny kid-friendly emoticons
  const funnyEmojis = [
    '🎈', '🦁', '🐸', '🎂', '🎪', '🎨', '🎭', '🌈', '⭐', '✨',
    '🦄', '🐻', '🐰', '🐼', '🐧', '🦋', '🐝', '🐢', '🦖', '🐙',
    '🎉', '🎊', '🎁', '🍰', '🍭', '🍬', '🍪', '🧁', '🍌', '🍎',
    '🚀', '✈️', '🚁', '🛸', '🎡', '🎢', '🎠', '🎯', '🪀', '🧸',
    '⚽', '🏀', '🎳', '🎲', '🃏', '🎪', '🎭', '🎨', '🎬', '🎮',
    '🌟', '💫', '☄️', '🌙', '☀️', '🌻', '🌺', '🌸', '🌷', '🌹'
  ];

  const scrollingRows = [
    {
      emojis: funnyEmojis.slice(0, 15),
      direction: 'right',
      speed: '8s',
      top: '10%',
      size: 'text-4xl'
    },
    {
      emojis: funnyEmojis.slice(15, 30),
      direction: 'left',
      speed: '12s',
      top: '25%',
      size: 'text-5xl'
    },
    {
      emojis: funnyEmojis.slice(30, 45),
      direction: 'diagonal-right',
      speed: '10s',
      top: '40%',
      size: 'text-3xl'
    },
    {
      emojis: funnyEmojis.slice(45, 60),
      direction: 'left',
      speed: '14s',
      top: '55%',
      size: 'text-6xl'
    },
    {
      emojis: funnyEmojis.slice(0, 10),
      direction: 'diagonal-left',
      speed: '9s',
      top: '70%',
      size: 'text-4xl'
    },
    {
      emojis: funnyEmojis.slice(10, 25),
      direction: 'right',
      speed: '11s',
      top: '85%',
      size: 'text-5xl'
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {scrollingRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="absolute w-full"
          style={{ top: row.top }}
        >
          {row.emojis.map((emoji, emojiIndex) => (
            <div
              key={`${rowIndex}-${emojiIndex}`}
              className={`absolute ${row.size} ${
                row.direction === 'right' ? 'animate-scroll-right' :
                row.direction === 'left' ? 'animate-scroll-left' :
                row.direction === 'diagonal-right' ? 'animate-scroll-diagonal-right' :
                'animate-scroll-diagonal-left'
              }`}
              style={{
                animationDelay: `${emojiIndex * 1.5}s`,
                animationDuration: row.speed,
                left: row.direction.includes('left') ? 'auto' : `-${emojiIndex * 100}px`
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      ))}
      
      {/* Additional floating elements that spin and move */}
      {/* <div className="absolute top-1/4 left-1/4 text-6xl animate-float-and-spin" style={{ animationDelay: '0s' }}>🎪</div>
      <div className="absolute top-1/3 right-1/4 text-5xl animate-float-and-spin" style={{ animationDelay: '1s' }}>🦄</div>
      <div className="absolute bottom-1/4 left-1/3 text-7xl animate-float-and-spin" style={{ animationDelay: '2s' }}>🌈</div> */}
      <div className="absolute bottom-1/3 right-1/3 text-4xl animate-float-and-spin" style={{ animationDelay: '1.5s' }}>🎊</div>
      <div className="absolute top-1/2 left-1/2 text-6xl animate-float-and-spin" style={{ animationDelay: '0.5s' }}>✨</div>
    </div>
  );
};

export default ScrollingEmojis; 