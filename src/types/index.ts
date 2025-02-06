export interface AIProvider {
  provider: string;
  apiKey: string;
  model: string;
  baseURL?: string; // 添加可选的 baseURL
}

export interface ReviewTrigger {
  on: 'pull_request' | 'merge_request' | 'push';
  actions?: string[];
}

export interface ReviewRule {
  enabled: boolean;
  pattern?: string;
  prompt: string;
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
    codeReview: ReviewRule;
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
}

export interface IAIProvider {
  review(prompt: string, content: string): Promise<string>;
}

export type AIProviderType = 'openai' | 'deepseek';
