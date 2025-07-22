// Import all image generation providers
import { HuggingFaceProvider } from './HuggingFaceProvider';
import { MinimaxProvider } from './MinimaxProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { HailuoProvider } from './HailuoProvider';
import { BaseProvider } from './BaseProvider';

// Import the provider factory
import { globalProviderRegistry, providerRegistry } from '../ProviderFactory';

// Export all image generation providers
export { HuggingFaceProvider } from './HuggingFaceProvider';
export { MinimaxProvider } from './MinimaxProvider';
export { OpenAIProvider } from './OpenAIProvider';
export { HailuoProvider } from './HailuoProvider';
export { BaseProvider } from './BaseProvider';

// Register all providers with the global registry
const registerDefaultProviders = () => {
  // Register provider classes for lazy instantiation
  providerRegistry.register('huggingface', HuggingFaceProvider);
  providerRegistry.register('minimax', MinimaxProvider);
  providerRegistry.register('openai', OpenAIProvider);
  providerRegistry.register('hailuo', HailuoProvider);
  
  //console.log('Default providers registered:', providerRegistry.list());
};

// Auto-register providers when module is imported
registerDefaultProviders();

// Legacy factory function for backward compatibility
export const createProvider = (type: string) => {
  return providerRegistry.create(type);
};

// New factory functions using the registry
export const getProvider = (name: string) => {
  return providerRegistry.create(name);
};

export const getAvailableProviders = () => {
  return providerRegistry.list();
};

export const isProviderAvailable = (name: string) => {
  return providerRegistry.has(name);
};

export const getProviderInfo = (name: string) => {
  return providerRegistry.getInfo(name);
};

// Export the registry for advanced usage
export { globalProviderRegistry, providerRegistry }; 