import { ConfigManager } from '../../../config/config-manager';
import { ProviderFactory } from '../../../providers/provider-factory';
import { getVcsProvider } from '../../../utils/vcs-factory';
import { GitPlatformFactory } from '../../../services/git-platform-factory';
import { PullRequestReviewInfo } from '../../../utils/git-service.interface';

// Type definitions for ora mock
export interface MockSpinner {
  start: jest.Mock;
  stop: jest.Mock;
  succeed: jest.Mock;
  fail: jest.Mock;
  info: jest.Mock;
  text: string;
  _cleanup: jest.Mock;
}

export interface MockOra extends jest.Mock {
  mockSpinnerInstance: MockSpinner;
}

// Type definitions for mock data
export interface MockFile {
  filename: string;
  changes: string;
}

export interface MockCommit extends PullRequestReviewInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
  files: MockFile[];
}

export interface MockConfig {
  providers: Record<string, any>;
  rules: Record<string, any>;
  triggers?: Record<string, any>;
  customReviewPoints?: Record<string, any>;
}

export const mockCommit: MockCommit = {
  hash: 'abc123',
  date: '2024-01-01',
  message: 'feat: test commit',
  author: 'Test Author',
  files: [
    {
      filename: 'src/test.ts',
      changes: 'test code changes',
    },
  ],
};

export const mockConfig: MockConfig = {
  providers: {
    openai: {
      enabled: true,
      apiKey: 'test-key',
      model: 'gpt-4',
    },
  },
  rules: {
    codeChanges: {
      enabled: true,
      filePatterns: ['**/*.ts'],
      prompt: 'Review this code',
    },
    commitMessage: {
      enabled: true,
      prompt: 'Review this commit message',
    },
    branchName: {
      enabled: true,
      prompt: 'Review this branch name',
    },
  },
  triggers: {
    onPullRequest: true,
    onPush: false,
  },
  customReviewPoints: {
    security: {
      enabled: true,
      prompt: 'Review for security issues',
    },
  },
};

// Store original implementations
const originalImplementations = {
  ConfigManagerGetInstance: ConfigManager.getInstance,
  ProviderFactoryCreateProvider: ProviderFactory.createProvider,
  getVcsProvider,
  GitPlatformFactoryCreateService: GitPlatformFactory.createService,
};

// Cleanup function to restore original implementations
export const cleanupMocks = () => {
  ConfigManager.getInstance = originalImplementations.ConfigManagerGetInstance;
  ProviderFactory.createProvider =
    originalImplementations.ProviderFactoryCreateProvider;
  (getVcsProvider as any) = originalImplementations.getVcsProvider;
  GitPlatformFactory.createService =
    originalImplementations.GitPlatformFactoryCreateService;
};

export const setupMocks = (
  customConfig: MockConfig = mockConfig,
  customCommits: MockCommit[] = [mockCommit],
) => {
  // Clean up any existing mocks first
  cleanupMocks();

  const mockConfigManager = {
    loadConfig: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockReturnValue(customConfig),
  };
  ConfigManager.getInstance = jest.fn().mockReturnValue(mockConfigManager);

  const mockProvider = {
    review: jest.fn().mockResolvedValue({
      success: true,
      message: 'Review completed successfully',
    }),
  };
  ProviderFactory.createProvider = jest.fn().mockReturnValue(mockProvider);

  const mockVcsProvider = {
    getPullRequestFiles: jest.fn().mockResolvedValue(customCommits[0]),
    getPullRequestCommits: jest.fn().mockResolvedValue(customCommits),
    getCurrentBranchName: jest.fn().mockResolvedValue('feature/test'),
  };
  (getVcsProvider as any) = jest.fn().mockReturnValue(mockVcsProvider);

  const mockGitService = {
    getPRDetails: jest
      .fn()
      .mockResolvedValue({ owner: 'owner', repo: 'repo', pullNumber: 1 }),
    createIssueComment: jest.fn().mockResolvedValue(undefined),
    createReviewComment: jest.fn().mockResolvedValue(undefined),
  };
  GitPlatformFactory.createService = jest.fn().mockReturnValue(mockGitService);

  return { mockConfigManager, mockProvider, mockVcsProvider, mockGitService };
};
