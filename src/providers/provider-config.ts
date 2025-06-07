import { AIProviderType } from '../types/review.types';

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
    anthropic: {
      defaultBaseURL: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-2',
    },
    gemini: {
      defaultBaseURL: 'https://generativelanguage.googleapis.com/v1',
      defaultModel: 'gemini-pro',
    },
  };
