import React, { useState } from 'react';
import { useDecoupledImageGeneration } from '@/hooks/useDecoupledImageGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { ProviderType } from '@/utils/imageGeneration';

export const DecoupledImageGenerationExample: React.FC = () => {
  const [prompt, setPrompt] = useState('A beautiful sunset over mountains, storybook style');
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('huggingface');
  const [characterName, setCharacterName] = useState('Alice');
  const [genre, setGenre] = useState('fantasy');

  const {
    isGenerating,
    generatedImage,
    error,
    generateImage,
    generateCharacterImage,
    generateStoryPanel,
    setProvider,
    clearCache,
    getCacheStats
  } = useDecoupledImageGeneration({
    defaultProvider: 'huggingface',
    fallbackProvider: 'minimax',
    retryAttempts: 3
  });

  const handleGenerateImage = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    await generateImage({
      prompt,
      apiKey,
      options: {
        width: 512,
        height: 512,
        style: 'storybook'
      }
    }, selectedProvider);
  };

  const handleGenerateCharacter = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    await generateCharacterImage(
      characterName,
      genre,
      apiKey,
      undefined, // characterImage
      { width: 512, height: 512 }
    );
  };

  const handleGenerateStoryPanel = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    await generateStoryPanel(
      prompt,
      genre,
      characterName,
      apiKey,
      0, // panelIndex
      undefined, // previousPanelImage
      undefined, // characterPhoto
      { width: 512, height: 512 }
    );
  };

  const handleProviderChange = (provider: string) => {
    const newProvider = provider as ProviderType;
    setSelectedProvider(newProvider);
    setProvider(newProvider);
  };

  const handleClearCache = () => {
    clearCache();
    alert('Cache cleared!');
  };

  const cacheStats = getCacheStats();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Decoupled Image Generation Service Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This example demonstrates the new decoupled image generation service architecture.
            You can easily switch between different providers (HuggingFace, Minimax, OpenAI, Hailuo)
            and the service will handle fallbacks, retries, and caching automatically.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="huggingface">HuggingFace (FLUX)</SelectItem>
                  <SelectItem value="minimax">Minimax (image-01)</SelectItem>
                  <SelectItem value="openai">OpenAI (DALL-E 3)</SelectItem>
                  <SelectItem value="hailuo">Hailuo (Realistic Vision)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input
                id="characterName"
                placeholder="Character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="mystery">Mystery</SelectItem>
                  <SelectItem value="sci-fi">Science Fiction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your image generation prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateImage} 
                disabled={isGenerating || !apiKey.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleClearCache} 
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Cache: {cacheStats.size} entries
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {error.message}
                  {error.retryable && ' (Retryable)'}
                </AlertDescription>
              </Alert>
            )}

            {generatedImage ? (
              <div className="space-y-2">
                <img
                  src={generatedImage}
                  alt="Generated image"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <div className="text-xs text-gray-500">
                  Generated with {selectedProvider} provider
                </div>
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>No image generated yet</p>
                  <p className="text-sm">Click "Generate Image" to start</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleGenerateCharacter}
              disabled={isGenerating || !apiKey.trim()}
              variant="outline"
            >
              Generate Character
            </Button>
            
            <Button 
              onClick={handleGenerateStoryPanel}
              disabled={isGenerating || !apiKey.trim()}
              variant="outline"
            >
              Generate Story Panel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">SOLID Principles</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Single Responsibility: Each provider has one job</li>
                <li>• Open/Closed: Easy to add new providers</li>
                <li>• Liskov Substitution: Providers are interchangeable</li>
                <li>• Interface Segregation: Clean, focused interfaces</li>
                <li>• Dependency Inversion: Depends on abstractions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Automatic fallbacks between providers</li>
                <li>• Retry logic with exponential backoff</li>
                <li>• Intelligent caching with TTL</li>
                <li>• Comprehensive error handling</li>
                <li>• Type-safe TypeScript implementation</li>
                <li>• Easy to test and maintain</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 