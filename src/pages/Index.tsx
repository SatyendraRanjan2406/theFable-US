import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import StoryPreview from '@/components/StoryPreview';
import StoryForm from '@/components/StoryForm';
import StoryOutlineEditor from '@/components/StoryOutlineEditor';
import AppHeader from '@/components/AppHeader';
import CuratedStoriesSection from '@/components/CuratedStoriesSection';
import CuratedStoryForm from '@/components/CuratedStoryForm';
import CuratedStoriesShowcase from '@/components/CuratedStoriesShowcase';
import CuratedStoryGenerationProgress from '@/components/story-preview/CuratedStoryGenerationProgress';
import FinalCuratedPreview from '@/components/story-preview/FinalCuratedPreview';
import { useStoryWorkflow } from '@/hooks/useStoryWorkflow';
import { useFormData } from '@/hooks/useFormData';
import ImageGenerationProgress from '@/components/story-preview/ImageGenerationProgress';
import { generateAllIllustrations } from '@/utils/generateAllIllustrations';
import { clearVisualContinuityCache } from '@/utils/imageGeneration';
import ErrorState from '@/components/story-preview/ErrorState';
import PricingModal from '@/components/PricingModal';
import { toast } from 'sonner';
import { fileToBase64, getSelectedCharacterImageBase64, urlToBase64 } from '@/utils/imageUtils';
import { generateMinimaxImage } from '@/utils/imageGeneration/apiClients';
import { generatePanelImage } from '@/utils/storyApi';
import NavigationBar from '@/components/NavigationBar';
import { StoryData } from '@/utils/types/storyTypes';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/Footer';

import { trackPhotosRegenerated, trackStoryRegenerated, trackStoryTemplateSelected } from '@/utils/gtm';
import { SAMPLE_PDFS } from '@/components/AppHeader';
import { BASE_URL } from '@/config/api';
import { APP_CONFIG, getCarouselImages } from '@/config/app';
import { getSamplePdfs } from '@/utils/domainUtils';


// Carousel images for hero section - configurable from environment variables
const carouselImages = getCarouselImages();

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-80 md:w-96 lg:w-[500px] h-80 md:h-96 lg:h-[500px] bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl flex items-center justify-center overflow-hidden shadow-lg">
      <img
        src={carouselImages[index]}
                        alt={`${APP_CONFIG.title} Example ${index + 1}`}
        className="w-full h-full object-cover rounded-3xl transition-all duration-700"
      />
    </div>
  );
}

interface IndexProps {
  onMenuToggle?: () => void;
}

const Index: React.FC<IndexProps> = ({ onMenuToggle }) => {
  // Helper function to get character photo from sessionStorage
  const getCharacterPhotoFromSessionStorage = () => {
    try {
      // First try to get from photoData
      const savedPhotoData = sessionStorage.getItem('photoData');
      if (savedPhotoData) {
        const photoData = JSON.parse(savedPhotoData);
        if (photoData.uploadedImageUrl) {
          return photoData.uploadedImageUrl;
        }
      }
      
      // Fallback to formData
      const savedFormData = sessionStorage.getItem('formData');
      if (savedFormData) {
        const formData = JSON.parse(savedFormData);
        if (formData.selectedPhotoForStory) {
          return formData.selectedPhotoForStory;
        }
        if (formData.uploadedPhotoUrl) {
          return formData.uploadedPhotoUrl;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting character photo from sessionStorage:', error);
      return null;
    }
  };
  console.log('🏠 Index component rendered');
  
  // 1. All state and ref hooks at the top
  const [showStoryCreation, setShowStoryCreation] = useState(false);
  const [selectedCuratedStory, setSelectedCuratedStory] = useState<{
    title: string;
    outline: string;
    genre: string;
    slug: string;
  } | null>(null);
  const [curatedStories, setCuratedStories] = useState<any[]>([]);
  const [selectedCuratedStoryForForm, setSelectedCuratedStoryForForm] = useState<any>(null);
  const [storybookImages, setStorybookImages] = useState<(string | null)[]>([]);
  const [imageGenerationErrors, setImageGenerationErrors] = useState<{ [key: number]: boolean }>({});
  const [storybookText, setStorybookText] = useState<string>('');
  const [step, setStep] = useState<'form' | 'curated-form' | 'curated-generating' | 'curated-final' | 'outline' | 'generating' | 'final'>('form');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isGeneratingPremiumContent, setIsGeneratingPremiumContent] = useState(false);
  const [isGeneratingCuratedStory, setIsGeneratingCuratedStory] = useState(false);
  const [curatedStoryResult, setCuratedStoryResult] = useState<any>(null);
  const [curatedGenerationProgress, setCuratedGenerationProgress] = useState(0);
  const [curatedCurrentStep, setCuratedCurrentStep] = useState('Initializing story generation...');
  const [regeneratingPanels, setRegeneratingPanels] = useState<{ [key: number]: boolean }>({});
  const [isCreatingMagic, setIsCreatingMagic] = useState(false);
  const [previousCharacterName, setPreviousCharacterName] = useState<string>('');
  const [isLoadingPanels, setIsLoadingPanels] = useState(false);
  const [panelsData, setPanelsData] = useState<any[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoadingCuratedStory, setIsLoadingCuratedStory] = useState(false);
  const [curatedStoryForEdit, setCuratedStoryForEdit] = useState<any>(null);
  const storyFormRef = useRef<HTMLDivElement>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [samplePdfs, setSamplePdfs] = useState(SAMPLE_PDFS); // Default to SAMPLE_PDFS
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  

  useEffect(() => {
    getSamplePdfs().then((pdfs) => {
      setSamplePdfs(pdfs);
    });
  }, []);

  // Determine if we're in edit mode or create mode
  // Edit mode: URL contains editStoryId query parameter
  // Create mode: URL does not contain editStoryId query parameter
  const editStoryId = searchParams.get('editStoryId');
  const isEditMode = !!editStoryId;

  // 2. Custom hooks
  const {
    currentStep,
    setCurrentStep,
    generatedOutline,
    setGeneratedOutline,
    finalOutline,
    generatedStory,
    setGeneratedStory,
    generatedTitle,
    setGeneratedTitle,
    confirmedStory,
    hfApiKey,
    isGeneratingOutline,
    isGeneratingStory,
    isRegeneratingOutline,
    isRegeneratingStory,
    generateOutline,
    handleRegenerateOutline,
    handleConfirmOutline,
    handleRegenerateStory,
    handleBackToForm: workflowHandleBackToForm,
    handleBackToOutline,
  } = useStoryWorkflow();

  const {
    formData,
    isCompressingPhoto,
    openaiApiKey,
    setOpenaiApiKey,
    hfApiKey: formHfApiKey,
    setHfApiKey,
    handleInputChange,
    handlePhotoUpload,
    handlePhotoRemove,
    handleCartoonSelect,
    handleCartoonRemove,
    handlePhotoChosenForStory,
    resetFormData,
    setFormData,
  } = useFormData();

  const [interruptedGeneration, setInterruptedGeneration] = useState(false);
  const [lockedPanels, setLockedPanels] = useState<boolean[]>([]); // Will be dynamically initialized based on story
  const [exising_photo_url, setExising_photo_url] = useState('');
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  const workflow = useStoryWorkflow();
  const { login, logout, storyId, setStoryId } = useAuth();

  // Load curated stories on component mount
  useEffect(() => {
    const loadCuratedStories = async () => {
      try {
        const response = await fetch(BASE_URL+'/api/auth/curated-stories/');
        if (response.ok) {
          const data = await response.json();
          setCuratedStories(data);
        }
      } catch (error) {
        console.error('Failed to load curated stories:', error);
      }
    };

    
    loadCuratedStories();
  }, []);

  // Effect to listen for home navigation from side panel
  useEffect(() => {
    const handleStorageChange = () => {
      const shouldNavigateHome = localStorage.getItem('navigateToHome');
      if (shouldNavigateHome === 'true') {
        localStorage.removeItem('navigateToHome');
        handleBackToHome();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Effect to update story outline when character name changes
  useEffect(() => {
    // Only run this effect if we have a valid character name change
    if (formData.characterName && 
        previousCharacterName && 
        formData.characterName !== previousCharacterName && 
        !isGeneratingOutline &&
        formData.characterName.trim() !== '') {
      
      // Helper function to replace character name with proper handling of possessive forms
      const replaceCharacterName = (text: string, oldName: string, newName: string): string => {
        // Replace basic name occurrences
        let updatedText = text.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
        
        // Replace possessive forms (e.g., "John's" -> "Mary's")
        updatedText = updatedText.replace(new RegExp(`\\b${oldName}'s\\b`, 'g'), `${newName}'s`);
        
        // Replace title occurrences (e.g., "**John's Adventure**" -> "**Mary's Adventure**")
        updatedText = updatedText.replace(
          new RegExp(`\\*\\*${oldName}'s (.+?)\\*\\*`, 'g'),
          `**${newName}'s $1**`
        );
        
        // Replace other title patterns
        updatedText = updatedText.replace(
          new RegExp(`\\*\\*${oldName} (.+?)\\*\\*`, 'g'),
          `**${newName} $1**`
        );
        
        return updatedText;
      };
      
      // Update the user's story outline in the form if it contains the old character name
      if (formData.storyOutline && formData.storyOutline.includes(previousCharacterName)) {
        const updatedFormOutline = replaceCharacterName(formData.storyOutline, previousCharacterName, formData.characterName);
        // Use a timeout to avoid race conditions with localStorage saving
        setTimeout(() => {
          setFormData(prev => ({ ...prev, storyOutline: updatedFormOutline }));
        }, 100);
      }
      
      // Update the generated outline if it exists
      if (generatedOutline) {
        const updatedOutline = replaceCharacterName(generatedOutline, previousCharacterName, formData.characterName);
        setGeneratedOutline(updatedOutline);
      }
      
      // Also update the generated story if it exists
      if (generatedStory) {
        const updatedStory = replaceCharacterName(generatedStory, previousCharacterName, formData.characterName);
        setGeneratedStory(updatedStory);
      }
      
      console.log(`📝 Updated story outline: ${previousCharacterName} → ${formData.characterName}`);
      toast.success(`Story updated with new character name: ${formData.characterName}`);
    }
    
    // Update the previous character name
    setPreviousCharacterName(formData.characterName);
  }, [formData.characterName, formData.storyOutline, generatedOutline, generatedStory, previousCharacterName, isGeneratingOutline, setGeneratedOutline, setGeneratedStory, setFormData]);

  useEffect(() => {
    // Simplified check for interrupted generation without relying on localStorage directly
    // This logic might need to be adjusted based on how generation state is now managed
  }, []);

  useEffect(() => {
    const savedStep = localStorage.getItem('storyStep');
    // ... existing code ...
  }, [setCurrentStep]);

  useEffect(() => {
    const editStoryId = searchParams.get('editStoryId');
    console.log('🔍 useEffect triggered - editStoryId:', editStoryId);
    console.log('🔍 Current searchParams:', searchParams.toString());
    
    if (editStoryId) {
      console.log('🔄 Starting to load story for editing:', editStoryId);
      console.log('🔐 Authentication state:', { hasToken: !!localStorage.getItem('authToken') });
      
      // Check if user is authenticated by checking localStorage directly
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ User not authenticated');
        toast.error('Please log in to edit curated stories');
        return;
      }
      
      console.log('🔐 User authenticated via localStorage token');
      
      // Fetch story panels and populate state
      const fetchPanels = async () => {
        setIsLoadingPanels(true);
        console.log('🔄 Starting panels loading...');
        
        // Small delay to ensure authentication state is properly initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Double-check authentication after delay
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ No auth token found after delay');
          toast.error('Please log in to edit stories');
          setIsLoadingPanels(false);
          return;
        }
        try {
          console.log('🔄 Loading story for editing:', editStoryId);
          console.log('🔐 Using token from localStorage for API calls');
          const token = localStorage.getItem('authToken');
          
      
          
          console.log('📡 Fetching story panels...');
          console.log('🔗 Panels API URL:', `${BASE_URL}/api/auth/stories/${editStoryId}/panels`);
          // Fetch story panels
          const panelsRes = await fetch(`${BASE_URL}/api/auth/stories/${editStoryId}/panels`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!panelsRes.ok) {
            console.error('❌ Story panels fetch failed:', panelsRes.status, panelsRes.statusText);
            throw new Error(`Failed to fetch story panels: ${panelsRes.status}`);
          }
          const panelsResponse = await panelsRes.json();
          console.log('🖼️ Full panels response:', panelsResponse);
          console.log('📊 Panels response status:', panelsRes.status);
          console.log('📊 Panels response ok:', panelsRes.ok);
          console.log('🔍 Response keys:', Object.keys(panelsResponse));
          
          // Extract panels and story data from the response
          const panels = panelsResponse.panels || [];
          const storyData = panelsResponse.story || {};
          console.log('🖼️ Extracted panels:', panels);
          console.log('📖 Extracted story data:', storyData);
          console.log('📖 Story data keys:', Object.keys(storyData));
          console.log('💰 Story data isPaid value:', storyData.isPaid);
          console.log('💰 Story data is_paid value:', storyData.is_paid);
          console.log('💰 Story data isPaid type:', typeof storyData.isPaid);
          console.log('💰 Story data is_paid type:', typeof storyData.is_paid);
          

          
          // Store panels data for ComicBook component
          setPanelsData(panels);
          
          // Set payment status from story data - check both camelCase and snake_case
          const paymentStatus = storyData.is_paid || false;
          setIsPaid(paymentStatus);
          
          
          // Validate response structure
          if (!panelsResponse.panels) {
            console.error('❌ Invalid panels response structure:', panelsResponse);
            throw new Error('Invalid response structure from panels API');
          }
          
          if (panels && panels.length > 0) {
            console.log('📖 Story data loaded:', storyData);
            console.log('🖼️ Panels loaded:', panels.length, 'panels');
            
            // Extract character name from story title or first panel text
            let characterName = storyData.name || 'Character';
    

            console.log('👤 Extracted character name:', characterName);
            // Reconstruct story text from panels
            const reconstructedStory = panels.map((panel: any, index: number) => {
              // Clean up panel text by removing markdown formatting and page headers
              let cleanText = panel.panel_text || '';
              
              // Remove markdown formatting
              cleanText = cleanText.replace(/\*\*/g, ''); // Remove bold
              cleanText = cleanText.replace(/\*/g, ''); // Remove italics
              
              // Remove page headers like "Page 1 - INTRODUCTION:"
              cleanText = cleanText.replace(/Page \d+ - [^:]+:\s*/g, '');
              
              // Remove panel headers like "Panel 1:" or "Panel 2:"
              cleanText = cleanText.replace(/Panel \d+:\s*/g, '');
              
              // Remove extra whitespace and newlines
              cleanText = cleanText.replace(/\n+/g, ' ').trim();
              
              return `Panel ${index + 1}: ${cleanText}`;
            }).join('\n\n');
            
            console.log('📝 Reconstructed story:', reconstructedStory.substring(0, 200) + '...');
            console.log('👤 Form data:', formData);
            
            // Set form data with story information
            setFormData((prev: any) => ({
              ...prev,
              characterName: characterName,
              characterAge: storyData.age?.toString() || '',
              characterGender: storyData.gender || '',
              genre: storyData.genre || storyData.story_genre || 'adventure',
              storyOutline: '', // We'll reconstruct this if needed
            }));
            
            // Extract character photo from panels response (edit mode) or story data (fallback)
            const characterPhoto = panelsResponse.story?.photo_url || storyData.photo_url;
            setExising_photo_url(characterPhoto);
            
            console.log('🔍 Character photo extracted:', {
              from_panels_response: panelsResponse.story?.photo_url,
              from_story_data: storyData.photo_url,
              final: characterPhoto
            });
            // Set story state
            setGeneratedTitle(storyData.title || storyData.story_title || `${characterName}'s Story`);
            setStorybookText(reconstructedStory);
            console.log('👤 Form data:', formData);

            // Extract image URLs, preferring S3 URLs over Minimax URLs
            const imageUrls = panels.map((p: any) => {
              console.log(`🖼️ Panel ${p.panel_number} images:`, {
                s3: p.aws_s3_image_url,
                minimax: p.minimax_image_url
              });
              return p.aws_s3_image_url || p.minimax_image_url || null;
            });
            setStorybookImages(imageUrls);
            console.log('🖼️ Set storybookImages:', imageUrls);
            
            // Set story ID for editing
            setStoryId(editStoryId);
            
            // Process AI story for editing (curated stories handled separately)
            console.log('🤖 Processing AI story for editing');
            
            // Initialize locked panels based on actual story length
            const totalPanels = panels.length;
            const initialLockedPanels = paymentStatus ?  Array(totalPanels).fill(false) :  Array(totalPanels).fill(false).map((_, idx) => idx >=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT); // First 4 free, rest locked
            setLockedPanels(initialLockedPanels);
            console.log('🔒 Setting lockedPanels:', {
              totalPanels,
              paymentStatus,
              initialLockedPanels,
              previewCount: import.meta.env.VITE_PREVIEW_IMAGE_COUNT
            });
            
            // Show story creation and go to final step
            setShowStoryCreation(true);
            setStep('final');
            console.log('🎭 Set step to final for AI story');
            
            console.log('✅ Story loaded successfully for editing');
            console.log('🔄 Setting isLoadingPanels to false');
            toast.success('Story loaded for editing!');
            setIsLoadingPanels(false);
          } else {
            console.error('❌ No panels found for story');
            console.log('🔄 Setting isLoadingPanels to false (no panels)');
            toast.error('No panels found for this story');
            setIsLoadingPanels(false);
          }
        } catch (err) {
          console.error('❌ Error loading story for editing:', err);
          
          // More detailed error logging
          if (err instanceof Error) {
            console.error('❌ Error details:', {
              message: err.message,
              stack: err.stack,
              name: err.name
            });
          }
          
          // Show user-friendly error message
          let errorMessage = 'Could not load story for editing';
          if (err instanceof Error) {
            if (err.message.includes('401')) {
              errorMessage = 'Please log in to edit stories';
            } else if (err.message.includes('404')) {
              errorMessage = 'Story not found';
            } else if (err.message.includes('403')) {
              errorMessage = 'You do not have permission to edit this story';
            } else {
              errorMessage = `Error: ${err.message}`;
            }
          }
          
          console.log('🔄 Setting isLoadingPanels to false (error)');
          toast.error(errorMessage);
          setIsLoadingPanels(false);
        }
      };
      fetchPanels();
    } else {
      console.log('🔍 No editStoryId found in URL params');
    }
  }, [searchParams, location.search]);

  // Edit flow for curated stories - separate from AI stories
  useEffect(() => {
    const editCuratedStoryId = searchParams.get('editCuratedStoryId');
    console.log('🔍 useEffect triggered - editCuratedStoryId:', editCuratedStoryId);
    console.log('🔍 Current searchParams:', searchParams.toString());
    
    // Add cleanup flag to prevent race conditions
    let isCancelled = false;
    
    if (editCuratedStoryId) {
      console.log('🔄 Starting to load curated story for editing:', editCuratedStoryId);
      console.log('🔐 Authentication state:', { hasToken: !!localStorage.getItem('authToken') });
      
      // Check if user is authenticated by checking localStorage directly
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ User not authenticated');
        toast.error('Please log in to edit curated stories');
        return;
      }
      
      console.log('🔐 User authenticated via localStorage token');
      
      // Fetch curated story data and populate state
      const fetchCuratedStory = async () => {
        setIsLoadingCuratedStory(true);
        console.log('🔄 Starting curated story loading...');
        
        // Small delay to ensure authentication state is properly initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Double-check authentication after delay
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ No auth token found after delay');
          toast.error('Please log in to edit curated stories');
          if (!isCancelled) {
            setIsLoadingCuratedStory(false);
          }
          return;
        }
        
        try {
          // Check if cancelled before proceeding
          if (isCancelled) {
            console.log('🔄 Curated story loading cancelled');
            return;
          }
          
          console.log('🔄 Loading curated story for editing:', editCuratedStoryId);
          
          // Fetch story data using the same API as AI stories
          console.log('🔗 Story API URL:', `${BASE_URL}/api/auth/stories/${editCuratedStoryId}`);
          const storyRes = await fetch(`${BASE_URL}/api/auth/stories/${editCuratedStoryId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!storyRes.ok) {
            throw new Error(`HTTP error! status: ${storyRes.status}`);
          }

          const storyData = await storyRes.json();
          console.log('📚 Curated story data loaded:', storyData);
          
          if (!storyData) {
            throw new Error('No curated story data received');
          }
          
          // Fetch panels data using the same API as AI stories
          console.log('🔗 Panels API URL:', `${BASE_URL}/api/auth/stories/${editCuratedStoryId}/panels`);
          const panelsRes = await fetch(`${BASE_URL}/api/auth/stories/${editCuratedStoryId}/panels`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!panelsRes.ok) {
            throw new Error(`HTTP error! status: ${panelsRes.status}`);
          }

          const panelsResponse = await panelsRes.json();
          console.log('📚 Curated story panels response:', panelsResponse);
          
          // Extract panels from response - handle different response structures
          let panels = [];
          if (Array.isArray(panelsResponse)) {
            panels = panelsResponse;
          } else if (panelsResponse && Array.isArray(panelsResponse.panels)) {
            panels = panelsResponse.panels;
          } else if (panelsResponse && panelsResponse.data && Array.isArray(panelsResponse.data)) {
            panels = panelsResponse.data;
          } else {
            console.error('❌ Invalid panels response structure:', panelsResponse);
            throw new Error('Invalid panels response structure from API');
          }
          
          console.log('📚 Extracted panels array:', panels);
          
          if (!panels || panels.length === 0) {
            throw new Error('No panels found in the response');
          }
          
          // Reconstruct story text from panels
          const reconstructedStory = panels.map((panel: any, index: number) => {
            let cleanText = panel.panel_text || '';
            cleanText = cleanText.replace(/\*\*/g, '');
            cleanText = cleanText.replace(/\*/g, '');
            cleanText = cleanText.replace(/Page \d+ - [^:]+:\s*/g, '');
            cleanText = cleanText.replace(/Panel \d+:\s*/g, '');
            cleanText = cleanText.replace(/\n+/g, ' ').trim();
            return `Panel ${index + 1}: ${cleanText}`;
          }).join('\n\n');
          
          // Set curated story for edit
          setCuratedStoryForEdit(storyData);
          
          // Set curated story result with proper panel_id mapping
          const curatedPanels = panels.map(panel => ({
            ...panel,
            panel_id: panel.panel_id || panel.id, // Ensure panel_id is set for regeneration
            id: panel.id || panel.panel_id, // Ensure id is set
          }));
          
          console.log('🔍 Curated panels with panel_id mapping:', curatedPanels.map(p => ({
            panel_number: p.panel_number,
            panel_id: p.panel_id,
            id: p.id,
            has_aws_url: !!p.aws_s3_image_url,
            has_file_url: !!p.file_url
          })));
          
          // Extract character information from panels response (edit mode) or story data (fallback)
          const characterName = panelsResponse.story?.character || storyData.character || storyData.name;
          const characterPhoto = panelsResponse.story?.photo_url || storyData.photo_url;
          
          console.log('🔍 Character info extracted:', {
            from_panels_response: {
              name: panelsResponse.story?.character,
              photo_url: panelsResponse.story?.photo_url
            },
            from_story_data: {
              name: storyData.character || storyData.name,
              photo_url: storyData.photo_url
            },
            final: {
              characterName,
              characterPhoto
            }
          });
         
          debugger;
          setCuratedStoryResult({
            story_id: storyData.id,
            story_content: reconstructedStory,
            panels: curatedPanels,
            title: storyData.title || storyData.story_title,
            genre: storyData.genre || storyData.story_genre,
            // Add character information from panels response (edit mode) or story data (fallback)
            character_name: characterName,
            photo_url: characterPhoto,
            story:{
              character_name: characterName,
              photo_url: characterPhoto,
              title: storyData.title || storyData.story_title,
              genre: storyData.genre || storyData.story_genre,
              front_page_img_url_portrait: storyData.front_page_img_url_portrait,
              back_page_image_url: storyData.back_page_image_url
            },
            front_page_img_url_portrait: storyData.front_page_img_url_portrait,
            back_page_image_url: storyData.back_page_image_url
          });
          
          // Set form data with story information (same as AI story flow)
          setFormData((prev: any) => ({
            ...prev,
            characterName: characterName,
            characterAge: storyData.age?.toString() || '',
            characterGender: storyData.gender || '',
            genre: storyData.genre || storyData.story_genre || 'adventure',
            storyOutline: '', // We'll reconstruct this if needed
          }));
          
          // Set existing photo URL for edit mode
          setExising_photo_url(characterPhoto);
          
          console.log('🔍 Curated story form data populated:', {
            characterName,
            characterAge: storyData.age?.toString() || '',
            characterGender: storyData.gender || '',
            genre: storyData.genre || storyData.story_genre || 'adventure',
            photo_url: characterPhoto
          });
          
          // Set payment status
          setIsPaid(storyData.is_paid || false);
          
          // Check if cancelled before setting state
          if (isCancelled) {
            console.log('🔄 Curated story loading cancelled, not setting state');
            return;
          }
          
          // Navigate to curated final preview
          setStep('curated-final');
          setShowStoryCreation(true);
          
          console.log('✅ Curated story loaded successfully for editing');
          setIsLoadingCuratedStory(false);
          
        } catch (err) {
          console.error('❌ Error loading curated story for editing:', err);
          
          // Show user-friendly error message
          let errorMessage = 'Could not load curated story for editing';
          if (err instanceof Error) {
            if (err.message.includes('401')) {
              errorMessage = 'Please log in to edit curated stories';
            } else if (err.message.includes('404')) {
              errorMessage = 'Curated story not found';
            } else if (err.message.includes('403')) {
              errorMessage = 'You do not have permission to edit this curated story';
            } else {
              errorMessage = `Error: ${err.message}`;
            }
          }
          
          // Check if cancelled before setting state
          if (isCancelled) {
            console.log('🔄 Curated story loading cancelled, not setting error state');
            return;
          }
          
          console.log('🔄 Setting isLoadingCuratedStory to false (error)');
          toast.error(errorMessage);
          setIsLoadingCuratedStory(false);
        }
      };
      fetchCuratedStory();
    } else {
      console.log('🔍 No editCuratedStoryId found in URL params');
    }
    
    // Cleanup function to prevent race conditions
    return () => {
      isCancelled = true;
      setIsLoadingCuratedStory(false);
    };
  }, [searchParams, location.search]);

  // Additional effect to handle editStoryId on mount and URL changes
  useEffect(() => {
    const editStoryId = searchParams.get('editStoryId');
    console.log('🔍 Additional useEffect - editStoryId:', editStoryId, 'Location:', location.pathname + location.search);
    
    if (editStoryId && !showStoryCreation) {
      console.log('🔄 Triggering story load from additional effect');
      // Force a re-render by updating searchParams
      setSearchParams(searchParams);
    }
  }, [location.pathname, location.search, showStoryCreation, searchParams, setSearchParams]);

  // Force trigger when URL changes with editStoryId
  useEffect(() => {
    const editStoryId = searchParams.get('editStoryId');
    console.log('🔍 URL Change Effect - editStoryId:', editStoryId);
    
    if (editStoryId) {
      console.log('🔄 URL contains editStoryId, triggering load...');
      // Small delay to ensure state is ready
      setTimeout(() => {
        const currentEditStoryId = searchParams.get('editStoryId');
        if (currentEditStoryId === editStoryId) {
          console.log('🔄 Confirmed editStoryId still present, proceeding with load');
        }
      }, 100);
    }
  }, [location.search]);

  // Manual trigger on component mount
  useEffect(() => {
    const editStoryId = searchParams.get('editStoryId');
    console.log('🔍 Component Mount Effect - editStoryId:', editStoryId);
    
    if (editStoryId) {
      console.log('🔄 Component mounted with editStoryId, will trigger load in main effect');
    }
  }, []);



  // 3. Event Handlers
  const handleCreateStoryClick = () => {
    setShowStoryCreation(true);
    storyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleBackToHome = () => {
    console.log('🏠 Back button clicked - navigating to main landing page');
    
    // Reset workflow state to form
    workflowHandleBackToForm();
    // Reset local state
    setStep('form');
    setStorybookImages([]);
    setStorybookText('');
    setIsGeneratingImages(false);
    setImageGenerationErrors({});
    setLockedPanels([]);
    setRegeneratingPanels({});
    setIsCreatingMagic(false);
    // Reset curated story state
    setCuratedStoryResult(null);
    setCuratedGenerationProgress(0);
    setCuratedCurrentStep('Initializing story generation...');
    setIsGeneratingCuratedStory(false);
    // Reset form data to give user a clean form
    resetFormData();

    // Clear any other potential cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('story') || key.startsWith('character') || key.startsWith('image'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear URL parameters if in edit mode
    if (storyId) {
      setSearchParams({});
    }
    
    // Clear curated story edit URL parameters
    const editCuratedStoryId = searchParams.get('editCuratedStoryId');
    if (editCuratedStoryId) {
      setSearchParams({});
    }
    
    // Clear curated story edit state
    setCuratedStoryForEdit(null);
    setIsLoadingCuratedStory(false);
    
    // Navigate back to the main landing page
    setShowStoryCreation(false);
    console.log('✅ showStoryCreation set to false - should show landing page');
  };

  const handleLoginSuccess = () => {
    login();
    setIsLoginModalOpen(false);
    setIsLoadingCuratedStory(false); // Reset curated story loading state
    // toast.success('Login successful! Welcome back.');
    handleCreateStoryClick();
  };
  
  const handleCuratedStorySelect = (story: { title: string; story_content: string; genre: string; slug: string; }) => {
    setFormData((prev: any) => ({ ...prev, storyOutline: story.story_content, genre: story.genre }));
    setShowStoryCreation(true);
    storyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHomePageCuratedStorySelect = (story: any) => {
    // Track curated story template selection from homepage
    trackStoryTemplateSelected(`homepage_${story.slug || story.title}`);
    
    // Store the full story object for the curated form
    setSelectedCuratedStoryForForm(story);
    setShowStoryCreation(true);
    setStep('curated-form');
  };

  const handleStorySelect = (outline: string, characterName: string) => {
    setFormData((prev: any) => ({ 
      ...prev, 
      storyOutline: outline, 
      characterName: characterName 
    }));
    setShowStoryCreation(true);
    storyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const handleGenerateOutline = () => {
    //console.log('=== DEBUG: handleGenerateOutline called ===');
    //console.log('openaiApiKey from useFormData:', openaiApiKey ? 'YES' : 'NO');
    //console.log('openaiApiKey length:', openaiApiKey?.length);
    //console.log('openaiApiKey preview:', openaiApiKey?.substring(0, 20) + '...');
    const openaiApiKey1 = "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";
    generateOutline(formData, openaiApiKey1);
  };

  const handleRegenerateOutlineWithData = () => {
    //console.log('=== DEBUG: handleRegenerateOutlineWithData called ===', openaiApiKey);
    const openaiApiKey1 = "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";

    handleRegenerateOutline(formData, openaiApiKey1);
  };

  const handleConfirmOutlineWithData = (confirmedOutline: string, apiKey: string) => {
    handleConfirmOutline(confirmedOutline, apiKey, '', formData);
  };

  const handleRegenerateStoryWithData = () => {
    handleRegenerateStory(formData, openaiApiKey);
  };

  const handleBackToForm = () => {
    //console.log('=== Create Another Story clicked ===');
    
    // Check if we're in edit mode (have a storyId or curated story)
    if (storyId || curatedStoryForEdit || curatedStoryResult) {
      console.log('🔄 Navigating back to stories history from edit mode');
      // Clear URL parameters and navigate back to stories history
      setSearchParams({});
      navigate('/stories-history');
      return;
    }
    
    // Check if we're in curated story edit mode via URL parameter
    const editCuratedStoryId = searchParams.get('editCuratedStoryId');
    if (editCuratedStoryId) {
      console.log('🔄 Navigating back to form from curated story edit mode');
      // Clear URL parameters and stay on current page
      setSearchParams({});
      return;
    }
    
    // Reset workflow state
    workflowHandleBackToForm();
    // Reset local state
    setStep('form');
    setStorybookImages([]);
    setStorybookText('');
    setIsGeneratingImages(false);
    setImageGenerationErrors({});
    setLockedPanels([]); // Reset to empty - will be dynamically initialized when story is ready
    setRegeneratingPanels({}); // Reset regenerating states
    setIsCreatingMagic(false); // Reset magic state
    setIsLoadingCuratedStory(false); // Reset curated story loading state
    // Reset form data to give user a clean form
    resetFormData();
    // Clear image generation cache for fresh start
    clearVisualContinuityCache();
    // Clear ALL persisted storage for a fresh start
    sessionStorage.removeItem('formData');
    localStorage.removeItem('generatedStory');
    localStorage.removeItem('generatedImageUrls');
    localStorage.removeItem('storyStep');
    localStorage.removeItem('huggingface-api-key');
    
    // Clear any other potential cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('story') || key.startsWith('character') || key.startsWith('image'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    //console.log('State reset complete - returning to form');
  };

  const handleCuratedStoryBack = () => {
    setSelectedCuratedStory(null);
    setIsLoadingCuratedStory(false); // Reset curated story loading state
    
    // Clear URL parameters if we're in edit mode
    const editCuratedStoryId = searchParams.get('editCuratedStoryId');
    if (editCuratedStoryId) {
      setSearchParams({});
    }
  };

  const handleIllustrationsReady = (story: string, images: string[], panelData?: Array<{
    id: string;
    panel_number: number;
    panel_text: string;
    image_prompt: string;
    minimax_image_url: string | null;
    aws_s3_image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>) => {
    console.log('=== DEBUG: handleIllustrationsReady called ===');
    console.log('=== handleIllustrationsReady story', story);
    console.log('=== handleIllustrationsReady images', images);
    console.log('=== handleIllustrationsReady panelData', panelData);
    setStorybookText(story);
    setStorybookImages(images);
    setIsGeneratingImages(false);
    setImageGenerationErrors({});
    
    // Store panel data for use in ComicBook component
    if (panelData && panelData.length > 0) {
      setPanelsData(panelData);
      console.log('📊 Stored panel data for ComicBook:', panelData.length, 'panels');
    }
    
    // Initialize locked panels based on actual story length
    const panelMatches = story.match(/Panel \d+:/g);
    const totalPanels = panelMatches?.length || 6;
    const initialLockedPanels = Array(totalPanels).fill(false).map((_, idx) => idx >=  import.meta.env.VITE_PREVIEW_IMAGE_COUNT); // First 2 free, rest locked
    setLockedPanels(initialLockedPanels);
    //console.log('Initialized locked panels for', totalPanels, 'total panels:', initialLockedPanels);
    
    setStep('final');
  };

  const handleImagesUpdated = (newImages: (string | null)[]) => {
    setStorybookImages(newImages);
  };

  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);

  const handleImageProgress = (generatedCount: number) => {
    // This function is called during the initial free image generation to track progress.
    // Update the progress count for the progress bar
    //console.log('=== IMAGE PROGRESS UPDATE ===');
    //console.log('Generated count received:', generatedCount);
    
    setImageGenerationProgress(generatedCount);
    
    // Don't replace existing images, just ensure we have the right array length for progress tracking
    setStorybookImages(prev => {
      // Keep existing non-null images and ensure we have enough slots
      const currentImages = [...prev];
      while (currentImages.length < Math.max(generatedCount, 2)) {
        currentImages.push(null);
      }
      //console.log('Updated storybookImages for progress tracking:', currentImages);
      return currentImages;
    });
  };

  const handleStartImageGeneration = () => {
    setIsGeneratingImages(true);
    setImageGenerationErrors({});
    setImageGenerationProgress(0);
    setStep('generating');
  };

  const handleImageGenerationError = (panelIndex?: number) => {
    //console.log(`Setting error state for panel ${panelIndex}`);
    if (panelIndex !== undefined) {
      setImageGenerationErrors(prev => ({ ...prev, [panelIndex]: true }));
    } else {
      // Handle general error - this is when the overall generation fails
      //console.log('General image generation error occurred');
      // Set a general error flag and ensure we stay in the generating step to show retry UI
      setImageGenerationErrors(prev => ({ ...prev, general: true }));
      // Make sure we stay in the generating step so the retry UI shows
      setStep('generating');
      setIsGeneratingImages(false); // Stop the loading state
    }
  };

  const handleImageGenerated = (index: number, url: string | null) => {
    console.log(`🎨 Handle index   image generated for panel ${index}:`, url ? 'SUCCESS' : 'FAILED');
    if (url === null) {
      // Mark this panel as having an error
      setImageGenerationErrors(prev => ({ ...prev, [index]: true }));
    } else {
      // Clear any previous error for this panel and update image
      if (imageGenerationErrors[index]) {
        setImageGenerationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
      handleUpdatePanel(index, url);
    }
    
    // Check if all images are now loaded and reset isCreatingMagic
    setTimeout(() => {
      const currentImages = storybookImages;
      const totalPanels = currentImages.length;
      const loadedImages = currentImages.filter(img => img !== null).length;
      const hasErrors = Object.keys(imageGenerationErrors).length > 0;
      
      console.log('🔍 Checking if all images are loaded:', {
        totalPanels,
        loadedImages,
        hasErrors,
        isCreatingMagic
      });
      
      // Only reset isCreatingMagic if all images are loaded and there are no errors
      if (loadedImages === totalPanels && !hasErrors && isCreatingMagic) {
        console.log('✅ All images loaded successfully, resetting isCreatingMagic to false');
        setIsCreatingMagic(false);
      }
    }, 1000); // Small delay to ensure image URLs are updated
  };

  const handleRetryImageGeneration = () => {
    // This is for the main "Retry" on the initial generation failure screen
    //console.log('=== RETRY IMAGE GENERATION ===');
    trackPhotosRegenerated('regenerate_on_failre_on_image_progress_loader_screen');
    setImageGenerationErrors({});
    setIsGeneratingImages(true);
    setStep('generating');
    
    // For initial image generation retry, we need to go back to the story outline
    // and restart the add illustrations process
    setStep('outline');
    setTimeout(() => {
      // Let the UI update, then trigger the add illustrations again
      // This should be handled by the StoryOutlineEditor component
    }, 600);
  };

  const handleUpdatePanel = (index: number, newImageUrl: string | null) => {
    // Only clear errors when we actually have a successful image URL
    if (newImageUrl && imageGenerationErrors[index]) {
      setImageGenerationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
    setStorybookImages(prev => {
      const newUrls = [...prev];
      newUrls[index] = newImageUrl;
      return newUrls;
    });
  };

  const handleLockPanel = (index: number) => {
    setLockedPanels((prev: boolean[]) => {
      const newLocks = [...prev];
      newLocks[index] = true;
      return newLocks;
    });
  };

  const handleUnlockPanel = (index: number) => {
    setLockedPanels((prev: boolean[]) => {
      const newLocks = [...prev];
      newLocks[index] = false;
      return newLocks;
    });
  };

  const handleUnlockRequest = () => {
    // Track checkout start for GTM
    import('@/utils/gtm').then(({ trackCheckoutStarted }) => {
      trackCheckoutStarted('unlock_now_panels_button', 49);
    });
    
    setIsPricingModalOpen(true);
  };

  const generateLockedImages = async (forcePaid: boolean = false) => {
    console.log('=== GENERATE LOCKED IMAGES START ===');
    console.log('🔍 generateLockedImages called with forcePaid:', forcePaid);
    console.log('🔍 Current isPaid state:', isPaid);
    
    // Check if this is a curated story
    const isCuratedStory = curatedStoryForEdit || curatedStoryResult;
    console.log('🔍 Is curated story:', !!isCuratedStory);
    
    // Prevent generation if payment hasn't been made (unless forced)
    if (!isPaid && !forcePaid) {
      console.error('❌ BLOCKED: Attempting to generate locked images without payment!');
      toast.error('Payment required to generate premium illustrations.');
      setIsCreatingMagic(false);
      setIsGeneratingPremiumContent(false);
      setIsGeneratingImages(false);
      return;
    }
    debugger
    if (!panelsData || panelsData.length === 0) {
      toast.error("Cannot generate locked images without panel data.");
      setIsCreatingMagic(false);
      setIsGeneratingPremiumContent(false);
      return;
    }

    console.log('✅ Payment verified, proceeding with locked image generation...');
    console.log('Panels data available:', panelsData.length, 'panels');
    
    // 1. Get panels that need generating (skip the first 4 free ones)
    const previewCount = Number(import.meta.env.VITE_PREVIEW_IMAGE_COUNT) || 4;
    const panelsToGenerate = panelsData.slice(previewCount);
    
    console.log('🎨 Generating images for', panelsToGenerate.length, 'locked panels');
  
    if (isCuratedStory) {
      // Use curated story generation flow (same as FinalCuratedPreview)
      console.log('🔄 Using curated story generation flow');
      
      // Process one by one instead of chunks (same as FinalCuratedPreview)
      for (let i = 0; i < panelsToGenerate.length; i++) {
        const panel = panelsToGenerate[i];
        const overallIndex = previewCount + i; // This is the actual index in the images array
        
        console.log(`🎨 Generating image for panel ${overallIndex} (ID: ${panel.id})`);
        
        // Set "Good things take time..." state for the current panel being generated
        toast.info(`Generating illustration for panel ${overallIndex}...`);
        setRegeneratingPanels(prev => {
          const newRegen = { ...prev };
          newRegen[overallIndex] = true; // Only set the current panel as regenerating
          return newRegen;
        });

        try {
          const { regenerateCuratedPanel } = await import('@/utils/curatedStoryApi');
          const result = await regenerateCuratedPanel(panel.panel_id || panel.id);
          
          if (result && result.panel) {
            console.log(`✅ Panel ${overallIndex} image generated successfully:`, {
              panel_id: result.panel.panel_id,
              panel_number: result.panel.panel_number,
              status: result.panel.status,
              image_url: result.panel.aws_s3_image_url || result.panel.file_url
            });
            
            // Update the panel with the generated image and panel text
            handleImageGenerated(
              overallIndex, 
              result.panel.aws_s3_image_url || result.panel.file_url
            );
            
            // Update panels data with new information
            const updatedPanel = {
              ...panel,
              panel_text: result.panel.panel_text || panel.panel_text,
              aws_s3_image_url: result.panel.aws_s3_image_url,
              minimax_image_url: result.panel.file_url,
              file_url: result.panel.file_url,
              status: result.panel.status,
              updated_at: new Date().toISOString()
            };
            
            setPanelsData(prev => prev.map((p, idx) => 
              idx === overallIndex ? updatedPanel : p
            ));
          } else {
            throw new Error('No panel data in response or regeneration failed');
          }
        } catch (error) {
          console.error(`❌ Failed to generate image for panel ${overallIndex} (ID: ${panel.id}):`, error);
          handleImageGenerated(overallIndex, null); // Mark as failed, but still update progress
        }
        
        // Clear "Good things take time..." state for the processed panel
        setRegeneratingPanels(prev => {
          const newRegen = { ...prev };
          delete newRegen[overallIndex];
          return newRegen;
        });
      }
    } else {
      // Use AI story generation flow (existing logic)
      console.log('🔄 Using AI story generation flow');
      
      // 2. Process in chunks of 2
      const chunkSize = 2;
      for (let i = 0; i < panelsToGenerate.length; i += chunkSize) {
        const chunk = panelsToGenerate.slice(i, i + chunkSize);
        
        const chunkPanelIndices = chunk.map((_, chunkIndex) => previewCount + i + chunkIndex);
        
        // Set "Updating illustration..." state for the current chunk
        toast.info(`Generating illustrations for panels ${chunkPanelIndices.map(p => p + 1).join(' & ')}...`);
        setRegeneratingPanels(prev => {
          const newRegen = { ...prev };
          chunkPanelIndices.forEach(idx => { newRegen[idx] = true; });
          return newRegen;
        });

        const chunkPromises = chunk.map(async (panel, chunkIndex) => {
          const overallIndex = previewCount + i + chunkIndex; // This is the actual index in the storybookImages array
          
          console.log(`🎨 Generating image for panel ${overallIndex + 1} (ID: ${panel.id})`);
          
          try {
            // Get character image base64 for subject reference
            let characterImageBase64: string | undefined;
            let characterImageType: string | undefined;
            
            // Handle both create case (formData.photo is File) and edit case (exising_photo_url is URL)
            if (formData.photo) {
              // Create case: user uploaded a new photo
              characterImageBase64 = await fileToBase64(formData.photo);
              characterImageType = formData.photo.type;
            } else if (exising_photo_url) {
              // Edit case: character image from API response
              characterImageBase64 = await urlToBase64(exising_photo_url);
              characterImageType = 'image/jpeg'; // Default type for URL images
            }
            
            const result = await generatePanelImage(panel.id, "16:9", 1, panel.panel_text, panel.panel_number, characterImageBase64, characterImageType);
            
            if (result && result.image_url) {
              console.log(`✅ Panel image generated successfully:`, {
                panel_id: result.panel_id,
                panel_number: result.panel_number,
                status: result.status,
                image_url: result.image_url
              });
              return { status: 'fulfilled' as const, value: result.image_url, index: overallIndex };
            } else {
              throw new Error(result.error || 'Failed to generate image');
            }
          } catch (error) {
            console.error(`❌ Failed to generate image for panel ${overallIndex + 1} (ID: ${panel.id}):`, error);
            return { status: 'rejected' as const, reason: error, index: overallIndex };
          }
        });

        const results = await Promise.all(chunkPromises);

        // Process results of the chunk
        results.forEach(result => {
          // Always call handleImageGenerated, even on error
          if (result.status === 'fulfilled') {
            handleImageGenerated(result.index, result.value);
          } else {
            handleImageGenerated(result.index, null); // Mark as failed, but still update progress
          }
        });
        
        // Clear "Updating illustration..." state for the processed chunk
        setRegeneratingPanels(prev => {
          const newRegen = { ...prev };
          chunkPanelIndices.forEach(idx => { delete newRegen[idx]; });
          return newRegen;
        });
      }
    }

    // After all chunks are processed and images are generated
    console.log('🔧 Resetting flags in generateLockedImages:');
    console.log('  - Setting isGeneratingImages to false');
    console.log('  - Setting isGeneratingPremiumContent to false');
    
    setIsGeneratingImages(false);
    setIsGeneratingPremiumContent(false);
    
    // Check if all panels were successfully generated
    const failedPanels = Object.keys(imageGenerationErrors).filter(key => key !== 'general' && imageGenerationErrors[key]);
    if (failedPanels.length > 0) {
      console.log('❌ Some panels failed, keeping isCreatingMagic true');
      toast.error(`Some illustrations failed to generate. You can retry individual panels using the "Retry Image" button.`);
      // Keep isCreatingMagic true if there are failures so users can see the retry options
    } else {
      console.log('✅ All panels successful, but keeping isCreatingMagic true until images are loaded');
      toast.success("All premium illustrations have been created!");
      // Don't reset isCreatingMagic here - let it be reset when images are actually loaded
      // The isCreatingMagic flag will be reset in handleImageGenerated when images are actually displayed
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('🚀 handlePaymentSuccess called - Starting premium image generation...');
    
    // Prevent multiple calls
    if (isPaid) {
      console.log('⚠️ Payment already processed, skipping duplicate call');
      return;
    }
    
    setIsPricingModalOpen(false);
    
    // Track successful purchase for GTM
    import('@/utils/gtm').then(({ trackPurchaseCompleted }) => {
      trackPurchaseCompleted(
        `txn_${Date.now()}`, // Generate a simple transaction ID
        'payment_success_on_premium_illustrations',
        49
      );
    });
    
    // Step 1: Set the premium content generation state
    console.log('🔧 Setting flags in handlePaymentSuccess:');
    console.log('  - Setting isGeneratingPremiumContent to true');
    console.log('  - Setting isCreatingMagic to true');
    console.log('  - Setting isGeneratingImages to true');
    console.log('  - Setting isPaid to true');
    
    setIsGeneratingPremiumContent(true);
    setIsCreatingMagic(true);
    setIsGeneratingImages(true);
    setIsPaid(true); // <-- Actually set isPaid to true here
    
    // Step 2: Calculate total panels and unlock ALL panels immediately
    const storyToProcess = storybookText || generatedStory;
    const panelMatches = storyToProcess?.match(/Panel \d+:/g);
    const totalPanels = panelMatches?.length || 6;
    
    //console.log('=== PAYMENT SUCCESS DEBUG ===');
    //console.log('Story to process exists:', !!storyToProcess);
    //console.log('Story preview:', storyToProcess?.substring(0, 200));
    //console.log('Panel matches found:', panelMatches?.length);
    //console.log('Panel matches:', panelMatches);
    //console.log('Total panels calculated:', totalPanels);
    //console.log('Setting isCreatingMagic to true');
    
    // Create array with exact panel count, all unlocked
    const unlockedPanels = Array(totalPanels).fill(false);
    setLockedPanels(unlockedPanels);
    //console.log('Unlocked panels array:', unlockedPanels);
    
    // Step 3: Ensure we have the right number of image slots
    setStorybookImages(prev => {
      const newImages = [...prev];
      while (newImages.length < totalPanels) {
        newImages.push(null);
      }
      //console.log('Updated storybook images length:', newImages.length);
      return newImages.slice(0, totalPanels);
    });

    toast.success('Payment successful! Creating your premium illustrations...');
    
    // Step 4: Start generation after a small delay to ensure state is updated
    setTimeout(async () => {
      console.log('🚀 Starting generateLockedImages after payment success...');
      console.log('🔍 Current isPaid state:', isPaid);
      // Force isPaid to true for this generation cycle to avoid race condition
      await generateLockedImages(true);
    }, 100);
  };

  const handlePaymentCancellation = () => {
    console.log('❌ handlePaymentCancellation called - Resetting payment state...');
    
    // Reset payment-related states
    setIsPaid(false);
    setIsGeneratingPremiumContent(false);
    setIsCreatingMagic(false);
    setIsGeneratingImages(false);
    
    // Reset locked panels to default state (first 4 free, rest locked)
    const storyToProcess = storybookText || generatedStory;
    const panelMatches = storyToProcess?.match(/Panel \d+:/g);
    const totalPanels = panelMatches?.length || 6;
    const previewCount = import.meta.env.VITE_PREVIEW_IMAGE_COUNT;
    const resetLockedPanels = Array(totalPanels).fill(false).map((_, idx) => idx >= previewCount);
    setLockedPanels(resetLockedPanels);
    
    console.log('🔄 Payment state reset:', {
      isPaid: false,
      totalPanels,
      previewCount,
      resetLockedPanels
    });
  };

  const handleRegeneratePanelImage = async (panelIndex: number, panelId?: string) => {
    console.log('=== REGENERATE PANEL IMAGE START ===');
    console.log('Panel index:', panelIndex);
    console.log('Panel ID:', panelId);
    
    // Check if this is a curated story
    const isCuratedStory = curatedStoryForEdit || curatedStoryResult;
    console.log('🔍 Is curated story:', !!isCuratedStory);
    
    // Try to get panel ID from panels data if not provided
    let targetPanelId = panelId;
    if (!targetPanelId && panelsData && panelsData.length > panelIndex) {
      targetPanelId = panelsData[panelIndex]?.id;
      console.log(`🔍 Found panel ID from panels data: ${targetPanelId}`);
    }
    
    // If we have a panel ID, use the appropriate API based on story type
    if (targetPanelId) {
      console.log(`🎨 Using ${isCuratedStory ? 'curated' : 'AI'} panel API for panel ${panelIndex} (ID: ${targetPanelId})`);
      
      // Set loading state for the specific panel being regenerated
      setRegeneratingPanels(prev => ({ ...prev, [panelIndex]: true }));
      
      // Clear any previous error for this panel
      if (imageGenerationErrors[panelIndex]) {
        setImageGenerationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[panelIndex];
          return newErrors;
        });
      }

      try {
        // Get the panel text for this panel
        const panelText = panelsData?.[panelIndex]?.panel_text;
        
        // Get character image base64 for subject reference
        let characterImageBase64: string | undefined;
        let characterImageType: string | undefined;
        
        // Handle both create case (formData.photo is File) and edit case (exising_photo_url is URL)
        if (formData.photo) {
          // Create case: user uploaded a new photo
          characterImageBase64 = await fileToBase64(formData.photo);
          characterImageType = formData.photo.type;
        } else if (exising_photo_url) {
          // Edit case: character image from API response
          characterImageBase64 = await urlToBase64(exising_photo_url);
          characterImageType = 'image/jpeg'; // Default type for URL images
        }
        
        // Get panel number from panels data
        const panelNumber = panelsData?.[panelIndex]?.panel_number;
        
        let result;
        
        if (isCuratedStory) {
          // Use curated story panel regeneration API (same as FinalCuratedPreview)
          console.log('🔄 Using curated story panel regeneration API');
          const { regenerateCuratedPanel } = await import('@/utils/curatedStoryApi');
          const curatedResult = await regenerateCuratedPanel(targetPanelId);
          
          console.log('Panel regeneration result:', curatedResult);
          
          if (curatedResult.panel) {
            // Extract aws_s3_image_url from the nested panel object
            const newImageUrl = curatedResult.panel.aws_s3_image_url || curatedResult.panel.file_url;
            const newPanelText = curatedResult.panel.panel_text;
            
            console.log('🔄 Panel regeneration - updating panel data:', {
              panel_id: targetPanelId,
              old_panel_text: panelText?.substring(0, 50) + '...',
              new_panel_text: newPanelText?.substring(0, 50) + '...',
              aws_s3_image_url: curatedResult.panel.aws_s3_image_url,
              file_url: curatedResult.panel.file_url,
              newImageUrl: newImageUrl
            });
            
            // Update panels data with new information
            if (panelsData && panelsData.length > panelIndex) {
              const updatedPanel = {
                ...panelsData[panelIndex],
                panel_text: newPanelText || panelsData[panelIndex].panel_text,
                aws_s3_image_url: curatedResult.panel.aws_s3_image_url,
                minimax_image_url: curatedResult.panel.file_url,
                file_url: curatedResult.panel.file_url,
                status: curatedResult.panel.status,
                updated_at: new Date().toISOString()
              };
              
              setPanelsData(prev => prev.map((p, i) => i === panelIndex ? updatedPanel : p));
            }
            
            // Transform to match expected format
            result = {
              success: true,
              panel_id: curatedResult.panel.id || targetPanelId,
              panel_number: curatedResult.panel.panel_number || panelNumber,
              status: curatedResult.panel.status || 'completed',
              image_url: newImageUrl,
              minimax_image_url: curatedResult.panel.minimax_image_url,
              aws_s3_image_url: curatedResult.panel.aws_s3_image_url || curatedResult.panel.file_url
            };
          } else {
            throw new Error('No panel data in response or regeneration failed');
          }
        } else {
          // Use AI story panel regeneration API
          console.log('🔄 Using AI story panel regeneration API');
          result = await generatePanelImage(targetPanelId, "16:9", 1, panelText, panelNumber, characterImageBase64, characterImageType);
        }
        
        if (result.success && result.image_url) {
          console.log(`✅ Panel image regenerated successfully:`, {
            panel_id: result.panel_id,
            panel_number: result.panel_number,
            status: result.status,
            image_url: result.image_url,
            minimax_url: result.minimax_image_url,
            s3_url: result.aws_s3_image_url
          });
          handleImageGenerated(panelIndex, result.image_url);
          
          // Clear any error state for this panel since regeneration was successful
          setImageGenerationErrors(prev => ({ ...prev, [panelIndex]: false }));
          
          toast.success(`Illustration for panel ${panelIndex + 1} has been magically regenerated!`);
        } else {
          throw new Error(result.error || 'Failed to generate image');
        }
      } catch (error) {
        console.error(`❌ Failed to regenerate image for panel ${panelIndex} (ID: ${targetPanelId}):`, error);
        
        // Provide specific error message for the backend issue
        if (error instanceof Error && error.message.includes('temporarily unavailable')) {
          toast.error(`Panel regeneration is temporarily unavailable. Please try again in a few minutes.`);
        } else {
          toast.error(`Could not regenerate illustration for panel ${panelIndex + 1}. Please try again.`);
        }
        
        handleImageGenerated(panelIndex, null);
      } finally {
        setRegeneratingPanels(prev => ({ ...prev, [panelIndex]: false }));
      }
      return;
    }
    
    // If no panel ID is available, show an error
    console.error(`❌ No panel ID available for panel ${panelIndex}`);
    toast.error(`Cannot regenerate image for panel ${panelIndex + 1}. Panel data not available.`);
    return;
  };

  // 4. Render logic
  let content = null;
  
  //console.log('=== INDEX RENDER DEBUG ===');
  //console.log('step state:', step);
  //console.log('currentStep from workflow:', currentStep);
  //console.log('generatedStory available:', generatedStory ? 'YES' : 'NO');
  //console.log('isGeneratingOutline:', isGeneratingOutline);
  
  // Loading state for curated story editing
  if (isLoadingCuratedStory) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-purple-700 mb-2">Loading Your Curated Story</h3>
          <p className="text-gray-600">Preparing your story for editing...</p>
        </div>
      </div>
    );
  } else if (interruptedGeneration) {
    content = (
      <ErrorState 
        onRetry={() => {
          setInterruptedGeneration(false);
          handleRetryImageGeneration();
        }} 
      />
    );
  } else if (step === 'form' && currentStep === 'form') {
    content = (
      <div className="space-y-8">
        <StoryForm
          formData={formData}
          onInputChange={handleInputChange}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={handlePhotoRemove}
          onCartoonSelect={handleCartoonSelect}
          onCartoonRemove={handleCartoonRemove}
          onGenerateStory={handleGenerateOutline}
          onLoginClick={() => setIsLoginModalOpen(true)}
          isGenerating={isGeneratingOutline}
          isCompressingPhoto={isCompressingPhoto}
          buttonText="Create My Amazing Story!"
          onPhotoChosenForStory={handlePhotoChosenForStory}
        />
        <CuratedStoriesSection onStorySelect={handleCuratedStorySelect} />
      </div>
    );
  } else if (step === 'curated-form') {
    content = (
      <div className="space-y-8">
        <CuratedStoryForm
          stories={curatedStories}
          selectedStory={selectedCuratedStoryForForm}
          onStorySelect={setSelectedCuratedStoryForForm}
          formData={formData}
          onInputChange={handleInputChange}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={handlePhotoRemove}
          onCartoonSelect={handleCartoonSelect}
          onCartoonRemove={handleCartoonRemove}
          onPhotoChosenForStory={handlePhotoChosenForStory}
          isCompressingPhoto={isCompressingPhoto}
          onGenerateStory={async () => {
            try {
              setIsGeneratingCuratedStory(true);
              setCuratedGenerationProgress(0);
              setCuratedCurrentStep('Initializing story generation...');
              setStep('curated-generating');
              
              // Get the S3 photo URL from form data
              let photoUrl = '';
              if (formData.selectedPhotoForStory) {
                photoUrl = formData.selectedPhotoForStory;
              } else if (formData.photo) {
                // If no S3 URL, use the blob URL as fallback
                photoUrl = URL.createObjectURL(formData.photo);
              }

              // Update progress
              setCuratedGenerationProgress(1);
              setCuratedCurrentStep('Preparing character data...');

              // Prepare the API request payload
              const payload: any = {
                character_name: formData.characterName,
                character_age: parseInt(formData.characterAge) || 4,
                character_gender: formData.characterGender,
                photo_url: photoUrl,
                curated_story_id: selectedCuratedStoryForForm?.id,
                curated_story_title: selectedCuratedStoryForForm?.title,
              };

              // Only add user_id if user is authenticated
              const token = localStorage.getItem('authToken');
              if (token) {
                try {
                  // Decode JWT token to get user_id
                  const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                  const userId = tokenPayload.user_id || tokenPayload.sub;
                  if (userId) {
                    payload.user_id = userId;
                  }
                } catch (error) {
                  console.error('Error extracting user_id from token:', error);
                }
              }
              // For non-authenticated users, don't send user_id at all

              console.log('Calling curated story generation API with payload:', payload);

              // Update progress
              setCuratedGenerationProgress(2);
              setCuratedCurrentStep('Generating personalized story...');

              // Call the curated story generation API
              const response = await fetch(`${BASE_URL}/api/auth/curated-stories/generate/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const result = await response.json();
              console.log('Curated story generation result:', result);
              console.log('Story content:', result.story_content);
              console.log('Panels:', result.panels);
              console.log('Story ID:', result.story.id);

              // Update progress
              setCuratedGenerationProgress(3);
              setCuratedCurrentStep('Finalizing your story...');
              // Store the result
              debugger;
              setCuratedStoryResult(result);
              
              // Show success message
              toast.success('Curated story generated successfully!');
              
              // Navigate to the final curated preview
              setStep('curated-final');

            } catch (error) {
              console.error('Error generating curated story:', error);
              toast.error('Failed to generate curated story. Please try again.');
              setStep('curated-form');
            } finally {
              setIsGeneratingCuratedStory(false);
            }
          }}
                      isGenerating={isGeneratingCuratedStory}
        />
      </div>
    );
  } else if (step === 'curated-generating') {
    content = (
      <CuratedStoryGenerationProgress
        characterName={formData.characterName}
        characterPhotoUrl={getCharacterPhotoFromSessionStorage() || formData.selectedPhotoForStory || (formData.photo ? URL.createObjectURL(formData.photo) : null)}
        selectedPhotoForStory={formData.selectedPhotoForStory}
        isCartoonSelectedForStory={formData.isCartoonSelectedForStory}
        onBackToForm={() => {
          setStep('curated-form');
          setIsGeneratingCuratedStory(false);
        }}
        progress={curatedGenerationProgress}
        currentStep={curatedCurrentStep}
        totalSteps={3}
      />
    );
  } else if (step === 'curated-final') {
    console.log('🔍 Rendering curated-final step, curatedStoryResult:', curatedStoryResult);
    // Check if curatedStoryResult is available before rendering
    if (!curatedStoryResult || typeof curatedStoryResult !== 'object') {
      console.log('❌ curatedStoryResult is not available, showing loading state');
      content = (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-purple-700 mb-2">Loading Your Curated Story</h3>
            <p className="text-gray-600">Preparing your story for editing...</p>
          </div>
        </div>
      );
    } else {
      content = (
        <FinalCuratedPreview
          curatedStoryResult={curatedStoryResult}
          characterName={formData.characterName}
          characterPhoto={
            // For edit mode, use photo_url from curatedStoryResult (panels API response)
            // For create mode, use form data or session storage
            curatedStoryResult?.photo_url || 
            getCharacterPhotoFromSessionStorage() || 
            formData.selectedPhotoForStory || 
            (formData.photo ? URL.createObjectURL(formData.photo) : null)
          }
          showBackButton={true}
          onBackToForm={handleBackToHome}
          onBackToCuratedForm={() => {
            setStep('curated-form');
            setCuratedStoryResult(null);
          }}
          onUnlockRequest={() => {
            // Handle unlock request - could open pricing modal or redirect to payment
            toast.info('Please complete payment to unlock all panels');
          }}
          isPaid={isPaid} // Use the actual payment status from state
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancellation={handlePaymentCancellation}
        />
      );
    }
  } else if (step === 'outline' && currentStep === 'outline') {
    //console.log('Rendering StoryOutlineEditor');
    content = (
      <StoryOutlineEditor
        generatedOutline={generatedOutline}
        characterName={formData.characterName}
        characterAge={formData.characterAge}
        characterGender={formData.characterGender}
        genre={formData.genre}
        onConfirmOutline={handleConfirmOutlineWithData}
        onRegenerateOutline={handleRegenerateOutlineWithData}
        isRegenerating={isRegeneratingOutline}
        generatedStory={generatedStory}
        characterPhotoFile={formData.photo}
        selectedPhotoForStory={formData.selectedPhotoForStory}
        isCartoonSelectedForStory={formData.isCartoonSelectedForStory}
        onIllustrationsReady={handleIllustrationsReady}
        onStartImageGeneration={handleStartImageGeneration}
        onImageGenerationError={handleImageGenerationError}
        onBackToForm={handleBackToForm}
        onImageProgress={handleImageProgress}
        onImageGenerated={handleImageGenerated}
        title={generatedTitle}
        onBackToCurated={() => {
          setStep('form');
          setShowStoryCreation(true);
        }}
      />
    );
  } else if (currentStep === 'outline') {
    //console.log('Rendering StoryOutlineEditor (currentStep only)');
    //console.log('formData.photo',formData);
    content = (
      <StoryOutlineEditor
        generatedOutline={generatedOutline}
        characterName={formData.characterName}
        characterAge={formData.characterAge}
        characterGender={formData.characterGender}
        genre={formData.genre}
        onConfirmOutline={handleConfirmOutlineWithData}
        onRegenerateOutline={handleRegenerateOutlineWithData}
        isRegenerating={isRegeneratingOutline}
        generatedStory={generatedStory}
        characterPhotoFile={formData.photo}
        selectedPhotoForStory={formData.selectedPhotoForStory}
        isCartoonSelectedForStory={formData.isCartoonSelectedForStory}
        onIllustrationsReady={handleIllustrationsReady}
        onStartImageGeneration={handleStartImageGeneration}
        onImageGenerationError={handleImageGenerationError}
        onBackToForm={handleBackToForm}
        onImageProgress={handleImageProgress}
        onImageGenerated={handleImageGenerated}
        title={generatedTitle}
        onBackToCurated={() => {
          setStep('form');
          setShowStoryCreation(true);
        }}
      />
    );
  } else if (step === 'generating') {
    // Calculate total panels dynamically for progress display
    let totalPanels = 8; // Default fallback increased to handle longer stories
    if (storybookText) {
      const panelMatches = storybookText.match(/Panel \d+:[^]*?(?=Panel \d+:|$)/g);
      if (panelMatches && panelMatches.length > 0) {
        totalPanels = panelMatches.length;
      } else {
        const prompts = storybookText
          .split(/\n\n+/)
          .map(s => s.trim())
          .filter(Boolean);
        totalPanels = Math.max(prompts.length, 6);
      }
    }
    // save panels
    
    // Use the progress count from image generation instead of counting actual images
    const targetGeneration = import.meta.env.VITE_PREVIEW_IMAGE_COUNT; // Initially generating 2 images
    const actualGeneratedCount = isGeneratingImages ? imageGenerationProgress : storybookImages.filter(img => img !== null && img !== undefined).length;
    
    // Calculate how many images are currently being generated
    const currentlyGenerating = isGeneratingImages 
      ? Math.max(0, targetGeneration - actualGeneratedCount)
      : 0;
    
    content = (
      <ImageGenerationProgress
        generatedCount={actualGeneratedCount}
        totalPanels={totalPanels}
        loadingCount={currentlyGenerating}
        onBackToForm={handleBackToForm}
        generationTarget={targetGeneration}
        characterPhotoUrl={formData.selectedPhotoForStory || (formData.photo ? URL.createObjectURL(formData.photo) : null)}
        selectedPhotoForStory={formData.selectedPhotoForStory}
        isCartoonSelectedForStory={formData.isCartoonSelectedForStory}
        error={Object.keys(imageGenerationErrors).length > 0}
        onRetry={handleRetryImageGeneration}
      />
    );
  } else if (step === 'final' || currentStep === 'final') {
    console.log('🎭 Rendering final step - StoryPreview component');
    console.log('📖 Story data:', {
      storybookText: storybookText?.substring(0, 100) + '...',
      generatedStory: generatedStory?.substring(0, 100) + '...',
      storybookImages: storybookImages,
      imagesCount: storybookImages?.length || 0,
      nonNullImages: storybookImages?.filter(img => img !== null).length || 0,
      step,
      currentStep,
      storyId,
      isLoadingPanels
    });
    
    // Show loading state while panels are being loaded
    if (isLoadingPanels) {
      console.log('⏳ Showing loading state while panels are being loaded...');
      content = (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-lg font-medium text-gray-700">Loading your story panels...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your story data</p>
        </div>
      );
    } else {
      console.log('✅ Panels loaded, rendering StoryPreview component');
      
    // Initialize locked panels if not already set
    const storyToCheck = storybookText || generatedStory;
    if (storyToCheck && lockedPanels.length === 0) {
      const panelMatches = storyToCheck.match(/Panel \d+:/g);
      const totalPanels = panelMatches?.length || 8;
      const initialLockedPanels = Array(totalPanels).fill(false).map((_, idx) => idx >= import.meta.env.VITE_PREVIEW_IMAGE_COUNT);
      setLockedPanels(initialLockedPanels);
        console.log('🔒 Auto-initialized locked panels in final step for', totalPanels, 'total panels:', initialLockedPanels);
    }
    
    console.log('🎭 Rendering StoryPreview with flags:', {
      isCreatingMagic,
      isGeneratingImages,
      isPaid,
      lockedPanels: lockedPanels.length,
      storybookImages: storybookImages.length,
      nonNullImages: storybookImages.filter(img => img !== null).length
    });
    
    content = (
      <StoryPreview 
        story={storybookText || generatedStory}
        characterName={formData.characterName}
        characterPhoto= { isEditMode ? exising_photo_url : (formData.selectedPhotoForStory || (formData.photo ? URL.createObjectURL(formData.photo) : null))}
        genre={formData.genre}
        isGenerating={isGeneratingStory || isGeneratingImages}
        isRegenerating={isRegeneratingStory}
        onBackToForm={handleBackToForm}
        onRegenerateStory={handleRegenerateStoryWithData}
        showBackButton={true}
        hfApiKey={hfApiKey}
        images={storybookImages}
        errorImages={imageGenerationErrors}
        characterPhotoFile={formData.photo}
        onImagesUpdated={handleImagesUpdated}
        onUpdatePanel={handleUpdatePanel}
        onLockPanel={handleLockPanel}
        onUnlockPanel={handleUnlockPanel}
        lockedPanels={lockedPanels}
        onRetry={handleRetryImageGeneration}
        onUnlockRequest={handleUnlockRequest}
        onRegeneratePanelImage={handleRegeneratePanelImage}
        regeneratingPanels={regeneratingPanels}
        isGeneratingImages={isGeneratingImages}
        isCreatingMagic={isCreatingMagic}
        title={generatedTitle}
        storyId={storyId}
        panels={panelsData}
        isPaid={isPaid}
        onGenerateLockedImages={generateLockedImages}
      />
    );
    }
  }

  // Render landing page or story creation based on state
  if (!showStoryCreation) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 py-12 px-4 max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-5xl font-dm-serif mb-4 text-[#8D4BE5] leading-snug">
              Your Child Deserves to Be the Hero of Their Own Story
            </h1>
            <p className="max-w-lg mx-auto md:mx-0 mb-6 text-lg text-[#555555]">
              Magical, personalized storybooks where your child appears in beautiful, illustrated adventures. Boost confidence, spark joy, and create lifelong memories.
            </p>
            <button 
              onClick={handleCreateStoryClick}
              className="bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white px-8 py-3 rounded-full shadow-lg text-lg font-medium hover:from-[#D55A3A] hover:to-[#C026D6] transition-all duration-300 transform hover:scale-105"
            >
              Create Your Story Now 
            </button>
            
            <div className="flex items-center justify-center mt-4 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            
            <button 
              onClick={() => {
                // Scroll to curated stories section
                const curatedSection = document.querySelector('[data-curated-stories]');
                if (curatedSection) {
                  curatedSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white border-2 border-[#8D4BE5] text-[#8D4BE5] px-8 py-3 rounded-full shadow-lg text-lg font-medium hover:bg-[#8D4BE5] hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              Choose from Curated Stories
            </button>
            
            {/* Sample PDF Downloads */}
            <div className="mt-6 text-left">
              <p className="text-sm text-[#555555] mb-3">Want to see examples? Download sample stories:</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-start items-start">
                {samplePdfs.map((pdf, index) => (
                  <a
                    key={index}
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#8D4BE5] hover:text-[#6B21A8] transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-50 border border-purple-200 hover:border-purple-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {pdf.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex justify-center flex-1">
            <div className="relative">
              <HeroCarousel />
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
              { icon: "📸", title: "Upload a Photo of Your Child", desc: "Their smile brings the story to life." },
              { icon: "📚", title: "Choose a Magical Adventure", desc: "Select from delightful, age-appropriate story templates." },
              { icon: "🎁", title: "Get Your Personalized Storybook", desc: "Preview illustrations instantly. Download or order your keepsake anytime." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow flex flex-col items-center space-y-4 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl">{item.icon}</div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Curated Stories Showcase */}
        <CuratedStoriesShowcase onStorySelect={handleHomePageCuratedStorySelect} />

        {/* Testimonials */}
        <section className="py-16 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-dm-serif mb-4 text-[#8D4BE5]">
                See the Magic Through Other Parents
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real stories from real families who've experienced the joy of personalized storytelling
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                    R
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Riya Patel</h4>
                    <p className="text-sm text-gray-500">Mom of a 5-year-old</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic text-lg leading-relaxed">
                  "My son couldn't stop smiling seeing himself in the story! He reads it every night before bed now. It's become our special bonding time."
                </blockquote>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                    A
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Arjun Singh</h4>
                    <p className="text-sm text-gray-500">Dad of twins</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic text-lg leading-relaxed">
                  "Great bonding activity. The twins love seeing themselves as heroes. Highly recommend for any parent wanting to encourage reading!"
                </blockquote>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 md:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                    P
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Priya Sharma</h4>
                    <p className="text-sm text-gray-500">Mom of a 7-year-old</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-gray-700 italic text-lg leading-relaxed">
                  "The quality of illustrations is amazing! My daughter carries her storybook everywhere. It's boosted her confidence so much."
                </blockquote>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                    <div className="text-gray-600">Happy Families</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-2">4.9★</div>
                    <div className="text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
                    <div className="text-gray-600">Stories Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky CTA for Mobile */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center md:hidden z-40">
          <button 
            onClick={handleCreateStoryClick}
            className="bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white px-8 py-3 rounded-full shadow-lg text-lg font-medium hover:from-[#D55A3A] hover:to-[#C026D6] transition-all duration-300"
          >
            Create Your Story Now
          </button>
        </div>

        {/* Modals */}
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onOpenChange={setIsLoginModalOpen} 
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  // Render story creation interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors mb-4 group"
        >
          <svg 
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>
      
      <div className="container mx-auto px-4 pb-8">
        <div ref={storyFormRef}>
          {content}
        </div>
      </div>

      {/* Modals */}
      <PricingModal
        open={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancellation={handlePaymentCancellation}
        isProcessing={isGeneratingPremiumContent}
        storyId={storyId}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Index;
