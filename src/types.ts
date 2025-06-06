import { ReviewLanguage } from './constants/ai-messages';

// Provider related types
export type AIProviderType = 'openai' | 'deepseek';

export interface BaseProviderConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export interface AIProviderConfig extends BaseProviderConfig {
  provider: AIProviderType;
  reviewLanguage?: ReviewLanguage;
}

export interface ProviderConfig {
  enabled?: boolean;
  apiKey: string;
  model: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  provider?: AIProviderType;
}

export type ProvidersConfig = Record<string, ProviderConfig>;

// Config related types
export interface Config {
  providers: Record<string, ProviderConfig>;
  ai: Omit<AIProviderConfig, 'provider'> & {
    provider: string;
  };
  triggers: Array<{ on: string }>;
  rules: {
    commitMessage: {
      enabled: boolean;
      pattern: string;
      prompt: string;
    };
    branchName: {
      enabled: boolean;
      pattern: string;
      prompt: string;
    };
    codeChanges: {
      enabled: boolean;
      filePatterns: string[];
      prompt: string;
    };
  };
  customReviewPoints: Array<{
    name: string;
    prompt: string;
  }>;
}

export interface CodeReviewSuggestion {
  message: string;
  file?: string;
  line?: number;
  severity?: 'info' | 'warning' | 'error';
  side?: 'LEFT' | 'RIGHT';
  startLine?: number;
}

export interface CodeReviewResult {
  success: boolean;
  suggestions: CodeReviewSuggestion[];
  error?: {
    message: string;
  };
}

export interface IAIProvider {
  review(prompt: string, content: string): Promise<string>;
}
