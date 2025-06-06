import { AIProviderType } from '../types';

interface ProviderDefaultConfig {
  defaultBaseURL: string;
  defaultModel: string;
}

export const PROVIDER_DEFAULTS: Record<AIProviderType, ProviderDefaultConfig> =
  {
    openai: {
      defaultBaseURL: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    },
    deepseek: {
      defaultBaseURL: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
    },
  };
