import { AIProviderConfig, IAIProvider } from '../types';
import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { PROVIDER_DEFAULTS } from './provider-config';

export class AIProviderFactory {
  static createProvider(config: AIProviderConfig): IAIProvider {
    const provider = config.provider;
    let providerDefaults;

    if (provider === 'openai') {
      providerDefaults = PROVIDER_DEFAULTS.openai;
    } else if (provider === 'deepseek') {
      providerDefaults = PROVIDER_DEFAULTS.deepseek;
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    const finalConfig: AIProviderConfig = {
      ...config,
      baseURL: config.baseURL || providerDefaults.defaultBaseURL,
      model: config.model || providerDefaults.defaultModel,
    };

    switch (provider) {
      case 'deepseek':
        return new DeepSeekProvider(finalConfig);
      case 'openai':
        return new OpenAIProvider(finalConfig);
      default:
        throw new Error(`Provider ${provider} is not yet implemented`);
    }
  }
}
