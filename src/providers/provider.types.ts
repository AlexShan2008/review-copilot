import { ReviewLanguage } from '../constants/ai-messages';

// Provider related types
export type AIProviderType = 'openai' | 'deepseek';

export interface AIProviderConfig {
  enabled: boolean;
  reviewLanguage?: ReviewLanguage;
  apiKey: string;
  model: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export interface TriggerConfig {
  on: 'pull_request' | 'merge_request' | 'push';
  actions?: string[];
}

// Config related types
export interface ProviderFactoryConfig {
  providers: Partial<Record<AIProviderType, AIProviderConfig>>;
  triggers: TriggerConfig[];
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
  filename?: string;
  line?: number;
  severity?: 'info' | 'warning' | 'error';
  side?: 'LEFT' | 'RIGHT';
  startLine?: number;
  endLine?: number;
  commitId?: string;
  diffHunk?: string;
  reviewType: 'general' | 'line-specific';
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
  reviewWithLineSpecificSuggestions?(
    prompt: string,
    content: string,
    fileContext: Array<{
      filePath: string;
      parsedDiff: ParsedDiff;
    }>,
  ): Promise<CodeReviewSuggestion[]>;
}

// New interfaces for diff parsing and line-specific reviews
export interface DiffLine {
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  type: 'add' | 'remove' | 'context';
  position: number; // Position in the diff for GitHub API
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
  header: string;
}

export interface ParsedDiff {
  filePath: string;
  oldFile: string;
  newFile: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface LineSpecificSuggestion extends CodeReviewSuggestion {
  reviewType: 'line-specific';
  filename: string;
  line: number;
  commitId: string;
  position?: number;
  diffContext: string;
}
