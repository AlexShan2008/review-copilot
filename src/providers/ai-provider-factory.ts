import { AIProviderConfig, IAIProvider, AI_PROVIDER_CONFIG } from '../types';

import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';

export class AIProviderFactory {
  static createProvider(config: AIProviderConfig): IAIProvider {
    const providerConfig = AI_PROVIDER_CONFIG[config.provider];
    if (!providerConfig) {
      throw new Error(`Unsupported AI provider: ${config.provider}`);
    }

    const finalConfig: AIProviderConfig = {
      ...config,
      baseURL: config.baseURL || providerConfig.defaultBaseURL,
      model: config.model || providerConfig.defaultModel || 'gpt-3.5-turbo',
    };

    switch (config.provider) {
      case 'deepseek':
        return new DeepSeekProvider(finalConfig);
      case 'openai':
        return new OpenAIProvider(finalConfig);
      default:
        throw new Error(`Provider ${config.provider} is not yet implemented`);
    }
  }
}
