import React, { useEffect, useState } from 'react';

const messages = [
  'Stories spark imagination and creativity in every child.',
  'Every child deserves to be the hero of their own story!',
  'Reading together builds strong family bonds.',
  'Stories help children dream big and believe in themselves.',
  'A good story can inspire a lifetime of learning.',
  'Creating stories together makes magical memories.'
];

const gifs = [
  'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', // book opening
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // stars
  'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', // reading
  'https://media.giphy.com/media/3o6Zt8zb1Pp2v3A4l6/giphy.gif', // magic
  'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', // sparkles
  'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif', // kids reading
];

const PremiumLoader: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full mx-4">
        {/* Animated GIF */}
        <div className="mb-6">
          <img
            src={gifs[index % gifs.length]}
            alt="Storybook animation"
            className="w-32 h-32 object-contain rounded-lg shadow-md border border-purple-200"
            style={{ background: '#f3e8ff' }}
          />
        </div>
        {/* Rotating inspirational message */}
        <div className="text-lg text-center text-purple-700 font-semibold min-h-[48px] transition-all duration-500">
          {messages[index % messages.length]}
        </div>
        <div className="mt-6 text-gray-500 text-sm text-center">
          Generating your premium illustrations...<br />This may take a moment.
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader; 