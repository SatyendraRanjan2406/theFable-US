import React, { useRef } from 'react';
import { BookOpen, Sparkles, Heart, Star, Gift, Users, Download, Menu } from 'lucide-react';
import WorkflowProgress from './WorkflowProgress';
import StoryExamplesShowcase from './StoryExamplesShowcase';
import MagicalImageCollage from './MagicalImageCollage';
import ImageCarousel from './ImageCarousel';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { trackStoryCreationHomeButtonClicked, trackStoryCreationStarted, trackStoryTemplateSelected } from '@/utils/gtm';

type WorkflowStep = 'form' | 'outline' | 'final';

interface AppHeaderProps {
  currentStep: WorkflowStep;
  onCreateStoryClick: () => void;
  onStorySelect?: (outline: string, characterName: string) => void;
  onMenuToggle?: () => void;
}

export const SAMPLE_PDFS = [
  {
    name: "Elisha's Adventure",
    url: "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/Elisha-comic-story.pdf",
    description: "See Elisha's exciting expedition with her friends!",
    character: "Elisha"
  },
  {
    name: "Shivaay's Journey",
    url: "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/shivaay-comic-story+(1).pdf",
    description: "Discover how Shivaay embarks on an exciting journey!",
    character: "Shivaay"
  }
];

const AppHeader: React.FC<AppHeaderProps> = ({ currentStep, onCreateStoryClick, onStorySelect, onMenuToggle }) => {
  const formRef = useRef<HTMLDivElement>(null);

  const handleCreateStoryClick = () => {
    // Track the story creation start event
    trackStoryCreationHomeButtonClicked('main_cta_button');
    onCreateStoryClick();
  };

  const handleStorySelect = (outline: string, characterName: string) => {
    // Track story template selection
    trackStoryTemplateSelected(outline.substring(0, 50)); // Use first 50 chars as template identifier
    if (onStorySelect) {
      onStorySelect(outline, characterName);
    }
  };

  // Image carousel data
  const storyExampleImages = [
    "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/5.png",
    "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/2.png",
    "https://storymaker-jcool.s3.ap-south-1.amazonaws.com/web_assets/3.png"
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#333333]">
      {/* Header with Menu Button */}
      {onMenuToggle && (
        <header className="bg-white shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onMenuToggle} className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
              <span className="text-xl font-bold text-gray-800">{APP_CONFIG.title}</span>
            </div>
          </nav>
        </header>
      )}
      
      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 py-12 px-4 max-w-6xl mx-auto">
        {/* Text Content */}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-5xl font-[DM Serif Display] mb-4 text-[#8D4BE5] leading-snug">
            Your Child Deserves to Be the Hero of Their Own Story
          </h1>
          <p className="max-w-lg mx-auto md:mx-0 mb-6 text-lg text-[#555555]">
            Magical, personalized storybooks where your child appears in beautiful, illustrated adventures. Boost confidence, spark joy, and create lifelong memories.
          </p>
          <Button
            onClick={handleCreateStoryClick}
            className="bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white px-8 py-3 rounded-full shadow-lg text-lg font-medium hover:from-[#D55A3A] hover:to-[#C026D6] transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Your Story Now
          </Button>
        </div>

        {/* Illustration */}
        <div className="flex justify-center flex-1">
          <div className="relative">
            <div className="w-64 md:w-80 h-64 md:h-80 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-24 h-24 text-purple-500 mx-auto mb-4" />
                <div className="text-2xl">📚✨</div>
                <p className="text-sm text-purple-600 mt-2">Personalized Stories</p>
              </div>
            </div>
            {/* Floating decorative elements */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🌟</div>
          </div>
        </div>
      </section>

      {/* Why Parents Love {APP_CONFIG.title} */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-[#333333]">Why Parents Love {APP_CONFIG.title}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: "🧠", title: "Builds Confidence & Imagination", desc: "Children light up when they see themselves as the star of a magical tale." },
            { icon: "📖", title: "Encourages a Love for Reading", desc: "Personalized adventures help kids fall in love with reading, one story at a time." },
            { icon: "💌", title: "A Keepsake You'll Treasure Forever", desc: "Beautifully illustrated books you'll cherish, relive, and share for years to come." },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow text-center flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-[#333333]">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3 text-center">
          {[
            { 
              icon: <Download className="w-12 h-12 text-blue-500" />, 
              title: "Upload a Photo of Your Child", 
              desc: "Their smile brings the story to life." 
            },
            { 
              icon: <BookOpen className="w-12 h-12 text-purple-500" />, 
              title: "Choose a Magical Adventure", 
              desc: "Select from delightful, age-appropriate story templates." 
            },
            { 
              icon: <Gift className="w-12 h-12 text-pink-500" />, 
              title: "Get Your Personalized Storybook", 
              desc: "Preview illustrations instantly. Download or order your keepsake anytime." 
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow flex flex-col items-center space-y-4 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="text-center py-12 px-4 bg-[#FFF7F3]">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-[#333333]">See the Magic Through Other Parents</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <blockquote className="bg-white rounded-xl p-6 shadow italic text-gray-700 hover:shadow-lg transition-shadow duration-300">
            "My son couldn't stop smiling seeing himself in the story!"<br/>
            <span className="not-italic font-semibold">— Riya, mom of a 5-year-old</span>
          </blockquote>
          <blockquote className="bg-white rounded-xl p-6 shadow italic text-gray-700 hover:shadow-lg transition-shadow duration-300">
            "Great bonding activity. Highly recommend."<br/>
            <span className="not-italic font-semibold">— Arjun, dad of twins</span>
          </blockquote>
        </div>
      </section>

      {/* Original Content - Enhanced */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Gift and reading habit emphasis */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <p className="text-lg text-slate-700 font-medium mb-2">
            Give your child the most meaningful gift imaginable - a personalized story where they become the hero of their own adventure!
          </p>
                      <h2 className="text-3xl font-bold text-blue-700 mb-4">Welcome to {APP_CONFIG.title}</h2>
          <p className="text-base text-slate-600">
            We believe every child deserves to see themselves as the hero of amazing stories.
            <br />
            <span className="font-semibold text-blue-700">Create personalized books that spark imagination, encourage reading habits, and become treasured keepsakes.</span>
          </p>
          <div className="mt-8">
            <Button
              onClick={handleCreateStoryClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg md:text-xl px-6 md:px-10 py-6 md:py-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-soft-blink"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              CREATE YOUR STORY NOW
            </Button>
          </div>
        </div>

        {/* New Section: Text Explanation and Image Carousel */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 mb-8 border border-purple-200">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Text Explanation Half */}
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-bold text-purple-700 mb-4">
                ✨ See the Magic in Action! ✨
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Watch your child's face light up as they discover themselves as the main character in beautifully illustrated adventures!
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <p className="text-slate-600">Upload your child's photo</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <p className="text-slate-600">Choose from magical story templates or write your own</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <p className="text-slate-600">Regenerate images if you don't like them</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <p className="text-slate-600">Get a personalized illustrated storybook</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">5</span>
                </div>
                <div className="flex-1">
                  <p className="text-blue-600 animate-pulse font-bold">Download sample books to see the magic</p>
                  <div className="flex gap-2 mt-1">
                    {SAMPLE_PDFS.map((pdf, index) => (
                      <a
                        key={index}
                        href={pdf.url}
                        download
                        className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded hover:bg-green-600 transition-colors"
                        onClick={() => {
                          import('@/utils/gtm').then(({ trackStoryTemplateSelected }) => {
                            trackStoryTemplateSelected(`sample_pdf_${pdf.character.toLowerCase()}`);
                          });
                        }}
                      >
                        <Download className="w-3 h-3" />
                        {pdf.character}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4 mt-4">
                <p className="text-sm text-purple-800 font-medium">
                  🌟 Perfect for ages 3-12 • Creates lasting memories • Encourages reading habits 🌟
                </p>
              </div>
            </div>

            {/* Image Carousel Half */}
            <div className="relative">
              <div className="relative">
                <ImageCarousel 
                  images={storyExampleImages} 
                  autoRotate={true} 
                  rotationInterval={4000} 
                />
                {/* Floating decorative elements */}
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
                <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🌟</div>
              </div>
              <p className="text-center text-sm text-slate-600 mt-3 italic">
                Examples of personalized story illustrations
              </p>
            </div>
          </div>
        </div>
        
        {/* Three pillars section - updated for reading and imagination focus */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Encourages Reading Habits</h3>
            <p className="text-sm text-slate-600">When children see themselves in stories, they become excited about reading and want to read more</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Activates Their Imagination</h3>
            <p className="text-sm text-slate-600">Personalized adventures help children dream bigger and see endless possibilities for their own lives</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-pink-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Creates Lasting Memories</h3>
            <p className="text-sm text-slate-600">A gift that becomes a treasured keepsake, reminding them they can be the hero of any adventure</p>
          </div>
        </div>

        {/* Story Examples Showcase - NEW ADDITION */}
        <StoryExamplesShowcase onStorySelect={handleStorySelect} />
        
        {/* Magical Image Collage - Fantasy Adventure Gallery */}
        <MagicalImageCollage onStorySelect={handleStorySelect} />

        {/* Gift/Surprise emphasis section - updated messaging */}
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-pink-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-8 h-8 text-pink-600" />
            <h2 className="text-2xl font-bold text-pink-700">The Gift That Keeps On Giving!</h2>
            <Gift className="w-8 h-8 text-pink-600" />
          </div>
          <p className="text-lg text-pink-800 font-medium mb-3">
            🎁 More than just a book - it's a confidence booster, imagination activator, and reading motivator all in one! 🎁
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-pink-700">
            <span className="bg-white/70 px-3 py-1 rounded-full">📚 Develops Love for Reading</span>
            <span className="bg-white/70 px-3 py-1 rounded-full">🌟 Builds Self-Confidence</span>
            <span className="bg-white/70 px-3 py-1 rounded-full">💭 Sparks Creativity</span>
            <span className="bg-white/70 px-3 py-1 rounded-full">❤️ Creates Special Memories</span>
          </div>
        </div>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-center">
          🌟 Give the gift of seeing themselves as the hero! 🌟
          <br />
          <span className="text-lg text-blue-600 font-medium">
            Upload their photo and create a personalized adventure that will inspire them to read more and dream bigger!
          </span>
        </p>
        
        <WorkflowProgress currentStep={currentStep} />
      </div>
    </div>
  );
};

export default AppHeader;
