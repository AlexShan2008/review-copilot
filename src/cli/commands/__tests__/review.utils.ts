import { ConfigManager } from '../../../config/config-manager';
import { ProviderFactory } from '../../../providers/provider-factory';
import { getVcsProvider } from '../../../utils/vcs-factory';
import { GitPlatformFactory } from '../../../services/git-platform-factory';

// Type definitions for mockCommit and mockConfig
export interface MockFile {
  file: string;
  changes: string;
}

export interface MockCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  files: MockFile[];
}

export interface MockConfig {
  providers: Record<string, any>;
  rules: Record<string, any>;
}

export const mockCommit: MockCommit = {
  hash: 'abc123',
  date: '2024-01-01',
  message: 'feat: test commit',
  author: 'Test Author',
  files: [
    {
      file: 'src/test.ts',
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
      enabled: false,
      prompt: 'Review this branch name',
    },
  },
};

export const setupMocks = (
  customConfig: MockConfig = mockConfig,
  customCommits: MockCommit[] = [mockCommit],
) => {
  const mockConfigManager = {
    loadConfig: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockReturnValue(customConfig),
  };
  (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);

  const mockProvider = {
    review: jest.fn().mockResolvedValue({
      success: true,
      message: 'Review completed successfully',
    }),
  };
  (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

  const mockVcsProvider = {
    getPullRequestChanges: jest.fn().mockResolvedValue(customCommits),
    getCurrentBranchName: jest.fn().mockResolvedValue('feature/test'),
  };
  (getVcsProvider as jest.Mock).mockReturnValue(mockVcsProvider);

  const mockGitService = {
    getPRDetails: jest
      .fn()
      .mockResolvedValue({ owner: 'owner', repo: 'repo', prNumber: 1 }),
    addPRComment: jest.fn().mockResolvedValue(undefined),
  };
  (GitPlatformFactory.createService as jest.Mock).mockReturnValue(
    mockGitService,
  );

  return { mockConfigManager, mockProvider, mockVcsProvider };
};
