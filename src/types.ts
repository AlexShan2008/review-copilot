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
}

export interface ProviderConfig extends BaseProviderConfig {
  enabled: boolean;
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

// Review related types
export interface ReviewResult {
  success: boolean;
  message: string;
  suggestions: Array<{
    message: string;
    severity: 'info' | 'warning' | 'error';
    file?: string;
    line?: number;
  }>;
  errors: Array<{
    message: string;
    file?: string;
    line?: number;
  }>;
}

export interface IAIProvider {
  review(prompt: string, content: string): Promise<string>;
}
