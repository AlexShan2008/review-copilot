import { AIProviderConfig, IAIProvider } from '../types';

import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';

export class AIProviderFactory {
  static createProvider(config: AIProviderConfig): IAIProvider {
    switch (config.provider) {
      case 'deepseek':
        return new DeepSeekProvider(config);
      case 'openai':
      default:
        return new OpenAIProvider(config);
    }
  }
}
