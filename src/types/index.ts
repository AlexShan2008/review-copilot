export type AIProviderType = 'openai' | 'deepseek' | 'anthropic' | 'gemini';

export interface AIProvider {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  baseURL?: string;
}

export interface ReviewTrigger {
  on: 'pull_request' | 'merge_request' | 'push';
  actions?: string[];
}

export interface ReviewRule {
  enabled: boolean;
  pattern?: string;
  prompt: string;
  filePatterns?: string[];
}

export interface CustomReviewPoint {
  name: string;
  prompt: string;
}

export interface Config {
  ai: AIProvider;
  triggers: ReviewTrigger[];
  rules: {
    commitMessage: ReviewRule;
    branchName: ReviewRule;
    codeChanges: ReviewRule;
  };
  customReviewPoints?: CustomReviewPoint[];
}

export interface ReviewResult {
  success: boolean;
  message: string;
  suggestions?: string[];
  errors?: string[];
}

export interface AIProviderConfig {
  apiKey: string;
  provider: AIProviderType;
  baseURL?: string;
  model: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export interface IAIProvider {
  review(prompt: string, content: string): Promise<string>;
}

export interface AIEnvConfig {
  [key: string]: {
    envKey: string;
    defaultBaseURL?: string;
    defaultModel?: string;
  };
}

export const AI_PROVIDER_CONFIG: AIEnvConfig = {
  openai: {
    envKey: 'AI_API_KEY_OPENAI',
    defaultModel: 'gpt-3.5-turbo',
  },
  deepseek: {
    envKey: 'AI_API_KEY_DEEPSEEK',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  anthropic: {
    envKey: 'AI_API_KEY_ANTHROPIC',
    defaultBaseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-2',
  },
  gemini: {
    envKey: 'AI_API_KEY_GEMINI',
    defaultModel: 'gemini-pro',
  },
};
