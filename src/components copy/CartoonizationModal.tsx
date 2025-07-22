import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, X, ImageIcon } from 'lucide-react';
import { useCartoonization, CartoonTemplate } from '@/hooks/useCartoonization';
import { toast } from 'sonner';

interface CartoonizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageFile: File;
  originalImageUrl: string;
  uploadedImageUrl: string | null;
  onSelectCartoon: (cartoonImageUrl: string) => void;
}

const CartoonizationModal: React.FC<CartoonizationModalProps> = ({
  isOpen,
  onClose,
  originalImageFile,
  originalImageUrl,
  uploadedImageUrl,
  onSelectCartoon,
}) => {
  const {
    templates,
    isLoadingTemplates,
    error,
    fetchTemplates,
    generateCartoonImage,
    getCachedImage,
  } = useCartoonization();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<{ [templateId: string]: string }>({});
  const [generatingTemplates, setGeneratingTemplates] = useState<Set<string>>(new Set());
  const [selectedCartoonImage, setSelectedCartoonImage] = useState<string | null>(null);

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen, templates.length, fetchTemplates]);

  // Load cached images when templates are available
  useEffect(() => {
    if (templates.length > 0) {
      const cachedImages: { [templateId: string]: string } = {};
      templates.forEach(template => {
        const cached = getCachedImage(template.id);
        if (cached) {
          cachedImages[template.id] = cached;
        }
      });
      setPreviewImages(cachedImages);
    }
  }, [templates, getCachedImage]);

  const handleTemplateSelect = async (template: CartoonTemplate) => {
    setSelectedTemplate(template.id);

    // Check if we already have a cached or generated image
    const existingImage = previewImages[template.id] || getCachedImage(template.id);
    if (existingImage) {
      setPreviewImages(prev => ({
        ...prev,
        [template.id]: existingImage
      }));
      setSelectedCartoonImage(existingImage);
      return;
    }

    // Check if we have the uploaded S3 URL
    if (!uploadedImageUrl) {
      toast.error('Image not uploaded yet. Please wait for upload to complete.');
      return;
    }

    // Generate new image using the pre-uploaded S3 URL
    setGeneratingTemplates(prev => new Set(prev).add(template.id));
    
    try {
      const generatedImageUrl = await generateCartoonImage(template.id, uploadedImageUrl);
      
      if (generatedImageUrl) {
        setPreviewImages(prev => ({
          ...prev,
          [template.id]: generatedImageUrl
        }));
        setSelectedCartoonImage(generatedImageUrl);
        toast.success(`Generated ${template.name} style!`);
      } else {
        toast.error(`Failed to generate ${template.name} style`);
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(`Error generating ${template.name} style`);
    } finally {
      setGeneratingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
    }
  };

  const handleSelectCartoon = () => {
    if (selectedCartoonImage) {
      onSelectCartoon(selectedCartoonImage);
      onClose();
      toast.success('Cartoonized image selected!');
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
     
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex h-full items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            🎨 Cartoonize Your Photo
          </DialogTitle>
          <p className="text-gray-600">
            Transform your photo into amazing cartoon styles! Select a template to see the magic happen.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original and Cartoonized Images Side by Side */}
          <div className="flex justify-center gap-4">
            {/* Original Image */}
            <Card className="w-fit">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-700 mb-2 text-center">Original Photo</p>
                <img 
                  src={originalImageUrl} 
                  alt="Original" 
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </CardContent>
            </Card>

            {/* Cartoonized Image */}
            {selectedCartoonImage && (
              <Card className="w-fit">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-purple-700 mb-2 text-center">🎨 Cartoonized</p>
                  <img 
                    src={selectedCartoonImage}
                    alt="Cartoonized"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-purple-300"
                  />
                </CardContent>
              </Card>
            )}

            {/* Generating State */}
            {generatingTemplates.size > 0 && !selectedCartoonImage && (
              <Card className="w-fit">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-purple-700 mb-2 text-center">🎨 Generating...</p>
                  <div className="w-32 h-32 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Finalize Cartoon Button - Only show when cartoon is generated */}
          {selectedCartoonImage && (
            <div className="flex justify-center py-4">
              <Button
                onClick={handleSelectCartoon}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="w-6 h-6" />
                ✨ I Love This Cartoon! Use It! ✨
              </Button>
            </div>
          )}

          {/* Instruction text for kids */}
          <div className="text-center py-2">
            {!selectedCartoonImage ? (
              <p className="text-gray-600 text-lg">
                🎨 Pick a cartoon style below to transform your photo!
              </p>
            ) : (
              <p className="text-purple-600 text-lg font-medium">
                🌟 Your cartoon looks amazing! Click the button above if you love it! 🌟
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">⚠️ {error}</p>
            </div>
          )}

          {/* Loading Templates */}
          {isLoadingTemplates && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading cartoon templates...</span>
            </div>
          )}

          {/* Templates Grid */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Cartoon Style:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  const isGeneratingThis = generatingTemplates.has(template.id);
                  const previewImage = previewImages[template.id];
                  
                  return (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-lg'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Template Preview - Always show template preview, never generated image */}
                          <div className="relative aspect-square">
                            {template.preview_image_url || template.preview || template.previewUrl ? (
                              <img 
                                src={template.preview_image_url || template.preview || template.previewUrl}
                                alt={`${template.name} preview`}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  console.error(`Failed to load preview for ${template.name}:`, template.preview_image_url || template.preview || template.previewUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Loading overlay */}
                            {isGeneratingThis && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                              </div>
                            )}
                            
                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                                ✓
                              </div>
                            )}
                          </div>
                          
                          {/* Template Name */}
                          <div className="text-center">
                            <p className="font-medium text-sm">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                            )}
                            {/* Debug info */}
                            {/* <p className="text-xs text-blue-500 mt-1">ID: {template.id}</p> */}
                            {/* {(template.preview_image_url || template.preview || template.previewUrl) && (
                              <p className="text-xs text-green-600 mt-1 truncate" title={template.preview_image_url || template.preview || template.previewUrl}>
                                Preview: ✓
                              </p>
                            )}
                            {template.preview_image_url && (
                              <p className="text-xs text-purple-600 mt-1 truncate" title={template.preview_image_url}>
                                URL: {template.preview_image_url.substring(0, 20)}...
                              </p>
                            )} */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Information */}
          {generatingTemplates.size > 0 && (
            <div className="h-full w-full  backdrop-blur border border-blue-200 rounded-lg  p-4 absolute top-0 left-0">
              <div className="flex  items-center gap-2 justify-center align-center h-full">
                <Loader2 className="w-16 h-16 animate-spin  text-purple-600" />
                <p className="text-lg font-medium text-purple-700 text-center">
                  <strong>Good things take time.... Please wait while awesomeness unfolds.</strong>
                </p>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartoonizationModal;